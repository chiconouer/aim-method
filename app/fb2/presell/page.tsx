// =============================================================
// FB2 / Presell — Age-gate pre-sell page that feeds Test B.
//
// Flow:
//   - Landing state: 18+ headline + curiosity subtitle + two
//     buttons. "I'm 18 or older" navigates to /fb2/sales-b via
//     <Link> (SPA nav so <Fb2Tracking />'s Utmify UTM tracker
//     keeps its cached UTM state and forwards it to the checkout
//     URL). "I'm under 18" swaps content in place to a dead-end.
//   - Under-18 dead-end state: shows a "come back when you're 18"
//     message. No redirect (per plan), no way back to the gate
//     from the same visit (fine — the visitor is meant to leave).
//
// Non-sticky gate: state lives in useState only, no local /
// sessionStorage persistence. Every page load / refresh resets
// to the landing state. This avoids the "one accidental tap
// bypasses the gate forever on this device" trap and matches
// the plan-only decision.
//
// No quiz_funnel_events logging — presell is a Utmify + Vturb
// funnel step, not part of the quiz analytics pipeline.
//
// <Fb2Tracking /> is mounted so João's Utmify pixel + UTM
// tracker fires here (same as the other /fb2 pages).
// =============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { Fb2Tracking } from "@/components/Fb2Tracking";

export default function Fb2PresellPage() {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <Fb2Tracking />

      {/* NAV — same treatment as /fb2/sales for visual continuity
          between the presell and the VSL that follows. */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      <main className="flex-1 flex items-center justify-center px-5 py-10">
        <div
          className="w-full max-w-md rounded-2xl border border-purple-900/30 px-6 py-8 sm:px-8 sm:py-10"
          style={{
            background: "linear-gradient(160deg,#0d0a1a,#080810)",
            boxShadow: "0 0 40px rgba(124,58,237,0.12)",
          }}
        >
          {!blocked ? (
            <>
              {/* Age-gate landing state */}
              <div className="text-center">
                <span
                  className="inline-block mb-4 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase text-white"
                  style={{
                    background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                  }}
                >
                  ✦ 18+ Only ✦
                </span>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white mb-3">
                  This content is for{" "}
                  <span className="text-purple-400">18+ only</span>
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed mb-8">
                  What you&apos;re about to see reveals how people are quietly
                  making <span className="text-green-400 font-bold">$200–$500 a day</span>{" "}
                  using AI models — no face, no followers, no experience needed.
                  Confirm your age to continue.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/fb2/sales-b"
                  className="block w-full text-center text-white text-base font-black py-4 rounded-2xl relative overflow-hidden"
                  style={{
                    background:
                      "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                    boxShadow:
                      "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                  }}
                >
                  I&apos;m 18 or older →
                </Link>
                <button
                  type="button"
                  onClick={() => setBlocked(true)}
                  className="w-full text-center text-gray-400 text-sm font-semibold py-3 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors"
                >
                  I&apos;m under 18
                </button>
              </div>

              <p className="text-center text-[10px] text-gray-600 mt-6 leading-relaxed">
                By continuing you confirm you are of legal age in your country
                of residence.
              </p>
            </>
          ) : (
            <>
              {/* Under-18 dead-end state */}
              <div className="text-center">
                <div className="text-5xl mb-4" aria-hidden="true">
                  🚫
                </div>
                <h1 className="text-2xl sm:text-3xl font-black leading-tight text-white mb-3">
                  Come back when you&apos;re{" "}
                  <span className="text-purple-400">18</span>
                </h1>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Sorry — this content is restricted to adults only. You&apos;re
                  welcome to come back and check it out once you&apos;re of legal
                  age.
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
