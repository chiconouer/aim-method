"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession, isLessonComplete } from "@/lib/auth";
import { getModule } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.moduleId);

  const [ready, setReady] = useState(false);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    const comps: Record<number, boolean> = {};
    const mod = getModule(moduleId);
    if (mod) {
      mod.lessons.forEach((l) => {
        comps[l.id] = isLessonComplete(moduleId, l.id);
      });
    }
    setCompletions(comps);

    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.completedModules)) {
          setCompletedModules(data.completedModules);
        }
      })
      .catch(() => {
        // Fail closed — leave completedModules empty
      })
      .finally(() => setReady(true));
  }, [router, moduleId]);

  const mod = getModule(moduleId);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Module not found.</p>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const unlocked = isModuleUnlocked(moduleId, completedModules);

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
        <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2">
            Module {moduleId} is locked
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Complete the Module {moduleId - 1} quiz to unlock this module.
          </p>
          <Link
            href={`/dashboard/module/${moduleId - 1}`}
            className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm inline-block w-full mb-2"
          >
            Go to Module {moduleId - 1}
          </Link>
          <Link
            href="/dashboard"
            className="block text-gray-500 hover:text-purple-400 text-sm transition-colors mt-3"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const completedCount = Object.values(completions).filter(Boolean).length;
  const quizCompleted = completedModules.includes(moduleId);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-3xl mx-auto px-5 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/25 rounded-full px-3 py-1 text-xs text-purple-300 mb-3">
            Module {mod.id}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">
            {mod.title}
          </h1>
          <p className="text-gray-500 text-sm">
            {completedCount} of {mod.lessons.length} lessons completed
          </p>
        </div>

        {/* Lesson list */}
        <div className="flex flex-col gap-3">
          {mod.lessons.map((lesson, idx) => {
            const done = completions[lesson.id];
            return (
              <Link
                key={lesson.id}
                href={`/dashboard/module/${mod.id}/lesson/${lesson.id}`}
                className="glass-card card-hover rounded-2xl overflow-hidden flex items-center gap-4 p-4"
              >
                <div className="relative w-20 h-14 sm:w-28 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs mb-0.5">
                    Lesson {idx + 1}
                  </p>
                  <p className="text-white font-bold text-sm truncate">
                    {lesson.title}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  {done ? (
                    <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 text-sm">
                      ✓
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-sm">
                      ▶
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quiz CTA */}
        <div className="mt-8 glass-card rounded-2xl p-6 text-center">
          <div className="text-3xl mb-2">{quizCompleted ? "🎯" : "📝"}</div>
          <h3 className="text-white font-bold text-lg mb-1">
            {quizCompleted ? "Quiz completed" : "Ready for the Module Quiz?"}
          </h3>
          <p className="text-gray-400 text-sm mb-5">
            {quizCompleted
              ? "You've already completed this quiz. Feel free to retake it anytime."
              : `Test what you learned in Module ${mod.id}. Passing the quiz unlocks the next module.`}
          </p>
          <Link
            href={`/dashboard/module/${mod.id}/quiz`}
            className="purple-btn text-white font-bold py-3 px-6 rounded-xl text-sm inline-block"
          >
            {quizCompleted ? "Retake Quiz" : "Take the Module Quiz"}
          </Link>
        </div>

        {/* Back */}
        <div className="mt-10">
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-purple-400 text-sm transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
