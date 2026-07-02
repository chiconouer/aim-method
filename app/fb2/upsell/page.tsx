// =============================================================
// FB2 variant — Upsell ($197 AI Model Customization)
// -------------------------------------------------------------
// Cloned from /ads/upsell-2 for the SECOND Facebook paid-traffic
// funnel (new traffic manager). Layout, copy, Vturb player, and
// 120 s reveal timer are identical to the source.
//
// Checkout flow: after the 120 s reveal, the Hotmart Sales Funnel
// widget (via hotmart-checkout-elements.js) mounts into the slot
// where the original YES/NO buttons used to live. Hotmart's widget
// renders its own accept + decline UI and handles the 1-click
// upsell + product-configured decline redirect internally — so no
// hardcoded checkout URLs or intra-app decline routes live in this
// file anymore. Whatever the new manager configures on the Hotmart
// product side is what runs.
//
// Untouched vs earlier revisions: 120 s setTimeout reveal,
// <Fb2Tracking /> pixel, all copy + layout. Vturb player id was
// swapped 2026-07-01 (previously vid-6a20bf63c681d550d423791a) to
// a new player under a separate converteai account so fb2 traffic
// keeps its own Vturb analytics instead of sharing with /ads.
// =============================================================

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Fb2Tracking } from "@/components/Fb2Tracking";
import {
  HOTMART_ELEMENTS_SRC,
  HOTMART_SALES_FUNNEL_ID,
  useHotmartSalesFunnel,
} from "@/lib/hotmartSalesFunnel";

// <vturb-smartplayer> JSX type is declared globally in app/sales/page.tsx
// (module augmentation merges across files), so no local declaration here.

const VTURB_PLAYER_SRC =
  "https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a45d9982ca01f4886761967/v4/player.js";

export default function Fb2UpsellPage() {
  // 120s delayed-CTA timer state — independent of the video player
  const [showCTAs, setShowCTAs] = useState(false);

  // Reveal the Hotmart Sales Funnel widget 120 seconds after mount
  useEffect(() => {
    const t = setTimeout(() => setShowCTAs(true), 120_000);
    return () => clearTimeout(t);
  }, []);

  // Waits for the Hotmart script + widget container, then mounts
  // exactly once. Idempotent + defensive — see lib/hotmartSalesFunnel.ts.
  useHotmartSalesFunnel(showCTAs);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Fb2Tracking />
      <Script src={VTURB_PLAYER_SRC} strategy="afterInteractive" />
      {/* Hotmart Sales Funnel loader — starts fetching on afterInteractive
          so the JS is warm well before the 120 s reveal timer fires. The
          checkoutElements global it defines is consumed by the hook above. */}
      <Script src={HOTMART_ELEMENTS_SRC} strategy="afterInteractive" />

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      <main className="flex-1 px-4 py-6 sm:py-10">
        <div
          className="max-w-2xl mx-auto rounded-2xl border border-purple-900/30 px-5 py-6 sm:px-7 sm:py-8"
          style={{
            background: "linear-gradient(160deg,#0d0a1a,#080810)",
            boxShadow: "0 0 40px rgba(124,58,237,0.12)",
          }}
        >
          {/* Start Here — top headline framing this page as Lesson 1 */}
          <h1 className="text-center text-3xl sm:text-4xl font-black leading-tight text-white mb-6">
            Start Here —{" "}
            <span className="text-purple-400">Lesson 1 of the Course</span>
          </h1>

          {/* Headline row */}
          <div className="flex items-center gap-3">
            <svg
              className="animate-spin w-5 h-5 text-purple-400 flex-shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
            <p className="text-base sm:text-lg font-bold text-white leading-tight">
              Your purchase is being processed...
            </p>
          </div>
          <p className="text-[12px] sm:text-sm text-gray-400 leading-relaxed mt-1 ml-8">
            While you wait, watch the first lesson of the course 👇
          </p>

          {/* Vturb smartplayer — late-binding web component upgraded
              by the player script loaded above. aspect-video wrapper
              reserves space to avoid layout shift while loading. */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mt-5 border border-white/5">
            <vturb-smartplayer
              id="vid-6a45d9982ca01f4886761967"
              style={{ display: "block", margin: "0 auto", width: "100%" }}
            />
          </div>

          {/* Hotmart Sales Funnel widget slot — replaces the old YES/NO
              placeholder buttons. Hidden until 120 s elapses; the widget
              itself only mounts when showCTAs flips (see the hook above),
              so we don't paint an empty container into the DOM early.
              min-h-[160px] reserves vertical space so the layout doesn't
              jump when Hotmart injects its own markup. */}
          <div
            className={`mt-6 min-h-[160px] transition-opacity duration-700 ease-out ${
              showCTAs ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!showCTAs}
          >
            {showCTAs && <div id={HOTMART_SALES_FUNNEL_ID} />}
          </div>
        </div>
      </main>
    </div>
  );
}
