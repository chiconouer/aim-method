// =============================================================
// TikTok variant — Pre-VSL Quiz funnel (paid-traffic warm-up)
// -------------------------------------------------------------
// FIRST page of the TikTok paid funnel. 8-step linear persuasion
// sequence with a progress bar — first 3 steps are scripted
// "guess the real woman" interactions (always wrong/correct/wrong
// regardless of which image is tapped), final 5 steps are the
// original persuasion sequence.
//
// Goal: warm up cold ad traffic before dumping them into the VSL
// at /ttk/sales. Step 8's CTA navigates to /ttk/sales.
//
// Route is an optional catch-all (/ttk/quiz/[[...step]]) so the
// browser URL can mirror the current step (/ttk/quiz/1 ... /8)
// without remounting, and a refresh mid-quiz lands on that step.
// The base /ttk/quiz still works — initial step defaults to 1 when
// no segment is present.
//
// All image/video URLs are empty constants at the top — paste real
// values when ready. While empty, each block renders a neutral
// placeholder so the page works end-to-end immediately.
// =============================================================

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TikTokPixel } from "@/components/TikTokPixel";

// Microsoft Clarity exposes window.clarity as a function once the
// tag script (loaded by <TikTokPixel />) has hydrated. Optional
// chaining at every call site (`window.clarity?.(...)`) means a
// pre-hydration or blocked-by-extension scenario is a silent no-op
// rather than an error.
declare global {
  interface Window {
    clarity?: (action: string, ...args: unknown[]) => void;
  }
}

const TOTAL_STEPS = 8;

// ───── INTRO STEPS (1-3): "guess the real woman" placeholder slots ─────
// Replace each empty string with a real image URL. While empty, the tile
// renders a labeled placeholder so the page is usable end-to-end.
// Step 1 is SCRIPTED WRONG, Step 2 SCRIPTED CORRECT, Step 3 SCRIPTED WRONG —
// the result has nothing to do with which image was tapped.
const INTRO1_IMG_A = "";
const INTRO1_IMG_B = "";
const INTRO1_IMG_C = "";
const INTRO2_IMG_A = "";
const INTRO2_IMG_B = "";
const INTRO2_IMG_C = "";
const INTRO3_IMG_A = "";
const INTRO3_IMG_B = "";
const INTRO3_IMG_C = "";

// ───── MAIN STEPS (4-8): paste media URLs as they become available ─────
const STEP4_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/Screenshot%202026-06-07%20at%2011.02.08%20PM.png";
const STEP5_PROFILE_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/22193051-1742-46C5-8A1B-1B4EB91B3385.jpg";
const STEP5_EARNINGS_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/9DDD5A77-E001-45EE-83BE-BFCDBD1A001F.PNG";
const STEP6_VIDEO_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/D6562B56-AA02-4CEE-B738-A0D8C2362EA1.mov";
// Step 7 — 5 testimonial images shown in a swipeable carousel
const STEP7_RESULTS_IMAGES: string[] = [
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/07B9C7A4-6AF6-4486-B605-04B952D2F78A.PNG",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0997.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0999.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1001.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/93F3E47E-AF60-4CC7-BC7A-D4740F81D5DA.jpg",
];
const STEP8_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_00182.PNG";
// ───────────────────────────────────────────────────────────

// =============================================================
// Money sound — synthesized via Web Audio API. No audio file is
// loaded or shipped. AudioContext is lazily constructed on the
// first invocation (which is always inside a user-gesture handler,
// so autoplay policies don't reject it) and reused after that.
// Every public call is wrapped in try/catch so a blocked context,
// an unsupported browser, or a suspended page silently no-ops
// instead of throwing into the React tree.
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

