"use client";
import { useRef } from "react";

const STRIPE_URL = process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL || "#";

const MODULES = [
  { icon: "🧠", title: "Diffusion Fundamentals", desc: "How the models work" },
  { icon: "✍️", title: "Prompt Engineering", desc: "Write prompts that produce results" },
  { icon: "🧬", title: "Character Consistency", desc: "Keep subjects coherent" },
  { icon: "🎬", title: "Video Animation", desc: "From still frames to motion" },
];

const WHAT_YOU_GET = [
  { icon: "📚", text: "20 structured video lessons across 5 modules" },
  { icon: "✍️", text: "Prompt engineering module with 15+ techniques" },
  { icon: "🧬", text: "Character consistency workflows used by digital artists" },
  { icon: "⚙️", text: "Workflow automation for consistent results" },
  { icon: "🎬", text: "Video animation fundamentals and frame-to-motion pipelines" },
  { icon: "🔄", text: "Full course access with all future updates included" },
  { icon: "💬", text: "Private learner community for questions and feedback" },
  { icon: "📥", text: "Downloadable prompt library and workflow templates" },
];

const FAQS = [
  { q: "Do I need prior experience with AI tools?", a: "No. The course starts from fundamentals and assumes only basic computer literacy. By the end of Module 1 you will be comfortable with the core concepts." },
  { q: "What is the refund policy?", a: "Full refund within 7 days of purchase, no questions asked. Email support@aimodelmethods.com from the address you used to enroll." },
  { q: "How long do I have access to the lessons?", a: "Full course access. You also receive all future updates at no additional cost as the underlying tools evolve." },
  { q: "What software or hardware do I need?", a: "A modern computer and a stable internet connection. The course covers cloud-based tools, so a powerful local GPU is not required." },
  { q: "How long does the course take to complete?", a: "Most learners finish the 20 lessons in 2–4 weeks at a comfortable pace. You can also work through it in a single weekend — each lesson stands on its own." },
  { q: "Is there support if I get stuck?", a: "Yes. Email support@aimodelmethods.com for any technical issue, and the private learner community is active throughout the week." },
];

const BODY_PARAGRAPHS = [
  "AI image generation has become one of the most valuable creative skills of the decade. Studios, agencies, and independent creators are using these tools to produce work that would have been impossible just two years ago.",
  "But most people who try to learn end up frustrated. They watch random YouTube tutorials, jump between tools, and never build real proficiency. The result is generic outputs that look obviously AI-generated.",
  "This course solves that. Twenty structured lessons across five modules walk you from the fundamentals of diffusion models all the way to advanced character consistency and video animation workflows. Every lesson is hands-on, with concrete examples you can replicate immediately.",
  "By the end of the course, you will understand how the latest AI image generation tools actually work, how to write prompts that produce consistent professional results, and how to build workflows that turn ideas into polished imagery in minutes instead of hours.",
  "The course is designed for beginners and intermediate creators. No coding required. Basic computer literacy is enough.",
];

