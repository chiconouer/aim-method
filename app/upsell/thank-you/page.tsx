import Link from "next/link";

export default function UpsellThankYouPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-5 py-16 sm:py-20 flex items-center justify-center">
      <div className="max-w-[700px] w-full flex flex-col items-center text-center">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight mb-5">
          Thank you!
        </h1>

        <p className="text-base sm:text-xl text-gray-300 leading-relaxed mb-10 max-w-xl">
          Your purchase is complete. Check your email for access to the course.
        </p>

        <Link
          href="/auth/sign-in"
          className="inline-block bg-white text-black hover:bg-gray-200 transition-colors font-bold text-base sm:text-lg px-10 py-4 rounded-xl"
        >
          Go to Course Login
        </Link>

        <p className="text-xs sm:text-sm text-gray-500 mt-12 max-w-md leading-relaxed">
          Your course access has been sent to your email. Please check your inbox and spam folder.
        </p>
      </div>
    </div>
  );
}
