"use client";
import { useEffect, useRef } from "react";

// JSX type for Vturb's custom element (web component, no public type pkg).
// Replaces a previous `@ts-expect-error` comment that TS misreported as
// unused — proper type declaration is the actual fix.
declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "vturb-smartplayer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & { id?: string };
    }
  }
}

const REVEAL_TIME = 510;
const STORAGE_KEY = "aim_sales_visited";

const STUDENTS = [
  { name: "johnultra", image: "/proof-johnultra.png", quote: "Without you mate nothing would be possible. Thank you @Chico Nouer for always checking on me." },
  { name: "kylefiles", image: "/proof-kylefiles.png", quote: "This is my highest total in a single day yet! Usually Sundays are a bit slower." },
  { name: "pedrosmbk", image: "/proof-pedrosmbk.png", quote: "God bless Johnny, hopefully he will comeback for more later." },
  { name: "bobcataiden", image: "/proof-bobcataiden.jpg", quote: "Blesssed. Thank you sm Professor Nouer." },
  { name: "aaron89", image: "/proof-aaron89.png", quote: "Time to take action and hit 15-20k a month. I'm done half assing this business." },
  { name: "dexmusic", image: "/proof-dexmusic.png", quote: "Very happy to be apart of this community. Thank you @Chico Nouer for always answering my questions!" },
];

const MODELS = [
  { name: "Sofia", earnings: "$11,200/month", followers: "187K followers", image: "/model1.jpg" },
  { name: "Valentina", earnings: "$8,750/month", followers: "124K followers", image: "/model2.jpg" },
  { name: "Aria", earnings: "$14,300/month", followers: "215K followers", image: "/model3.jpg" },
  { name: "Sadie", earnings: "$27,450/month", followers: "347K followers", image: "/model4.jpg" },
];

const FAQS = [
  { q: "Do I need technical experience?", a: "No. All you need is a phone or computer. Everything is explained from scratch." },
  { q: "What if I encounter problems during the course?", a: "You get access to our Discord community where Professor Nouer and other students help you every step of the way." },
  { q: "Is this suitable for beginners with no technical knowledge?", a: "Absolutely. The course was designed for complete beginners. No prior experience needed." },
  { q: "How long will it take to see results?", a: "Most students launch their first AI model within 5 days. Results vary based on effort and consistency." },
  { q: "What sets this course apart from others?", a: "This is not theory. It is the exact system Professor Nouer uses to generate $10K+ per month with real AI models." },
  { q: "Is the content available in different languages?", a: "The course is in English. However, the methods work globally regardless of your location." },
];

const HOTMART_URL = "https://pay.hotmart.com/L105642115S?checkoutMode=10&sck=organico";

