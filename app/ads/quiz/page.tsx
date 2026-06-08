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

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TikTokPixel } from "@/components/TikTokPixel";

const TOTAL_STEPS = 5;

// ───── HERE: paste media URLs as they become available ─────
const STEP1_IMAGE_URL = "";
const STEP2_PROFILE_IMAGE_URL = "";
const STEP2_EARNINGS_IMAGE_URL = "";
const STEP3_VIDEO_URL = "";
const STEP4_RESULTS_IMAGE_URL = "";
const STEP5_IMAGE_URL = "";
// ───────────────────────────────────────────────────────────

function ImagePlaceholder({
  url,
  alt,
  aspectClass = "aspect-[4/3]",
}: {
  url: string;
  alt: string;
  aspectClass?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={alt}
        className={`w-full ${aspectClass} object-cover rounded-2xl border border-purple-900/30`}
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
  if (url) {
    return (
      <video
        src={url}
        controls
        playsInline
        className="w-full aspect-video rounded-2xl border border-purple-900/30 bg-black"
      />
    );
  }
  return (
    <div
      className="w-full aspect-video rounded-2xl border border-purple-900/30 flex items-center justify-center bg-[#0d0d0d]"
      style={{ boxShadow: "0 0 20px rgba(124,58,237,0.08)" }}
    >
      <span className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">
        Video placeholder
      </span>
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
        Make <span className="text-green-400">$200 to $500</span> a day with
        ultra-realistic AI models
      </h1>
      <ImagePlaceholder url={STEP1_IMAGE_URL} alt="AI model showcase" />
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
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        In a moment, I&apos;ll show you how to build your own model in under{" "}
        <span className="text-purple-400">30 minutes</span> with simple, free
        tools.
      </h1>
      <ImagePlaceholder
        url={STEP2_PROFILE_IMAGE_URL}
        alt="Example AI profile"
      />
      <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mt-5 mb-6">
        This profile was built 100% with AI. Less than 30 days old, and it&apos;s
        already pulled in over{" "}
        <span className="text-green-400 font-bold">$10,000</span> and gained{" "}
        <span className="text-purple-400 font-bold">14k followers</span>.
      </p>
      <ImagePlaceholder url={STEP2_EARNINGS_IMAGE_URL} alt="Earnings proof" />
      <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mt-5">
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
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-3">
        This is the <span className="text-green-400">laziest way</span> to make{" "}
        <span className="text-green-400">$200 to $500</span> a day — even if
        you know nothing about AI, even if you&apos;ve never worked online
        before.
      </h1>
      <p className="text-sm sm:text-base text-gray-300 leading-relaxed text-center mb-5">
        Take a look at the results some of my students are getting:
      </p>
      <ImagePlaceholder
        url={STEP4_RESULTS_IMAGE_URL}
        alt="Student results"
        aspectClass="aspect-[4/5]"
      />
      <ContinueButton label="Continue →" onClick={onContinue} />
    </>
  );
}

function Step5({ onContinue }: { onContinue: () => void }) {
  return (
    <>
      <h1 className="text-xl sm:text-2xl font-black text-white leading-tight text-center mb-5">
        Now I&apos;m gonna show you the{" "}
        <span className="text-purple-400">full step-by-step</span> of how to
        create your AI model and start making{" "}
        <span className="text-green-400">$300 to $500</span> a day.
      </h1>
      <ImagePlaceholder url={STEP5_IMAGE_URL} alt="Class preview" />
      <ContinueButton label="I want to access the class" onClick={onContinue} />
    </>
  );
}

export default function AdsQuizPage() {
  const [step, setStep] = useState(1);
  const router = useRouter();

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function goToSales() {
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

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      {/* STEP CONTENT — key on step forces re-mount → fadeIn animation re-runs */}
      <main className="flex-1 px-5 py-8 sm:py-12">
        <div
          key={step}
          className="max-w-2xl mx-auto"
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
      `}</style>
    </div>
  );
}
