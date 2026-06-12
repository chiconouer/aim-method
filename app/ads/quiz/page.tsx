// =============================================================
// Ads variant — Pre-VSL Quiz funnel (paid-traffic warm-up)
// -------------------------------------------------------------
// FIRST page of the paid funnel. 5-step linear persuasion sequence
// with a progress bar — no real quiz questions, no branching, no
// state persisted anywhere. Goal: warm up cold ad traffic before
// dumping them into the VSL at /ads/sales.
//
// Step 5's CTA navigates to /ads/sales (next page of the funnel).
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

const TOTAL_STEPS = 5;

// ───── HERE: paste media URLs as they become available ─────
const STEP1_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/Screenshot%202026-06-07%20at%2011.02.08%20PM.png";
const STEP2_PROFILE_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/22193051-1742-46C5-8A1B-1B4EB91B3385.jpg";
const STEP2_EARNINGS_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/9DDD5A77-E001-45EE-83BE-BFCDBD1A001F.PNG";
const STEP3_VIDEO_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/D6562B56-AA02-4CEE-B738-A0D8C2362EA1.mov";
// Step 4 — 5 testimonial images shown in a swipeable carousel
const STEP4_RESULTS_IMAGES: string[] = [
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/07B9C7A4-6AF6-4486-B605-04B952D2F78A.PNG",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0997.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0999.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1001.jpg",
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/93F3E47E-AF60-4CC7-BC7A-D4740F81D5DA.jpg",
];
const STEP5_IMAGE_URL =
  "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_00182.PNG";
// ───────────────────────────────────────────────────────────

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

function Step1({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight text-center mb-5">
        Make <span className="text-green-400">$200 to $500</span> a day with an
        AI Model
      </h1>
      {STEP1_IMAGE_URL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STEP1_IMAGE_URL}
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

function Step2({ onContinue }: { onContinue: () => void }) {
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
        {STEP2_PROFILE_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={STEP2_PROFILE_IMAGE_URL}
            alt="Example AI profile"
            className="block max-h-[280px] max-w-full w-auto h-auto mx-auto rounded-2xl border border-purple-900/30"
          />
        ) : (
          <ImagePlaceholder url="" alt="Example AI profile" aspectClass="aspect-[3/4]" />
        )}
        {STEP2_EARNINGS_IMAGE_URL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={STEP2_EARNINGS_IMAGE_URL}
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

function Step3({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        With just <span className="text-purple-400">3 clicks</span> you can copy
        the movements from any existing video and apply them to your AI
        influencer. 👇
      </h1>
      <VideoPlaceholder url={STEP3_VIDEO_URL} />
      <ContinueButton label="I'll use it responsibly" onClick={onContinue} />
    </>
  );
}

function Step4({ onContinue }: { onContinue: () => void }) {
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
      <TestimonialsCarousel images={STEP4_RESULTS_IMAGES} />
      <ContinueButton label="Continue →" onClick={onContinue} />
    </>
  );
}

function Step5({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-lg sm:text-xl font-black text-white leading-tight text-center mb-3">
        Now I&apos;m gonna show you how to{" "}
        <span className="text-purple-400">get your AI model for free</span> and
        start making <span className="text-green-400">$200 to $500</span> a day.
      </h1>
      {STEP5_IMAGE_URL ? (
        // Inline <img> with max-h cap + w-auto so the image stays whole at
        // its natural aspect (no crop, no letterbox bars) but doesn't
        // dominate the screen. Centered so the Continue button stays
        // visible without scrolling on a typical mobile.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={STEP5_IMAGE_URL}
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

export default function AdsQuizPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  // "Reached step N" — fires whenever the visible step changes,
  // including the initial mount (step=1). Combined with the
  // *_advanced events below, this gives a full view→click funnel
  // per step in Clarity, scoped to the TikTok funnel via the tt_ prefix.
  useEffect(() => {
    if (typeof window !== "undefined") {
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
      window.clarity?.("event", "tt_quiz_step_5_completed");
    }
    // Client-side nav into the VSL page. /ads/sales mounts its own
    // Vturb script via useEffect, so SPA navigation works fine.
    router.push("/ads/sales");
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
          {step === 1 && <Step1 onContinue={next} />}
          {step === 2 && <Step2 onContinue={next} />}
          {step === 3 && <Step3 onContinue={next} />}
          {step === 4 && <Step4 onContinue={next} />}
          {step === 5 && <Step5 onContinue={goToSales} />}
        </div>
      </main>

      <style>{`
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
        @keyframes stepFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
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
