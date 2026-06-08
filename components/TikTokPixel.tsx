"use client";

import Script from "next/script";

const TIKTOK_PIXEL_ID = "6a21ba581f04a3dea3835cb8";

/**
 * Utmify tracking suite for paid-traffic pages. Mount on /ads/* pages
 * ONLY — NEVER on organic /sales, /upsell-*, /downsell-*, /dashboard,
 * /auth, /start, /apply, /fanvue, etc.
 *
 * Loads three Script tags in DOM order under afterInteractive:
 *   1. Inline pixel-id config (window.tikTokPixelId = "...")
 *   2. Utmify TikTok pixel loader (pixel-tiktok.js)
 *   3. Utmify UTM tracker (utms/latest.js) — captures incoming UTM
 *      query params on the entry page so they persist across the
 *      funnel. data-utmify-prevent-xcod-sck + data-utmify-prevent-subids
 *      are Utmify-specific config flags requested for this account.
 *
 * Component name stays `TikTokPixel` for git-history continuity even
 * though it now bundles the UTM tracker too — both ride together on
 * every /ads/* page, so they're treated as one paid-funnel tracking
 * unit. Future paid-only scripts (Meta, Google Ads, etc.) can be
 * added here as additional <Script> tags.
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
      <Script
        src="https://cdn.utmify.com.br/scripts/utms/latest.js"
        strategy="afterInteractive"
        data-utmify-prevent-xcod-sck=""
        data-utmify-prevent-subids=""
      />
    </>
  );
}
