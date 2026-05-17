export default function UpsellPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-16 sm:py-20">
      <div className="max-w-2xl mx-auto text-center">

        {/* HEADLINE */}
        <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
          You Were Customer #500 —{" "}
          <span className="neon-purple">Now I&apos;m Going to Build Your AI Model For You</span>
        </h1>

        {/* SUBHEADLINE */}
        <p className="text-lg text-neutral-400 mt-4">
          A one-time, done-for-you service where my team and I create a fully custom AI model for you — built exactly the way you want it.
        </p>

        {/* BODY */}
        <div className="max-w-xl mx-auto text-left flex flex-col gap-5 mt-10">
          <p className="text-base text-neutral-200 leading-relaxed">
            You just took a serious step by joining the AIM Method. But here&apos;s what most people don&apos;t realize: the quality of your AI model&apos;s foundation determines everything that follows.
          </p>

          <p className="text-base text-neutral-200 leading-relaxed">
            Creating your AI model is like building the walls of a house. If the foundation isn&apos;t solid, every image and video you generate from it will fall short — no matter how good your prompts get.
          </p>

          <p className="text-base text-neutral-200 leading-relaxed">
            That&apos;s why some of our members pay up to $500 for my team and I to create their AI model from scratch — fully customized, ready to use, and built to produce <strong>consistent professional results</strong>.
          </p>

          <p className="text-base text-neutral-200 leading-relaxed">
            Here&apos;s how it works: we send a quick form directly to your email where you describe exactly how you want your AI model to look. Then I build her based on what you described — plus 10 ready-to-use images and 5 ready-to-use videos.
          </p>

          <p className="text-base text-neutral-200 leading-relaxed">
            Because you&apos;re <span className="neon-purple font-bold">customer #500</span>, you just unlocked a special $300 discount — available only on this page, right now.
          </p>
        </div>

        {/* CTA BUTTON */}
        <a
          href="https://go.centerpag.com/PPU38CQC3BD?upsell=true"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-8 bg-green-500 hover:bg-green-600 transition-colors text-white font-bold text-xl px-12 py-5 rounded-xl shadow-lg shadow-green-500/20"
        >
          Access Now! 🚀
        </a>

        {/* SECURE PAYMENT LABEL */}
        <p className="text-xs text-neutral-500 mt-3">
          🔒 Secure payment · Instant access
        </p>

        {/* OFFER BOX */}
        <div className="mt-6 max-w-md mx-auto bg-[#111] border border-green-500/20 rounded-2xl px-6 py-6">
          <p className="text-sm text-neutral-400">Exclusive special offer for you:</p>
          <p className="mt-2">
            <span className="text-5xl font-bold text-green-400">$197</span>
            <span className="text-2xl text-neutral-500 line-through ml-2">$500</span>
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            One-time payment · Instant access · Lifetime model
          </p>
        </div>

        {/* NO THANKS LINK */}
        <div className="mt-8">
          <a
            href="https://course.aimodelmethods.com"
            target="_self"
            className="text-sm text-neutral-500 hover:underline hover:text-neutral-300 transition-colors"
          >
            No thanks
          </a>
        </div>

      </div>
    </div>
  );
}
