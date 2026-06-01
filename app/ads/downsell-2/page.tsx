// =============================================================
// Ads variant — Downsell 2 (AI Model photos downsell, $97 one-time)
// -------------------------------------------------------------
// Duplicate of /downsell-2 for the PAID-TRAFFIC funnel (Digistore
// checkout). Pixel-for-pixel identical to the organic version
// (same roulette, same copy, same victory box).
//
// One difference: the claim button's URL is a Digistore
// placeholder (empty until the gestor de tráfego sets it up),
// instead of the hardcoded Hotmart URL on the organic version.
//
// The original /downsell-2 stays wired to the organic / Hotmart
// funnel and is NOT touched by this duplicate.
//
// ⚠️ CHECKOUT NOT WIRED YET. Paste the Digistore live URL into
// the empty string on line 25 — no other change required.
// =============================================================

"use client";

import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";

// ───── HERE: paste the Digistore checkout URL when ready ─────
// Ads / Downsell 2 / AI Model photos — $97 one-time after roulette discount.
// While empty, the claim button renders identically but won't navigate.
const CHECKOUT_URL = "";
// ─────────────────────────────────────────────────────────────

// Slice order matches the organic /downsell-2 pixel-for-pixel.
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$50 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$100 OFF",       color: "#fbbf24" },
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function AdsDownsell2Page() {
  const [won, setWon] = useState(false);
  const hasCheckout = CHECKOUT_URL.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
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
                href={hasCheckout ? CHECKOUT_URL : "#"}
                target={hasCheckout ? "_blank" : undefined}
                rel={hasCheckout ? "noopener noreferrer" : undefined}
                onClick={(e) => {
                  if (!hasCheckout) e.preventDefault();
                }}
                aria-disabled={!hasCheckout}
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 CLAIM MY DISCOUNT
              </a>

              {!hasCheckout && (
                <p
                  className="mt-4 text-[10px] text-gray-600 uppercase tracking-[0.2em]"
                  aria-hidden="true"
                >
                  ⚙️ Checkout link pending — placeholder mode
                </p>
              )}
            </div>
          </div>
        )}

        {/* NO THANKS */}
        <div className="mt-12">
          <a
            href="https://course.aimodelmethods.com"
            target="_self"
            className="text-base text-neutral-500 underline hover:text-neutral-300 transition-colors"
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
