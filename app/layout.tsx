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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#0a0a0a] text-white">{children}</body>
    </html>
  );
}
