"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession, isLessonComplete } from "@/lib/auth";
import { getModule } from "@/lib/courseData";

export default function ModulePage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = Number(params.moduleId);

  const [ready, setReady] = useState(false);
  const [completions, setCompletions] = useState<Record<number, boolean>>({});

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
    setReady(true);
  }, [router, moduleId]);

  const mod = getModule(moduleId);

  if (!ready) return null;

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

  const completedCount = Object.values(completions).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="text-xl font-bold tracking-tight flex-shrink-0">
          <span className="text-white">AIM</span>{" "}
          <span className="text-purple-400">Method</span>
        </Link>
        <div className="flex items-center gap-2 text-sm overflow-x-auto scrollbar-hide">
          <Link href="/dashboard" className="text-gray-500 hover:text-white transition-colors whitespace-nowrap">
            Dashboard
          </Link>
          <span className="text-gray-700">/</span>
          <span className="text-white font-semibold whitespace-nowrap">{mod.title}</span>
        </div>
      </nav>

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
                {/* Thumbnail */}
                <div className="relative w-20 h-14 sm:w-28 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden">
                  <Image
                    src={lesson.thumbnail}
                    alt={lesson.title}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs mb-0.5">
                    Lesson {idx + 1}
                  </p>
                  <p className="text-white font-bold text-sm truncate">
                    {lesson.title}
                  </p>
                </div>

                {/* Status */}
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
