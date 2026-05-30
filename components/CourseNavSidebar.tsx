"use client";

import { useState } from "react";
import Link from "next/link";
import { MODULES } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";
import { LessonThumbnail } from "@/components/LessonThumbnail";

interface Props {
  currentModuleId: number;
  currentLessonId: number;
  completedModules: number[];
  progressMap: Record<string, boolean>;
}

export function CourseNavSidebar({
  currentModuleId,
  currentLessonId,
  completedModules,
  progressMap,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const totalLessons = MODULES.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = MODULES.reduce(
    (acc, m) =>
      acc + m.lessons.filter((l) => progressMap[`${m.id}-${l.id}`]).length,
    0,
  );
  const overallPct = totalLessons
    ? Math.round((completedLessons / totalLessons) * 100)
    : 0;

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* Mobile-only toggle header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="lg:hidden w-full flex items-center justify-between p-4 text-left"
        aria-expanded={expanded}
      >
        <div>
          <p className="text-white font-bold text-sm">Course Content</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {completedLessons} of {totalLessons} lessons · {overallPct}%
          </p>
        </div>
        <span className="text-purple-400 text-2xl leading-none w-6 text-center">
          {expanded ? "−" : "+"}
        </span>
      </button>

      <div className={`${expanded ? "block" : "hidden"} lg:block`}>
        {/* Progress block */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm font-semibold">
              Your Progress
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
            {completedLessons} of {totalLessons} lessons completed
          </p>
        </div>

        {/* Module list */}
        <div className="p-3 flex flex-col gap-5">
          {MODULES.map((mod) => {
            const moduleUnlocked = isModuleUnlocked(mod.id, completedModules);
            const quizDone = completedModules.includes(mod.id);

            return (
              <div key={mod.id}>
                {/* Module header */}
                <div className="px-2 mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                      Module {mod.id}
                    </p>
                    {!moduleUnlocked && (
                      <LockIcon className="w-3 h-3 text-gray-600" />
                    )}
                  </div>
                  <p
                    className={`text-sm font-bold mt-0.5 ${
                      moduleUnlocked ? "text-white" : "text-gray-500"
                    }`}
                  >
                    {mod.title}
                  </p>
                </div>

                {/* Lessons */}
                <div className="flex flex-col gap-1">
                  {mod.lessons.map((lesson, idx) => {
                    const isCurrent =
                      mod.id === currentModuleId &&
                      lesson.id === currentLessonId;
                    const isCompleted =
                      !!progressMap[`${mod.id}-${lesson.id}`];

                    if (!moduleUnlocked) {
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 px-2 py-2 rounded-lg opacity-40 cursor-not-allowed"
                          aria-disabled="true"
                        >
                          <LessonThumbnail
                            state="locked"
                            number={idx + 1}
                            size={40}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-gray-600 text-[10px]">
                              Lesson {idx + 1}
                            </p>
                            <p className="text-gray-400 text-xs truncate">
                              {lesson.title}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    const itemCls = isCurrent
                      ? "bg-purple-500/15 border border-purple-500/40"
                      : "border border-transparent hover:bg-white/5 hover:border-white/10";

                    // Priority: current > completed > available
                    const thumbState = isCurrent
                      ? "current"
                      : isCompleted
                        ? "completed"
                        : "available";

                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/module/${mod.id}/lesson/${lesson.id}`}
                        aria-current={isCurrent ? "page" : undefined}
                        className={`flex items-center gap-3 px-2 py-2 rounded-lg transition-colors ${itemCls}`}
                      >
                        <LessonThumbnail
                          state={thumbState}
                          number={idx + 1}
                          size={40}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-500 text-[10px]">
                            Lesson {idx + 1}
                          </p>
                          <p
                            className={`text-xs truncate font-semibold ${
                              isCurrent ? "text-white" : "text-gray-300"
                            }`}
                          >
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
                      className="flex items-center gap-3 px-2 py-2 rounded-lg border border-transparent hover:bg-white/5 hover:border-white/10 transition-colors"
                    >
                      <LessonThumbnail
                        state={quizDone ? "completed" : "available"}
                        emoji={quizDone ? "🎯" : "📝"}
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-500 text-[10px]">Quiz</p>
                        <p className="text-gray-300 text-xs font-semibold truncate">
                          Module {mod.id} Quiz
                        </p>
                      </div>
                    </Link>
                  ) : (
                    <div
                      className="flex items-center gap-3 px-2 py-2 rounded-lg opacity-40 cursor-not-allowed"
                      aria-disabled="true"
                    >
                      <LessonThumbnail
                        state="locked"
                        emoji="📝"
                        size={40}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-600 text-[10px]">Quiz</p>
                        <p className="text-gray-400 text-xs truncate font-semibold">
                          Module {mod.id} Quiz
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