export default function StartPage() {
  const openFaq = useRef<number | null>(null);

  function toggleFaq(idx: number) {
    const body = document.getElementById(`faq-body-${idx}`);
    const icon = document.getElementById(`faq-icon-${idx}`);
    if (!body || !icon) return;
    const isOpen = openFaq.current === idx;
    document.querySelectorAll(".faq-body").forEach((b) => ((b as HTMLElement).style.maxHeight = "0"));
    document.querySelectorAll(".faq-icon").forEach((i) => ((i as HTMLElement).style.transform = "rotate(0deg)"));
    openFaq.current = isOpen ? null : idx;
    if (!isOpen) {
      body.style.maxHeight = "240px";
      icon.style.transform = "rotate(45deg)";
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* BANNER */}
      <div
        className="relative overflow-hidden py-2 px-4 text-center text-xs font-bold text-white tracking-wide"
        style={{ background: "linear-gradient(90deg,#2d0a6b,#7c3aed,#2d0a6b)", backgroundSize: "200% 100%", animation: "bannerShift 4s linear infinite" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.3),transparent 70%)" }} />
        <p className="relative z-10">✦ 20 structured lessons · full course access · 7-day refund ✦</p>
      </div>

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      {/* HERO */}
      <div className="text-center px-5 pt-5 pb-3">
        <span className="inline-block mb-2 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-purple-900/10 border border-purple-700/20 text-purple-400">
          AI Image Generation Course
        </span>
        <h1 className="text-2xl font-black text-white leading-tight tracking-tight mb-2">
          The Complete Course on<br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg,#a78bfa,#e9d5ff,#a78bfa)", backgroundSize: "200%", animation: "shimmer 3s linear infinite" }}
          >
            AI Image Generation
          </span>
        </h1>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Learn the latest AI image generation tools through 20 structured video lessons. Explore prompt engineering, advanced workflows, and creative techniques used by digital artists today.
        </p>
      </div>

      {/* SALES LETTER BODY (replaces VSL video) */}
      <div
        className="mx-4 my-4 rounded-2xl border border-purple-900/30 px-5 py-6"
        style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)", boxShadow: "0 0 40px rgba(124,58,237,0.12)" }}
      >
        <div className="flex flex-col gap-4">
          {BODY_PARAGRAPHS.map((p, i) => (
            <p key={i} className="text-[12px] text-gray-300 leading-relaxed">
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* CTA BUTTON */}
      <div className="px-5 pb-5">
        <a
          href={STRIPE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-white text-base font-black py-4 rounded-2xl relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            animation: "btnGlow 3s ease-in-out infinite",
          }}
        >
          Enroll Now — $29 →
        </a>
        <p className="text-center text-[10px] text-gray-600 mt-2">
          One-time payment · Full course access · 7-day refund
        </p>
      </div>

      {/* WHAT YOU GET DIVIDER */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">What You Get</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
      </div>

      {/* WHAT YOU GET CARD */}
      <div className="px-5 mb-5 relative">
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{
            padding: "2px",
            background: "conic-gradient(from 0deg, #7c3aed, #a78bfa, #e9d5ff, #7c3aed)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            animation: "rotateBorder 3s linear infinite",
          }}
        />
        <div
          className="relative rounded-[18px] p-5"
          style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)" }}
        >
          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-white mb-3" style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }}>
              ✦ Full course access · $29
            </span>
            <p className="text-sm font-bold text-gray-200">Everything included:</p>
          </div>

          <div className="flex flex-col gap-3 mb-5">
            {WHAT_YOU_GET.map((item) => (
              <div key={item.text} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-purple-900/20 border border-purple-700/25">
                  {item.icon}
                </div>
                <p className="text-[11px] text-gray-400 leading-relaxed pt-1">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="text-center py-4 border-t border-purple-900/20 mb-4">
            <p className="text-xl font-black text-white">Today: <span className="text-purple-400">$29</span></p>
            <p className="text-[10px] text-gray-600 mt-1">One-time · No subscription</p>
          </div>

          <a
            href={STRIPE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-white text-sm font-black py-4 rounded-xl relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              animation: "wygBtnPulse 2s ease-in-out infinite",
            }}
          >
            ENROLL FOR $29 →
          </a>
          <p className="text-center text-[9px] text-gray-600 mt-2">🔒 Secure payment · Instant access · 7-day refund</p>
        </div>
      </div>

      {/* MODULES DIVIDER */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">Course Modules</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
      </div>

      <div className="grid grid-cols-2 gap-3 px-5 mb-5">
        {MODULES.map((m) => (
          <div
            key={m.title}
            className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/5 flex flex-col items-center justify-center px-3 text-center"
            style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)" }}
          >
            <div className="text-3xl mb-3">{m.icon}</div>
            <p className="text-sm font-black text-white leading-tight mb-1">{m.title}</p>
            <p className="text-[10px] text-purple-400 font-medium">{m.desc}</p>
          </div>
        ))}
      </div>

      {/* FAQ DIVIDER */}
      <div className="flex items-center gap-2 px-5 pb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">Frequently Asked</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
      </div>

      <div className="px-5 flex flex-col gap-2 mb-6">
        {FAQS.map((faq, i) => (
          <div key={i} className="rounded-xl overflow-hidden border border-white/5 bg-[#090909] cursor-pointer" onClick={() => toggleFaq(i)}>
            <div className="flex items-center justify-between px-4 py-3">
              <p className="text-xs font-bold text-gray-200 flex-1 mr-2">{faq.q}</p>
              <span id={`faq-icon-${i}`} className="faq-icon text-purple-500 font-bold text-sm flex-shrink-0" style={{ transition: "transform 0.3s" }}>+</span>
            </div>
            <div id={`faq-body-${i}`} className="faq-body overflow-hidden" style={{ maxHeight: 0, transition: "max-height 0.3s ease" }}>
              <p className="text-[11px] text-gray-500 leading-relaxed px-4 pb-3">{faq.a}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FINAL CTA */}
      <div className="px-5 pb-10 text-center">
        <p className="text-[9px] text-purple-900 uppercase tracking-widest mb-3">✦ Start learning today ✦</p>
        <a
          href={STRIPE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-white text-base font-black py-4 rounded-2xl mb-3 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
            boxShadow: "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          Enroll Now — $29 →
        </a>
        <p className="text-[9px] text-gray-700 leading-relaxed">
          Skill development depends on time and effort invested. The course provides structured instruction; individual outcomes vary.
        </p>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-white/5 px-5 py-8 pb-28 text-center">
        <p className="text-sm font-black mb-2">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </p>
        <p className="text-[10px] text-gray-500 mb-4">
          Questions? <a href="mailto:support@aimodelmethods.com" className="text-purple-400 hover:underline">support@aimodelmethods.com</a>
        </p>
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-500 mb-4">
          <a href="/refund-policy" className="hover:text-purple-400 transition-colors">Refund Policy</a>
          <span className="text-gray-800">·</span>
          <a href="/terms" className="hover:text-purple-400 transition-colors">Terms</a>
          <span className="text-gray-800">·</span>
          <a href="/privacy" className="hover:text-purple-400 transition-colors">Privacy</a>
        </div>
        <p className="text-[9px] text-gray-700">© 2026 AIM Method. All rights reserved.</p>
      </footer>

      {/* FIXED BOTTOM */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t border-white/5"
        style={{ background: "rgba(5,5,5,0.97)", backdropFilter: "blur(12px)" }}
      >
        <a
          href={STRIPE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between max-w-lg mx-auto rounded-xl px-5 py-3 text-white relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)", boxShadow: "0 0 28px rgba(124,58,237,0.4)" }}
        >
          <span className="text-sm font-black">Enroll Now</span>
          <span className="text-base font-black">$29 →</span>
        </a>
      </div>

      <style>{`
        @keyframes bannerShift { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes shimmer { 0%{background-position:0%} 100%{background-position:200%} }
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
        @keyframes wygBtnPulse {
          0%,100%{box-shadow:0 0 20px rgba(124,58,237,0.4);transform:scale(1)}
          50%{box-shadow:0 0 40px rgba(124,58,237,0.7);transform:scale(1.01)}
        }
        @keyframes rotateBorder {
          0%{background:conic-gradient(from 0deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          25%{background:conic-gradient(from 90deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          50%{background:conic-gradient(from 180deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          75%{background:conic-gradient(from 270deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          100%{background:conic-gradient(from 360deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
        }
      `}</style>
    </div>
  );
}
