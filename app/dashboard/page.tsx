"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, getProgress, User } from "@/lib/auth";
import { MODULES } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";
import { OnboardingTour } from "@/components/OnboardingTour";
import { getCompletionStatus } from "@/lib/courseCompletion";
import { DISCORD_INVITE_URL } from "@/lib/discord";

const COURSE_TITLE = "AIM Method";
const TOTAL_LESSONS = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function findNextLesson(
  progressMap: Record<string, boolean>,
  completedModules: number[],
) {
  for (const mod of MODULES) {
    if (!isModuleUnlocked(mod.id, completedModules)) continue;
    for (const lesson of mod.lessons) {
      if (!progressMap[`${mod.id}-${lesson.id}`]) {
        return { module: mod, lesson };
      }
    }
  }
  return null;
}

export default function DashboardHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [statusReady, setStatusReady] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setUser(session);
    setProgressMap(getProgress());
    setGreeting(greetingFor(new Date().getHours()));

    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.completedModules)) {
          setCompletedModules(data.completedModules);
        }
      })
      .catch(() => {
        // Fail closed — only Module 1 unlocked
      })
      .finally(() => setStatusReady(true));
  }, [router]);

  if (!user || !statusReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  const overallPct = Math.round((completedLessons / TOTAL_LESSONS) * 100);
  const next = findNextLesson(progressMap, completedModules);
  const courseComplete = !next;
  const isStart = completedLessons === 0;
  // Full completion requires lessons AND quizzes — drives the celebration card.
  const fullCompletion = getCompletionStatus(progressMap, completedModules);
  const displayName = user.name && user.name !== "Student" ? user.name : "";
  const initial = (displayName || user.email || "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-6xl mx-auto px-5 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {displayName ? `${greeting}, ${displayName} 👋` : `${greeting} 👋`}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Continue your lesson today.
          </p>
        </div>

        {/* Continue card + Profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-5 mb-8">
          {/* Continue */}
          <div
            data-tour="continue-card"
            className="glass-card rounded-2xl p-6 flex flex-col gap-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
                  {courseComplete
                    ? "Course complete"
                    : isStart
                      ? "Start the course"
                      : "Continue where you left off"}
                </p>
                <h2 className="text-white font-bold text-xl truncate">
                  {COURSE_TITLE}
                </h2>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-purple-400 text-2xl font-extrabold leading-none">
                  {overallPct}%
                </p>
                <p className="text-gray-500 text-[10px] mt-1 uppercase tracking-wider">
                  Progress
                </p>
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
                style={{ width: `${overallPct}%` }}
              />
            </div>

            {courseComplete ? (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-gray-400 text-sm">
                    You&apos;ve completed every lesson. 🏆
                  </p>
                </div>
                <Link
                  href="/dashboard/course"
                  data-tour="continue-button"
                  className="outline-btn font-bold py-3 px-6 rounded-xl text-sm flex-shrink-0"
                >
                  Review Course
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <p className="text-gray-500 text-xs">
                    Module {next.module.id} · Up next
                  </p>
                  <p className="text-white font-bold text-sm mt-0.5 truncate">
                    {next.lesson.title}
                  </p>
                </div>
                <Link
                  href={`/dashboard/module/${next.module.id}/lesson/${next.lesson.id}`}
                  data-tour="continue-button"
                  className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm flex-shrink-0"
                >
                  {isStart ? "Start" : "Continue"} →
                </Link>
              </div>
            )}
          </div>

          {/* Profile */}
          <div className="glass-card rounded-2xl p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-2xl font-extrabold mb-3 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
              {initial}
            </div>
            <p className="text-white font-bold text-base truncate w-full">
              {displayName || "Student"}
            </p>
            <p className="text-gray-500 text-xs mt-1">
              {completedLessons} of {TOTAL_LESSONS} lessons completed
            </p>
          </div>
        </div>

        {/* Certificate celebration card — shown only when both lessons + quizzes are 100% */}
        {fullCompletion.isComplete && (
          <Link
            href="/dashboard/certificate"
            className="block glass-card card-hover rounded-2xl p-5 mb-8 border-purple-500/40 flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-[0_0_30px_rgba(139,92,246,0.35)]">
              🎓
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-purple-400 text-[10px] uppercase tracking-wider font-bold mb-0.5">
                You did it
              </p>
              <p className="text-white font-bold text-base">
                Your Certificate is Ready
              </p>
              <p className="text-gray-500 text-xs mt-0.5">
                Download it and share your AIM Method completion.
              </p>
            </div>
            <span className="text-gray-500 group-hover:text-purple-400 text-lg flex-shrink-0 transition-colors">
              →
            </span>
          </Link>
        )}

        {/* Discord Community CTA — sits between Continue/Profile and
            Your Course so buyers who forgot to click the Discord button
            in the welcome email have an unmissable second chance every
            time they land on the dashboard. Whole card is a single <a>
            with target="_blank" so it doesn't tear down the dashboard
            session. Discord brand blue (#5865F2) is intentionally
            different from the purple-heavy AIM palette so it visually
            stands out from every other card on this page. */}
        <a
          href={DISCORD_INVITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block group rounded-2xl mb-8 overflow-hidden transition-transform active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
          style={{
            background:
              "linear-gradient(135deg, #5865F2 0%, #4752C4 100%)",
            boxShadow:
              "0 10px 32px rgba(88, 101, 242, 0.35), inset 0 1px 0 rgba(255,255,255,0.12)",
          }}
        >
          <div className="p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
            {/* Discord logo — sits in a translucent white square so it
                pops against the blue background across every viewport. */}
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="white" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base sm:text-lg leading-tight mb-1">
                🎯 Join the AIM community
              </h3>
              <p className="text-white/85 text-xs sm:text-sm leading-snug">
                Get support, connect with other students, and get updates as
                new lessons drop.
              </p>
            </div>
          </div>
          {/* CTA bar — full-width white button below the header row so the
              hit target is obviously clickable on mobile even though the
              whole card is already an <a>. On desktop it doubles as a
              visual button treatment matching the "Continue" CTA above. */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6">
            <span
              className="block w-full text-center font-bold py-3 rounded-xl text-sm sm:text-base transition-colors group-hover:bg-white/95"
              style={{
                background: "#ffffff",
                color: "#5865F2",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              Open Discord →
            </span>
          </div>
        </a>

        {/* Your Course */}
        <div>
          <h2 className="text-white font-bold text-lg mb-3">Your Course</h2>
          <Link
            href="/dashboard/course"
            className="glass-card card-hover rounded-2xl p-5 flex items-center gap-5 group"
          >
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-700/30 border border-purple-500/30 flex items-center justify-center text-2xl flex-shrink-0">
              🎯
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base">{COURSE_TITLE}</p>
              <p className="text-gray-500 text-xs mt-0.5">
                {MODULES.length} modules · {TOTAL_LESSONS} lessons
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                    style={{ width: `${overallPct}%` }}
                  />
                </div>
                <span className="text-purple-400 text-xs font-bold">
                  {overallPct}%
                </span>
              </div>
            </div>
            <span className="text-gray-500 group-hover:text-purple-400 text-lg flex-shrink-0 transition-colors">
              →
            </span>
          </Link>
        </div>
      </main>

      {/* First-visit onboarding tour. Self-gated by localStorage. */}
      <OnboardingTour />
    </div>
  );
}
