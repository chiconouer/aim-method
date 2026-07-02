// =============================================================
// Fb2SalesTemplate — the shared VSL page skeleton for João's paid
// fb2 funnel. Every /fb2 sales URL (the current /fb2/sales and any
// future retention-test variants like /fb2/sales-b, /fb2/sales-c)
// renders this same template with different props so bugfixes,
// layout tweaks, and copy updates propagate to every variant
// automatically — no drift.
//
// What lives here (fixed across variants):
//   - Nav, VSL container, scroll indicator, locked section with
//     reveal timer, 4 CTA buttons + fixed-bottom bar
//   - Students ticker, "What You Get" block, model gallery, FAQ,
//     final CTA + disclaimer
//   - Reveal timer (REVEAL_TIME = 510 s) — waits then unlocks the
//     lower half of the page
//   - Per-session checkout beacon dedupe (via storageKeyPrefix)
//   - <Fb2Tracking /> pixel mount, Vturb preload+dns-prefetch hints
//   - <style> block with the animation keyframes
//
// What varies per variant (props):
//   - vturbPlayerId + vturbPlayerScriptSrc — the retention split
//     lives here (each variant has its own player + analytics)
//   - vturbHlsManifestUrl — optional preload hint for the m3u8
//   - checkoutUrl — Hotmart URL with per-variant sck param
//   - storageKeyPrefix — isolates reveal timer + checkout dedupe
//     between variants (empty string for /fb2/sales preserves the
//     original keys)
//   - onFirstCheckoutClick — optional callback fired at most once
//     per session on first CTA click; the original /fb2/sales
//     passes the step-10 funnel beacon here, retention-test
//     variants omit it (they rely on Vturb + Hotmart sck +
//     Utmify UTM for attribution)
// =============================================================

"use client";
import { useEffect, useRef } from "react";
import { Fb2Tracking } from "@/components/Fb2Tracking";

// JSX type for Vturb's custom element (web component, no public type pkg).
// Declared here so every consumer of the template gets the augmentation
// without needing its own duplicate declaration.
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

export interface Fb2SalesTemplateProps {
  /** `id` attribute of the `<vturb-smartplayer>` element — the
   *  web component upgrades in place when its script loads. */
  vturbPlayerId: string;
  /** Full URL of the Vturb player.js script for this variant.
   *  Injected via `document.createElement("script")` on mount
   *  AND pre-hinted via `<link rel="preload">`. */
  vturbPlayerScriptSrc: string;
  /** Optional preload hint for the HLS manifest — Vturb gives you
   *  a per-player m3u8 URL. Skip to omit the preload (small first-
   *  frame regression, page still works). */
  vturbHlsManifestUrl?: string;
  /** Hotmart checkout URL (with sck query param already baked in).
   *  Empty string flips every CTA to a dead `href="#"` with
   *  preventDefault — safe for placeholder deployments. */
  checkoutUrl: string;
  /** Appended to the reveal-timer `localStorage` key and the
   *  checkout-recorded `sessionStorage` key so each variant is
   *  isolated. Pass `""` on /fb2/sales to preserve the original
   *  keys (`aim_sales_visited`, `aim_checkout_recorded`). Pass
   *  `"_b"`, `"_c"`, etc. for retention-test variants. */
  storageKeyPrefix: string;
  /** Optional. Called at most once per browser tab session on the
   *  first CTA click (per-session dedupe is scoped by
   *  `storageKeyPrefix`). Original /fb2/sales passes the step-10
   *  funnel beacon here; retention-test variants can omit to skip
   *  quiz_funnel_events logging entirely. */
  onFirstCheckoutClick?: () => void;
}

