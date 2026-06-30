// =============================================================
// FB2 variant — Downsell ($97 AI Model Customization)
// -------------------------------------------------------------
// Cloned from /ads/downsell-2 for the SECOND Facebook paid-traffic
// funnel (new traffic manager). Spin wheel, copy, layout, and
// $100-off reveal are identical to the source.
//
// Differences vs /ads/downsell-2:
//   - NO Digistore wiring. CLAIM MY DISCOUNT is a placeholder
//     `href="#"` with preventDefault until the new manager wires
//     their accept flow.
//   - NO tracking pixel. <Fb2Tracking /> placeholder replaces
//     <TikTokPixel />.
//   - "No thanks" routes intra-app to /upsell-2/thank-you (the
//     existing static confirmation page that tells the buyer their
//     access is on the way by email) instead of through Digistore
//     admin's redirect chain. Honest UX since this is the end of
//     the fb2 chain — the buyer's main-product access was already
//     provisioned by their checkout webhook (whatever the new
//     manager configures).
// =============================================================

"use client";

import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";
import { Fb2Tracking } from "@/components/Fb2Tracking";

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

const THANK_YOU_HREF = "/upsell-2/thank-you";

export default function Fb2DownsellPage() {
  const [won, setWon] = useState(false);

  // CLAIM is a placeholder until the new manager wires their accept
  // flow. preventDefault stops the dead `#` href from scrolling.
  function handleAcceptPlaceholder(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
      <Fb2Tracking />
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

        {/* VICTORY + PURCHASE BOX */}
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

              <a
                href="#"
                onClick={handleAcceptPlaceholder}
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 CLAIM MY DISCOUNT
              </a>

            </div>
          </div>
        )}

        {/* NO THANKS → intra-app thank-you confirmation page */}
        <div className="mt-12">
          <a
            href={THANK_YOU_HREF}
            className="inline-block outline-btn font-semibold py-2.5 px-5 rounded-xl text-sm"
          >
            No thanks, take me to the course
          </a>
        </div>

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
