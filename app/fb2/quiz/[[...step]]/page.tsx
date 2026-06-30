// =============================================================
// Facebook variant — Pre-VSL Quiz funnel (paid-traffic warm-up)
// -------------------------------------------------------------
// FIRST page of the SECOND Facebook paid funnel (new traffic manager). 8-step linear persuasion
// sequence with a progress bar. Steps 1-3 are scripted "real vs
// A.I." interactions (the answer is fixed, the buttons/tiles only
// look interactive). Steps 4-8 are the original persuasion
// sequence.
//
// Goal: warm up cold ad traffic before dumping them into the VSL
// at /fb2/sales. Step 8's CTA navigates to /fb2/sales.
//
// Route is an optional catch-all (/fb2/quiz/[[...step]]) so the
// browser URL can mirror the current step (/fb2/quiz/1 ... /8)
// without remounting, and a refresh mid-quiz lands on that step.
// The base /fb2/quiz still works — initial step defaults to 1 when
// no segment is present.
//
// All image/video URLs are empty constants at the top — paste real
// values when ready. While empty, each block renders a neutral
// placeholder so the page works end-to-end immediately.
// =============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
// canvas-confetti is loaded LAZILY via dynamic import inside
// fireCelebration() (see loadConfetti()) so the ~5 KB lib stays
// out of the initial route chunk. Only the type lives at the top
// of the file via `import type`, which is erased at compile time.
import type confetti from "canvas-confetti";
import { Fb2Tracking } from "@/components/Fb2Tracking";
import { getVisitorId } from "@/lib/visitor_id";
import {
  markStep1Mounted,
  markStep1Interaction,
  fireStep1Dwell,
} from "@/lib/step1_dwell";

// Microsoft Clarity exposes window.clarity as a function once the
// tag script (loaded by <Fb2Tracking />) has hydrated. Optional
// chaining at every call site (`window.clarity?.(...)`) means a
// pre-hydration or blocked-by-extension scenario is a silent no-op
// rather than an error.
declare global {
  interface Window {
    clarity?: (action: string, ...args: unknown[]) => void;
  }
}

const TOTAL_STEPS = 8;

// ───── INTRO STEPS (1-3): "real vs A.I." placeholder slots ─────
// Step 1 shows ONE image + Real / A.I. buttons. The image is meant
// to be A.I.-generated, so tapping "A.I." is "correct" and "Real"
// is "wrong" — both branches are wired regardless of the asset.
// Steps 2 & 3 show TWO tiles each; tapping either tile in step 2
// is always "correct", in step 3 always "wrong".
const INTRO1_IMG =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/imagemetapa_1.jpg";
const INTRO2_IMG_A =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1190.jpg";
const INTRO2_IMG_B =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1191.jpg";
const INTRO3_IMG_A =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1192.jpg";
const INTRO3_IMG_B =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1193.jpg";

// ───── MAIN STEPS (4-8): paste media URLs as they become available ─────
const STEP4_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/step4.jpg";
const STEP5_PROFILE_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/22193051-1742-46C5-8A1B-1B4EB91B3385-2.jpg";
const STEP5_EARNINGS_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/step5earnings-2.jpg";
const STEP6_VIDEO_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/D6562B56-AA02-4CEE-B738-A0D8C2362EA1.mp4";
// Step 7 — 5 testimonial images shown in a swipeable carousel
const STEP7_RESULTS_IMAGES: string[] = [
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/step7-2.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0997-2.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0999-2.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1001-2.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/93F3E47E-AF60-4CC7-BC7A-D4740F81D5DA-2.jpg",
];
const STEP8_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/step8v2.jpg";
// Tiny SVG data URI — paints a dark gradient placeholder while the
// step-6 video is unloaded. ~150 bytes, zero network cost. Keeps the
// video area visually present before the user taps to play.
const STEP6_VIDEO_POSTER =
  "data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%209%2016%27%3E%3Cdefs%3E%3ClinearGradient%20id%3D%27g%27%20x1%3D%270%27%20y1%3D%270%27%20x2%3D%270%27%20y2%3D%271%27%3E%3Cstop%20offset%3D%270%27%20stop-color%3D%27%23130c2a%27%2F%3E%3Cstop%20offset%3D%271%27%20stop-color%3D%27%23080810%27%2F%3E%3C%2FlinearGradient%3E%3C%2Fdefs%3E%3Crect%20width%3D%279%27%20height%3D%2716%27%20fill%3D%27url%28%23g%29%27%2F%3E%3C%2Fsvg%3E";
// ───────────────────────────────────────────────────────────

// Only INTRO1_IMG (step 1) is preloaded eagerly via a
// fetchpriority="high" <link> in the SSR'd HTML + a fetchPriority
// attribute on the <img> tag itself — step 1 is what the visitor
// sees first and any delay here costs paid clicks.
//
// All other step images load lazily when their step mounts
// (loading="lazy" on each <img>). Now that the four heavy PNGs
// have been re-encoded to JPEG (8.2 MB → 3.6 MB total across the
// 14 images), the bulk pre-fetch is no longer worth the memory
// pressure it caused in the TikTok in-app browser (WKWebView was
// evicting tabs after the old 7+ MB preload). See PR description.

