"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, getProgress, User } from "@/lib/auth";
import { MODULES } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";
import { OnboardingTour } from "@/components/OnboardingTour";
import { getCompletionStatus } from "@/lib/courseCompletion";

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
