"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function StartUpsellContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Existing 1-click charge state
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // VSL facade state
  const [showSoundOverlay, setShowSoundOverlay] = useState(true);
  const [showCTAs, setShowCTAs] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reveal upgrade CTAs 120 seconds after mount
  useEffect(() => {
    const t = setTimeout(() => setShowCTAs(true), 120_000);
    return () => clearTimeout(t);
  }, []);

  // Existing 1-click charge handler — behaviour unchanged
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

  // YouTube JS API postMessage to unmute the muted-autoplay video
  function handleUnmute() {
    iframeRef.current?.contentWindow?.postMessage(
      '{"event":"command","func":"unMute","args":""}',
      "*",
    );
    setShowSoundOverlay(false);
  }

  // "No thanks" routes through the downsell page so the same Stripe
  // session can power a 1-click $97 charge if the customer changes
  // their mind there.
  const noThanksHref = sessionId
    ? `/start/upsell/downsell?session_id=${sessionId}`
    : "/start/upsell/downsell";

  const mainButtonText = loading
    ? "Processing..."
    : "YES — UPGRADE MY ACCESS — $197";

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
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

          {/* Video + sound overlay */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mt-5 border border-white/5">
            <iframe
              ref={iframeRef}
              src="https://www.youtube.com/embed/RyOUKVc7mbk?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1"
              title="Lesson"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />

            {showSoundOverlay && (
              <button
                type="button"
                onClick={handleUnmute}
                aria-label="Tap to unmute the video"
                className="absolute inset-0 flex items-center justify-center bg-black/45 cursor-pointer focus:outline-none focus-visible:bg-black/55 transition-colors"
              >
                <span
                  className="flex items-center gap-2 px-6 py-4 sm:px-8 sm:py-5 rounded-2xl text-white text-base sm:text-lg font-black tracking-wide"
                  style={{
                    background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                    boxShadow:
                      "0 0 30px rgba(124,58,237,0.6), inset 0 1px 0 rgba(255,255,255,0.15)",
                    minHeight: "48px",
                    animation: "soundPulse 1.6s ease-in-out infinite",
                  }}
                >
                  <span className="text-2xl" aria-hidden="true">🔊</span>
                  TAP TO UNMUTE
                </span>
              </button>
            )}
          </div>

          {/* Upgrade CTAs — hidden until 120s elapses.
              Wrapper always rendered with min-height so revealing doesn't
              shift the page. Children only mounted once showCTAs flips,
              and fade in via opacity transition. */}
          <div
            className={`mt-6 min-h-[160px] transition-opacity duration-700 ease-out ${
              showCTAs ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            aria-hidden={!showCTAs}
          >
            {showCTAs && (
              <>
                <button
                  type="button"
                  onClick={handleUpsell}
                  disabled={loading}
                  className="block w-full text-center text-white text-sm sm:text-base font-black py-4 sm:py-5 rounded-2xl relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                    boxShadow:
                      "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
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
                <div className="text-center mt-5">
                  <a
                    href={noThanksHref}
                    className="text-[12px] text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
                  >
                    No thanks, take me to my course
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-5 py-8 text-center mt-auto">
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
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
        @keyframes soundPulse {
          0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(124,58,237,0.6),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{transform:scale(1.04);box-shadow:0 0 50px rgba(124,58,237,0.95),inset 0 1px 0 rgba(255,255,255,0.15)}
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
