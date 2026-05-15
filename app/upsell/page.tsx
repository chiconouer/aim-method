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

        {/* TODO: Replace with VTurb embed when video is ready */}
        <div className="w-full max-w-[1000px] aspect-video bg-[#111] border border-white/10 rounded-2xl flex items-center justify-center mb-12">
          <span className="text-gray-500 text-sm sm:text-base font-medium tracking-wide uppercase">
            VIDEO PLACEHOLDER — VTurb embed will go here
          </span>
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
