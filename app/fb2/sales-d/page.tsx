// =============================================================
// FB2 / Sales page — Test D (microlead-driven VSL, variant 2)
// of the 4-way retention split. Sibling of Test C with a
// different microlead edit — separate Vturb player + separate
// Hotmart sck so retention deltas are attributable to the
// microlead edit rather than any other funnel variable.
//
// Test D config:
//   - Vturb player: vid-6a468b26bace28b9089f1907
//   - HLS media   : 6a468a6e0d30a6c34ad8ed6b
//   - Checkout    : Hotmart O106558433D, sck=fb2-microlead2
//   - storageKeyPrefix "_d"
//   - onFirstCheckoutClick omitted (analytics via Vturb +
//     Hotmart sck + Utmify UTM)
// =============================================================

"use client";
import { Fb2SalesTemplate } from "@/app/fb2/_components/Fb2SalesTemplate";

const CHECKOUT_URL =
  "https://pay.hotmart.com/O106558433D?checkoutMode=10&sck=fb2-microlead2";

export default function Fb2SalesDPage() {
  return (
    <Fb2SalesTemplate
      vturbPlayerId="vid-6a468b26bace28b9089f1907"
      vturbPlayerScriptSrc="https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a468b26bace28b9089f1907/v4/player.js"
      vturbHlsManifestUrl="https://cdn.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/6a468a6e0d30a6c34ad8ed6b/main.m3u8"
      checkoutUrl={CHECKOUT_URL}
      storageKeyPrefix="_d"
    />
  );
}
