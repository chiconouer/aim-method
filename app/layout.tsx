import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIM Method — Build AI Models That Make Money",
  description:
    "The exact system to create, grow and monetize your AI influencer — no face, no followers, no experience needed.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No global font links — the only consumer of Bebas Neue is the
  // certificate SVG at /dashboard/certificate, so the font + its
  // preconnect hints are scoped to that page instead of being paid
  // on every route (/sales, /upsell-2, /downsell-2, /quizfunnel, all
  // dashboard pages, etc.). Body uses system fonts (globals.css).
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
