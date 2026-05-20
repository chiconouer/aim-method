"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const MODELS = [
  { name: "Sofia" },
  { name: "Valentina" },
  { name: "Aria" },
  { name: "Sadie" },
];

const REVIEWS = [
  {
    user: "johnultra",
    text: "Very good method, changed my life. If you want to understand how AI image generation works for social media, this program delivers real actionable strategies.",
  },
  {
    user: "kylefiles",
    text: "Very simple to understand, professor Nouer the goat. I started from scratch with no technical knowledge. Within 3 weeks I had my first AI character live on social media.",
  },
  {
    user: "pedrosmbk",
    text: "The step-by-step framework helped me launch my own creative project fast. Highly recommended for anyone curious about AI image generation.",
  },
  {
    user: "dexmusic",
    text: "Amazing community and support. Very happy to be a part of this community.",
  },
];

function HomeContent() {
  const router = useRouter();

  async function handleCourseNav() {
    const session = getSession();
    if (!session) {
      router.push("/auth/sign-in");
      return;
    }
    const hasCookie = document.cookie.split(";").some(c => c.trim().startsWith("aim_user="));
    if (hasCookie) {
      router.push("/dashboard");
      return;
    }
    try {
      const res = await fetch("/api/auth/restore-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session: localStorage.getItem("aim_session") }),
      });
      if (res.ok) router.push("/dashboard");
    } catch {}
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-white">AIM</span>{" "}
            <span className="text-purple-400">Method</span>
          </span>
          <span className="text-gray-500 text-xs font-medium">@chiconouer</span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          <a href="#models" className="text-white hover:text-purple-400 transition-colors text-sm">Examples</a>
          <a href="#about" className="text-white hover:text-purple-400 transition-colors text-sm">About</a>
          <a href="#reviews" className="text-white hover:text-purple-400 transition-colors text-sm">Reviews</a>
        </div>
        <button
          onClick={handleCourseNav}
          className="bg-[#8b5cf6] hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          Sign In
        </button>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center px-5 pt-24 pb-12 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-5">
            <span className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-400 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
              AI Image Generation Course
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            Create AI Influencers.<br />
            <span className="text-purple-400">Build Your Brand.</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
            Learn to create realistic AI influencers for content creation, branding, and social media — no camera or experience needed.
          </p>
          <button
            onClick={handleCourseNav}
            className="inline-block purple-btn text-white font-bold text-base px-8 py-4 rounded-xl mb-12"
          >
            Explore Courses →
          </button>
          <div id="models" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MODELS.map((model) => (
              <div
                key={model.name}
                className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/10 flex items-center justify-center"
                style={{ background: "linear-gradient(160deg, #1a1a2e 0%, #0d0d1a 100%)" }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="relative z-10 flex flex-col items-center gap-3 px-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-700/40 flex items-center justify-center">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4" />
                      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" />
                    </svg>
                  </div>
                  <p className="text-white font-bold text-base leading-tight">{model.name}</p>
                  <p className="text-purple-400 text-xs uppercase tracking-widest">AI Character</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COURSE HIGHLIGHTS */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#222] px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8">

            {/* Purple glow */}
            <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-purple-700/20 blur-3xl pointer-events-none" />

            {/* Left side */}
            <div className="relative z-10 flex-1">
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase bg-purple-900/30 border border-purple-700/40 text-purple-400">
                What You Learn
              </span>
              <h2 className="text-3xl font-bold text-white leading-snug mb-3">
                A structured path through{" "}
                <span className="text-purple-400">AI image generation</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md">
                Twenty video lessons covering diffusion models, prompt engineering, character consistency, and video animation workflows used by digital artists today.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleCourseNav}
                  className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 transition-colors text-white text-sm font-semibold px-5 py-3 rounded-lg"
                >
                  Explore the Course →
                </button>
              </div>
            </div>

            {/* Right side - stats */}
            <div className="relative z-10 flex flex-col gap-3 min-w-[160px]">
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">20 lessons</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">across 5 modules</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">Full access</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">all future updates included</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">7-day refund</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">no questions asked</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* STUDENT RESULTS */}
      <section id="reviews" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">
              Testimonials
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              What Students Are Saying
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {REVIEWS.map((r) => (
              <div
                key={r.user}
                className="glass-card card-hover rounded-2xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-sm">
                    {r.user[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">@{r.user}</p>
                    <p className="text-yellow-400 text-xs">★★★★★</p>
                  </div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-extrabold mb-4">
            Ready to Start?
          </h2>
          <p className="text-gray-400 mb-8 text-base sm:text-lg">
            Join hundreds of students already learning AI image generation with the AIM Method.
          </p>
          <button
            onClick={handleCourseNav}
            className="purple-btn text-white font-bold px-10 py-4 rounded-xl text-lg"
          >
            Explore Courses
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 px-5 text-center text-gray-600 text-sm">
        © 2026 AIM Method. All rights reserved.
      </footer>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
