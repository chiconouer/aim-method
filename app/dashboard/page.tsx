"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getSession, signOut, getModuleProgress, User } from "@/lib/auth";
import { MODULES } from "@/lib/courseData";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [progress, setProgress] = useState<Record<number, number>>({});

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
  }, [router]);

  function handleSignOut() {
    signOut();
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-white">AIM</span>{" "}
          <span className="text-purple-400">Method</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm hidden sm:block">
            👋 {user.name}
          </span>
          <button
            onClick={handleSignOut}
            className="text-gray-500 hover:text-white text-sm transition-colors px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Content */}
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

            return (
              <div
                key={mod.id}
                className="glass-card card-hover rounded-2xl overflow-hidden flex flex-col"
              >
                {/* First lesson thumbnail */}
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

                {/* Info */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="text-white font-bold text-base leading-snug">
                    {mod.title}
                  </h3>
                  <p className="text-gray-500 text-xs">
                    {mod.lessons.length} lessons
                  </p>

                  {/* Progress */}
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
