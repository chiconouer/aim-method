"use client";

import Script from "next/script";

// Primary TikTok pixel — runs through the Utmify pipeline and gets
// the full enrichment suite (form-submit tracking, IP geolocation,
// FBC/FBP cookie reads, UTM persistence).
const TIKTOK_PIXEL_ID = "6a21ba581f04a3dea3835cb8";

// Secondary TikTok pixel — bypasses Utmify and registers via TikTok's
// NATIVE ttq snippet so both pixels can fire on the same page.
//
// Why we can't run BOTH through Utmify:
//   Utmify's pixel-tiktok.js reads `window.tikTokPixelId` (singular)
//   and has a singleton `inited` init guard. Setting the global twice
//   makes the second value overwrite the first; loading the script
//   twice no-ops on the second call. Confirmed by source inspection
//   of cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js.
//
// Why the native-ttq workaround works:
//   Utmify uses TikTok's native ttq object under the hood (verified —
//   it loads analytics.tiktok.com/i18n/pixel/events.js and calls
//   ttq.load / ttq.page / ttq.track internally). The ttq object
//   natively supports multiple pixels via repeated ttq.load(ID) calls.
//   We piggyback on the same global to register the secondary pixel
//   without disturbing Utmify's setup for the primary.
//
// Limitation to flag to the gestor:
//   The secondary pixel only receives standard PageView tracking via
//   ttq. It does NOT get Utmify's form-submit / IP / UTM enrichment.
//   If the gestor wants both pixels enriched, that has to be
//   configured server-side in Utmify's dashboard (multi-pixel-per-
//   account), not client-side.
const TIKTOK_PIXEL_ID_SECONDARY = "6a33f80aaa9d9ad8e6ef3461";

const CLARITY_PROJECT_ID = "x4g1epela7";

/**
 * Paid-traffic tracking suite. Mount on /ttk/* pages ONLY — NEVER on
 * organic /sales, /upsell-*, /downsell-*, /dashboard, /auth, /start,
 * /apply, /fanvue, /fb/* (those use FbTracking), etc.
 *
 * Loads five Script tags in DOM order under afterInteractive:
 *   1. Inline pixel-id config (window.tikTokPixelId = PRIMARY)
 *   2. Utmify TikTok pixel loader (pixel-tiktok.js) — wires the
 *      primary pixel with full enrichment.
 *   3. Inline native-ttq bootstrap that registers the SECONDARY
 *      pixel via ttq.load + ttq.instance(ID).page(). See the
 *      TIKTOK_PIXEL_ID_SECONDARY comment above for the rationale.
 *   4. Utmify UTM tracker (utms/latest.js) — captures incoming UTM
 *      query params on the entry page so they persist across the
 *      funnel. data-utmify-prevent-xcod-sck + data-utmify-prevent-subids
 *      are Utmify-specific config flags requested for this account.
 *   5. Microsoft Clarity session-recording + heatmaps.
 *
 * All five tags use strategy="afterInteractive" — Next.js loads them
 * after first hydration so they never block first paint.
 *
 * Component name stays `TikTokPixel` for git-history continuity.
 * Future paid-only scripts (Meta, Google Ads, etc.) can be added
 * here as additional <Script> tags.
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
      {/* Standard TikTok ttq bootstrap (idempotent — reuses existing
          ttq if Utmify already set it up). ttq.load registers the
          secondary pixel; ttq.instance(ID).page() fires PageView ONLY
          to that pixel so the primary's count isn't doubled. */}
      <Script id="tiktok-pixel-secondary" strategy="afterInteractive">
        {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(e,n){e[n]=function(){e.push([n].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(e){for(var n=ttq._i[e]||[],r=0;r<ttq.methods.length;r++)ttq.setAndDefer(n,ttq.methods[r]);return n};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var s=d.createElement("script");s.type="text/javascript";s.async=!0;s.src=r+"?sdkid="+e+"&lib="+t;var o=d.getElementsByTagName("script")[0];o.parentNode.insertBefore(s,o)};ttq.load("${TIKTOK_PIXEL_ID_SECONDARY}");ttq.instance("${TIKTOK_PIXEL_ID_SECONDARY}").page();}(window,document,"ttq");`}
      </Script>
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
