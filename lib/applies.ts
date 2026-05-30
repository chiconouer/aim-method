import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { postToDiscordWebhook } from "@/lib/discord";

const resend = new Resend(process.env.RESEND_API_KEY!);

export interface ApplyData {
  /** Full name. Used for DB applicant_name + Discord. Empty string allowed. */
  name: string;
  /** Already normalized (lowercase + trim) email. Used for Resend "to:" + DB. */
  email: string;
  /** Map of question → answer. Used for DB jsonb + Discord notification body. */
  answers: Record<string, unknown>;
  /** Idempotency key. Maps to the source_id column on the applies table. */
  sourceId: string;
  /** Optional raw webhook payload (Typeform sends one; self-hosted form may omit). */
  rawPayload?: unknown;
  /** ISO timestamp. Defaults to now. */
  submittedAt?: string;
}

function formatEtTimestamp(isoString: string): string {
  const date = new Date(isoString);
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

function buildAcceptanceEmail(firstName: string): string {
  return `
      <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">You've been accepted — click to book your 1-on-1 coaching call</span>
      <div style="background-color:#0a0a0a;padding:48px 20px;font-family:sans-serif;">
        <div style="max-width:520px;margin:0 auto;">

          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AIM</span>
            <span style="font-size:22px;font-weight:800;color:#8b5cf6;letter-spacing:-0.5px;"> Method</span>
          </div>

          <div style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
            <div style="height:3px;background-color:#8b5cf6;"></div>
            <div style="padding:40px 36px;">

              <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">You're Accepted! 🎉</h1>
              <p style="font-size:15px;color:#9ca3af;margin:0 0 24px;">Hi ${firstName}, we received your application for 1-on-1 coaching for AI Model Method — and great news, you've been accepted!</p>

              <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Click below to book your call at a time that works for you.</p>

              <div style="text-align:center;">
                <a href="https://calendly.com/chiconouersk8/30min" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">📅 Book Your Call Now</a>
              </div>

              <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                  If you have any questions before the call, reply to this email and we'll get back to you.
                </p>
              </div>

            </div>
          </div>

          <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2025 AIM Method · All rights reserved</p>

        </div>
      </div>
    `;
}

/**
 * Runs the post-application automation: acceptance email, DB row, and Discord
 * notification. Each step is BEST-EFFORT — a failure in one is logged but does
 * not block the others, and the function always returns ok. This is the
 * critical reliability change: a Resend hiccup no longer wipes out the DB +
 * Discord write (and no longer 500s the webhook, which would trigger Typeform
 * retries and duplicate emails).
 */
export async function processApply(data: ApplyData): Promise<{ ok: true }> {
  const submittedAt = data.submittedAt ?? new Date().toISOString();
  const trimmedName = data.name.trim();
  const firstName = trimmedName.split(/\s+/)[0] || "there";
  const email = data.email;

  // 1. Acceptance email — best-effort
  try {
    const { error: emailError } = await resend.emails.send({
      from: "AIM Method <noreply@aimodelmethods.com>",
      to: email,
      subject: "You're In! Book Your Call - AIM Method",
      html: buildAcceptanceEmail(firstName),
    });
    if (emailError) {
      console.error("[applies] Resend email error:", emailError);
    }
  } catch (err) {
    console.error("[applies] Resend exception:", err);
  }

  // 2. Persist to applies table — best-effort
  try {
    const { error: upsertError } = await supabaseAdmin.from("applies").upsert(
      {
        source_id: data.sourceId,
        applicant_name: trimmedName || null,
        applicant_email: email,
        answers: data.answers,
        raw_payload: data.rawPayload ?? null,
        submitted_at: submittedAt,
      },
      { onConflict: "source_id", ignoreDuplicates: true },
    );
    if (upsertError) {
      console.error("[applies] supabase upsert failed:", upsertError);
    }
  } catch (err) {
    console.error("[applies] supabase exception:", err);
  }

  // 3. Discord realtime notification — best-effort, only if configured
  const webhookUrl = process.env.DISCORD_WEBHOOK_APPLIES_REALTIME;
  if (webhookUrl) {
    try {
      const answersLines = Object.entries(data.answers).map(
        ([question, answer]) => {
          const value =
            typeof answer === "string" ||
            typeof answer === "number" ||
            typeof answer === "boolean"
              ? String(answer)
              : JSON.stringify(answer);
          return `📝 **${question}**: ${value}`;
        },
      );
      const content = [
        "📋 **NEW 1-ON-1 APPLY** 📋",
        "━━━━━━━━━━━━━━━━━━",
        `👤 **${trimmedName || "Unknown Applicant"}**`,
        `📧 ${email || "No email"}`,
        `⏰ Submitted at ${formatEtTimestamp(submittedAt)}`,
        "",
        "**Answers:**",
        ...answersLines,
      ].join("\n");
      await postToDiscordWebhook(webhookUrl, content);
    } catch (err) {
      console.error("[applies] discord post failed:", err);
    }
  }

  return { ok: true };
}