// =============================================================
// Money sound — synthesized cash-register "cha-ching" via Web
// Audio API. No audio file is loaded or shipped.
//
// Why it sounds metallic instead of bell-y: each percussive hit
// stacks multiple SQUARE-wave oscillators at non-harmonic
// frequencies (e.g. 3200 + 4400 Hz, ratio ≠ 2:1). Square waves
// carry odd harmonics, the non-harmonic stacking adds
// inharmonicity, and that combo reads as "coin/metal" to the
// ear instead of "bell". A short noise burst at t=0 fakes the
// drawer-slide "ka" before the bell tail.
//
// AudioContext is lazily constructed on first call (which always
// happens inside a user-gesture handler, so autoplay policies
// allow it) and reused after. Every public call is wrapped in
// try/catch so blocked / unsupported / suspended contexts
// silently no-op instead of throwing into the React tree.
// =============================================================
let audioCtxRef: AudioContext | null = null;

function ensureAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtxRef) {
      const Ctor =
        window.AudioContext ||
        (
          window as unknown as {
            webkitAudioContext?: typeof AudioContext;
          }
        ).webkitAudioContext;
      if (!Ctor) return null;
      audioCtxRef = new Ctor();
    }
    if (audioCtxRef.state === "suspended") {
      audioCtxRef.resume().catch(() => {});
    }
    return audioCtxRef;
  } catch {
    return null;
  }
}

// Short noise burst — used for the "ka" of "cha-CHING" so the
// drawer-slide character is in there. Filter steeply lowpassed
// so it reads as a thud, not white-noise hiss.
function playNoiseBurst(
  ctx: AudioContext,
  startTime: number,
  duration: number,
  peak: number,
): void {
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < sampleCount; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 1200;
  filter.Q.value = 0.6;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(startTime);
  source.stop(startTime + duration + 0.02);
}

// Stack of square-wave oscillators at the given inharmonic freqs.
// All start at the same time; one shared gain envelope = a single
// percussive "clink". The non-harmonic stacking is what makes it
// sound like metal hitting metal instead of a tuning fork.
function playMetallicClink(
  ctx: AudioContext,
  startTime: number,
  freqs: number[],
  duration: number,
  peak: number,
): void {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  gain.connect(ctx.destination);
  for (const freq of freqs) {
    const osc = ctx.createOscillator();
    osc.type = "square";
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }
}

function playMoneySound(): void {
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;

    // 1. "ka" — short filtered noise burst, register drawer slide.
    playNoiseBurst(ctx, t0, 0.04, 0.18);

    // 2. First coin clink, slightly delayed — "cha"
    playMetallicClink(ctx, t0 + 0.02, [3200, 4400], 0.09, 0.09);

    // 3. Second coin clink, higher — "ching" attack
    playMetallicClink(ctx, t0 + 0.1, [3800, 5200], 0.08, 0.085);

    // 4. Bell-tail ring — longer decay, three inharmonic partials.
    //    This is what carries the "money is mine" sustain after
    //    the percussive clinks.
    playMetallicClink(ctx, t0 + 0.18, [2200, 2987, 4400], 0.4, 0.075);
  } catch {
    // Silent no-op — audio must never block the popup UX.
  }
}

// =============================================================
// Funnel analytics beacon — POST to /api/quiz-funnel for every
// step view. Browser NEVER touches Supabase directly: the route
// uses the service-role client server-side, and the
// quiz_funnel_events table is RLS-locked to service_role only.
//
// Prefers navigator.sendBeacon (queued by the browser, survives
// navigation — that's the property we need for the step=9 fire
// right before router.push("/{platform}/sales")). Falls back to
// fetch + keepalive if sendBeacon is missing or returns false
// (e.g. the browser's beacon queue is full).
//
// Wrapped in try/catch so any browser quirk silently no-ops —
// analytics ingestion must never break the quiz UX.
// =============================================================
function recordFunnelStep(
  platform: "ttk" | "fb" | "fb2",
  step: number,
): void {
  try {
    if (typeof window === "undefined") return;
    const visitor_id = getVisitorId();
    const body = JSON.stringify({ platform, step, visitor_id });
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/quiz-funnel", blob);
      if (ok) return;
    }
    fetch("/api/quiz-funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent — analytics failures must never break the quiz.
  }
}

// =============================================================
// Celebration burst — confetti via canvas-confetti (~5 KB gz),
// LAZY-LOADED via dynamic import so the lib doesn't ship in the
// initial route chunk. The first popup tap downloads the chunk
// (typically <100 ms on warm caches); subsequent celebrations
// reuse the cached module.
//
// Fires on correct guesses (step 1 picking "A.I." and step 2 any
// tap). Three layered effects: a center burst, raining money
// emojis from the top, and side bursts ~200 ms later for depth.
//
// Every public call is wrapped in try/catch so a missing
// document, denied OffscreenCanvas, dynamic-import failure, or
// a stale browser silently no-ops — the popup must always show,
// the user must always be able to advance.
// =============================================================
type ConfettiFn = typeof confetti;
let confettiPromise: Promise<ConfettiFn> | null = null;
function loadConfetti(): Promise<ConfettiFn> {
  if (!confettiPromise) {
    confettiPromise = import("canvas-confetti").then((m) => m.default);
  }
  return confettiPromise;
}

