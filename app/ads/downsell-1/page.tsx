// =============================================================
// Ads variant — Downsell 1 (3x More Offer downsell, $27 one-time)
// -------------------------------------------------------------
// Duplicate of /downsell-1 for the PAID-TRAFFIC funnel.
// Wired to the Digistore 1-click upsell flow:
//   YES → https://www.checkout-ds24.com/answer/yes?template=light
//   NO  → https://www.checkout-ds24.com/answer/no
// Digistore handles the same-payment-method charge and redirects
// to the next funnel step configured in its admin (upsell-2 for
// both YES and NO on this page — see Digistore admin upsell config).
//
// The original /downsell-1 stays wired to the organic / Hotmart
// funnel and is NOT touched by this duplicate.
// =============================================================

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { SpinWheel, type SpinWheelSlice } from "@/components/SpinWheel";
import { TikTokPixel } from "@/components/TikTokPixel";

const DIGISTORE_YES_URL =
  "https://www.checkout-ds24.com/answer/yes?template=light";
const DIGISTORE_NO_URL = "https://www.checkout-ds24.com/answer/no";

// Calls the global digistoreUpsell() installed by digistore.js.
// Safe to call before the script loads (no-op if missing) AND safe
// to call multiple times — digistoreUpsell() just re-reads the URL
// params Digistore stores after the original purchase.
function callDigistoreUpsell() {
  if (typeof window === "undefined") return;
  const fn = (window as unknown as { digistoreUpsell?: () => void })
    .digistoreUpsell;
  if (typeof fn === "function") fn();
}

// Wheel slices — same as the organic /downsell-1, gold winning slice gives $20 OFF.
const SLICES: SpinWheelSlice[] = [
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" }, // 0  (1st spin lands here)
  { label: "$10 OFF",        color: "#4c1d95" },
  { label: "SPIN AGAIN 🎰", color: "#8b5cf6" },
  { label: "$20 OFF",        color: "#fbbf24" }, // 3  (2nd spin lands here — gold winning slice)
  { label: "FREE BONUS",     color: "#8b5cf6" },
  { label: "TRY LATER",      color: "#4c1d95" },
];

export default function AdsDownsell1Page() {
  const [won, setWon] = useState(false);

  // Cover the cached-script case: if digistore.js was already loaded
  // on a previous mount/navigation, onLoad on <Script> won't fire
  // again — running this on mount guarantees digistoreUpsell() is
  // called in both first-load and cached scenarios.
  useEffect(() => {
    callDigistoreUpsell();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-12 sm:py-16">
      <TikTokPixel />
      <Script
        src="https://www.digistore24-scripts.com/service/digistore.js"
        strategy="afterInteractive"
        onLoad={callDigistoreUpsell}
      />
      <div className="max-w-2xl mx-auto text-center">

        {/* HEADLINE */}
        <h1 className="neon-purple text-4xl sm:text-5xl font-bold leading-tight mt-12">
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
                href={DIGISTORE_YES_URL}
                className="inline-block mt-6 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-lg px-8 py-4 rounded-xl shadow-lg shadow-green-500/30"
              >
                🚀 YES — CLAIM MY $27 DISCOUNT
              </a>

            </div>
          </div>
        )}

        {/* NO THANKS → Digistore decline (Digistore admin routes to /ads/upsell-2) */}
        <div className="mt-12">
          <a
            href={DIGISTORE_NO_URL}
            className="inline-block outline-btn font-semibold py-2.5 px-5 rounded-xl text-sm"
          >
            No thanks
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
