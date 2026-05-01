"use client";

import { useState, FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function SignInContent() {
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [error, setError] = useState(
    urlError === "expired"
      ? "This link has expired. Please request a new one."
      : urlError === "invalid"
      ? "This link is invalid. Please request a new one."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-5">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-extrabold">
              <span className="text-white">AIM</span>{" "}
              <span className="text-purple-400">Method</span>
            </span>
          </Link>
          <p className="text-gray-500 text-sm mt-2">
            Sign in to access your courses
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📬</div>
              <h1 className="text-xl font-bold text-white mb-3">Check your email!</h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                We sent a login link to{" "}
                <span className="text-purple-400 font-medium">{email}</span>.
                Click it to access your course.
              </p>
              <p className="text-gray-600 text-xs mt-4">
                Link expires in 15 minutes. Check your spam folder if you don&apos;t see it.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-white mb-6">Welcome back</h1>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/60 focus:bg-white/8 transition-all"
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="purple-btn text-white font-bold py-3 rounded-xl mt-2 disabled:opacity-60"
                >
                  {loading ? "Sending…" : "Send Magic Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          <Link href="/" className="text-gray-500 hover:text-purple-400 transition-colors">
            ← Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}
