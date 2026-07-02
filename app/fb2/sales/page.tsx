// =============================================================
// FB2 / Sales page — Test A of the retention split. Renders the
// shared <Fb2SalesTemplate/> with the original variant's props:
// original Vturb player, checkoutMode=10 Hotmart URL with sck=fb2,
// empty storageKeyPrefix (preserves the pre-refactor localStorage /
// sessionStorage keys), and the step-10 funnel beacon for the
// /quizfunnel dashboard.
//
// Everything the page used to render inline (582 lines: nav,
// video, scroll indicator, reveal timer, CTAs, students ticker,
// FAQ, fixed-bottom bar, animation keyframes) now lives in the
// template file. This wrapper is intentionally small — any
// upcoming retention variants (/fb2/sales-b, /fb2/sales-c) will
// look identical to this file with different props.
//
// Zero behavior change vs the pre-refactor version:
//   - Same Vturb player id + script URL + m3u8 preload
//   - Same CHECKOUT_URL with sck=fb2 (sck swap is a separate PR)
//   - Same reveal timer (REVEAL_TIME=510 s in the template)
//   - Same localStorage key "aim_sales_visited" and sessionStorage
//     key "aim_checkout_recorded" (storageKeyPrefix="" makes the
//     template append nothing to the base names)
//   - Same step-10 funnel beacon with platform="fb2" (fires once
//     per browser tab session on first CTA click)
// =============================================================

"use client";
import { Fb2SalesTemplate } from "@/app/fb2/_components/Fb2SalesTemplate";
import { getVisitorId } from "@/lib/visitor_id";

const CHECKOUT_URL =
  "https://pay.hotmart.com/O106558433D?checkoutMode=10&sck=fb2";

// =============================================================
// Funnel analytics beacon — POST to /api/quiz-funnel for the
// "reached checkout" event (step 10). Same fire-and-forget shape
// the quiz pages use. Browser never touches Supabase directly;
// the route uses the service-role client, and the
// quiz_funnel_events table is RLS-locked to service_role only.
//
// Prefers navigator.sendBeacon (queued by the browser, so it
// fires even when target="_blank" opens a new tab AND when the
// current tab itself is in mid-teardown). Falls back to fetch +
// keepalive. Wrapped in try/catch so any browser quirk silently
// no-ops — analytics ingestion must NEVER break the checkout
// redirect. Per-session dedupe lives inside the template.
// =============================================================
function recordReachedCheckout(): void {
  try {
    if (typeof window === "undefined") return;
    const visitor_id = getVisitorId();
    const body = JSON.stringify({ platform: "fb2", step: 10, visitor_id });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/quiz-funnel", blob);
      if (ok) return;
    }
    fetch("/api/quiz-funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent — analytics failures must never break the checkout.
  }
}

export default function Fb2SalesPage() {
  return (
    <Fb2SalesTemplate
      vturbPlayerId="vid-6a299481f97bdf6759cad9e2"
      vturbPlayerScriptSrc="https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a299481f97bdf6759cad9e2/v4/player.js"
      vturbHlsManifestUrl="https://cdn.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/69e6740ad9a2e678cbc93155/main.m3u8"
      checkoutUrl={CHECKOUT_URL}
      storageKeyPrefix=""
      onFirstCheckoutClick={recordReachedCheckout}
    />
  );
}
