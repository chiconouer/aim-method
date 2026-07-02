// =============================================================
// FB2 / Sales page — Test A (quiz-driven) of the 4-way retention
// split. Sits at the end of the /fb2/quiz path and is the only
// variant that logs to quiz_funnel_events (step 10, platform=fb2)
// so the /quizfunnel dashboard sees the "reached checkout" event.
//
// Sibling variants (/fb2/sales-b, -c, -d) render the same template
// with different player + sck + storageKeyPrefix props and skip
// the funnel beacon — their retention lives in Vturb + Hotmart
// sck attribution + Utmify UTM traces.
//
// Test A config:
//   - Vturb player: vid-6a468d9550a718e59b282dbc
//   - HLS media   : 6a468ce5c73572ad0f8dd1ce
//   - Checkout    : Hotmart O106558433D, sck=fb2-quiz
//     (was sck=fb2 pre-split; renamed to disambiguate the 4 tests
//     in João's Hotmart reports — no code consumers match on sck
//     literally, per the PR #106 audit)
//   - storageKeyPrefix "" — preserves the original localStorage /
//     sessionStorage keys so returning visitors keep their reveal
//     state
//   - onFirstCheckoutClick = recordReachedCheckout — fires the
//     step-10 beacon
// =============================================================

"use client";
import { Fb2SalesTemplate } from "@/app/fb2/_components/Fb2SalesTemplate";
import { getVisitorId } from "@/lib/visitor_id";

const CHECKOUT_URL =
  "https://pay.hotmart.com/O106558433D?checkoutMode=10&sck=fb2-quiz";

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
      vturbPlayerId="vid-6a468d9550a718e59b282dbc"
      vturbPlayerScriptSrc="https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a468d9550a718e59b282dbc/v4/player.js"
      vturbHlsManifestUrl="https://cdn.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/6a468ce5c73572ad0f8dd1ce/main.m3u8"
      checkoutUrl={CHECKOUT_URL}
      storageKeyPrefix=""
      onFirstCheckoutClick={recordReachedCheckout}
    />
  );
}
