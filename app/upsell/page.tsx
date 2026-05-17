"use client";

import Link from "next/link";

export default function UpsellPage() {
  async function handleOneClickUpsell() {
    console.log("TODO: implement Stripe 1-click upsell");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-16 sm:py-20">
      <div className="max-w-[1000px] mx-auto flex flex-col items-center text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Almost there — your access is being processed...
        </h1>

        <p className="neon-purple text-base sm:text-xl leading-relaxed max-w-2xl font-medium">
          While we set up your account, watch this important first lesson below
        </p>

        <div className="upsell-arrow-bounce mt-8 mb-8" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a855f7"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>

        {/* SALES LETTER (replaces the previous VSL placeholder) */}
        <div className="w-full max-w-[1000px] text-left mb-12 flex flex-col gap-5">
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            You were our customer #500 — and you just unlocked a gift worth over $500:
          </p>

          <p className="neon-purple text-2xl sm:text-3xl font-bold text-center leading-tight my-2">
            I&apos;M GOING TO CREATE YOUR AI MODEL FOR YOU!!!
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            That&apos;s right, you read that correctly. This page only appears for every 100th customer...
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            And if you&apos;re reading this right now, you&apos;re one of the lucky ones to receive this gift — so pay close attention, because I&apos;m about to explain exactly how this works.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Inside the AIM Method community, my team and I help select members by creating their AI models for them.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Because creating the base of your AI model is the most important part of the entire process.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Without a solid foundation, everything else falls apart.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Creating your AI model is like building the walls of a house. If the walls aren&apos;t built right, nothing else holds up.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            In other words, if your AI isn&apos;t created the right way, every image and video you make from it won&apos;t look good.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            And if your content doesn&apos;t look good, you don&apos;t go viral, you don&apos;t grow followers, you don&apos;t sell anything, and you don&apos;t make money.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            That&apos;s why some of our members pay up to $500 for my team and I to create their AI model.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Take a look at some examples:
          </p>

          {/* TODO: Replace with real example images */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 my-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="aspect-square bg-neutral-900 border border-white/10 rounded-lg flex items-center justify-center"
              >
                <span className="text-gray-500 text-xs font-medium tracking-wide uppercase">
                  Image {n}
                </span>
              </div>
            ))}
          </div>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Here&apos;s how it works: we send a quick form directly to your email, where you&apos;ll tell me exactly how you want your AI model to look. Then I&apos;ll build her based on exactly what you described.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            And because you&apos;re customer #500, you get a special offer right here, right now. If you close or refresh this page, you&apos;ll never see this offer again.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            You just unlocked a <span className="neon-purple font-bold">$300 discount</span> to have me build your AI model.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            So instead of $500, you only invest <span className="neon-purple font-bold">$200</span> to have me create your AI model + 10 ready-to-use images + 5 ready-to-use videos.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Once your AI model is ready, you&apos;ll be able to generate unlimited images effortlessly, because the foundation is already done.
          </p>

          {/* CTA BUTTONS — group 1 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-6">
            <button
              onClick={handleOneClickUpsell}
              className="w-full sm:w-auto purple-btn text-white text-lg font-bold px-10 py-4 rounded-xl"
            >
              I WANT IT — $200
            </button>
            <Link
              href="/upsell/downsell"
              className="text-gray-500 text-sm underline-offset-4 hover:underline hover:text-gray-300 transition-colors"
            >
              No thanks
            </Link>
          </div>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            And remember: this offer only exists right here, right now.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            If you leave this page, close this tab, or hit back — you lose this opportunity forever.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            So if you really want to take advantage of this special deal and be one of the lucky few who get ahead of everyone else...
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Click the button below right now to lock in your access.
          </p>

          {/* CTA BUTTONS — group 2 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 my-6">
            <button
              onClick={handleOneClickUpsell}
              className="w-full sm:w-auto purple-btn text-white text-lg font-bold px-10 py-4 rounded-xl"
            >
              I WANT IT — $200
            </button>
            <Link
              href="/upsell/downsell"
              className="text-gray-500 text-sm underline-offset-4 hover:underline hover:text-gray-300 transition-colors"
            >
              No thanks
            </Link>
          </div>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            From this point on, you only have one choice.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Either you create your AI model on your own and risk getting mediocre results until you figure it out...
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Or you grab this one-time opportunity that will accelerate your results massively, and let me handle everything for you.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            The choice is yours. And you can decide right now.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Because the moment you leave this page, this opportunity won&apos;t come back.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            So click the button below now, lock in your access... and I&apos;ll see you inside.
          </p>

          {/* CTA BUTTON — final */}
          <div className="flex justify-center my-6">
            <button
              onClick={handleOneClickUpsell}
              className="w-full sm:w-auto purple-btn text-white text-xl font-extrabold px-12 py-5 rounded-xl"
            >
              I WANT IT — $200
            </button>
          </div>
        </div>

        {/* TODO: Paste Hotmart widget code here when Sales Funnel is configured */}
        <div
          id="hotmart-upsell-widget"
          className="w-full max-w-[1000px] min-h-[200px] bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center mb-12"
        >
          <span className="text-gray-500 text-sm font-medium tracking-wide uppercase">
            Hotmart Upsell Widget
          </span>
        </div>

        <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
          Your course access has been sent to your email. Please check your inbox and spam folder.
        </p>
      </div>
    </div>
  );
}
