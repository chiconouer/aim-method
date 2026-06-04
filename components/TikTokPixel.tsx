"use client";

import Script from "next/script";

const TIKTOK_PIXEL_ID = "6a21ba581f04a3dea3835cb8";

/**
 * TikTok pixel via Utmify. Mount on paid-traffic pages ONLY —
 * NEVER on organic /sales, /upsell-*, /downsell-* pages.
 *
 * Two Script tags: an inline config that sets window.tikTokPixelId,
 * and the external Utmify loader. afterInteractive preserves DOM
 * order so the pixel ID is set before the external script reads it.
 */
export function TikTokPixel() {
  return (
    <>
      <Script id="tiktok-pixel-config" strategy="afterInteractive">
        {`window.tikTokPixelId = "${TIKTOK_PIXEL_ID}";`}
      </Script>
      <Script
        src="https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js"
        strategy="afterInteractive"
      />
    </>
  );
}
