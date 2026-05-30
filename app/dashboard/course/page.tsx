"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession, getProgress } from "@/lib/auth";
import { MODULES } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";
import { LessonThumbnail } from "@/components/LessonThumbnail";

const COURSE_TITLE = "AIM Method";
const TOTAL_LESSONS = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);

export default function CoursePage() {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [statusReady, setStatusReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setProgressMap(getProgress());

    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.completedModules)) {
          setCompletedModules(data.completedModules);
        }
      })
      .catch(() => {
        // Fail closed
      })
      .finally(() => setStatusReady(true));
  }, [router]);

  if (!statusReady) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  const completedLessons = Object.values(progressMap).filter(Boolean).length;
  const overallPct = Math.round((completedLessons / TOTAL_LESSONS) * 100);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-4xl mx-auto px-5 py-10">
        {/* Back nav */}
        <Link
          href="/dashboard"
          className="inline-flex items-center text-gray-500 hover:text-purple-400 text-sm transition-colors mb-6"
        >
          ← Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">
            {COURSE_TITLE}
          </h1>
          <p className="text-gray-500 text-sm">
            {MODULES.length} modules · {TOTAL_LESSONS} lessons
          </p>
        </div>

        {/* Overall progress */}
        <div className="glass-card rounded-2xl p-5 mb-10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm font-semibold">
              Course Progress
            </span>
            <span className="text-purple-400 text-sm font-bold">
              {overallPct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden mb-2">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-300"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          <p className="text-gray-500 text-xs">
            {completedLessons} of {TOTAL_LESSONS} lessons completed
          </p>
        </div>

        {/* Modules */}
        <div className="flex flex-col gap-10">
          {MODULES.map((mod) => {
            const moduleUnlocked = isModuleUnlocked(mod.id, completedModules);
            const quizDone = completedModules.includes(mod.id);

            return (
              <section key={mod.id}>
                {/* Module header */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-purple-400 text-xs font-bold uppercase tracking-wider mb-0.5">
                      Module {mod.id}
                    </p>
                    <h2
                      className={`text-lg sm:text-xl font-extrabold truncate ${
                        moduleUnlocked ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {mod.title}
                    </h2>
                  </div>
                  {!moduleUnlocked && (
                    <div className="inline-flex items-center gap-1.5 bg-white/3 border border-white/10 text-gray-400 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full">
                      <LockIcon className="w-3 h-3" />
                      Locked
                    </div>
                  )}
                </div>

                {/* Lessons */}
                <div className="flex flex-col gap-2">
                  {mod.lessons.map((lesson, idx) => {
                    const isCompleted =
                      !!progressMap[`${mod.id}-${lesson.id}`];

                    if (!moduleUnlocked) {
                      return (
                        <div
                          key={lesson.id}
                          className="glass-card rounded-2xl p-3 flex items-center gap-4 opacity-50 cursor-not-allowed"
                          aria-disabled="true"
                        >
                          <LessonThumbnail
                            state="locked"
                            number={idx + 1}
                            size={60}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                              Lesson {idx + 1}
                            </p>
                            <p className="text-gray-400 text-sm font-bold truncate">
                              {lesson.title}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/module/${mod.id}/lesson/${lesson.id}`}
                        className="glass-card card-hover rounded-2xl p-3 flex items-center gap-4"
                      >
                        <LessonThumbnail
                          state={isCompleted ? "completed" : "available"}
                          number={idx + 1}
                          size={60}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">
                            Lesson {idx + 1}
                          </p>
                          <p className="text-white text-sm font-bold truncate">
                            {lesson.title}
                          </p>
                        </div>
                      </Link>
                    );
                  })}

                  {/* Quiz item */}
                  {moduleUnlocked ? (
                    <Link
                      href={`/dashboard/module/${mod.id}/quiz`}
                      className="glass-card card-hover rounded-2xl p-3 flex items-center gap-4 border-purple-500/20"
                    >
                      <LessonThumbnail
                        state={quizDone ? "completed" : "available"}
                        emoji={quizDone ? "🎯" : "📝"}
                        size={60}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-purple-400 text-[10px] uppercase tracking-wider font-semibold">
                          Quiz
                        </p>
                        <p className="text-white text-sm font-bold truncate">
                          Module {mod.id} Quiz
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div
                      className="glass-card rounded-2xl p-3 flex items-center gap-4 opacity-50 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      <LessonThumbnail state="locked" emoji="📝" size={60} />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-[10px] uppercase tracking-wider font-semibold">
                          Quiz
                        </p>
                        <p className="text-gray-400 text-sm font-bold truncate">
                          Module {mod.id} Quiz
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}
