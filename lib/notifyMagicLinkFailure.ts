import type { AccessChannel } from "@/lib/notifySale";

/**
 * LOUD, best-effort Discord alert for a failed magic_links insert during
 * provisioning.
 *
 * A failed insert means the buyer receives a welcome/login email whose token
 * was never stored — the link is dead the moment they click it ("link is not
 * valid"). Historically every webhook only console.error'd this and continued
 * (returning 200), so a paying customer could be locked out for days before
 * anyone noticed (see the aitor@araitmultimedia.es incident, 2026-09-25).
 *
 * Fire-and-forget: this ALWAYS logs loudly server-side, and additionally posts
 * to the realtime sales Discord so the dono is paged immediately. It never
 * throws and never blocks provisioning — provisioning must not break because
 * Discord is unavailable.
 */
export async function notifyMagicLinkFailure(args: {
  channel: AccessChannel;
  email: string;
  error: unknown;
}): Promise<void> {
  const { channel, email, error } = args;

  const errMsg =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message: unknown }).message)
        : String(error);

  // Always log loudly regardless of whether Discord is configured/reachable.
  console.error(
    `[magic-link-failure] channel=${channel} email=${email} — buyer will receive a DEAD login link (token was never stored). err=${errMsg}`,
  );

  const webhookUrl = process.env.DISCORD_WEBHOOK_SALES_REALTIME;
  if (!webhookUrl) {
    console.warn(
      "[magic-link-failure] DISCORD_WEBHOOK_SALES_REALTIME not set — skipping Discord alert",
    );
    return;
  }

  const content = [
    "🚨 **MAGIC LINK FAILED — BUYER LOCKED OUT** 🚨",
    "━━━━━━━━━━━━━━━━━━",
    `📡 Channel: **${channel}**`,
    `📧 ${email || "No email"}`,
    "❌ The `magic_links` insert failed — the welcome/login email points at a token that was never stored, so the link is dead on arrival.",
    `🧾 error: ${errMsg}`,
    "",
    `🔧 Fix now: \`node grant-access.js ${email} "<full name>"\``,
  ].join("\n");

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[magic-link-failure] Discord webhook failed (${res.status}) for channel=${channel} email=${email}: ${body}`,
      );
    }
  } catch (err) {
    console.error(
      `[magic-link-failure] Discord call threw for channel=${channel} email=${email}:`,
      err,
    );
  }
}
