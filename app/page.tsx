"use client";

import Image from "next/image";
import Link from "next/link";

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
];

const FEATURES = [
  {
    icon: "🚀",
    title: "No Experience Needed",
    desc: "Start from zero with step-by-step guidance through every stage.",
  },
  {
    icon: "🕶️",
    title: "Full Anonymity",
    desc: "Build a profitable AI model without ever showing your face.",
  },
  {
    icon: "💰",
    title: "Proven System",
    desc: "The exact method used to generate $10K+/month consistently.",
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

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-white">AIM</span>{" "}
          <span className="text-purple-400">Method</span>
        </Link>
        <div className="hidden sm:flex items-center gap-8">
          <a href="#models" className="text-white hover:text-purple-400 transition-colors text-sm">Model Examples</a>
          <a href="#about" className="text-white hover:text-purple-400 transition-colors text-sm">About</a>
          <a href="#reviews" className="text-white hover:text-purple-400 transition-colors text-sm">Reviews</a>
        </div>
        <Link
          href="/auth/sign-in"
          className="purple-btn text-white text-sm font-semibold px-5 py-2 rounded-lg"
        >
          Sign In
        </Link>
      </nav>

      {/* HERO */}
      <section
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          gap: "12px",
          background: "#0a0a0a",
          paddingTop: "64px",
          paddingBottom: "16px",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Radial glow behind model */}
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "800px", height: "800px", background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(109,40,217,0.04) 50%, transparent 70%)", zIndex: 0, pointerEvents: "none" }} />

        {/* Wide soft light sweep 1 */}
        <div style={{ position: "absolute", left: "-10%", top: "-50%", width: "60%", height: "300%", background: "linear-gradient(to right, transparent 0%, rgba(139,92,246,0.07) 40%, rgba(139,92,246,0.12) 50%, rgba(139,92,246,0.07) 60%, transparent 100%)", transform: "rotate(35deg)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }} />

        {/* Wide soft light sweep 2 */}
        <div style={{ position: "absolute", right: "-10%", top: "-50%", width: "60%", height: "300%", background: "linear-gradient(to right, transparent 0%, rgba(139,92,246,0.07) 40%, rgba(139,92,246,0.12) 50%, rgba(139,92,246,0.07) 60%, transparent 100%)", transform: "rotate(-35deg)", opacity: 0.3, zIndex: 0, pointerEvents: "none" }} />

        {/* Floating particles */}
        {[
          { left: "5%",  top: "80%", color: "#8b5cf6", dur: "6s",  delay: "0s",    op: 0.5 },
          { left: "12%", top: "65%", color: "#a78bfa", dur: "9s",  delay: "1.2s",  op: 0.4 },
          { left: "7%",  top: "50%", color: "#8b5cf6", dur: "7s",  delay: "2.5s",  op: 0.6 },
          { left: "18%", top: "90%", color: "#a78bfa", dur: "11s", delay: "0.5s",  op: 0.3 },
          { left: "25%", top: "70%", color: "#8b5cf6", dur: "5s",  delay: "3.1s",  op: 0.5 },
          { left: "3%",  top: "35%", color: "#a78bfa", dur: "8s",  delay: "1.8s",  op: 0.4 },
          { left: "15%", top: "20%", color: "#8b5cf6", dur: "10s", delay: "0.3s",  op: 0.3 },
          { left: "30%", top: "45%", color: "#a78bfa", dur: "6s",  delay: "4.0s",  op: 0.5 },
          { left: "22%", top: "88%", color: "#8b5cf6", dur: "12s", delay: "2.0s",  op: 0.4 },
          { left: "9%",  top: "15%", color: "#a78bfa", dur: "7s",  delay: "3.5s",  op: 0.6 },
          { left: "75%", top: "75%", color: "#8b5cf6", dur: "9s",  delay: "0.8s",  op: 0.5 },
          { left: "88%", top: "60%", color: "#a78bfa", dur: "6s",  delay: "2.2s",  op: 0.4 },
          { left: "93%", top: "40%", color: "#8b5cf6", dur: "8s",  delay: "1.5s",  op: 0.3 },
          { left: "82%", top: "85%", color: "#a78bfa", dur: "11s", delay: "3.8s",  op: 0.6 },
          { left: "70%", top: "55%", color: "#8b5cf6", dur: "5s",  delay: "0.2s",  op: 0.5 },
          { left: "96%", top: "25%", color: "#a78bfa", dur: "10s", delay: "2.7s",  op: 0.4 },
          { left: "78%", top: "18%", color: "#8b5cf6", dur: "7s",  delay: "4.3s",  op: 0.3 },
          { left: "65%", top: "92%", color: "#a78bfa", dur: "12s", delay: "1.0s",  op: 0.5 },
          { left: "85%", top: "10%", color: "#8b5cf6", dur: "6s",  delay: "3.3s",  op: 0.4 },
          { left: "60%", top: "70%", color: "#a78bfa", dur: "9s",  delay: "0.6s",  op: 0.6 },
        ].map((p, i) => (
          <div key={i} style={{ position: "absolute", left: p.left, top: p.top, width: "3px", height: "3px", borderRadius: "50%", background: p.color, opacity: p.op, zIndex: 0, pointerEvents: "none", animation: `float ${p.dur} ${p.delay} ease-in-out infinite` }} />
        ))}

        {/* Model image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/hero-model-v2.png"
          alt="AI Model"
          style={{
            maxHeight: "65vh",
            width: "auto",
            maxWidth: "90vw",
            display: "block",
            mixBlendMode: "screen",
            position: "relative",
            zIndex: 1,
          }}
        />

        <p className="text-gray-300 text-sm sm:text-base text-center max-w-sm leading-relaxed px-5" style={{ position: "relative", zIndex: 2 }}>
          The exact system to create AI Models that make money
        </p>

        <div className="flex gap-3" style={{ position: "relative", zIndex: 2 }}>
          <Link
            href="/auth/sign-in"
            className="purple-btn text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            Explore Courses
          </Link>
          <Link
            href="/auth/sign-in"
            className="outline-btn font-bold px-6 py-3 rounded-xl text-sm"
          >
            Sign In
          </Link>
        </div>

      </section>

      {/* AI MODELS SHOWCASE */}
      <section id="models" className="py-20 px-5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">
              Real Results
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              AI Models Our Students Built
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {MODELS.map((model) => (
              <div
                key={model.name}
                className="glass-card card-hover rounded-2xl overflow-hidden"
              >
                <div className="relative h-72 sm:h-80">
                  <Image
                    src={model.image}
                    alt={model.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-lg">{model.name}</p>
                    <p className="text-purple-300 font-bold text-base">
                      {model.earnings}
                    </p>
                    <p className="text-gray-400 text-xs mt-0.5">{model.stats}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY CHOOSE AIM METHOD */}
      <section id="about" className="py-20 px-5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-2">
              Why AIM Method
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="glass-card card-hover rounded-2xl p-7 text-center"
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
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
          <Link
            href="/auth/sign-in"
            className="purple-btn text-white font-bold px-10 py-4 rounded-xl text-lg inline-block"
          >
            Explore Courses
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 px-5 text-center text-gray-600 text-sm">
        © 2026 AIM Method. All rights reserved.
      </footer>
    </div>
  );
}