async function fireCelebration(): Promise<void> {
  try {
    const confetti = await loadConfetti();
    // Confetti renders to its own fixed-position canvas; zIndex
    // 9999 makes sure it overlays the popup (z-[60]).
    confetti({
      particleCount: 80,
      spread: 80,
      startVelocity: 35,
      ticks: 130,
      origin: { x: 0.5, y: 0.65 },
      colors: ["#7c3aed", "#a78bfa", "#22c55e", "#fbbf24", "#e9d5ff"],
      zIndex: 9999,
    });

    // Raining money emojis from the top. shapeFromText was added
    // in canvas-confetti 1.6 — the package.json pin (^1.9) is well
    // above that.
    try {
      const money = confetti.shapeFromText({ text: "💰", scalar: 3 });
      confetti({
        particleCount: 22,
        angle: 270,
        spread: 110,
        startVelocity: 28,
        gravity: 1.1,
        ticks: 220,
        origin: { x: 0.5, y: 0 },
        shapes: [money],
        scalar: 3,
        zIndex: 9999,
      });
    } catch {
      // shapeFromText unavailable — center burst alone is enough.
    }

    // Side bursts 200ms later for layered crowd-roar feel.
    setTimeout(() => {
      try {
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ["#7c3aed", "#a78bfa", "#22c55e", "#fbbf24"],
          zIndex: 9999,
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ["#7c3aed", "#a78bfa", "#22c55e", "#fbbf24"],
          zIndex: 9999,
        });
      } catch {
        /* */
      }
    }, 200);
  } catch {
    // Silent no-op — celebration failures must never block the popup.
  }
}

// Red rubber-stamp overlay rendered on top of an image during the
// "wrong" reveal on steps 1 and 3. Positioned absolutely; the
// caller is expected to provide a `relative` parent that hugs the
// image so this lands centered over the photo itself.
function AIStamp() {
  return (
    <div
      className="intro-stamp absolute pointer-events-none whitespace-nowrap"
      style={{
        top: "50%",
        left: "50%",
        padding: "8px 14px",
        background: "rgba(220, 38, 38, 0.92)",
        border: "3px solid rgba(255, 255, 255, 0.95)",
        boxShadow:
          "0 0 28px rgba(220, 38, 38, 0.7), 0 6px 18px rgba(0,0,0,0.55)",
        transform: "translate(-50%, -50%) rotate(-12deg)",
      }}
    >
      <span className="text-white font-black text-sm sm:text-lg tracking-widest">
        AI GENERATED 🤖
      </span>
    </div>
  );
}

function ImagePlaceholder({
  url,
  alt,
  aspectClass = "aspect-[4/3]",
}: {
  url: string;
  alt: string;
  /** Only applied to the empty-URL placeholder box (gives it a visible
   *  default height). Real images set their own height via h-auto. */
  aspectClass?: string;
}) {
  if (url) {
    // Container fits the image — block + w-full + h-auto means the rendered
    // height comes from the image's natural aspect ratio with NO empty
    // letterbox bars around it. The border/radius wraps the actual image.
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className="block w-full h-auto rounded-2xl border border-purple-900/30"
      />
    );
  }
  return (
    <div
      className={`w-full ${aspectClass} rounded-2xl border border-purple-900/30 flex items-center justify-center bg-[#0d0d0d]`}
      style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
    >
      <span className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">
        Image placeholder
      </span>
    </div>
  );
}