function playCoinTone(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  duration: number,
  peak: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "triangle";
  osc.frequency.value = freq;
  // ADSR: ~5ms attack, exponential decay to silence. Triangle wave
  // + exponential ramps gives a bright "ping" without a harsh edge.
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(peak, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

function playMoneySound(): void {
  try {
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    const t0 = ctx.currentTime;
    // Cash-register ping: E6 → A6 → E7 sparkle stacked 70ms apart.
    playCoinTone(ctx, t0, 1318.5, 0.13, 0.28); // E6
    playCoinTone(ctx, t0 + 0.07, 1760.0, 0.13, 0.24); // A6
    playCoinTone(ctx, t0 + 0.14, 2637.0, 0.18, 0.18); // E7 sparkle
  } catch {
    // Silent no-op — audio must never block the popup UX.
  }
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

function VideoPlaceholder({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSoundOverlay, setShowSoundOverlay] = useState(true);

  function handleUnmute() {
    const v = videoRef.current;
    if (v) {
      v.muted = false;
      // Some browsers pause when unmute happens via JS — re-issue play().
      v.play().catch(() => {});
    }
    setShowSoundOverlay(false);
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
          src={url}
          autoPlay
          muted
          loop
          playsInline
          controls
          className="block max-h-[50vh] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30 bg-black"
        />
        {showSoundOverlay && (
          <button
            type="button"
            onClick={handleUnmute}
            aria-label="Tap to enable sound"
            className="absolute inset-0 flex items-center justify-center rounded-2xl cursor-pointer focus:outline-none focus-visible:bg-black/10 transition-colors"
          >
            <span
              className="flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-black tracking-wide"
              style={{
                background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                boxShadow:
                  "0 0 24px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
                animation: "soundPulse 1.6s ease-in-out infinite",
              }}
            >
              <span className="text-base" aria-hidden="true">🔊</span>
              Tap for sound
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
function TestimonialsCarousel({ images }: { images: string[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const newIndex = Math.round(el.scrollLeft / el.clientWidth);
    setActiveSlide((prev) => (prev === newIndex ? prev : newIndex));
  }

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
          "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
        animation: "btnGlow 3s ease-in-out infinite",
      }}
    >
      {label}
    </button>
  );
}

// Tappable 3-image row used by intro steps 1-3. ANY tap calls onPick.
// The scripted "is this the right answer" decision happens in the
// parent — this component is dumb on purpose.
function IntroGuessRow({
  images,
  onPick,
}: {
  images: { url: string; placeholderLabel: string }[];
  onPick: () => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {images.map((img, i) => (
        <button
          key={i}
          type="button"
          onClick={onPick}
          aria-label={`Pick option ${String.fromCharCode(65 + i)}`}
          className="block aspect-[3/4] rounded-2xl overflow-hidden border border-purple-900/30 bg-[#0d0d0d] focus:outline-none focus-visible:border-purple-400 transition-transform active:scale-[0.97]"
          style={{ boxShadow: "0 0 16px rgba(124,58,237,0.08)" }}
        >
          {img.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img.url}
              alt={`Option ${String.fromCharCode(65 + i)}`}
              className="block w-full h-full object-cover"
            />
          ) : (
            <span className="flex w-full h-full items-center justify-center text-[9px] uppercase tracking-widest text-purple-700 font-bold text-center px-1">
              {img.placeholderLabel}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Full-screen modal popup shown after a guess. Always carries the same
// shape (icon + title + Continue button) — the kind prop just flips
// color + copy. Continue is the only way to dismiss.
type PopupKind = "correct" | "wrong";

function GuessPopup({
  kind,
  onContinue,
}: {
  kind: PopupKind;
  onContinue: () => void;
}) {
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
          {isCorrect ? "Correct!" : "Wrong — she's A.I."}
        </h2>
        <p className="text-sm text-gray-400 mb-2">
          {isCorrect
            ? "Real one spotted. Nice eye 👁️"
            : "All three were AI-generated 🤖"}
        </p>
        <ContinueButton label="Continue →" onClick={onContinue} />
      </div>
    </div>
  );
}

function Step1({ onPick }: { onPick: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-4">
        To unlock the method, answer: which of these images is a{" "}
        <span className="text-green-400">real woman</span>?
      </h1>
      <IntroGuessRow
        images={[
          { url: INTRO1_IMG_A, placeholderLabel: "INTRO1 A" },
          { url: INTRO1_IMG_B, placeholderLabel: "INTRO1 B" },
          { url: INTRO1_IMG_C, placeholderLabel: "INTRO1 C" },
        ]}
        onPick={onPick}
      />
      <p className="text-[11px] sm:text-xs text-gray-500 text-center mt-3">
        Tap a photo to lock in your answer.
      </p>
    </>
  );
}

function Step2({ onPick }: { onPick: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-4">
        Which of these 3 images is a{" "}
        <span className="text-green-400">real woman</span>?
      </h1>
      <IntroGuessRow
        images={[
          { url: INTRO2_IMG_A, placeholderLabel: "INTRO2 A" },
          { url: INTRO2_IMG_B, placeholderLabel: "INTRO2 B" },
          { url: INTRO2_IMG_C, placeholderLabel: "INTRO2 C" },
        ]}
        onPick={onPick}
      />
      <p className="text-[11px] sm:text-xs text-gray-500 text-center mt-3">
        Tap a photo to lock in your answer.
      </p>
    </>
  );
}

function Step3({ onPick }: { onPick: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-4">
        Which of these 3 images is a{" "}
        <span className="text-green-400">real woman</span>?
      </h1>
      <IntroGuessRow
        images={[
          { url: INTRO3_IMG_A, placeholderLabel: "INTRO3 A" },
          { url: INTRO3_IMG_B, placeholderLabel: "INTRO3 B" },
          { url: INTRO3_IMG_C, placeholderLabel: "INTRO3 C" },
        ]}
        onPick={onPick}
      />
      <p className="text-[11px] sm:text-xs text-gray-500 text-center mt-3">
        Tap a photo to lock in your answer.
      </p>
    </>
  );
}

function Step4({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight text-center mb-5">
        Make <span className="text-green-400">$200 to $500</span> a day with an
        AI Model
      </h1>
      {STEP4_IMAGE_URL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STEP4_IMAGE_URL}
          alt="AI model showcase"
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
      <h1 className="text-base sm:text-lg font-black text-white leading-tight text-center mb-2">
        In a moment, I&apos;ll show you how to build your own model in under{" "}
        <span className="text-purple-400">30 minutes</span> with simple, free
        tools.
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
            className="block max-h-[280px] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
          />
        ) : (
          <ImagePlaceholder url="" alt="Example AI profile" aspectClass="aspect-[3/4]" />
        )}
        {STEP5_EARNINGS_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={STEP5_EARNINGS_IMAGE_URL}
            alt="Earnings proof"
            className="block max-h-[280px] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
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
      <ContinueButton label="I'll use it responsibly" onClick={onContinue} />
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
          className="block max-h-[42vh] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
        />
      ) : (
        <ImagePlaceholder url="" alt="Class preview" />
      )}
      <ContinueButton label="I want to access the class" onClick={onContinue} />
    </>
  );
}

// Optional catch-all gives us `params.step` as `string[] | undefined`.
// Clamp the first segment to [1..TOTAL_STEPS]; anything else → step 1.
// Keeps mid-quiz refreshes (e.g. /ttk/quiz/4) landing on that step and
// the base /ttk/quiz (no segment) starting at 1.
function parseInitialStep(segment: string[] | undefined): number {
  const raw = segment?.[0];
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 && n <= TOTAL_STEPS ? n : 1;
}

export default function TtkQuizPage({
  params,
}: {
  params: { step?: string[] };
}) {
  const [step, setStep] = useState(() => parseInitialStep(params.step));
  const [popup, setPopup] = useState<PopupKind | null>(null);
  const router = useRouter();

  // "Reached step N" — fires whenever the visible step changes,
  // including the initial mount (step=1). Combined with the
  // *_advanced events below, this gives a full view→click funnel
  // per step in Clarity, scoped to the TikTok funnel via the tt_ prefix.
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Mirror step in URL via replaceState (NOT pushState) so the
      // browser back button leaves the quiz instead of walking through
      // steps in reverse. Pure DOM API — no Next.js navigation, no
      // remount, no fetch.
      window.history.replaceState(null, "", `/ttk/quiz/${step}`);
      window.clarity?.("event", `tt_quiz_step_${step}_viewed`);
    }
  }, [step]);

  function next() {
    if (step < TOTAL_STEPS) {
      // "Advanced from step N" — fired BEFORE setStep so the event
      // carries the step the user is leaving, not the one they land on.
      if (typeof window !== "undefined") {
        window.clarity?.("event", `tt_quiz_step_${step}_advanced`);
      }
      setStep(step + 1);
    }
  }

  function goToSales() {
    // Final completion — fired BEFORE router.push so it's guaranteed
    // to land in the same Clarity session as the quiz steps (the next
    // page mounts its own session).
    if (typeof window !== "undefined") {
      window.clarity?.("event", "tt_quiz_step_8_completed");
    }
    // Client-side nav into the VSL page. /ttk/sales mounts its own
    // Vturb script via useEffect, so SPA navigation works fine.
    router.push("/ttk/sales");
  }

  // Show a scripted popup (kind decided by the parent based on which
  // intro step is active), play the money sound, and remember the kind
  // so GuessPopup can render. Dismissal advances the funnel.
  function showPopup(kind: PopupKind) {
    playMoneySound();
    setPopup(kind);
  }

  function dismissPopupAndAdvance() {
    setPopup(null);
    next();
  }

  const progressPct = (step / TOTAL_STEPS) * 100;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      <TikTokPixel />

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

      {/* STEP CONTENT — key on step forces re-mount → fadeIn animation re-runs.
          flex column + justify-center with asymmetric padding (pt < pb) shifts
          the centered content slightly upward, so it doesn't leave a giant
          empty gap between the logo and the headline. The bigger pb still
          gives breathing room at the bottom. */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 pt-4 pb-16 sm:pt-6 sm:pb-20">
        <div
          key={step}
          className="w-full max-w-2xl"
          style={{ animation: "stepFadeIn 0.45s ease-out" }}
        >
          {step === 1 && <Step1 onPick={() => showPopup("wrong")} />}
          {step === 2 && <Step2 onPick={() => showPopup("correct")} />}
          {step === 3 && <Step3 onPick={() => showPopup("wrong")} />}
          {step === 4 && <Step4 onContinue={next} />}
          {step === 5 && <Step5 onContinue={next} />}
          {step === 6 && <Step6 onContinue={next} />}
          {step === 7 && <Step7 onContinue={next} />}
          {step === 8 && <Step8 onContinue={goToSales} />}
        </div>
      </main>

      {popup && (
        <GuessPopup kind={popup} onContinue={dismissPopupAndAdvance} />
      )}

      <style>{`
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes popupIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .carousel-track { -ms-overflow-style: none; scrollbar-width: none; }
        .carousel-track::-webkit-scrollbar { display: none; }
        @keyframes soundPulse {
          0%,100%{transform:scale(1);box-shadow:0 0 24px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{transform:scale(1.04);box-shadow:0 0 36px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
      `}</style>
    </div>
  );
}
