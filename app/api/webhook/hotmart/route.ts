import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { postToDiscordWebhook } from "@/lib/discord";

const resend = new Resend(process.env.RESEND_API_KEY!);

function formatEtTimestamp(isoString: string) {
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

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Only process approved/completed purchases
  const ACCEPTED_EVENTS = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"];
  if (!ACCEPTED_EVENTS.includes(body.event)) {
    return NextResponse.json({ ok: true, message: "Event ignored." });
  }

  const email: string | undefined = body?.data?.buyer?.email;
  const fullName: string = body?.data?.buyer?.name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists — if not, create them
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", normalizedEmail)
    .single();

  if (!existing) {
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      email: normalizedEmail,
      name: firstName,
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }
  }

  // Generate magic link — 30-day expiry for welcome email
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });

  if (linkError) {
    console.error("Failed to create magic link:", linkError);
    // User was created — don't fail the webhook
  }

  const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;

  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: normalizedEmail,
    subject: "Welcome to AIM Method!",
    html: `
      <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Click here to access your AIM Method course</span>
      <div style="background-color:#0a0a0a;padding:48px 20px;font-family:sans-serif;">
        <div style="max-width:520px;margin:0 auto;">

          <div style="text-align:center;margin-bottom:32px;">
            <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AIM</span>
            <span style="font-size:22px;font-weight:800;color:#8b5cf6;letter-spacing:-0.5px;"> Method</span>
          </div>

          <div style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
            <div style="height:3px;background-color:#8b5cf6;"></div>
            <div style="padding:40px 36px;">

              <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Welcome to AIM Method! 🎉</h1>
              <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${firstName}, your purchase was successful. Your access is ready below.</p>

              <div style="text-align:center;">
                <a href="${loginUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:12px;">Access Your Course →</a>
                <br>
                <a href="https://discord.gg/9ZdNpbbfC" style="display:inline-block;background-color:#5865F2;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:12px;">💬 Join Our Community on Discord</a>
              </div>

              <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                  To sign in again later, visit <a href="https://course.aimodelmethods.com/auth/sign-in" style="color:#8b5cf6;text-decoration:none;">course.aimodelmethods.com</a> and enter your email to receive a new login link.
                </p>
              </div>

            </div>
          </div>

          <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2025 AIM Method · All rights reserved</p>

        </div>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend email error:", emailError);
    return NextResponse.json({ error: "Failed to send welcome email." }, { status: 500 });
  }

  const transactionId =
    body?.data?.purchase?.transaction ??
    body?.data?.purchase?.transaction_id ??
    body?.data?.purchase?.id ??
    body?.data?.transaction;

  if (!transactionId) {
    console.error("Hotmart sales insert skipped: missing transaction id.");
  } else {
    const rawAmount = Number(body?.data?.purchase?.price?.value ?? 0);
    const amountCents = Math.round(rawAmount * 100);
    const occurredAt = body?.data?.purchase?.approved_date ?? new Date().toISOString();

    const { error: salesInsertError } = await supabaseAdmin.from("sales").upsert(
      {
        hotmart_transaction_id: String(transactionId),
        buyer_name: body?.data?.buyer?.name ?? null,
        buyer_email: normalizedEmail,
        amount_cents: amountCents,
        currency: body?.data?.purchase?.price?.currency_code ?? "USD",
        product_name: body?.data?.product?.name ?? null,
        status: "approved",
        occurred_at: occurredAt,
        raw_payload: body,
      },
      { onConflict: "hotmart_transaction_id", ignoreDuplicates: true }
    );

    if (salesInsertError) {
      // Keep webhook response successful to avoid retries breaking existing purchase flow.
      console.error("Failed to persist sale record:", salesInsertError);
    }

    if (body.event === "PURCHASE_APPROVED") {
      const salesRealtimeWebhook = process.env.DISCORD_WEBHOOK_SALES_REALTIME;
      if (salesRealtimeWebhook) {
        const amount = (amountCents / 100).toFixed(2);
        const displayTime = formatEtTimestamp(occurredAt);
        const content = [
          "💰 **NEW SALE** 💰",
          "━━━━━━━━━━━━━━━━━━",
          `👤 **${body?.data?.buyer?.name ?? "Unknown Buyer"}**`,
          `📧 ${normalizedEmail}`,
          `💵 **$${amount}** ${body?.data?.purchase?.price?.currency_code ?? "USD"}`,
          `📦 ${body?.data?.product?.name ?? "Unknown Product"}`,
          `⏰ ${displayTime}`,
        ].join("\n");

        try {
          await postToDiscordWebhook(salesRealtimeWebhook, content);
        } catch (discordError) {
          console.error("Failed to post realtime sales Discord message:", discordError);
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