// Tap-to-play video. preload="none" + no autoPlay guarantees the
// browser does NOT fetch the 16 MB source until the visitor explicitly
// taps. The poster is an inline SVG (zero network) so the video area
// is visually present from mount. On tap, .play() inside the user
// gesture unblocks BOTH the network load and unmuted audio in one
// shot (iOS requires a gesture for unmuted playback). Mounts only
// when step === 6, so even the <video> element doesn't exist before
// that.
function VideoPlaceholder({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showStartOverlay, setShowStartOverlay] = useState(true);

  function handleStart() {
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      v.play().catch(() => {});
    }
    setShowStartOverlay(false);
  }

  if (url) {
    // max-w-sm + mx-auto centers the portrait video and caps its width so
    // it stays a comfortable size on desktop while filling the full width
    // on mobile. <video> with no aspect class auto-heights from intrinsic
    // ratio — no wide black side bars, container hugs the video.
    return (
      <div className="relative w-full max-w-sm mx-auto">
        <video
          ref={videoRef}
          loop
          playsInline
          controls
          preload="none"
          poster={STEP6_VIDEO_POSTER}
          className="block max-h-[50vh] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30 bg-black"
        >
          <source src={url} type="video/mp4" />
        </video>
        {showStartOverlay && (
          <button
            type="button"
            onClick={handleStart}
            aria-label="Tap to play video"
            className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer focus:outline-none focus-visible:bg-black/10 transition-colors"
          >
            <span
              className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-black tracking-wide"
              style={{
                background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                boxShadow:
                  "0 0 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              }}
            >
              <span className="text-base" aria-hidden="true">▶</span>
              Tap to play
            </span>
          </button>
        )}
      </div>
    );
  }
  return (
    <div
      className="w-full aspect-video rounded-2xl border border-purple-900/30 flex items-center justify-center bg-[#0d0d0d] max-w-sm mx-auto"
      style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
    >
      <span className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">
        Video placeholder
      </span>
    </div>
  );
}

// Horizontal swipeable carousel — CSS scroll-snap handles touch/drag
// natively on mobile, no JS gesture lib needed. onScroll measures the
// current slide index from scrollLeft so dot indicators stay in sync.
// Scroll events fire 60+ times/sec on mobile, so we coalesce them
// through requestAnimationFrame — at most one index recalc per frame.
// Cheap React-side comparison still gates re-renders, but the rAF
// gate prevents the React reconciler from being woken up needlessly.
function TestimonialsCarousel({ images }: { images: string[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  function handleScroll() {
    if (rafRef.current !== null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const el = scrollRef.current;
      if (!el || el.clientWidth === 0) return;
      const newIndex = Math.round(el.scrollLeft / el.clientWidth);
      setActiveSlide((prev) => (prev === newIndex ? prev : newIndex));
    });
  }

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function goToSlide(i: number) {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="carousel-track flex items-start overflow-x-auto snap-x snap-mandatory scroll-smooth"
      >
        {images.map((url, i) => (
          <div
            key={i}
            className="snap-center flex-shrink-0 w-full flex items-start justify-center"
          >
            {url ? (
              // Inline <img> with max-h cap so testimonials at varying
              // natural ratios don't blow up the carousel height. Image
              // stays whole (no crop, no letterbox) and centers in the
              // slide. Swipe + dot indicators still work — each slide
              // is full-width regardless of its image's rendered width.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`Student result ${i + 1}`}
                loading="lazy"
                decoding="async"
                className="block max-h-[300px] max-w-full w-auto h-auto rounded-2xl border border-purple-900/30"
              />
            ) : (
              <ImagePlaceholder
                url=""
                alt={`Student result ${i + 1}`}
                aspectClass="aspect-[4/5]"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 mt-3">
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goToSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeSlide ? "w-6 bg-purple-400" : "w-2 bg-gray-700"
            }`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-500 text-center mt-2 tracking-wide">
        ← Swipe to see more →
      </p>
    </div>
  );
}

// Static glow — the previous infinite box-shadow animation (3 s loop
// on every Continue button) forced a full repaint each frame on
// mobile/in-app browsers, which compounded into visible jank on
// WKWebView. The non-animated glow looks ~identical and costs zero
// per frame after first paint.
function ContinueButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-center text-white text-base sm:text-lg font-black py-4 sm:py-5 rounded-2xl relative overflow-hidden mt-6"
      style={{
        background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
        boxShadow:
          "0 8px 40px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.15)",
      }}
    >
      {label}
    </button>
  );
}

// Generic single-tile renderer used by Step 1 (one image above the
// Real/A.I. buttons). When `revealing` is true, the image runs the
// glitch keyframe and stamps an "AI GENERATED" badge over the
// portrait — this is the "you got tricked, it was AI all along"
// reveal that fires when the user taps the "Real" button (wrong
// answer on the scripted Step 1).
//
// The wrapper uses `width: fit-content + mx-auto` so the
// absolutely-positioned <AIStamp /> centers on the image itself,
// not on the wider parent container.
function IntroSingleTile({
  url,
  placeholderLabel,
  revealing = false,
}: {
  url: string;
  placeholderLabel: string;
  revealing?: boolean;
}) {
  if (url) {
    return (
      <div
        className="relative mx-auto"
        style={{ width: "fit-content" }}
      >
        {/* fetchPriority + loading="eager" tells the browser this is
            the LCP candidate — the same hint that lets the
            <link rel="preload"> in <head> outrank the deferred image
            requests when they kick off after first paint. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt="Real or A.I.?"
          fetchPriority="high"
          loading="eager"
          decoding="async"
          className={`block max-h-[55vh] max-w-full w-auto h-auto rounded-2xl border border-purple-900/30 ${
            revealing ? "intro-glitch" : ""
          }`}
        />
        {revealing && <AIStamp />}
      </div>
    );
  }
  return (
    <div
      className="relative w-full max-w-sm mx-auto"
      style={{ width: "fit-content" }}
    >
      <div
        className={`w-full max-w-sm aspect-[3/4] rounded-2xl border border-purple-900/30 flex items-center justify-center bg-[#0d0d0d] ${
          revealing ? "intro-glitch" : ""
        }`}
        style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
      >
        <span className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">
          {placeholderLabel}
        </span>
      </div>
      {revealing && <AIStamp />}
    </div>
  );
}

// Two-tile guess row used by intro steps 2 and 3. Same visual
// recipe as Step 5's two-image grid (inline <img> + natural aspect
// + mx-auto centering), but with a much taller max-height cap
// (55vh — about half the viewport on mobile) so the intro photos
// fill the screen instead of leaving black space below. Step 5
// keeps its 360px cap because its Continue button must stay
// in-view.
// `items-start` keeps tiles top-aligned when their natural heights
// differ. ANY tap calls onPick — the right/wrong decision is made
// in the parent (so this component stays asset-agnostic).
//
// Tappable affordance: the 2px purple border on the image is the
// primary "this is clickable" cue. group-hover and group-focus
// brighten it to purple-300 on devices that hover. `active:scale`
// provides press feedback on mobile.
function IntroTwoTileRow({
  images,
  onPick,
  revealing = false,
}: {
  images: { url: string; placeholderLabel: string }[];
  onPick: () => void;
  revealing?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 items-start">
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={onPick}
          aria-label={`Pick option ${String.fromCharCode(65 + i)}`}
          className="group block focus:outline-none active:scale-[0.97] transition-transform cursor-pointer"
        >
          {/* relative + fit-content wrapper so the AI GENERATED stamp
              centers on the image, not the full button cell. */}
          <div
            className="relative mx-auto"
            style={{ width: "fit-content" }}
          >
            {img.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={img.url}
                alt={`Option ${String.fromCharCode(65 + i)}`}
                loading="lazy"
                decoding="async"
                className={`block max-h-[55vh] max-w-full w-auto h-auto rounded-2xl border-2 border-purple-700/50 group-hover:border-purple-300 group-focus-visible:border-purple-300 transition-colors ${
                  revealing ? "intro-glitch" : ""
                }`}
              />
            ) : (
              <div
                className={`w-full aspect-[3/4] rounded-2xl border-2 border-purple-700/50 group-hover:border-purple-300 group-focus-visible:border-purple-300 transition-colors flex items-center justify-center bg-[#0d0d0d] ${
                  revealing ? "intro-glitch" : ""
                }`}
                style={{
                  boxShadow: "0 0 16px rgba(124,58,237,0.08)",
                  minWidth: "120px",
                }}
              >
                <span className="text-[11px] uppercase tracking-widest text-purple-700 font-bold text-center px-1">
                  {img.placeholderLabel}
                </span>
              </div>
            )}
            {revealing && <AIStamp />}
          </div>
        </button>
      ))}
    </div>
  );
}

// Full-screen modal popup shown after a guess. Auto-dismisses after
// ~2s — no Continue button, no tap required. The kind prop just
// flips color + copy.
type PopupKind = "correct" | "wrong";

const POPUP_AUTO_ADVANCE_MS = 2000;

function GuessPopup({
  kind,
  title,
  subtitle,
  onContinue,
}: {
  kind: PopupKind;
  title: string;
  subtitle: string;
  onContinue: () => void;
}) {
  // Hold onContinue in a ref so the auto-advance timeout always calls
  // the latest version without resetting the 2s clock when the parent
  // re-renders. A single timeout per mount; cleared on unmount. The
  // user spec: "doesn't double-fire or skip".
  const onContinueRef = useRef(onContinue);
  useEffect(() => {
    onContinueRef.current = onContinue;
  }, [onContinue]);
  useEffect(() => {
    const t = setTimeout(() => onContinueRef.current(), POPUP_AUTO_ADVANCE_MS);
    return () => clearTimeout(t);
  }, []);

  const isCorrect = kind === "correct";
  const accent = isCorrect ? "34,197,94" : "239,68,68"; // green / red as rgb
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isCorrect ? "Correct answer" : "Wrong answer"}
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: "rgba(0,0,0,0.78)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-center"
        style={{
          background: "linear-gradient(160deg,#0d0a1a,#080810)",
          border: `1px solid rgba(${accent},0.35)`,
          boxShadow: `0 0 36px rgba(${accent},0.25)`,
          animation: "popupIn 0.32s ease-out",
        }}
      >
        <div className="text-5xl mb-2" aria-hidden="true">
          {isCorrect ? "✅" : "🤖"}
        </div>
        <h2
          className={`text-2xl font-black mb-1 ${
            isCorrect ? "text-green-400" : "text-red-400"
          }`}
        >
          {title}
        </h2>
        <p className="text-sm text-gray-400">{subtitle}</p>
      </div>
    </div>
  );
}

// Maps (step, kind) → popup copy. The headline differs per step
// because the trick the user is being shown is different — see the
// scripted behavior in Fb2QuizPage's handlers.
function popupCopyFor(
  step: number,
  kind: PopupKind,
): { title: string; subtitle: string } {
  if (kind === "correct") {
    if (step === 1) {
      return {
        title: "Correct — she's A.I. ✅",
        subtitle: "You've got an eye 👀",
      };
    }
    return { title: "Correct!", subtitle: "Nice eye 👁️" };
  }
  // wrong
  if (step === 3) {
    return {
      title: "Gotcha! BOTH are A.I. 🤯",
      subtitle: "See how impossible it is to tell?",
    };
  }
  return {
    title: "Wrong — she's A.I.",
    subtitle: "AI is hard to spot 🤖",
  };
}

// Step 1 — single image, Real / A.I. buttons. Tap "Real" → wrong
// (image glitches + AI GENERATED stamp), tap "A.I." → correct
// (celebration burst). The image is scripted to be A.I., so the
// "Real" button is always the wrong answer.
function Step1({
  onReal,
  onAi,
  revealing,
}: {
  onReal: () => void;
  onAi: () => void;
  revealing: boolean;
}) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        To unlock the method, answer: is she{" "}
        <span className="text-green-400">real</span> or{" "}
        <span className="text-purple-400">A.I.</span>?
      </h1>
      <IntroSingleTile
        url={INTRO1_IMG}
        placeholderLabel="INTRO1"
        revealing={revealing}
      />
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          type="button"
          onClick={onReal}
          disabled={revealing}
          className="text-white text-base sm:text-lg font-black py-4 rounded-2xl border border-purple-700/40 bg-[#0d0a1a] hover:bg-[#13102a] focus:outline-none focus-visible:border-purple-400 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
        >
          Real
        </button>
        <button
          type="button"
          onClick={onAi}
          disabled={revealing}
          className="text-white text-base sm:text-lg font-black py-4 rounded-2xl border border-purple-700/40 bg-[#0d0a1a] hover:bg-[#13102a] focus:outline-none focus-visible:border-purple-400 transition-colors active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
        >
          A.I.
        </button>
      </div>
    </>
  );
}

function Step2({ onPick }: { onPick: () => void }) {
  // pt-12/16 shifts the block down so it lands in a balanced
  // middle-of-screen zone on mobile instead of glueing to the top
  // with empty space below. Not fully centered — the headline would
  // drift too far from the logo — just nudged into the upper-mid.
  return (
    <div className="pt-12 sm:pt-16">
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-3">
        Which of these is a{" "}
        <span className="text-green-400">real woman</span>?
      </h1>
      <p className="text-[13px] sm:text-sm text-purple-300 font-semibold text-center mb-4">
        👇 Tap the photo you think is real
      </p>
      <IntroTwoTileRow
        images={[
          { url: INTRO2_IMG_A, placeholderLabel: "INTRO2 A" },
          { url: INTRO2_IMG_B, placeholderLabel: "INTRO2 B" },
        ]}
        onPick={onPick}
      />
    </div>
  );
}

function Step3({
  onPick,
  revealing,
}: {
  onPick: () => void;
  revealing: boolean;
}) {
  // pt-12/16 — same vertical-balance shift as Step2, see comment there.
  return (
    <div className="pt-12 sm:pt-16">
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-3">
        Which of these is a{" "}
        <span className="text-green-400">real woman</span>?
      </h1>
      <p className="text-[13px] sm:text-sm text-purple-300 font-semibold text-center mb-4">
        👇 Tap the photo you think is real
      </p>
      <IntroTwoTileRow
        images={[
          { url: INTRO3_IMG_A, placeholderLabel: "INTRO3 A" },
          { url: INTRO3_IMG_B, placeholderLabel: "INTRO3 B" },
        ]}
        onPick={onPick}
        revealing={revealing}
      />
    </div>
  );
}

function Step4({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        You couldn&apos;t tell which one was real. Now imagine making{" "}
        <span className="text-green-400">$200&ndash;$500</span> a day creating
        AI models exactly like those.
      </h1>
      {STEP4_IMAGE_URL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STEP4_IMAGE_URL}
          alt="AI model showcase"
          loading="lazy"
          decoding="async"
          className="block max-h-[40vh] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
        />
      ) : (
        <ImagePlaceholder url="" alt="AI model showcase" />
      )}
      <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mt-5">
        You only need about 2 hours a day to pull in{" "}
        <span className="text-green-400 font-bold">$200–$500</span>.
      </p>
      <ContinueButton label="Continue →" onClick={onContinue} />
    </>
  );
}

function Step5({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-3">
        This is just <span className="text-purple-400">ONE</span> of the
        accounts I have.
      </h1>
      {/* Two images side-by-side. Inline <img> with max-h cap + max-w-full
          so each image renders at natural aspect (no crop, no letterbox)
          but won't dominate vertical space. items-start prevents stretch. */}
      <div className="grid grid-cols-2 gap-2 items-start">
        {STEP5_PROFILE_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={STEP5_PROFILE_IMAGE_URL}
            alt="Example AI profile"
            loading="lazy"
            decoding="async"
            className="block max-h-[360px] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
          />
        ) : (
          <ImagePlaceholder url="" alt="Example AI profile" aspectClass="aspect-[3/4]" />
        )}
        {STEP5_EARNINGS_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={STEP5_EARNINGS_IMAGE_URL}
            alt="Earnings proof"
            loading="lazy"
            decoding="async"
            className="block max-h-[360px] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
          />
        ) : (
          <ImagePlaceholder url="" alt="Earnings proof" aspectClass="aspect-[3/4]" />
        )}
      </div>
      <p className="text-[12px] sm:text-[13px] text-gray-300 leading-snug text-center mt-2">
        This profile was built 100% with AI. Less than 30 days old, and it&apos;s
        already pulled in over{" "}
        <span className="text-green-400 font-bold">$10,000</span> and gained{" "}
        <span className="text-purple-400 font-bold">14k followers</span>.
      </p>
      <p className="text-[12px] sm:text-[13px] text-gray-400 leading-snug text-center mt-1">
        On the next page I&apos;ll show you a new tool — but you&apos;ve gotta
        use it responsibly, deal? 👀
      </p>
      <ContinueButton label="Continue →" onClick={onContinue} />
    </>
  );
}

function Step6({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        With just <span className="text-purple-400">3 clicks</span> you can copy
        the movements from any existing video and apply them to your AI
        influencer. 👇
      </h1>
      <VideoPlaceholder url={STEP6_VIDEO_URL} />
      <ContinueButton label="I want to make $200/day" onClick={onContinue} />
    </>
  );
}

function Step7({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-lg sm:text-xl font-black text-white leading-tight text-center mb-2">
        This is the <span className="text-green-400">laziest way</span> to make{" "}
        <span className="text-green-400">$200 to $500</span> a day — even if
        you know nothing about AI, even if you&apos;ve never worked online
        before.
      </h1>
      <p className="text-[13px] sm:text-sm text-gray-300 leading-snug text-center mb-3">
        Take a look at the results some of my students are getting:
      </p>
      <TestimonialsCarousel images={STEP7_RESULTS_IMAGES} />
      <ContinueButton label="Continue →" onClick={onContinue} />
    </>
  );
}

function Step8({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-lg sm:text-xl font-black text-white leading-tight text-center mb-3">
        Now I&apos;m gonna show you how to{" "}
        <span className="text-purple-400">get your AI model for free</span> and
        start making <span className="text-green-400">$200 to $500</span> a day.
      </h1>
      {STEP8_IMAGE_URL ? (
        // Inline <img> with max-h cap + w-auto so the image stays whole at
        // its natural aspect (no crop, no letterbox bars) but doesn't
        // dominate the screen. Centered so the Continue button stays
        // visible without scrolling on a typical mobile.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STEP8_IMAGE_URL}
          alt="Class preview"
          loading="lazy"
          decoding="async"
          className="block max-h-[42vh] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
        />
      ) : (
        <ImagePlaceholder url="" alt="Class preview" />
      )}
      <ContinueButton label="I want access to this" onClick={onContinue} />
    </>
  );
}

// Optional catch-all gives us `params.step` as `string[] | undefined`.
// Clamp the first segment to [1..TOTAL_STEPS]; anything else → step 1.
// Keeps mid-quiz refreshes (e.g. /fb2/quiz/4) landing on that step and
// the base /fb2/quiz (no segment) starting at 1.
function parseInitialStep(segment: string[] | undefined): number {
  const raw = segment?.[0];
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1;
}

export default function Fb2QuizPage({
  params,
}: {
  params: { step?: string[] };
}) {
  const [step, setStep] = useState(() => parseInitialStep(params.step));
  // popup tracks which step + which outcome so popupCopyFor can pick
  // the right title/subtitle (different per step). null = no popup.
  const [popup, setPopup] = useState<{ kind: PopupKind; step: number } | null>(
    null,
  );
  // `revealing` flips on between a wrong tap and the popup appearing,
  // so the intro image components can run the glitch keyframe and
  // stamp "AI GENERATED" over the photos before the user sees the
  // explanation. Only steps 1 and 3 actually read this prop.
  const [revealing, setRevealing] = useState(false);
  const router = useRouter();

  // "Reached step N" — fires whenever the visible step changes,
  // including the initial mount (step=1). Combined with the
  // *_advanced events below, this gives a full view→click funnel
  // per step in Clarity, scoped to the second Facebook funnel via the fb2_ prefix.
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Mirror step in URL via replaceState (NOT pushState) so the
      // browser back button leaves the quiz instead of walking through
      // steps in reverse. Pure DOM API — no Next.js navigation, no
      // remount, no fetch.
      window.history.replaceState(null, "", `/fb2/quiz/${step}`);
      window.clarity?.("event", `fb2_quiz_step_${step}_viewed`);
      // Fire the Supabase beacon from the same [step] effect that
      // fires Clarity, so dedup behavior matches: exactly one row
      // per step view per session in production (React strict mode
      // may double-fire in dev — acceptable, dev only).
      recordFunnelStep("fb2", step);
      // Mark step-1 mount time for the dwell-based bot filter.
      // markStep1Mounted no-ops on SSR and resets the dedupe flag,
      // so re-entering step 1 (rare — happens only on full reload)
      // arms a fresh measurement.
      if (step === 1) markStep1Mounted();
    }
  }, [step]);

  // Page-leave listeners that fire the step-1 dwell beacon when the
  // visitor closes the tab, switches apps, or otherwise leaves
  // step 1 without advancing. fireStep1Dwell is idempotent (single
  // send per visit) so all three listeners pointing at it is safe.
  // Cleanup removes them on unmount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    function flush() {
      fireStep1Dwell("fb2", getVisitorId());
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    window.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  // Interaction listeners — registered only while step 1 is active.
  // Any touchstart / pointerdown / click / scroll flips the
  // step-1 interaction flag in the dwell helper. markStep1Interaction
  // is idempotent so multiple events firing in sequence (e.g.
  // touchstart → pointerdown → click on the same tap) are safe.
  // Cleaned up when step changes — no listeners survive past step 1.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (step !== 1) return;
    function onInteract() {
      markStep1Interaction();
    }
    window.addEventListener("touchstart", onInteract, { passive: true });
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("click", onInteract);
    window.addEventListener("scroll", onInteract, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onInteract);
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("click", onInteract);
      window.removeEventListener("scroll", onInteract);
    };
  }, [step]);

  // Pre-warm the AudioContext on idle so the synchronous Web Audio
  // setup (~10–50 ms on low-end / in-app browsers) doesn't block the
  // first answer-tap's popup render. The context is created in
  // `suspended` state outside any user gesture; the answer tap then
  // calls ensureAudioCtx() which already-exists + `.resume()` inside
  // the gesture (which is what iOS actually needs to unlock audio).
  // Wrapped in requestIdleCallback (with a setTimeout fallback) so it
  // doesn't fight with first paint for thread time.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
    };
    const schedule =
      w.requestIdleCallback ?? ((cb: () => void) => setTimeout(cb, 0));
    schedule(() => {
      ensureAudioCtx();
    });
  }, []);

  function next() {
    if (step < TOTAL_STEPS) {
      // "Advanced from step N" — fired BEFORE setStep so the event
      // carries the step the user is leaving, not the one they land on.
      if (typeof window !== "undefined") {
        window.clarity?.("event", `fb2_quiz_step_${step}_advanced`);
      }
      // Fire the step-1 dwell beacon as soon as the visitor advances
      // past step 1 — clearer signal than waiting for them to leave
      // the page, and the next() path is the common case.
      if (step === 1) {
        fireStep1Dwell("fb2", getVisitorId());
      }
      setStep(step + 1);
    }
  }

  function goToSales() {
    // Final completion — fired BEFORE router.push so it's guaranteed
    // to land in the same Clarity session as the quiz steps (the next
    // page mounts its own session).
    if (typeof window !== "undefined") {
      window.clarity?.("event", "fb2_quiz_step_8_completed");
      // step=9 = "reached the VSL". sendBeacon is queued by the
      // browser BEFORE router.push tears the page down, so the
      // event survives navigation.
      recordFunnelStep("fb2", 9);
    }
    // Client-side nav into the VSL page. /fb2/sales mounts its own
    // Vturb script via useEffect, so SPA navigation works fine.
    router.push("/fb2/sales");
  }

  // Correct path — fire the celebration burst (confetti + falling
  // money emojis) and pop the popup right away. No reveal delay.
  // `void` discards the celebration Promise: confetti is fire-and-
  // forget, the popup must not wait on the dynamic-import chunk.
  function triggerCorrect(stepNumber: number) {
    playMoneySound();
    void fireCelebration();
    setPopup({ kind: "correct", step: stepNumber });
  }

  // Wrong path — flip `revealing` first so the image glitches and the
  // AI GENERATED stamp slams on, hold the reveal visible for ~700ms,
  // then show the popup. The setTimeout always fires (not chained to
  // animation completion) so a slow GPU never strands the user.
  function triggerWrongWithReveal(stepNumber: number) {
    playMoneySound();
    setRevealing(true);
    setTimeout(() => {
      setPopup({ kind: "wrong", step: stepNumber });
    }, 700);
  }

  function dismissPopupAndAdvance() {
    setPopup(null);
    setRevealing(false);
    next();
  }

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Step 1's image is the only render-critical asset for first
          paint, so it's the ONLY <link rel="preload"> in the initial
          HTML and it's flagged fetchpriority="high". Images for
          steps 2-8 are not preloaded at all — they ship with
          loading="lazy" on their <img> tags and only start fetching
          when their step's component mounts. */}
      {INTRO1_IMG && (
        <link
          rel="preload"
          as="image"
          href={INTRO1_IMG}
          fetchPriority="high"
        />
      )}
      <Fb2Tracking />

      {/* PROGRESS BAR — sticky at top */}
      <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-sm border-b border-white/5">
        <div className="h-1 bg-white/5">
          <div
            className="h-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
              boxShadow: "0 0 12px rgba(124,58,237,0.4)",
            }}
          />
        </div>
        <div className="px-5 py-2 text-center">
          <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Compact logo header — ~28px, just enough for branding */}
      <div className="flex items-center justify-center py-2 border-b border-white/5">
        <span className="text-sm font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </div>

      {/* STEP CONTENT — top-aligned so light intro steps don't float in
          the middle of the viewport. Wider pb keeps a comfortable cushion
          below the last button. key={step} forces re-mount per step so
          the fadeIn animation re-runs on every transition. */}
      <main className="flex-1 flex flex-col items-center px-5 pt-5 pb-16 sm:pt-7 sm:pb-20">
        <div
          key={step}
          className="w-full max-w-2xl"
          style={{ animation: "stepFadeIn 0.45s ease-out" }}
        >
          {step === 1 && (
            <Step1
              onReal={() => triggerWrongWithReveal(1)}
              onAi={() => triggerCorrect(1)}
              revealing={revealing}
            />
          )}
          {step === 2 && <Step2 onPick={() => triggerCorrect(2)} />}
          {step === 3 && (
            <Step3
              onPick={() => triggerWrongWithReveal(3)}
              revealing={revealing}
            />
          )}
          {step === 4 && <Step4 onContinue={next} />}
          {step === 5 && <Step5 onContinue={next} />}
          {step === 6 && <Step6 onContinue={next} />}
          {step === 7 && <Step7 onContinue={next} />}
          {step === 8 && <Step8 onContinue={goToSales} />}
        </div>
      </main>

      {popup &&
        (() => {
          const copy = popupCopyFor(popup.step, popup.kind);
          return (
            <GuessPopup
              kind={popup.kind}
              title={copy.title}
              subtitle={copy.subtitle}
              onContinue={dismissPopupAndAdvance}
            />
          );
        })()}

      <style>{`
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes glitchShift {
          0%   { transform: translate(0, 0); filter: none; }
          10%  { transform: translate(-2px, 1px);  filter: hue-rotate(15deg)  saturate(1.4); }
          20%  { transform: translate(2px, -1px);  filter: hue-rotate(-15deg) saturate(1.6) brightness(1.1); }
          30%  { transform: translate(-3px, 2px);  filter: hue-rotate(25deg)  brightness(1.2); }
          40%  { transform: translate(3px, -2px);  filter: hue-rotate(-25deg) saturate(1.3); }
          50%  { transform: translate(-1px, 0);    filter: hue-rotate(30deg)  brightness(1.3); }
          60%  { transform: translate(2px, 1px);   filter: hue-rotate(-20deg) brightness(0.9); }
          70%  { transform: translate(0, -2px);    filter: hue-rotate(10deg); }
          80%  { transform: translate(-2px, 1px);  filter: hue-rotate(-10deg); }
          90%  { transform: translate(1px, 0);     filter: hue-rotate(5deg); }
          100% { transform: translate(0, 0); filter: none; }
        }
        .intro-glitch { animation: glitchShift 0.6s ease-in-out; }
        @keyframes stampSlam {
          0%   { transform: translate(-50%, -50%) rotate(-12deg) scale(3);    opacity: 0; }
          55%  { transform: translate(-50%, -50%) rotate(-12deg) scale(0.85); opacity: 1; }
          80%  { transform: translate(-50%, -50%) rotate(-12deg) scale(1.06); opacity: 1; }
          100% { transform: translate(-50%, -50%) rotate(-12deg) scale(1);    opacity: 1; }
        }
        .intro-stamp { animation: stampSlam 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .carousel-track { -ms-overflow-style: none; scrollbar-width: none; }
        .carousel-track::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
