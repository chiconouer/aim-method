"use client";

import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";

// Slice order matches the original page exactly so the visible wheel layout
// and the rigged stop angles stay identical pixel-for-pixel:
//   0  SPIN AGAIN  (1st spin lands here — tease)
//   1  $10 OFF
//   2  SPIN AGAIN
//   3  $20 OFF     (2nd spin lands here — gold winning slice)
//   4  FREE BONUS
//   5  TRY LATER
// Prizes rebalanced 2026-07 with the $197 → $67 / $97 → $47 organic
// price drop — $20 OFF represents ~30% of the $67 base, matching the
// psychological weight of the old $100 OFF on the old $197 base.
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$10 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$20 OFF",        color: "#fbbf24" },
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function DownsellPage() {
  const [won, setWon] = useState(false);

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
          I know having me create your AI model could accelerate your path by 5x — because you&apos;d already have a 100% professional model built personally by me. That&apos;s why I want to give you one more chance to unlock an extra $20 discount.
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
              Get everything for just <span className="text-green-400 font-bold">$47</span> instead of <span className="line-through text-neutral-500">$67</span>
            </p>

            <div className="max-w-md mx-auto mt-8 bg-[#111] border border-green-500/40 rounded-2xl p-8 shadow-lg shadow-green-500/10">
              <p className="text-sm text-neutral-400">Your exclusive price:</p>
              <p className="mt-2">
                <span className="text-5xl font-bold text-green-400">$47</span>
                <span className="text-2xl text-neutral-500 line-through ml-2">$67</span>
              </p>
              <p className="text-sm text-neutral-400 mt-2">
                Save $20 — final offer
              </p>

              <a
                href="https://pay.hotmart.com/U106013301D?off=pqis6sbk&checkoutMode=10&sck=organico"
                target="_self"
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 CLAIM MY DISCOUNT
              </a>
            </div>
          </div>
        )}

        {/* NO THANKS — exits the funnel to the thank-you confirmation page
            (tells the buyer their access is on the way via email). Used to
            send straight to course.aimodelmethods.com/dashboard, but the
            login link is delivered by the Hotmart webhook email — landing
            on /upsell-2/thank-you first is the honest UX, the buyer then
            follows the email link to actually sign into the course. */}
        <div className="mt-12">
          <a
            href="https://aimodelmethods.com/upsell-2/thank-you"
            target="_self"
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
