// =============================================================
// Single source of truth for the Discord community invite URL.
// Consumed by every UI + email path that surfaces the invite:
//
//   UI:
//     - app/dashboard/page.tsx        (banner card between Continue and Your Course)
//     - app/dashboard/layout.tsx      (persistent sidebar item)
//
//   Welcome / login emails:
//     - app/api/webhook/hotmart/route.ts
//     - app/api/webhook/stripe/route.ts
//     - app/api/webhook/digistore/route.ts
//     - app/api/webhook/perfectpay-affiliate/route.ts
//     - app/api/auth/magic-link/route.ts
//
//   CommonJS script (mirrors this value with a SYNC comment):
//     - grant-access.js — Node script, can't import TS. If you
//       ever rotate the invite, update BOTH this constant and
//       the DISCORD_INVITE_URL literal at the top of grant-access.js.
// =============================================================
export const DISCORD_INVITE_URL = "https://discord.gg/MqpBq3CshD";

export async function postToDiscordWebhook(webhookUrl: string, content: string): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Discord webhook failed (${response.status}): ${body || "unknown error"}`);
  }
}
