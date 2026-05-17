export default function UpsellPage() {
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

        {/* SALES LETTER */}
        <div className="w-full max-w-2xl mx-auto text-center mb-12 flex flex-col gap-5">
          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            You were our customer #500 — and you just unlocked a gift worth over $500:
          </p>

          <p className="neon-purple text-2xl sm:text-3xl font-bold leading-tight my-2">
            I&apos;M GOING TO CREATE YOUR AI MODEL FOR YOU!!!
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            That&apos;s right. This page only appears for every 100th customer — and you&apos;re one of the lucky ones.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Inside the AIM Method community, my team and I help select members by creating their AI model for them. The foundation of your AI model is the most important part of the entire process — without it, every image and video you make won&apos;t look good, you won&apos;t grow, and you won&apos;t make money.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            That&apos;s why some of our members pay up to $500 for my team to build their model from scratch.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Here&apos;s how it works: we send a quick form to your email where you describe exactly how you want your AI model to look — and I build her based on what you described.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Because you&apos;re customer #500, you get a <span className="neon-purple font-bold">$300 discount</span>, right here, right now. If you close or refresh this page, you&apos;ll never see this offer again.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            So instead of $500, you only invest <span className="neon-purple font-bold">$197</span> to have me create your AI model + 10 ready-to-use images + 5 ready-to-use videos.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Once your model is ready, you&apos;ll generate unlimited content effortlessly — because the foundation is already done.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            This is a one-time opportunity. The moment you leave this page, it&apos;s gone.
          </p>

          <p className="text-base sm:text-lg text-gray-300 leading-relaxed">
            Click below to lock in your access.
          </p>

          {/* FINAL CTA — single group */}
          <div className="flex flex-col items-center gap-3 mt-6">
            <a
              href="https://go.centerpag.com/PPU38CQC3BD?upsell=true"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto purple-btn text-white text-xl font-extrabold px-12 py-5 rounded-xl"
            >
              Access Now!
            </a>
            <p className="neon-purple text-3xl font-bold">$197</p>
            <a
              href="https://course.aimodelmethods.com"
              target="_self"
              className="text-sm text-neutral-500 hover:underline hover:text-neutral-300 transition-colors mt-2"
            >
              No thanks
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
