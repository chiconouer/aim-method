// =============================================================
// FB2 / Sales page — Test C (microlead-driven VSL, variant 1)
// of the 4-way retention split. Traffic reaches this page
// straight from the ad — no quiz, no presell. The Vturb player
// wraps a VSL edit with a microlead intro.
//
// Test C config:
//   - Vturb player: vid-6a4689dc8360e66517676199
//   - HLS media   : 6a4689760d30a6c34ad8ecb3
//   - Checkout    : Hotmart O106558433D, sck=fb2-microlead1
//   - storageKeyPrefix "_c"
//   - onFirstCheckoutClick omitted (analytics via Vturb +
//     Hotmart sck + Utmify UTM)
// =============================================================

"use client";
import { Fb2SalesTemplate } from "@/app/fb2/_components/Fb2SalesTemplate";

const CHECKOUT_URL =
  "https://pay.hotmart.com/O106558433D?checkoutMode=10&sck=fb2-microlead1";

export default function Fb2SalesCPage() {
  return (
    <Fb2SalesTemplate
      vturbPlayerId="vid-6a4689dc8360e66517676199"
      vturbPlayerScriptSrc="https://scripts.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/players/6a4689dc8360e66517676199/v4/player.js"
      vturbHlsManifestUrl="https://cdn.converteai.net/9fb1f5b1-1f24-41b5-8813-069e6a0bf8d0/6a4689760d30a6c34ad8ecb3/main.m3u8"
      checkoutUrl={CHECKOUT_URL}
      storageKeyPrefix="_c"
    />
  );
}
