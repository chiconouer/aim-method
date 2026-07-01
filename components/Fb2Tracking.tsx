"use client";

import Script from "next/script";

// ─────────────────────────────────────────────────────────────
// Fb2Tracking — Utmify pixel + UTM tracker for the SECOND
// Facebook paid-traffic funnel (new traffic manager).
//
// Mount ONLY on /fb2/* pages — the new manager's routes. Never
// on /fb/* (Gabriel — uses <FbTracking /> with pixel
// 6a29b12be02fa138b6513a2c), never on /ttk/* (uses
// <TikTokPixel />), never on organic /sales or dashboard/auth.
//
// Loads three tags under afterInteractive so the pixel + UTM
// tracker don't block first paint:
//   1. Inline window.pixelId = FB2_PIXEL_ID (must run BEFORE
//      pixel.js so Utmify's loader picks it up on init)
//   2. Utmify pixel loader (pixel.js) — same script Gabriel's
//      FbTracking uses, but bound to the new manager's ID via
//      the inline config above
//   3. Utmify UTM tracker (utms/latest.js) — NEW vs Gabriel's
//      FbTracking which deliberately omits it. Preserves UTM
//      params across navigation so the checkout URL keeps them.
//      `data-utmify-prevent-subids` is a documented Utmify
//      attribute that stops the tracker from mangling Hotmart's
//      internal sub-id params (sck=fb2 stays intact on
//      pay.hotmart.com/O106558433D links).
//
// Microsoft Clarity intentionally not included yet — the new
// manager's session recordings should stay isolated from
// Gabriel's Clarity project (x4g1epela7). If they want Clarity
// later, add a project ID + a Script tag here.
// ─────────────────────────────────────────────────────────────

const FB2_PIXEL_ID = "6a44968bedb9cb1a07fda1e1";

export function Fb2Tracking() {
  return (
    <>
      <Script id="fb2-pixel-config" strategy="afterInteractive">
        {`window.pixelId = "${FB2_PIXEL_ID}";`}
      </Script>
      <Script
        src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
        strategy="afterInteractive"
      />
      <Script
        src="https://cdn.utmify.com.br/scripts/utms/latest.js"
        strategy="afterInteractive"
        data-utmify-prevent-subids=""
      />
    </>
  );
}
