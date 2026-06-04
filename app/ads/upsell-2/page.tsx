// =============================================================
// Ads variant — Upsell 2 (AI Model 11 photos, $197 one-time)
// -------------------------------------------------------------
// Duplicate of /upsell-2 for the PAID-TRAFFIC funnel.
// Wired to the Digistore 1-click upsell flow:
//   YES → https://www.checkout-ds24.com/answer/yes?template=light
//   NO  → https://www.checkout-ds24.com/answer/no
// Digistore handles the same-payment-method charge and redirects
// to the next funnel step configured in its admin (downsell-2).
//
// Video player: Vturb smartplayer (web component loaded via
// scripts.converteai.net). 120s reveal timer on the upgrade CTAs
// is independent of the player — it's a pure React setTimeout.
//
// The original /upsell-2 stays wired to the organic / Hotmart
// funnel and is NOT touched by this duplicate.
// =============================================================

"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

// <vturb-smartplayer> JSX type is declared globally in app/sales/page.tsx
// (module augmentation merges across files), so no local declaration here.

const VTURB_PLAYER_SRC =
  "https://scripts.converteai.net/ee166677-475b-4486-89b7-8d5715864e85/players/6a20bf63c681d550d423791a/v4/player.js";

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

export default function AdsUpsell2Page() {
  // 120s delayed-CTA timer state — independent of the video player
  const [showCTAs, setShowCTAs] = useState(false);

  // Reveal upgrade CTAs 120 seconds after mount
  useEffect(() => {
    const t = setTimeout(() => setShowCTAs(true), 120_000);
    return () => clearTimeout(t);
  }, []);

  // Cover the cached-script case: if digistore.js was already loaded
  // on a previous mount/navigation, onLoad on <Script> won't fire
  // again — running this on mount guarantees digistoreUpsell() is
  // called in both first-load and cached scenarios.
  useEffect(() => {
    callDigistoreUpsell();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Script
        src="https://www.digistore24-scripts.com/service/digistore.js"
        strategy="afterInteractive"
        onLoad={callDigistoreUpsell}
      />
      <Script src={VTURB_PLAYER_SRC} strategy="afterInteractive" />

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
              id="vid-6a20bf63c681d550d423791a"
              style={{ display: "block", margin: "0 auto", width: "100%" }}
            />
          </div>

          {/* Upgrade CTAs — hidden until 120s elapses */}
          <div
            className={`mt-6 min-h-[160px] transition-opacity duration-700 ease-out ${
              showCTAs ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!showCTAs}
          >
            {showCTAs && (
              <>
                <a
                  href={DIGISTORE_YES_URL}
                  className="block w-full text-center text-white text-sm sm:text-base font-black py-4 sm:py-5 rounded-2xl relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                    boxShadow:
                      "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                    animation: "btnGlow 3s ease-in-out infinite",
                  }}
                >
                  YES — UPGRADE MY ACCESS — $197
                </a>
                <p className="text-center text-[10px] text-gray-600 mt-2">
                  One-time payment · Instant access · Lifetime model
                </p>
                <div className="text-center mt-6">
                  <a
                    href={DIGISTORE_NO_URL}
                    className="inline-block outline-btn font-semibold py-2.5 px-5 rounded-xl text-sm"
                  >
                    No thanks
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <style>{`
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
      `}</style>
    </div>
  );
}
