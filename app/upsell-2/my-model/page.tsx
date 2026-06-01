import type { Metadata } from "next";

// SEO: keep this placeholder out of Google. When we promote it to a real
// dynamic gallery (/upsell-2/my-model/[order_id]) it will still be noindex.
export const metadata: Metadata = {
  title: "Your AI Model Dashboard | AIM Method",
  robots: { index: false, follow: false },
};

const STEPS = [
  {
    n: 1,
    title: "Check your email",
    desc:
      "We've sent you a private link to fill out your AI model preferences form. Check your inbox (and spam folder).",
  },
  {
    n: 2,
    title: "Submit your preferences",
    desc:
      "Tell us your model's age, ethnicity, hair, eyes, body type, and aesthetic. Takes 2 minutes.",
  },
  {
    n: 3,
    title: "Receive your gallery",
    desc:
      "Within 24–48 hours, we'll deliver 11 high-quality 4K images to this dashboard. You'll get an email when they're ready.",
  },
];

export default function MyModelPlaceholderPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-5 py-10 sm:py-16">
      <div className="w-full max-w-3xl">
        {/* Main card */}
        <div className="glass-card rounded-2xl p-6 sm:p-10 text-center">

          {/* Spinner */}
          <div className="flex justify-center mb-6">
            <svg
              className="animate-spin w-10 h-10 sm:w-12 sm:h-12 text-purple-400"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeOpacity="0.25"
                strokeWidth="3"
              />
              <path
                d="M22 12a10 10 0 0 1-10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3 leading-tight">
            Your AI Model{" "}
            <span className="neon-purple">Dashboard</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-xl mx-auto mb-10">
            Welcome to your private dashboard. Here&apos;s where your custom AI model images will appear once they&apos;re ready.
          </p>

          {/* 3-step process */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
            {STEPS.map((s) => (
              <div
                key={s.n}
                className="rounded-xl border border-purple-900/30 bg-purple-900/10 p-5 flex flex-col"
              >
                <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 font-bold text-base mb-3">
                  {s.n}
                </div>
                <h3 className="text-white font-bold text-base mb-1.5">
                  {s.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Info box */}
          <div className="border border-purple-700/40 bg-purple-900/10 rounded-xl px-4 py-3 text-[13px] sm:text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto mb-6">
            ⚠️ This is your generic dashboard view. Your personal gallery with your 11 custom images will be accessible at a private link sent to you by email.
          </div>

          {/* Support contact */}
          <p className="text-xs text-gray-500">
            Questions? Email us at{" "}
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
