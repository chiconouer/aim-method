// =============================================================
// Downsell 1 — downsell of the 3x More offer ($27 one-time)
// -------------------------------------------------------------
// Public funnel page at /downsell-1. Shown to customers who
// declined the /upsell-1 $47 offer. Reuses the shared SpinWheel
// component (same mechanic as /downsell-2, the photos downsell):
// 1st spin teases, 2nd spin lands on "$20 OFF" → reveals the
// $27 final price ($47 - $20 = $27).
//
// Old route /weekly/downsell is preserved as a 301 redirect in
// next.config.mjs for any external links still in the wild.
//
// ⚠️ CHECKOUT NOT WIRED YET. The CHECKOUT_URL constant below
// is the SINGLE place to swap once Digistore product is
// created — drop the live checkout URL into the empty string,
// no other changes required.
// =============================================================

"use client";

import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";

// ───── HERE: paste the Digistore checkout URL when ready ─────
// Up1 downsell / 3x More Offer — $27 one-time after roulette discount.
// While empty, the claim button renders identically but won't navigate.
const CHECKOUT_URL = "";
// ─────────────────────────────────────────────────────────────

// Wheel slices — same visual layout as /downsell-1, labels adapted
// for the $47 → $27 offer (gold "winning" slice gives $20 OFF).
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" }, // 0  (1st spin lands here)
  { label: "$10 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$20 OFF",        color: "#fbbf24" }, // 3  (2nd spin lands here — gold winning slice)
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function WeeklyDownsellPage() {
  const [won, setWon] = useState(false);
  const hasCheckout = CHECKOUT_URL.length > 0;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
      <div className="max-w-2xl mx-auto text-center">

        {/* FUNNEL STEP LABEL */}
        <div className="mt-8 flex justify-center">
          <span
            className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white"
            style={{
              background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
              paddingLeft: "calc(0.75rem + 0.2em)",
            }}
          >
            Downsell 1
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="neon-purple text-4xl sm:text-5xl font-bold leading-tight mt-6">
          Hold On — One Last Shot
        </h1>

        {/* SUBHEADLINE */}
        <p className="text-xl text-neutral-300 mt-4">
          The 3x Upgrade at a Price You Won&apos;t See Again
        </p>

        {/* BODY */}
        <p className="text-base text-neutral-200 mt-8 max-w-xl mx-auto leading-relaxed">
          Look — the multipliers in this upgrade are what separate the people
          who 3x and the people who plateau. Before you walk away, spin the
          wheel. If luck&apos;s on your side, you walk out with the upgrade
          for less than half the price.
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
              🎉 YOU JUST UNLOCKED $20 OFF! 🎉
            </h2>
            <p className="text-base text-neutral-300 mt-3">
              Your special price has been activated
            </p>

            <div className="max-w-md mx-auto mt-8 bg-[#111] border border-green-500/40 rounded-2xl p-8 shadow-lg shadow-green-500/10">
              <p className="text-sm text-neutral-400">Your exclusive price:</p>
              <p className="mt-2">
                <span className="text-5xl font-bold text-green-400">$27</span>
                <span className="text-2xl text-neutral-500 line-through ml-2">
                  $47
                </span>
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Save $20 — final offer
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
                🚀 YES — CLAIM MY $27 DISCOUNT
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
