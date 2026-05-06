"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSession } from "@/lib/auth";

const MODELS = [
  {
    image: "/model1.jpg",
    name: "Sofia",
    earnings: "$11,200/month",
    stats: "187K followers • 43K likes",
  },
  {
    image: "/model2.jpg",
    name: "Valentina",
    earnings: "$8,750/month",
    stats: "124K followers • 31K likes",
  },
  {
    image: "/model3.jpg",
    name: "Aria",
    earnings: "$14,300/month",
    stats: "215K followers • 67K likes",
  },
  {
    image: "/model4.jpg",
    name: "Sadie",
    earnings: "$27,450/month",
    stats: "347K followers",
  },
];


const REVIEWS = [
  {
    user: "johnultra",
    text: "Very good method, changed my life. If you want to understand how AI influencers are monetized, this program delivers real actionable strategies.",
  },
  {
    user: "kylefiles",
    text: "Very simple to understand, professor Nouer the goat. I started from scratch with no technical knowledge. Within 3 weeks I had my first AI model generating revenue.",
  },
  {
    user: "pedrosmbk",
    text: "Quit my 9to5 after 2 months. The step-by-step framework helped me launch a profitable setup fast.",
  },
  {
    user: "dexmusic",
    text: "Amazing community and support. Very happy to be apart of this community.",
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
          <a href="#models" className="text-white hover:text-purple-400 transition-colors text-sm">Model Examples</a>
          <a href="#about" className="text-white hover:text-purple-400 transition-colors text-sm">About</a>
          <a href="#reviews" className="text-white hover:text-purple-400 transition-colors text-sm">Reviews</a>
        </div>
        <a
          href="/dashboard/store"
          className="bg-[#8b5cf6] hover:bg-purple-500 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
        >
          🤖 AI Model Store
        </a>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center px-5 pt-24 pb-12 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto w-full">
          <div className="mb-5">
            <span className="inline-block bg-purple-900/30 border border-purple-700/40 text-purple-400 text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full">
              AI Model Method
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight tracking-tight mb-4">
            Your AI model.<br />
            <span className="text-purple-400">Your income.</span>
          </h1>
          <p className="text-gray-500 text-base sm:text-lg leading-relaxed mb-8 max-w-lg">
            Build faceless AI influencers that make money 24/7 — no camera, no followers, no experience needed.
          </p>
          <button
            onClick={handleCourseNav}
            className="inline-block purple-btn text-white font-bold text-base px-8 py-4 rounded-xl mb-12"
          >
            Explore Courses →
          </button>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MODELS.map((model) => (
              <div
                key={model.name}
                className="relative rounded-2xl overflow-hidden aspect-[3/4]"
              >
                <Image
                  src={model.image}
                  alt={model.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-sm leading-tight">{model.name}</p>
                  <p className="text-purple-400 font-bold text-xs">{model.earnings}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{model.stats}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI MODEL STORE BANNER */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-2xl bg-[#0a0a0a] border border-[#222] px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-8">

            {/* Purple glow */}
            <div className="absolute -top-16 -right-16 w-60 h-60 rounded-full bg-purple-700/20 blur-3xl pointer-events-none" />

            {/* Left side */}
            <div className="relative z-10 flex-1">
              <span className="inline-block mb-4 px-3 py-1 rounded-full text-xs font-medium tracking-widest uppercase bg-purple-900/30 border border-purple-700/40 text-purple-400">
                New — AI Model Store
              </span>
              <h2 className="text-3xl font-bold text-white leading-snug mb-3">
                The best AI models,{" "}
                <span className="text-purple-400">ready to make money</span>
              </h2>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md">
                Skip the hardest part of the course. Get a fully built AI model — already created and ready to post on Instagram.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/dashboard/store"
                  className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-600 transition-colors text-white text-sm font-semibold px-5 py-3 rounded-lg"
                >
                  View Ready AI Models →
                </a>
                <a
                  href="/dashboard/store"
                  className="inline-flex items-center gap-2 border border-purple-900 hover:border-purple-700 transition-colors text-purple-400 text-sm font-medium px-5 py-3 rounded-lg"
                >
                  Learn more
                </a>
              </div>
            </div>

            {/* Right side - stats */}
            <div className="relative z-10 flex flex-col gap-3 min-w-[160px]">
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">3–5 days</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">saved on model creation</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">100% unique</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">sold to one student only</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                <div className="text-lg font-bold text-purple-400">Ready to post</div>
                <div className="text-xs text-gray-500 mt-1 leading-snug">no editing required</div>
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
            Join hundreds of students already building their AI model business.
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