export default function SalesPage() {
  const lockedRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const fixedBtnRef = useRef<HTMLDivElement>(null);
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
      body.style.maxHeight = "200px";
      icon.style.transform = "rotate(45deg)";
    }
  }

  useEffect(() => {
    // Load Vturb script
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/69e6749288365845bdfcd75c/v4/player.js";
    s.async = true;
    document.head.appendChild(s);

    function reveal() {
      if (lockedRef.current) {
        lockedRef.current.style.opacity = "1";
        lockedRef.current.style.maxHeight = "none";
        lockedRef.current.style.overflow = "visible";
      }
      if (scrollIndicatorRef.current) scrollIndicatorRef.current.style.opacity = "1";
      if (fixedBtnRef.current) fixedBtnRef.current.style.display = "block";
      localStorage.setItem(STORAGE_KEY, "true");
      setTimeout(() => window.scrollBy({ top: 120, behavior: "smooth" }), 600);
    }

    // First visit or return
    const hasVisited = localStorage.getItem(STORAGE_KEY);
    if (hasVisited) {
      reveal();
      return;
    }

    // Use Date.now() so browser timer throttling (background tabs) doesn't affect timing
    const deadline = Date.now() + REVEAL_TIME * 1000;
    const cd = setInterval(() => {
      if (Date.now() >= deadline) {
        clearInterval(cd);
        reveal();
      }
    }, 2000);

    return () => clearInterval(cd);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* BANNER */}
      <div
        className="relative overflow-hidden py-2 px-4 text-center text-xs font-bold text-white tracking-wide"
        style={{ background: "linear-gradient(90deg,#2d0a6b,#7c3aed,#2d0a6b)", backgroundSize: "200% 100%", animation: "bannerShift 4s linear infinite" }}
      >
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.3),transparent 70%)" }} />
        <p className="relative z-10">✦ Quit your 9-to-5 with my method — watch the free video below ✦</p>
      </div>

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      {/* VIDEO — sits right below the NAV (HERO headline block removed
          intentionally to match /ttk/sales and /fb/sales; mt-3 gives a
          small breathing gap below the NAV border without leaving empty
          space). */}
      <div className="mx-4 mt-3 mb-0 rounded-2xl overflow-hidden border border-purple-900/30" style={{ boxShadow: "0 0 40px rgba(124,58,237,0.12)" }}>
        <vturb-smartplayer
          id="vid-69e6749288365845bdfcd75c"
          style={{ display: "block", width: "100%" }}
        />
      </div>

      {/* SCROLL INDICATOR */}
      <div
        ref={scrollIndicatorRef}
        className="flex flex-col items-center gap-1 py-3 transition-opacity duration-1000"
        style={{ opacity: 0 }}
      >
        {[0, 0.2, 0.4].map((delay, i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-purple-700"
            style={{ animation: `scrollBounce 1.2s ease-in-out infinite ${delay}s` }}
          />
        ))}
        <span className="text-[8px] text-purple-900 tracking-widest uppercase font-semibold">scroll down</span>
      </div>

      {/* LOCKED SECTION */}
      <div
        ref={lockedRef}
        style={{ opacity: 0, maxHeight: 0, overflow: "hidden", transition: "opacity 1s ease" }}
      >

        {/* CTA BUTTON */}
        <div className="px-5 pb-5">
          <a
            href={HOTMART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-white text-base font-black py-4 rounded-2xl relative overflow-hidden smartplayer-click-event"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              animation: "btnGlow 3s ease-in-out infinite",
            }}
          >
            Get Instant Access — $29 →
          </a>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            <s>$297</s> · One-time payment · No subscriptions
          </p>
        </div>

        {/* STUDENTS */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
          <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">Students Winning</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
        </div>

        {/* TICKER */}
        <div className="relative w-full overflow-hidden py-1" style={{ maskImage: "linear-gradient(90deg, transparent, black 80px, black calc(100% - 80px), transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, black 80px, black calc(100% - 80px), transparent)" }}>
          <div
            className="flex gap-3"
            style={{
              width: "max-content",
              animation: "tickerScroll 25s linear infinite",
            }}
          >
            {[...STUDENTS, ...STUDENTS].map((s, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-48 rounded-2xl overflow-hidden border border-white/5 bg-[#0d0d0d]"
              >
                <img
                  src={s.image}
                  alt={s.name}
                  className="w-full object-cover object-top"
                  style={{ height: "180px" }}
                />
                <div className="px-3 py-2">
                  <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">@{s.name}</p>
                  <p className="text-[9px] text-gray-500 leading-relaxed italic">&ldquo;{s.quote}&rdquo;</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WHAT YOU GET */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
          <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">What You Get</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
        </div>

        <div className="px-5 mb-5 relative">
          {/* Neon rotating border */}
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
                ✦ Limited Time: $29
              </span>
              <div className="text-sm mb-1">⭐⭐⭐⭐⭐</div>
              <p className="text-sm font-bold text-gray-200">Here&apos;s what you get:</p>
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {[
                { icon: "📈", text: "How the market actually works (and how to start getting results fast)" },
                { icon: "📱", text: "How to create and warm up your social media accounts the right way" },
                { icon: "💳", text: "How to set up your Fanvue account and start getting paid" },
                { icon: "🤖", text: "How to create your AI model in less than 30 minutes" },
                { icon: "🖼️", text: "How to generate photos and videos of your model in under 2 minutes" },
                { icon: "👥", text: "How to gain hundreds of targeted followers every single day" },
                { icon: "💰", text: "How to monetize your AI model step by step" },
                { icon: "🚀", text: "How to scale your AI model and increase your income" },
              ].map((item) => (
                <div key={item.text} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0 bg-purple-900/20 border border-purple-700/25">
                    {item.icon}
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed pt-1">{item.text}</p>
                </div>
              ))}
            </div>

            <div className="text-center py-4 border-t border-purple-900/20 mb-4">
              <p className="text-[10px] text-gray-600 mb-1">Total Value: <s>$297</s></p>
              <p className="text-xl font-black text-white">Today: <span className="text-purple-400">$29</span></p>
            </div>

            <a
              href={HOTMART_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center text-white text-sm font-black py-4 rounded-xl relative overflow-hidden smartplayer-click-event"
              style={{
                background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                animation: "wygBtnPulse 2s ease-in-out infinite",
              }}
            >
              GET INSTANT ACCESS FOR $29 →
            </a>
            <p className="text-center text-[9px] text-gray-600 mt-2">🔒 Secure Payment · Instant Access · 100% Risk-Free</p>
          </div>
        </div>

        {/* AI MODELS */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
          <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">AI Model Examples</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 mb-5">
          {MODELS.map((model) => (
            <div key={model.name} className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-white/5">
              <img src={model.image} alt={model.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to top,rgba(0,0,0,0.92) 40%,transparent)" }} />
              <div className="absolute bottom-2 left-3 right-3">
                <p className="text-sm font-black text-white">{model.name}</p>
                <p className="text-[10px] text-purple-400 font-bold">{model.earnings}</p>
                <p className="text-[9px] text-gray-500">{model.followers}</p>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="flex items-center gap-2 px-5 pb-3">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
          <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">Got Questions?</span>
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
        <div className="px-5 pb-24 text-center">
          <p className="text-[9px] text-purple-900 uppercase tracking-widest mb-3">✦ Limited time offer ✦</p>
          <a
            href={HOTMART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-white text-base font-black py-4 rounded-2xl mb-3 relative overflow-hidden smartplayer-click-event"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              boxShadow: "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            Get Instant Access — $29 →
          </a>
          <p className="text-[9px] text-gray-700 leading-relaxed">
            Disclaimer: Results may vary. This is not a get-rich-quick scheme. Any earnings mentioned are not guaranteed and depend on individual effort, experience, and consistency.
          </p>
        </div>

      </div>

      {/* FIXED BOTTOM */}
      <div
        ref={fixedBtnRef}
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t border-white/5"
        style={{ background: "rgba(5,5,5,0.97)", backdropFilter: "blur(12px)", display: "none" }}
      >
        <a
          href={HOTMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between max-w-lg mx-auto rounded-xl px-5 py-3 text-white relative overflow-hidden smartplayer-click-event"
          style={{ background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)", boxShadow: "0 0 28px rgba(124,58,237,0.4)" }}
        >
          <span className="text-sm font-black">Get Instant Access</span>
          <span className="flex items-center gap-2">
            <span className="text-purple-200 line-through text-xs font-normal">$297</span>
            <span className="text-base font-black">$29 →</span>
          </span>
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
        @keyframes scrollBounce {
          0%,100%{opacity:0.2;transform:translateY(0)}
          50%{opacity:1;transform:translateY(4px)}
        }
        @keyframes rotateBorder {
          0%{background:conic-gradient(from 0deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          25%{background:conic-gradient(from 90deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          50%{background:conic-gradient(from 180deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          75%{background:conic-gradient(from 270deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
          100%{background:conic-gradient(from 360deg,#7c3aed,#a78bfa,#e9d5ff,#7c3aed)}
        }
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
