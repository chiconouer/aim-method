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

// Heavy local PNGs (5+ MB total) swapped for compressed JPEGs in the
// QUIZ MEDIA Supabase bucket (the same -2 variants the quiz step-7
// carousel already uses, so the browser cache may even hit). The
// bobcataiden tile stays on the local /proof-bobcataiden.jpg — it's
// already 172 KB and is the only original asset under budget.
const STUDENTS = [
  { name: "johnultra", image: "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/step7-2.jpg", quote: "Without you mate nothing would be possible. Thank you @Chico Nouer for always checking on me." },
  { name: "kylefiles", image: "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/93F3E47E-AF60-4CC7-BC7A-D4740F81D5DA-2.jpg", quote: "This is my highest total in a single day yet! Usually Sundays are a bit slower." },
  { name: "pedrosmbk", image: "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0997-2.jpg", quote: "God bless Johnny, hopefully he will comeback for more later." },
  { name: "bobcataiden", image: "/proof-bobcataiden.jpg", quote: "Blesssed. Thank you sm Professor Nouer." },
  { name: "aaron89", image: "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_0999-2.jpg", quote: "Time to take action and hit 15-20k a month. I'm done half assing this business." },
  { name: "dexmusic", image: "https://vrjcgvcmycisfacgyasr.supabase.co/storage/v1/object/public/QUIZ%20MEDIA/IMG_1001-2.jpg", quote: "Very happy to be apart of this community. Thank you @Chico Nouer for always answering my questions!" },
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
    // Vturb perf marker — records the page-load timestamp so the
    // player can later compute its own load-time metric against it.
    // Mateus's snippet runs this BEFORE the loader script.
    const w = window as unknown as { _plt?: number };
    w._plt =
      w._plt ||
      (performance.timeOrigin
        ? performance.timeOrigin + performance.now()
        : Date.now());

    // Load the ORGANIC-only Vturb player (id 6a70e8d52082bab248309470).
    // Separate from the TikTok/FB players in /ttk/sales and /fb/sales
    // so this funnel gets its own Vturb analytics, not shared.
    const s = document.createElement("script");
    s.src = "https://scripts.converteai.net/4d9a9882-3537-424b-9e92-d5ef4d59d6a7/players/6a70e8d52082bab248309470/v4/player.js";
    s.async = true;
    document.head.appendChild(s);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">

      {/* Vturb preload + DNS prefetch hints — rendered into the SSR'd
          HTML so the browser starts fetching the player chunks and
          warming the converteai DNS while the page is still parsing,
          before useEffect even runs. Same id as the player loaded in
          useEffect below (organic-only: 6a70e8d52082bab248309470). */}
      <link
        rel="preload"
        href="https://scripts.converteai.net/4d9a9882-3537-424b-9e92-d5ef4d59d6a7/players/6a70e8d52082bab248309470/v4/player.js"
        as="script"
      />
      <link
        rel="preload"
        href="https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js"
        as="script"
      />
      <link
        rel="preload"
        href="https://cdn.converteai.net/4d9a9882-3537-424b-9e92-d5ef4d59d6a7/6a70e86668922a32968009e7/main.m3u8"
        as="fetch"
      />
      <link rel="dns-prefetch" href="https://cdn.converteai.net" />
      <link rel="dns-prefetch" href="https://scripts.converteai.net" />
      {/* preconnect (not just dns-prefetch) — does DNS + TLS handshake
          ahead of the actual request, saving ~50–150 ms on the first
          response from each host. Used here because both are hit early
          in the player's bootstrap (thumbnails + license check). The
          two hosts above already have implicit preconnects via their
          <link rel="preload"> tags so they don't need this. */}
      <link rel="preconnect" href="https://images.converteai.net" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://license.vturb.com" crossOrigin="anonymous" />

      {/* BANNER — organic /sales only (paid /ttk/sales + /fb/sales stay
          headerless). Originally animated background-position via the
          `bannerShift` keyframe; restored 2026-06-25 without the loop
          because animating background-position forces a full repaint
          per frame on mobile WKWebView. The static 3-stop gradient
          gives the same purple-shift look at frame 0. */}
      <div
        className="relative overflow-hidden py-2 px-4 text-center text-xs font-bold text-white tracking-wide"
        style={{ background: "linear-gradient(90deg,#2d0a6b,#7c3aed,#2d0a6b)" }}
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

      {/* HERO — organic /sales only (paid funnels stay headerless to keep
          the visitor inside the quiz-warmed pre-VSL frame). Restored
          2026-06-25 from PR ab883e3. The "$10,000+/Month" gradient used
          to animate background-position via `shimmer` infinite; kept the
          gradient, dropped the animation to avoid per-frame repaint on
          mobile WKWebView. Static frame-0 looks identical. */}
      <div className="text-center px-5 pt-5 pb-3">
        <span className="inline-block mb-2 px-3 py-1 rounded-full text-[9px] font-bold tracking-widest uppercase bg-purple-900/10 border border-purple-700/20 text-purple-400">
          Free Video Reveals
        </span>
        <h1 className="text-2xl font-black text-white leading-tight tracking-tight mb-2">
          How I Create AI Models<br />
          Generating{" "}
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: "linear-gradient(135deg,#a78bfa,#e9d5ff,#a78bfa)" }}
          >
            $10,000+/Month
          </span>
        </h1>
        <p className="text-[11px] text-gray-500 leading-relaxed">No face. No followers. No experience needed.</p>
      </div>

      {/* VIDEO — HERO above provides spacing, so no mt-3 needed here. */}
      <div className="mx-4 mb-0 rounded-2xl overflow-hidden border border-purple-900/30" style={{ boxShadow: "0 0 40px rgba(124,58,237,0.12)" }}>
        <vturb-smartplayer
          id="vid-6a70e8d52082bab248309470"
          style={{
            display: "block",
            margin: "0 auto",
            width: "100%",
            maxWidth: "400px",
          }}
        />
      </div>

      {/* PROMO PRICE — VSL audio quotes $29 as the regular price; the
          relaunch drops to $9.90 and anchors against that $29. Rendered
          right below the video so the offer is impossible to miss even
          if the visitor never watches the VSL. */}
      <div className="mx-4 mt-5">
        <div
          className="relative overflow-hidden rounded-2xl p-5 text-center"
          style={{
            background: "linear-gradient(135deg,#2d0a6b,#7c3aed,#2d0a6b)",
            boxShadow: "0 8px 40px rgba(124,58,237,0.55)",
          }}
        >
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at center,rgba(167,139,250,0.35),transparent 70%)" }} />
          <div className="relative z-10">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase text-purple-100 mb-3">🔥 Limited Time Promo</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl font-bold text-purple-200 line-through opacity-70">$29</span>
              <span className="text-2xl text-white/60">→</span>
              <span
                className="text-5xl font-black text-white tracking-tight"
                style={{ textShadow: "0 2px 20px rgba(255,255,255,0.35)" }}
              >
                $9.90
              </span>
            </div>
            <p className="text-[11px] text-purple-100/80 mt-3">One-time payment · Instant access · No subscriptions</p>
          </div>
        </div>

        <a
          href={HOTMART_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center text-white text-base font-black py-4 rounded-2xl mt-3 relative overflow-hidden smartplayer-click-event"
          style={{
            background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
            boxShadow: "0 8px 40px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          Get Instant Access — Only $9.90 →
        </a>
      </div>

      {/* STUDENTS */}
      <div className="flex items-center gap-2 px-5 pt-8 pb-3">
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
                loading="lazy"
                decoding="async"
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
      <div className="flex items-center gap-2 px-5 pt-8 pb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent to-purple-900/50" />
        <span className="text-[9px] font-black tracking-widest uppercase text-purple-700">What You Get</span>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent to-purple-900/50" />
      </div>

      <div className="px-5 mb-5 relative">
        {/* Neon static border — was infinite conic-gradient animation;
            removed because conic-gradient repaints can't go to the GPU
            on WebKit and the per-frame cost on mobile dwarfs the visual
            gain. Static gradient keeps the same "neon ring" feel. */}
        <div
          className="absolute inset-0 rounded-[20px]"
          style={{
            padding: "2px",
            background: "conic-gradient(from 0deg, #7c3aed, #a78bfa, #e9d5ff, #7c3aed)",
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
          }}
        />
        <div
          className="relative rounded-[18px] p-5"
          style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)" }}
        >
          <div className="text-center mb-4">
            <span className="inline-block px-4 py-1 rounded-full text-[9px] font-black tracking-widest uppercase text-white mb-3" style={{ background: "linear-gradient(90deg,#7c3aed,#a78bfa)" }}>
              ✦ Limited Time: $9.90
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
            <p className="text-[10px] text-gray-600 mb-1">Regular Price: <s>$29</s></p>
            <p className="text-xl font-black text-white">Today: <span className="text-purple-400">$9.90</span></p>
          </div>

          <a
            href={HOTMART_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-white text-sm font-black py-4 rounded-xl relative overflow-hidden smartplayer-click-event"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              boxShadow: "0 8px 40px rgba(124,58,237,0.65), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            GET INSTANT ACCESS FOR $9.90 →
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
            <img src={model.image} alt={model.name} loading="lazy" decoding="async" className="w-full h-full object-cover" />
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
          Get Instant Access — Only $9.90 →
        </a>
        <p className="text-[9px] text-gray-700 leading-relaxed">
          Disclaimer: Results may vary. This is not a get-rich-quick scheme. Any earnings mentioned are not guaranteed and depend on individual effort, experience, and consistency.
        </p>
      </div>

      {/* FIXED BOTTOM */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 px-4 py-3 border-t border-white/5"
        style={{ background: "rgba(5,5,5,0.97)", backdropFilter: "blur(12px)" }}
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
            <span className="text-purple-200 line-through text-xs font-normal">$29</span>
            <span className="text-base font-black">$9.90 →</span>
          </span>
        </a>
      </div>

      <style>{`
        @keyframes tickerScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
