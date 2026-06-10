"use client";

import Script from "next/script";

const FB_PIXEL_ID = "6a29b12be02fa138b6513a2c";
const CLARITY_PROJECT_ID = "x4g1epela7";

/**
 * Facebook / Utmify pixel + Microsoft Clarity tracking suite for the
 * Facebook paid-traffic funnel. Mount on /fb/* pages ONLY — NEVER on
 * /ads/* (those use TikTokPixel), NEVER on organic /sales,
 * /upsell-*, /downsell-*, /dashboard, /auth, /start, /apply, /fanvue.
 *
 * Loads three Script tags in DOM order under afterInteractive:
 *   1. Inline pixel-id config (window.pixelId = "...")
 *   2. Utmify Facebook pixel loader (pixel.js)
 *   3. Microsoft Clarity tag — same project ID as TikTokPixel uses,
 *      so all Clarity session recordings land in one project for
 *      easier cross-funnel analysis.
 *
 * NOTE: deliberately NO Utmify UTM tracker (utms/latest.js) here —
 * the Facebook funnel doesn't currently use Utmify UTM links. If
 * needed later, add as another <Script src=".../utms/latest.js" />.
 */
export function FbTracking() {
  return (
    <>
      <Script id="fb-pixel-config" strategy="afterInteractive">
        {`window.pixelId = "${FB_PIXEL_ID}";`}
      </Script>
      <Script
        src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
        strategy="afterInteractive"
      />
      <Script id="ms-clarity-fb" strategy="afterInteractive">
        {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
      </Script>
    </>
  );
}
