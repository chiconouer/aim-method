// =============================================================
// FB2 variant — Downsell ($97 AI Model Customization)
// -------------------------------------------------------------
// Cloned from /ads/downsell-2 for the SECOND Facebook paid-traffic
// funnel (new traffic manager). Spin wheel, copy, layout, and the
// $100-off reveal are identical to the source.
//
// Checkout flow: after the wheel win, the Hotmart Sales Funnel
// widget (via hotmart-checkout-elements.js) mounts inside the
// victory box where the original CLAIM button used to live.
// Hotmart's widget renders its own accept + decline UI — the
// "No thanks / take me to the course" outline anchor is gone
// because the widget handles decline internally, routed by
// whatever the new manager configures on the Hotmart product side.
// =============================================================

"use client";

import Script from "next/script";
import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";
import { Fb2Tracking } from "@/components/Fb2Tracking";
import {
  HOTMART_ELEMENTS_SRC,
  HOTMART_SALES_FUNNEL_ID,
  useHotmartSalesFunnel,
} from "@/lib/hotmartSalesFunnel";

// Slice order matches /ads/downsell-2 + organic /downsell-2
// pixel-for-pixel — gold slice (index 3) is the winning $100 OFF.
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$50 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$100 OFF",       color: "#fbbf24" },
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function Fb2DownsellPage() {
  const [won, setWon] = useState(false);

  // Widget mounts once the wheel finishes and `won` flips true. Hook
  // handles StrictMode double-fire + poll-until-ready — see
  // lib/hotmartSalesFunnel.ts.
  useHotmartSalesFunnel(won);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
      <Fb2Tracking />
      {/* Hotmart Sales Funnel loader — fetches on afterInteractive so
          the JS is warm before the wheel finishes. The checkoutElements
          global it defines is consumed by the hook above. */}
      <Script src={HOTMART_ELEMENTS_SRC} strategy="afterInteractive" />
      <div className="max-w-2xl mx-auto text-center">

        {/* HEADLINE */}
        <h1 className="neon-purple text-4xl sm:text-5xl font-bold leading-tight mt-12">
          It&apos;s Now or Never
        </h1>

        {/* SUBHEADLINE */}
        <p className="text-xl text-neutral-300 mt-4">
          Here&apos;s the Discount You Needed
        </p>

        {/* BODY */}
        <p className="text-base text-neutral-200 mt-8 max-w-xl mx-auto leading-relaxed">
          I know having me create your AI model could accelerate your path by 5x — because you&apos;d already have a 100% professional model built personally by me. That&apos;s why I want to give you one more chance to unlock an extra $100 discount.
        </p>

        {/* CTA TEXT */}
        <p className="neon-purple text-lg font-semibold mt-6">
          Want to test your luck?
        </p>

        {/* WHEEL (shared component) */}
        <SpinWheel
          slices={SLICES}
          firstSpinTargetIndex={0}
          secondSpinTargetIndex={3}
          onComplete={() => setWon(true)}
        />

        {/* VICTORY + WIDGET BOX */}
        {won && (
          <div style={{ animation: "fadeInUp 0.8s ease-out" }}>
            <h2 className="text-3xl font-bold text-green-400 mt-10 animate-pulse">
              🎉 YOU JUST UNLOCKED $100 OFF! 🎉
            </h2>
            <p className="text-base text-neutral-300 mt-3">
              Your special price has been activated
            </p>

            <div className="max-w-md mx-auto mt-8 bg-[#111] border border-green-500/40 rounded-2xl p-8 shadow-lg shadow-green-500/10">
              <p className="text-sm text-neutral-400">Your exclusive price:</p>
              <p className="mt-2">
                <span className="text-5xl font-bold text-green-400">$97</span>
                <span className="text-2xl text-neutral-500 line-through ml-2">$197</span>
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Save $100 — final offer
              </p>

              {/* Hotmart Sales Funnel widget slot — replaces the old
                  CLAIM MY DISCOUNT + "No thanks" placeholder pair.
                  min-h reserves vertical space so the layout doesn't
                  jump when Hotmart injects its own markup. */}
              <div id={HOTMART_SALES_FUNNEL_ID} className="mt-6 min-h-[80px]" />

            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
