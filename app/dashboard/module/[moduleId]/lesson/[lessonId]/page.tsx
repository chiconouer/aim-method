"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getSession, markComplete, isLessonComplete } from "@/lib/auth";
import { getLesson, getAdjacentLessons, getModule } from "@/lib/courseData";
import { QuizCTA } from "@/components/QuizCTA";

export default function LessonPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.moduleId);
  const lessonId = Number(params.lessonId);

  const [ready, setReady] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState<boolean | null>(null);

  const modForLast = getModule(moduleId);
  const isLastLesson =
    !!modForLast &&
    modForLast.lessons[modForLast.lessons.length - 1].id === lessonId;

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setCompleted(isLessonComplete(moduleId, lessonId));
    setReady(true);

    if (!isLastLesson) return;
    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        const completed: number[] = Array.isArray(data?.completedModules)
          ? data.completedModules
          : [];
        setQuizCompleted(completed.includes(moduleId));
      })
      .catch(() => setQuizCompleted(false));
  }, [router, moduleId, lessonId, isLastLesson]);

  function handleMarkComplete() {
    markComplete(moduleId, lessonId);
    setCompleted(true);
  }

  const data = getLesson(moduleId, lessonId);
  const { prev, next } = getAdjacentLessons(moduleId, lessonId);

  if (!ready) return null;

  if (!data) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">Lesson not found.</p>
          <Link href="/dashboard" className="text-purple-400 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { module: mod, lesson } = data;

  // Find lesson index for display
  const lessonIndex = mod.lessons.findIndex((l) => l.id === lessonId);

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Back nav */}
        <Link
          href={`/dashboard/module/${moduleId}`}
          className="inline-flex items-center text-gray-500 hover:text-purple-400 text-sm transition-colors mb-6"
        >
          ← Back to Module {moduleId}
        </Link>

        {/* Lesson header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400 text-xs font-semibold uppercase tracking-widest">
              Module {moduleId} · Lesson {lessonIndex + 1}
            </span>
            {completed && (
              <span className="bg-green-500/15 border border-green-500/30 text-green-400 text-xs px-2 py-0.5 rounded-full">
                ✓ Completed
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            {lesson.title}
          </h1>
        </div>

        {/* Video area */}
        <div className="glass-card rounded-2xl overflow-hidden mb-6">
          {lesson.videoEmbed ? (
            <div
              className="w-full aspect-video"
              dangerouslySetInnerHTML={{ __html: lesson.videoEmbed }}
            />
          ) : (
            <div className="w-full aspect-video flex flex-col items-center justify-center gap-3 bg-white/3">
              <div className="w-16 h-16 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 text-2xl">
                ▶
              </div>
              <p className="text-gray-500 text-sm">Video coming soon</p>
              <p className="text-gray-700 text-xs">
                Add your Vturb embed code in courseData.ts
              </p>
            </div>
          )}
        </div>

        {/* Resource link (e.g. NSFW content examples for M4L4) */}
        {lesson.resourceLink && (
          <div className="text-center mb-6">
            <a
              href={lesson.resourceLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#8b5cf6] text-white font-bold px-8 py-3 rounded-xl text-sm hover:bg-purple-500 transition-colors"
            >
              {lesson.resourceLink.label}
            </a>
            {lesson.resourceLink.warning && (
              <p className="text-gray-500 text-xs mt-2">{lesson.resourceLink.warning}</p>
            )}
          </div>
        )}

        {/* Progress tracker */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-400 text-sm font-semibold">
              Module Progress
            </span>
            <span className="text-purple-400 text-sm font-bold">
              Lesson {lessonIndex + 1} of {mod.lessons.length}
            </span>
          </div>
          <div className="flex gap-1.5">
            {mod.lessons.map((l, i) => (
              <div
                key={l.id}
                className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < lessonIndex
                    ? "bg-purple-500"
                    : i === lessonIndex
                    ? "bg-purple-400"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          {!completed ? (
            <button
              onClick={handleMarkComplete}
              className="purple-btn text-white font-bold py-3 px-6 rounded-xl flex-1 text-sm"
            >
              ✓ Mark as Complete
            </button>
          ) : (
            <div className="flex-1 bg-green-500/10 border border-green-500/25 text-green-400 font-bold py-3 px-6 rounded-xl text-center text-sm">
              ✓ Lesson Completed
            </div>
          )}
        </div>

        {/* Quiz CTA — only on the last lesson of the module */}
        {isLastLesson && quizCompleted !== null && (
          <div className="mb-8">
            <QuizCTA moduleId={moduleId} quizCompleted={quizCompleted} />
          </div>
        )}

        {/* Prev / Next navigation */}
        <div className="flex gap-3">
          {prev ? (
            <Link
              href={`/dashboard/module/${prev.moduleId}/lesson/${prev.lessonId}`}
              className="flex-1 outline-btn font-semibold py-3 px-4 rounded-xl text-center text-sm"
            >
              ← Previous
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {next ? (
            <Link
              href={`/dashboard/module/${next.moduleId}/lesson/${next.lessonId}`}
              className="flex-1 purple-btn text-white font-bold py-3 px-4 rounded-xl text-center text-sm"
            >
              Next →
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex-1 purple-btn text-white font-bold py-3 px-4 rounded-xl text-center text-sm"
            >
              🎉 Back to Dashboard
            </Link>
          )}
        </div>
      </main>
    </div>
  );
}
