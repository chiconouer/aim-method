"use client";

import { useEffect, useRef, useState } from "react";

// Black-hat $197 checkout — flips to a Hotmart link later, CenterPag for now.
const CHECKOUT_URL = "https://go.centerpag.com/PPU38CQC3BD?upsell=true";
const DOWNSELL_HREF = "/upsell/downsell";

export default function UpsellPage() {
  // VSL facade state
  const [showSoundOverlay, setShowSoundOverlay] = useState(true);
  const [showCTAs, setShowCTAs] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Reveal upgrade CTAs 120 seconds after mount
  useEffect(() => {
    const t = setTimeout(() => setShowCTAs(true), 120_000);
    return () => clearTimeout(t);
  }, []);

  // YouTube JS API postMessage to unmute the muted-autoplay video
  function handleUnmute() {
    iframeRef.current?.contentWindow?.postMessage(
      '{"event":"command","func":"unMute","args":""}',
      "*",
    );
    setShowSoundOverlay(false);
  }

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
                <a
                  href={CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
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
                <div className="text-center mt-5">
                  <a
                    href={DOWNSELL_HREF}
                    className="text-[12px] text-gray-500 hover:text-gray-300 transition-colors underline underline-offset-4"
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
        @keyframes soundPulse {
          0%,100%{transform:scale(1);box-shadow:0 0 30px rgba(124,58,237,0.6),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{transform:scale(1.04);box-shadow:0 0 50px rgba(124,58,237,0.95),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
      `}</style>
    </div>
  );
}
