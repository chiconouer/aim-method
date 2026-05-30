"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession, getModuleProgress, User } from "@/lib/auth";
import { MODULES } from "@/lib/courseData";
import { isModuleUnlocked } from "@/lib/moduleAccess";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [statusReady, setStatusReady] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/auth/sign-in");
      return;
    }
    setUser(session);

    const prog: Record<number, number> = {};
    MODULES.forEach((m) => {
      prog[m.id] = getModuleProgress(m.id, m.lessons.length);
    });
    setProgress(prog);

    // Fetch which module quizzes the student has completed
    fetch(`/api/quiz/status?email=${encodeURIComponent(session.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.completedModules)) {
          setCompletedModules(data.completedModules);
        }
      })
      .catch(() => {
        // On error, fail closed: keep completedModules empty so only module 1 unlocks.
        // Better to show "locked" than to grant unintended access.
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

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <main className="max-w-6xl mx-auto px-5 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Welcome back! 🔥
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Continue where you left off.
          </p>
        </div>

        {/* Module grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {MODULES.map((mod) => {
            const pct = progress[mod.id] ?? 0;
            const firstLesson = mod.lessons[0];
            const unlocked = isModuleUnlocked(mod.id, completedModules);

            if (!unlocked) {
              return (
                <div
                  key={mod.id}
                  className="glass-card rounded-2xl overflow-hidden flex flex-col opacity-60 cursor-not-allowed"
                  aria-disabled="true"
                >
                  <div className="relative h-44">
                    <Image
                      src={firstLesson.thumbnail}
                      alt={mod.title}
                      fill
                      className="object-cover grayscale"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="absolute top-3 left-3 bg-gray-700/80 backdrop-blur-sm text-gray-300 text-xs font-bold px-2.5 py-1 rounded-full">
                      Module {mod.id}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-black/70 border border-white/15 flex items-center justify-center">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                          <path d="M7 11V7a5 5 0 0110 0v4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-3 flex-1">
                    <h3 className="text-gray-300 font-bold text-base leading-snug">
                      {mod.title}
                    </h3>
                    <p className="text-gray-500 text-xs">
                      {mod.lessons.length} lessons
                    </p>
                    <div className="mt-auto bg-white/3 border border-white/10 text-gray-400 text-xs font-medium py-2.5 px-3 rounded-xl text-center">
                      🔒 Unlocks after you complete the Module {mod.id - 1} quiz
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={mod.id}
                className="glass-card card-hover rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="relative h-44">
                  <Image
                    src={firstLesson.thumbnail}
                    alt={mod.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3 bg-purple-600/80 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    Module {mod.id}
                  </div>
                  {pct === 100 && (
                    <div className="absolute top-3 right-3 bg-green-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      ✓ Done
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="text-white font-bold text-base leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {mod.lessons.length} lessons
                  </p>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-gray-500 text-xs">Progress</span>
                      <span className="text-purple-400 text-xs font-semibold">
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="progress-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/module/${mod.id}`}
                    className="mt-auto purple-btn text-white text-sm font-bold py-2.5 rounded-xl text-center"
                  >
                    {pct > 0 ? "Continue" : "Start Module"}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
