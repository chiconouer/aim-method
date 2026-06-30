"use client";

import Script from "next/script";

// ─────────────────────────────────────────────────────────────
// PLACEHOLDER — the new fb2 traffic manager will provide their
// own Facebook pixel ID. Until then this component intentionally
// loads NOTHING: no pixel script, no inline window.pixelId. The
// fb2 funnel pages still mount this tag so wiring the pixel
// later is a one-line change (drop the ID into FB2_PIXEL_ID,
// uncomment the two <Script> tags below) — no need to touch the
// quiz or sales page templates.
//
// Microsoft Clarity is also intentionally omitted so the new
// manager's funnel recordings stay isolated from Gabriel's fb
// project. If they want Clarity later, add a project ID +
// uncomment the third tag.
//
// Do NOT reuse FbTracking's pixel ID (6a29b12be02fa138b6513a2c)
// or Clarity project ID (x4g1epela7) here — those belong to the
// existing /fb funnel.
// ─────────────────────────────────────────────────────────────

const FB2_PIXEL_ID = ""; // ← new manager fills this in
const CLARITY_PROJECT_ID = ""; // ← optional, leave empty to disable

export function Fb2Tracking() {
  if (!FB2_PIXEL_ID && !CLARITY_PROJECT_ID) return null;

  return (
    <>
      {FB2_PIXEL_ID && (
        <>
          <Script id="fb2-pixel-config" strategy="afterInteractive">
            {`window.pixelId = "${FB2_PIXEL_ID}";`}
          </Script>
          <Script
            src="https://cdn.utmify.com.br/scripts/pixel/pixel.js"
            strategy="afterInteractive"
          />
        </>
      )}
      {CLARITY_PROJECT_ID && (
        <Script id="ms-clarity-fb2" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${CLARITY_PROJECT_ID}");`}
        </Script>
      )}
    </>
  );
}
