export default function UpsellPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-16 sm:py-20">
      <div className="max-w-[1000px] mx-auto flex flex-col items-center text-center">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight mb-4">
          Almost there — your access is being processed
        </h1>

        <p className="text-base sm:text-xl text-gray-300 leading-relaxed mb-10 max-w-2xl">
          While we set up your account, watch this important first lesson below
        </p>

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
