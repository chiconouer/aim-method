// =============================================================
// Up1 — 3x More Offer ($47 one-time upsell)
// -------------------------------------------------------------
// Public funnel page (route: /weekly). Visual cloned from
// /upsell-1 — same dark card, purple gradient CTA, animations.
//
// Angle: the customer just bought the main product. This upgrade
// is the leverage layer that 3x's their results without 3x'ing
// the work. Single $47 charge, not recurring.
//
// ⚠️ CHECKOUT NOT WIRED YET. The CHECKOUT_URL constant below is
// the SINGLE place to swap once Digistore product is created —
// drop the live checkout URL into the empty string, no other
// changes required.
// =============================================================

"use client";

// ───── HERE: paste the Digistore checkout URL when ready ─────
// Up1 / 3x More Offer — $47 one-time upsell.
// While empty, the button renders identically but won't navigate.
const CHECKOUT_URL = "";
// ─────────────────────────────────────────────────────────────

const BULLETS: string[] = [
  "The hidden multipliers that turn the same effort into 3x the output",
  "Plug-and-play frameworks built to stack on top of what you just bought",
  "Skip months of trial and error — go straight to what actually 3x's results",
  "Compounding leverage: small inputs, outsized returns",
  "Lifetime access — pay once, yours forever",
];

export default function WeeklyUpsellPage() {
  const hasCheckout = CHECKOUT_URL.length > 0;

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* NAV */}
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>

      <main className="flex-1 px-4 py-6 sm:py-10">
        <div
          className="max-w-2xl mx-auto rounded-2xl border border-purple-900/30 px-5 py-6 sm:px-7 sm:py-8"
          style={{
            background: "linear-gradient(160deg,#0d0a1a,#080810)",
            boxShadow: "0 0 40px rgba(124,58,237,0.12)",
          }}
        >
          {/* Eyebrow badge */}
          <div className="flex justify-center">
            <span
              className="inline-block px-3 py-1 rounded-full text-[10px] font-black tracking-[0.2em] uppercase text-white"
              style={{
                background: "linear-gradient(90deg,#7c3aed,#a78bfa)",
                paddingLeft: "calc(0.75rem + 0.2em)",
              }}
            >
              Upsell 1
            </span>
          </div>

          {/* Headline */}
          <h1 className="mt-4 text-center text-2xl sm:text-3xl font-black leading-tight text-white">
            Get <span className="text-purple-400">3x More Results</span> —
            Without Doing 3x The Work
          </h1>
          <p className="mt-3 text-center text-[13px] sm:text-sm text-gray-400 leading-relaxed">
            You just locked in the system. This upgrade gives you the
            multipliers — the leverage points that turn the same effort into
            triple the output.
          </p>

          {/* Video / VSL placeholder.
              Drop a YouTube embed URL into the iframe `src` when the VSL is
              ready. Keeping the exact frame shape as /upsell-1 so the look
              matches when the real video lands. */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black mt-5 border border-white/5">
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6"
              style={{
                background:
                  "radial-gradient(ellipse at center,#1a1233 0%,#080810 75%)",
              }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{
                  background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                  boxShadow: "0 0 30px rgba(124,58,237,0.55)",
                }}
              >
                ▶
              </div>
              <p className="text-purple-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                Pitch Video
              </p>
              <p className="text-gray-500 text-[11px]">
                VSL drops here — swap the placeholder for the real iframe
              </p>
            </div>
          </div>

          {/* Bullets */}
          <ul className="mt-6 flex flex-col gap-3">
            {BULLETS.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                  style={{
                    background:
                      "linear-gradient(135deg,#7c3aed,#a78bfa)",
                  }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                <span className="text-[13px] sm:text-sm text-gray-200 leading-relaxed">
                  {b}
                </span>
              </li>
            ))}
          </ul>

          {/* Price block */}
          <div
            className="mt-6 rounded-xl px-4 py-4 text-center border border-purple-900/40"
            style={{
              background: "linear-gradient(160deg,#0f0a1f,#0a0712)",
            }}
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-purple-300 font-black">
              Today
            </p>
            <p className="mt-1 text-3xl sm:text-4xl font-black text-white leading-none">
              $47
              <span className="text-base sm:text-lg text-gray-400 font-bold ml-1">
                one-time
              </span>
            </p>
            <p className="mt-2 text-[11px] text-gray-500">
              One-time payment · Instant lifetime access
            </p>
          </div>

          {/* CTA button — same gradient + glow animation as /upsell-1 */}
          <a
            href={hasCheckout ? CHECKOUT_URL : "#"}
            target={hasCheckout ? "_blank" : undefined}
            rel={hasCheckout ? "noopener noreferrer" : undefined}
            onClick={(e) => {
              if (!hasCheckout) e.preventDefault();
            }}
            aria-disabled={!hasCheckout}
            className="block w-full text-center text-white text-sm sm:text-base font-black py-4 sm:py-5 rounded-2xl relative overflow-hidden mt-5"
            style={{
              background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
              boxShadow:
                "0 8px 32px rgba(124,58,237,0.5), inset 0 1px 0 rgba(255,255,255,0.15)",
              animation: "btnGlow 3s ease-in-out infinite",
            }}
          >
            YES — TRIPLE MY RESULTS — $47
          </a>
          <p className="text-center text-[10px] text-gray-600 mt-2">
            One-time payment · Instant access · Yours forever
          </p>

          {!hasCheckout && (
            <p
              className="mt-4 text-center text-[10px] text-gray-700 uppercase tracking-[0.2em]"
              aria-hidden="true"
            >
              ⚙️ Checkout link pending — placeholder mode
            </p>
          )}
        </div>
      </main>

      <style>{`
        @keyframes btnGlow {
          0%,100%{box-shadow:0 8px 32px rgba(124,58,237,0.5),inset 0 1px 0 rgba(255,255,255,0.15)}
          50%{box-shadow:0 8px 48px rgba(124,58,237,0.8),inset 0 1px 0 rgba(255,255,255,0.15)}
        }
      `}</style>
    </div>
  );
}
