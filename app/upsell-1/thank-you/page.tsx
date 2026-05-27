import type { Metadata } from "next";

// SEO: keep this thank-you URL out of Google — it's a funnel endpoint,
// not a marketing landing page.
export const metadata: Metadata = {
  title: "Thank You — AIM Method",
  robots: { index: false, follow: false },
};

// Pure static content — pre-render at build, serve from CDN.
export const dynamic = "force-static";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-2xl">
        <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Thank you!{" "}
            <span className="neon-purple">🎉</span>
          </h1>
          <p className="text-gray-300 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-8">
            Your order is being processed.
          </p>

          <div className="max-w-xl mx-auto text-left flex flex-col gap-4 mb-8">
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              You&apos;ll receive an email shortly with everything you need. If you bought a custom AI model, check your inbox for a preferences form &mdash; we need a few details before we can generate your photos.
            </p>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              If you bought the AIM Method course, your login link is on its way.
            </p>
          </div>

          <p className="text-xs text-gray-500">
            Questions? Email{" "}
            <a
              href="mailto:aimodelmethods@gmail.com"
              className="text-purple-400 hover:underline"
            >
              aimodelmethods@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
