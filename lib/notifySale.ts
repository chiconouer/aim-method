/**
 * Discord realtime sale/access notification — shared across every channel
 * that provisions course access (hotmart, stripe, digistore, perfectpay,
 * manual grant-access script).
 *
 * Best-effort: every call is wrapped so a Discord failure NEVER blocks
 * user provisioning or returns a non-200 to the upstream caller.
 *
 * The visual treatment differs per channel so the dono spots unexpected
 * provisioning sources at a glance:
 *   - hotmart, stripe, digistore → ✅ normal "new sale" (active paid channels)
 *   - perfectpay → 🚨 ALERT (deprecated; presence in the feed indicates
 *     suspicious provisioning — token leak, cloned funnel, etc.)
 *   - manual → 🔧 informational (manual script ran)
 */

export type AccessChannel =
  | "hotmart"
  | "stripe"
  | "digistore"
  | "perfectpay"
  | "manual";

/**
 * Funnel origin classification — when the caller can determine which
 * funnel produced the sale (e.g. from Hotmart product id), passing this
 * replaces the generic "💰 NEW SALE 💰" header with a large color-coded
 * heading so cross-funnel volume is trivial to eyeball in the feed.
 *
 *   - "organic"    → green banner (# 🟢 ORGÂNICO)
 *   - "paid_fb2"   → red   banner (# 🔴 TRÁFEGO PAGO (FB2))
 *
 * Add new funnel labels here as new paid managers come online.
 */
export type Funnel = "organic" | "paid_fb2";

export interface NotifySaleInput {
  channel: AccessChannel;
  /**
   * Whether this notification represents a new sale ("sale", the default)
   * or a refund/chargeback ("refund"). Refund renders with a distinct
   * header (↩️ REFUND / CHARGEBACK ↩️) regardless of channel, so refund
   * events are never confused with new sales in the Discord feed.
   */
  eventKind?: "sale" | "refund";
  email: string;
  name?: string | null;
  /** Amount in cents (e.g. 2900 = $29.00). Omit for channels we don't see the price for. */
  amountCents?: number | null;
  currency?: string | null;
  product?: string | null;
  /** Optional one-line extra context appended at the bottom of the message. */
  extraNote?: string | null;
  /**
   * Optional funnel classification. When present, the notification renders
   * a large color-coded heading (# 🟢 ORGÂNICO or # 🔴 TRÁFEGO PAGO (FB2))
   * INSTEAD of the generic "💰 NEW SALE 💰" banner. Only wired from the
   * Hotmart route right now — other channels omit it and keep the legacy
   * header. Refund events ignore this field (refund banner wins).
   */
  funnel?: Funnel;
  /**
   * Optional Hotmart `sck` tracking param (e.g. "organico", "fb2").
   * Included as a small subtitle below the funnel banner for extra
   * signal — NOT authoritative for the funnel classification (product id
   * is). Ignored when `funnel` isn't set.
   */
  sck?: string | null;
}

const EXPECTED_CHANNELS: AccessChannel[] = ["hotmart", "stripe", "digistore"];

function formatEtTimestamp(date: Date): string {
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  const datePart = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
  return `${time} EST · ${datePart}`;
}

function formatAmount(cents: number | null | undefined, currency?: string | null): string | null {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return null;
  const value = (cents / 100).toFixed(2);
  return `$${value} ${(currency ?? "USD").toUpperCase()}`;
}

function channelLabel(channel: AccessChannel): string {
  return (
    {
      hotmart: "Hotmart",
      stripe: "Stripe",
      digistore: "Digistore",
      perfectpay: "PerfectPay",
      manual: "Manual (grant-access)",
    } as const
  )[channel];
}

// Discord markdown "# " renders as a large h1 heading — the point is to
// make the funnel classification unmissable at the top of the message.
// Colors chosen so organic (green) vs paid (red) is instantly scannable.
function funnelHeader(funnel: Funnel): string {
  return (
    {
      organic: "# 🟢 ORGÂNICO",
      paid_fb2: "# 🔴 TRÁFEGO PAGO (FB2)",
    } as const
  )[funnel];
}

function buildMessage(input: NotifySaleInput): string {
  const { channel, eventKind, email, name, amountCents, currency, product, extraNote } = input;
  const displayName = (name ?? "").trim() || "Unknown name";
  const amount = formatAmount(amountCents, currency);
  const stamp = formatEtTimestamp(new Date());
  const isRefund = eventKind === "refund";

  const lines: string[] = [];

  if (isRefund) {
    // Refund header trumps every other variant — a refund is never
    // a "new sale" regardless of which gateway sent it or which
    // funnel produced the original purchase.
    lines.push("↩️ **REFUND / CHARGEBACK** ↩️");
  } else if (input.funnel) {
    // Funnel classification wins over the generic "NEW SALE" header
    // when the caller passes one (currently: Hotmart route only). The
    // banner is Discord "# " h1 so it dominates the message visually.
    lines.push(funnelHeader(input.funnel));
  } else if (EXPECTED_CHANNELS.includes(channel)) {
    lines.push("💰 **NEW SALE** 💰");
  } else if (channel === "manual") {
    lines.push("🔧 **MANUAL ACCESS GRANTED** 🔧");
  } else {
    // perfectpay — unexpected channel at present
    lines.push("🚨 **UNEXPECTED CHANNEL — VERIFY** 🚨");
  }

  lines.push("━━━━━━━━━━━━━━━━━━");
  lines.push(`📡 Channel: **${channelLabel(channel)}**`);
  // sck is a secondary tracking signal we surface right under the
  // channel line when it's known — only meaningful alongside the
  // funnel banner (Hotmart route sets both).
  if (input.funnel && input.sck) {
    lines.push(`🔖 sck=${input.sck}`);
  }
  lines.push(`👤 **${displayName}**`);
  lines.push(`📧 ${email || "No email"}`);
  if (amount) lines.push(`💵 **${amount}**`);
  if (product) lines.push(`📦 ${product}`);
  lines.push(`⏰ ${stamp}`);

  if (!isRefund && !EXPECTED_CHANNELS.includes(channel) && channel !== "manual") {
    lines.push("");
    lines.push(
      `⚠️ This channel should NOT be actively provisioning access right now. If you did not authorize this sale, investigate immediately (token leak, cloned funnel, etc).`,
    );
  }

  if (extraNote) {
    lines.push("");
    lines.push(extraNote);
  }

  return lines.join("\n");
}

/**
 * Post the formatted notification to the Discord webhook. Always resolves —
 * never rejects, never throws. Logs failures to the server console.
 */
export async function notifySale(input: NotifySaleInput): Promise<void> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_SALES_REALTIME;
  if (!webhookUrl) {
    console.warn(
      "[notifySale] DISCORD_WEBHOOK_SALES_REALTIME not set — skipping notification",
    );
    return;
  }

  try {
    const content = buildMessage(input);
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(
        `[notifySale] Discord webhook failed (${res.status}) for channel=${input.channel} email=${input.email}: ${body}`,
      );
    }
  } catch (err) {
    console.error(
      `[notifySale] Discord call threw for channel=${input.channel} email=${input.email}:`,
      err,
    );
  }
}
