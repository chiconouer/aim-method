"use client";

import { useState } from "react";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";

// Slice order matches the original page exactly so the visible wheel layout
// and the rigged stop angles stay identical pixel-for-pixel:
//   0  SPIN AGAIN  (1st spin lands here — tease)
//   1  $50 OFF
//   2  SPIN AGAIN
//   3  $100 OFF    (2nd spin lands here — gold winning slice)
//   4  FREE BONUS
//   5  TRY LATER
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$50 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$100 OFF",       color: "#fbbf24" },
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function DownsellPage() {
  const [won, setWon] = useState(false);

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
            Downsell 2
          </span>
        </div>

        {/* HEADLINE */}
        <h1 className="neon-purple text-4xl sm:text-5xl font-bold leading-tight mt-6">
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
                href="https://pay.hotmart.com/U106013301D?off=pqis6sbk&checkoutMode=10&sck=organico"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 CLAIM MY DISCOUNT
              </a>
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
