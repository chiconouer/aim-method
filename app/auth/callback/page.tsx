"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const email = searchParams.get("email");
    const session = searchParams.get("session");

    if (!email || !session) {
      router.replace("/auth/sign-in?error=invalid");
      return;
    }

    try {
      // Decode the base64 session to get {email, name}
      const user = JSON.parse(atob(session));
      // Write full user object so getSession() can parse it correctly
      localStorage.setItem("aim_session", JSON.stringify(user));
    } catch {
      // Fallback: store just the email — getSession() handles this case
      localStorage.setItem("aim_session", email);
    }

    router.replace("/dashboard");
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400 text-sm">Signing you in…</p>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
