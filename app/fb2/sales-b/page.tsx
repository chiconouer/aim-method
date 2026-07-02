// =============================================================
// FB2 / Sales page — Test B (presell-driven) of the 4-way
// retention split. Traffic reaches this page via the age-gate
// presell at /fb2/presell (visitor confirms "I'm 18 or older"
// and Link-navigates here). Independent Vturb player + sck so
// retention metrics stay isolated from Tests A / C / D.
//
// Test B config:
//   - Vturb player: vid-6a4688b98360e665176760a5
//   - HLS media   : 6a46881abace28b9089f1573
//   - Checkout    : Hotmart O106558433D, sck=fb2-presell
//   - storageKeyPrefix "_b" — isolates the reveal timer +
//     checkout-dedupe keys from every other variant
//   - onFirstCheckoutClick omitted — retention analytics live
//     in Vturb + Hotmart sck + Utmify UTM, so we intentionally
//     skip quiz_funnel_events (per plan option a)
// =============================================================

"use client";
import { Fb2SalesTemplate } from "@/app/fb2/_components/Fb2SalesTemplate";

const CHECKOUT_URL =
  "https://pay.hotmart.com/O106558433D?checkoutMode=10&sck=fb2-presell";

export default function Fb2SalesBPage() {
  return (
    <Fb2SalesTemplate
      vturbPlayerId="vid-6a4688b98360e665176760a5"
      vturbPlayerScriptSrc="https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a4688b98360e665176760a5/v4/player.js"
      vturbHlsManifestUrl="https://cdn.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/6a46881abace28b9089f1573/main.m3u8"
      checkoutUrl={CHECKOUT_URL}
      storageKeyPrefix="_b"
    />
  );
}