export function Fb2SalesTemplate({
  vturbPlayerId,
  vturbPlayerScriptSrc,
  vturbHlsManifestUrl,
  checkoutUrl,
  storageKeyPrefix,
  onFirstCheckoutClick,
}: Fb2SalesTemplateProps) {
  const lockedRef = useRef<HTMLDivElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);
  const fixedBtnRef = useRef<HTMLDivElement>(null);
  const openFaq = useRef<number | null>(null);
  // Module-level `checkoutRecorded` boolean in the pre-refactor page
  // survived the whole page session. useRef gives us the same
  // per-component-instance semantics without polluting module scope.
  const checkoutRecordedRef = useRef(false);

  const hasCheckout = checkoutUrl.length > 0;
  const revealStorageKey = `aim_sales_visited${storageKeyPrefix}`;
  const checkoutRecordedKey = `aim_checkout_recorded${storageKeyPrefix}`;

  // =============================================================
  // Per-session dedupe for the "reached checkout" event. A single
  // visitor can hit any of the 4 buy buttons multiple times (and
  // Digistore's Apple Pay flow sometimes opens an extra tab that
  // re-fires the click), which would otherwise inflate the
  // dashboard's checkout count.
  //
  // Two-layer guard:
  //   1. useRef flag — fast path, survives within a single
  //      component lifetime.
  //   2. sessionStorage — survives page reload within the same
  //      browser tab session. Cleared when the tab is closed, so
  //      a returning visitor in a new tab session DOES get counted
  //      again (matches the "per-visitor / per-visit" semantics).
  // =============================================================
  function isCheckoutRecorded(): boolean {
    if (checkoutRecordedRef.current) return true;
    try {
      if (
        typeof window !== "undefined" &&
        sessionStorage.getItem(checkoutRecordedKey) === "1"
      ) {
        checkoutRecordedRef.current = true;
        return true;
      }
    } catch {
      // sessionStorage blocked (private mode / hostile extension).
      // useRef alone provides dedupe for the rest of this
      // component lifetime; lost on remount, accepted edge case.
    }
    return false;
  }

  function markCheckoutRecorded(): void {
    checkoutRecordedRef.current = true;
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(checkoutRecordedKey, "1");
      }
    } catch {
      // sessionStorage blocked — see comment in isCheckoutRecorded.
    }
  }

  // Shared onClick for all 4 buy buttons. Defensive: if
  // checkoutUrl is empty, preventDefault stops the dead
  // navigation. The redirect ALWAYS proceeds otherwise — only
  // the analytics callback is deduped. onFirstCheckoutClick is
  // sync (sendBeacon inside the caller is fire-and-forget) and
  // never holds up the redirect.
  function handleCheckoutClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!hasCheckout) {
      e.preventDefault();
      return;
    }
    if (!isCheckoutRecorded()) {
      markCheckoutRecorded();
      onFirstCheckoutClick?.();
    }
  }

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
    // Load Vturb script for the specific player of this variant.
    // The preload hint below the root <div> primes the browser to
    // fetch this URL before useEffect even runs, so by the time
    // we inject the <script> tag here the bytes are usually
    // already cached.
    const s = document.createElement("script");
    s.src = vturbPlayerScriptSrc;
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
      localStorage.setItem(revealStorageKey, "true");
      setTimeout(() => window.scrollBy({ top: 120, behavior: "smooth" }), 600);
    }

    // First visit or return
    const hasVisited = localStorage.getItem(revealStorageKey);
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
  }, [vturbPlayerScriptSrc, revealStorageKey]);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <Fb2Tracking />

      {/* Performance preloads + DNS prefetch — Next.js App Router /
          React auto-hoists these <link> elements into the document
          <head> so the browser can start fetching the Vturb player
          assets in parallel with the rest of the page parse. Same
          domains the player ends up calling anyway; this just kicks
          the requests off earlier. */}
      <link
        rel="preload"
        as="script"
        href={vturbPlayerScriptSrc}
      />
      <link
        rel="preload"
        as="script"
        href="https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js"
      />
      {vturbHlsManifestUrl && (
        <link
          rel="preload"
          as="fetch"
          href={vturbHlsManifestUrl}
        />
      )}
      <link rel="dns-prefetch" href="https://cdn.converteai.net" />
      <link rel="dns-prefetch" href="https://scripts.converteai.net" />
      <link rel="dns-prefetch" href="https://images.converteai.net" />
      <link rel="dns-prefetch" href="https://license.vturb.com" />

      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      {/* VIDEO — sits right below the NAV (no HERO headline block on the
          FB/paid variants; mt-3 gives a small breathing gap below the NAV
          border without leaving empty space). Player caps at 400px wide
          and centers via margin auto — the wrapper still shows the purple
          glow border for any leftover horizontal space on wider screens. */}
      <div className="mx-4 mt-3 mb-0 rounded-2xl overflow-hidden border border-purple-900/30" style={{ boxShadow: "0 0 40px rgba(124,58,237,0.12)" }}>
        <vturb-smartplayer
          id={vturbPlayerId}
          style={{ display: "block", margin: "0 auto", width: "100%", maxWidth: "400px" }}
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
            href={hasCheckout ? checkoutUrl : "#"}
            target={hasCheckout ? "_blank" : undefined}
            rel={hasCheckout ? "noopener noreferrer" : undefined}
            onClick={handleCheckoutClick}
            aria-disabled={!hasCheckout}
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
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
              href={hasCheckout ? checkoutUrl : "#"}
              target={hasCheckout ? "_blank" : undefined}
              rel={hasCheckout ? "noopener noreferrer" : undefined}
              onClick={handleCheckoutClick}
              aria-disabled={!hasCheckout}
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
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
            href={hasCheckout ? checkoutUrl : "#"}
            target={hasCheckout ? "_blank" : undefined}
            rel={hasCheckout ? "noopener noreferrer" : undefined}
            onClick={handleCheckoutClick}
            aria-disabled={!hasCheckout}
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
          href={hasCheckout ? checkoutUrl : "#"}
          target={hasCheckout ? "_blank" : undefined}
          rel={hasCheckout ? "noopener noreferrer" : undefined}
          onClick={handleCheckoutClick}
          aria-disabled={!hasCheckout}
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
