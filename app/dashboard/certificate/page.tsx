"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getSession, getProgress, User } from "@/lib/auth";
import {
  getCompletionStatus,
  type CompletionStatus,
} from "@/lib/courseCompletion";
import {
  Certificate,
  CERT_HEIGHT,
  CERT_RENDER_ID,
  CERT_WIDTH,
} from "@/components/Certificate";

export default function CertificatePage() {
  // useSearchParams() requires a Suspense boundary at static-export time.
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading…</div>
        </div>
      }
    >
      <CertificatePageInner />
    </Suspense>
  );
}

function CertificatePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // ?preview=1 forces the unlocked state for design testing — the certificate
  // renders with the logged-in user's name so the download still works.
  const previewMode = searchParams.get("preview") === "1";

  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<CompletionStatus | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setUser(session);

    const progressMap = getProgress();

    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        const completed: number[] = Array.isArray(data?.completedModules)
          ? data.completedModules
          : [];
        setStatus(getCompletionStatus(progressMap, completed));
      })
      .catch(() => {
        // Fail closed — treat as zero quizzes done so the locked state shows.
        setStatus(getCompletionStatus(progressMap, []));
      });
  }, [router]);

  // Responsive scale: keep the certificate fully visible at any viewport.
  useEffect(() => {
    function compute() {
      const padding = 40;
      const maxW = Math.min(
        window.innerWidth - padding * 2,
        CERT_WIDTH,
      );
      setScale(maxW / CERT_WIDTH);
    }
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, []);

  if (!user || !status) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  const isUnlocked = status.isComplete || previewMode;
  const displayName = pickDisplayName(user);
  const dateString = formatDate(new Date());

  async function handleDownload() {
    setDownloadError(null);
    setDownloading(true);
    try {
      // Dynamic import keeps html-to-image out of the initial bundle —
      // it's only needed at click-time and is a ~30KB browser-only lib.
      const { toPng } = await import("html-to-image");
      const node = document.getElementById(CERT_RENDER_ID);
      if (!node) throw new Error("Certificate element not found");
      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        width: CERT_WIDTH,
        height: CERT_HEIGHT,
        backgroundColor: "#0a0a0a",
      });
      const link = document.createElement("a");
      const safeName = displayName.replace(/[^a-zA-Z0-9-_]+/g, "-");
      link.download = `AIM-Method-Certificate-${safeName}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("[certificate] download failed:", err);
      setDownloadError(
        "Couldn't generate the download. Please try again or use a different browser.",
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-5xl mx-auto px-5 py-10">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-500 hover:text-purple-400 text-sm transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        {isUnlocked ? (
          <UnlockedView
            scale={scale}
            displayName={displayName}
            date={dateString}
            previewMode={previewMode}
            isComplete={status.isComplete}
            downloading={downloading}
            downloadError={downloadError}
            onDownload={handleDownload}
          />
        ) : (
          <LockedView
            scale={scale}
            displayName={displayName}
            date={dateString}
            status={status}
          />
        )}
      </main>
    </div>
  );
}

function UnlockedView({
  scale,
  displayName,
  date,
  previewMode,
  isComplete,
  downloading,
  downloadError,
  onDownload,
}: {
  scale: number;
  displayName: string;
  date: string;
  previewMode: boolean;
  isComplete: boolean;
  downloading: boolean;
  downloadError: string | null;
  onDownload: () => void;
}) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🎓</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          You did it!
        </h1>
        <p className="text-gray-400 text-sm">
          You&apos;ve completed every lesson and quiz in the AIM Method
          course. Here&apos;s your certificate.
        </p>
        {previewMode && !isComplete && (
          <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mt-3">
            🔍 Preview mode
          </p>
        )}
      </div>

      <ScaledCertificate
        scale={scale}
        name={displayName}
        date={date}
      />

      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className={`purple-btn text-white font-bold py-3.5 px-8 rounded-xl text-base ${
            downloading ? "opacity-60 cursor-wait" : ""
          }`}
        >
          {downloading ? "Generating…" : "⬇️  Download as PNG"}
        </button>
        {downloadError && (
          <p className="text-red-400 text-xs text-center max-w-md">
            {downloadError}
          </p>
        )}
        <p className="text-gray-500 text-xs">
          Share it on Instagram, LinkedIn, or wherever you celebrate wins.
        </p>
      </div>
    </>
  );
}

function LockedView({
  scale,
  displayName,
  date,
  status,
}: {
  scale: number;
  displayName: string;
  date: string;
  status: CompletionStatus;
}) {
  const lessonsLeft = status.totalLessons - status.completedLessons;
  const quizzesLeft = status.totalQuizzes - status.completedQuizzes;
  return (
    <>
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🔒</div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
          Your Certificate is Almost Ready
        </h1>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Complete every lesson and every module quiz to unlock your
          AIM Method certificate.
        </p>
      </div>

      <div className="relative">
        <div
          style={{
            filter: "blur(8px) saturate(0.55)",
            opacity: 0.55,
            pointerEvents: "none",
          }}
        >
          <ScaledCertificate
            scale={scale}
            name={displayName}
            date={date}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-[#0a0a0a]/85 border border-purple-500/30 rounded-2xl px-6 py-5 text-center backdrop-blur-sm max-w-xs">
            <p className="text-purple-400 text-3xl font-extrabold leading-none">
              {status.overallPct}%
            </p>
            <p className="text-gray-400 text-xs mt-1.5">complete</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 mt-8 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-sm font-semibold">
            Course Progress
          </span>
          <span className="text-purple-400 text-sm font-bold">
            {status.overallPct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
            style={{ width: `${status.overallPct}%` }}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/3 border border-white/10 rounded-xl p-3">
            <p className="text-white text-lg font-extrabold leading-none">
              {status.completedLessons}/{status.totalLessons}
            </p>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">
              Lessons
            </p>
          </div>
          <div className="bg-white/3 border border-white/10 rounded-xl p-3">
            <p className="text-white text-lg font-extrabold leading-none">
              {status.completedQuizzes}/{status.totalQuizzes}
            </p>
            <p className="text-gray-500 text-[10px] uppercase tracking-wider mt-1">
              Quizzes
            </p>
          </div>
        </div>
        <p className="text-gray-500 text-xs text-center mt-4">
          {lessonsLeft > 0 && (
            <span>
              {lessonsLeft} {lessonsLeft === 1 ? "lesson" : "lessons"} left
            </span>
          )}
          {lessonsLeft > 0 && quizzesLeft > 0 && " · "}
          {quizzesLeft > 0 && (
            <span>
              {quizzesLeft} {quizzesLeft === 1 ? "quiz" : "quizzes"} left
            </span>
          )}
        </p>
        <Link
          href="/dashboard/course"
          className="block purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm text-center mt-5"
        >
          Continue the Course
        </Link>
      </div>
    </>
  );
}

function ScaledCertificate({
  scale,
  name,
  date,
}: {
  scale: number;
  name: string;
  date: string;
}) {
  return (
    <div
      style={{
        width: CERT_WIDTH * scale,
        height: CERT_HEIGHT * scale,
        margin: "0 auto",
        overflow: "hidden",
        borderRadius: 12,
        boxShadow: "0 30px 80px rgba(139, 92, 246, 0.15)",
      }}
    >
      <div
        style={{
          width: CERT_WIDTH,
          height: CERT_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "top left",
        }}
      >
        <Certificate name={name} date={date} />
      </div>
    </div>
  );
}

function pickDisplayName(user: User): string {
  const raw = (user.name ?? "").trim();
  if (raw && raw.toLowerCase() !== "student") return raw;
  // Gracious fallback derived from email local-part, capitalized.
  const local = user.email?.split("@")[0] ?? "";
  if (!local) return "AIM Student";
  return (
    local
      .replace(/[._-]+/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ") || "AIM Student"
  );
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}
