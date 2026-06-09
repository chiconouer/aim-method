"use client";

import Script from "next/script";

const TIKTOK_PIXEL_ID = "6a21ba581f04a3dea3835cb8";
const CLARITY_PROJECT_ID = "x4g1epela7";

/**
 * Paid-traffic tracking suite. Mount on /ads/* pages ONLY — NEVER on
 * organic /sales, /upsell-*, /downsell-*, /dashboard, /auth, /start,
 * /apply, /fanvue, etc.
 *
 * Loads four Script tags in DOM order under afterInteractive:
 *   1. Inline pixel-id config (window.tikTokPixelId = "...")
 *   2. Utmify TikTok pixel loader (pixel-tiktok.js)
 *   3. Utmify UTM tracker (utms/latest.js) — captures incoming UTM
 *      query params on the entry page so they persist across the
 *      funnel. data-utmify-prevent-xcod-sck + data-utmify-prevent-subids
 *      are Utmify-specific config flags requested for this account.
 *   4. Microsoft Clarity session-recording + heatmaps. IIFE pushes to
 *      window.clarity queue and async-injects the tag script; same
 *      paid-pages-only scope as the others.
 *
 * Component name stays `TikTokPixel` for git-history continuity even
 * though it now bundles UTM tracker + Clarity too — all ride together
 * on every /ads/* page, treated as one paid-funnel tracking unit.
 * Future paid-only scripts (Meta, Google Ads, etc.) can be added here
 * as additional <Script> tags.
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
      <Script id="ms-clarity" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
      </Script>
    </>
  );
}
