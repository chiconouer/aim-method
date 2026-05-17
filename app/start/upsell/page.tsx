"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const WHAT_YOU_GET = [
  { icon: "📹", text: "12 advanced video lessons" },
  { icon: "⚙️", text: "Complex workflow techniques for ComfyUI and similar tools" },
  { icon: "✍️", text: "Library of 100+ tested professional prompts" },
  { icon: "🎛️", text: "Configuration templates for popular AI image platforms" },
  { icon: "🔄", text: "Lifetime access with future updates" },
  { icon: "💬", text: "Private learner community access" },
];

function StartUpsellContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleUpsell() {
    if (loading) return;
    if (!sessionId) {
      setErrorMsg("Session not found. Please contact support@aimodelmethods.com.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/upsell/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/start/upsell/downsell?session_id=${sessionId}`);
        return; // keep button disabled while navigating
      }
      if (data.requiresAction) {
        setErrorMsg(
          "Your bank requires additional authentication. Please contact support@aimodelmethods.com.",
        );
      } else {
        setErrorMsg(data.error || "Something went wrong. Please try again.");
      }
      setLoading(false);
    } catch (err) {
      console.error("[/start/upsell] error:", err);
      setErrorMsg("Network error. Please try again.");
      setLoading(false);
    }
  }

  const downsellHref = sessionId
    ? `/start/upsell/downsell?session_id=${sessionId}`
    : "/start/upsell/downsell";

  const mainButtonText = loading ? "Processing..." : "Get Instant Access — $197 →";
  const cardButtonText = loading ? "Processing..." : "GET INSTANT ACCESS →";

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      {/* HERO */}
      <div className="text-center px-5 pt-8 pb-3">
        <span className="inline-block mb-3 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-purple-900/10 border border-purple-700/20 text-purple-400">
          ✦ Next Level Course
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight mb-2">
          Take Your Skills to the<br />
          <span
            className="text-transparent bg-clip-text"
            style={{
              backgroundImage: "linear-gradient(135deg,#a78bfa,#e9d5ff,#a78bfa)",
              backgroundSize: "200%",
              animation: "shimmer 3s linear infinite",
            }}
          >
            Next Level
          </span>
        </h1>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Advanced AI Workflows Masterclass
        </p>
      </div>

      {/* BODY CARD */}
      <div
        className="mx-4 my-4 rounded-2xl border border-purple-900/30 px-5 py-6"
        style={{
          background: "linear-gradient(160deg,#0d0a1a,#080810)",
          boxShadow: "0 0 40px rgba(124,58,237,0.12)",
        }}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-gray-300 leading-relaxed">
            You&apos;ve started with the fundamentals. Now it&apos;s time to go deeper. Advanced AI Workflows Masterclass picks up where the AIM Method ends — with 12 advanced video lessons designed for intermediate users ready to produce professional results consistently.
          </p>
          <p className="text-[12px] text-gray-300 leading-relaxed">
            This isn&apos;t a basics rehash. Every lesson covers techniques used by digital artists working with AI image generation tools at a professional level.
          </p>
        </div>
      </div>

      {/* CTA BUTTON */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={handleUpsell}
          disabled={loading}
          className="block w-full text-center text-white text-base font-black py-4 rounded-2xl relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            animation: "btnGlow 3s ease-in-out infinite",
          }}
        >
          {mainButtonText}
        </button>
        <p className="text-center text-[10px] text-gray-600 mt-2">
          One-time payment · Full course access · 7-day money-back guarantee
        </p>
        {errorMsg && (
          <p className="text-center text-[11px] text-red-400 mt-3 max-w-md mx-auto">
            {errorMsg}
          </p>
        )}
      </div>

      {/* WHAT YOU GET DIVIDER */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">What You Get</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
      </div>

      {/* WHAT YOU GET CARD */}
      <div className="px-5 mb-5 relative">
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{
            padding: "2px",
            background: "conic-gradient(from 0deg, #7c3aed, #a78bfa, #e9d5ff, #7c3aed)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: "rotateBorder 3s linear infinite",
          }}
        />
        <div
          className="relative rounded-[18px] p-5"
          style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)" }}
        >
          <div className="text-center mb-4">
            <span
              className="inline-block px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-white mb-3"
              style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }}
            >
              ✦ Advanced Course · $197
            </span>
            <p className="text-sm font-bold text-gray-200">Everything included:</p>
          </div>

          <div className="flex flex-col gap-3 mb-5">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-purple-900/20 border border-purple-700/25">
                  {item.icon}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-4 border-t border-purple-900/20 mb-4">
            <p className="text-xl font-black text-white">
              Today: <span className="text-purple-400">$197</span>
            </p>
            <p className="text-[10px] text-gray-600 mt-1">One-time · No subscription</p>
          </div>

          <button
            type="button"
            onClick={handleUpsell}
            disabled={loading}
            className="block w-full text-center text-white text-sm font-black py-4 rounded-xl relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              animation: "wygBtnPulse 2s ease-in-out infinite",
            }}
          >
            {cardButtonText}
          </button>
          <p className="text-center text-[9px] text-gray-600 mt-2">
            🔒 Secure payment · Instant access · 7-day money-back guarantee
          </p>
        </div>
      </div>

      {/* NO THANKS */}
      <div className="text-center px-5 pb-10">
        <Link
          href={downsellHref}
          className="text-[12px] text-gray-500 hover:text-purple-400 transition-colors underline underline-offset-4"
        >
          No thanks, take me to a smaller option
        </Link>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-5 py-8 text-center">
        <p className="text-sm font-black mb-2">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </p>
        <p className="text-[10px] text-gray-500 mb-4">
          Questions?{" "}
          <a href="mailto:support@aimodelmethods.com" className="text-purple-400 hover:underline">
            support@aimodelmethods.com
          </a>
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 mb-4">
          <a href="/refund-policy" className="hover:text-purple-400 transition-colors">Refund Policy</a>
          <span className="text-gray-800">·</span>
          <a href="/terms" className="hover:text-purple-400 transition-colors">Terms</a>
          <span className="text-gray-800">·</span>
          <a href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</a>
        </div>
        <p className="text-[9px] text-gray-700">© 2026 AIM Method. All rights reserved.</p>
      </footer>

      <style>{`
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
        @keyframes wygBtnPulse {
          0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.4);transform:scale(1)}
          50%{box-shadow:0 0 40px rgba(124,58,237,0.7);transform:scale(1.01)}
        }
        @keyframes rotateBorder {
          0%{background:conic-gradient(from 0deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          25%{background:conic-gradient(from 90deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          50%{background:conic-gradient(from 180deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          75%{background:conic-gradient(from 270deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          100%{background:conic-gradient(from 360deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
        }
      `}</style>
    </div>
  );
}

export default function StartUpsellPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505]" />}>
      <StartUpsellContent />
    </Suspense>
  );
}
