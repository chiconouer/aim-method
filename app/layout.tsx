import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AIM Method — AI Image Generation Course",
  description:
    "Learn to create realistic AI influencers for content creation, branding, and social media. Twenty structured video lessons covering diffusion models, prompt engineering, and video animation.",
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
