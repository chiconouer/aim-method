// PerfectPay affiliate webhook.
// Fires when an external affiliate sells the AIM Method course through PerfectPay.
// We do NOT own the sale (no entry in `sales`, no Discord notification) — we only
// provision course access for the buyer: create user, issue magic link, send welcome email.
//
// Auth: requires header `x-affiliate-token` matching env PERFECTPAY_AFFILIATE_TOKEN.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";
import { DISCORD_INVITE_URL } from "@/lib/discord";

const resend = new Resend(process.env.RESEND_API_KEY!);

const ACCEPTED_STATUSES = ["approved", "completed"];

export async function POST(req: NextRequest) {
  // 1. Auth via header token
  const providedToken = req.headers.get("x-affiliate-token");
  const expectedToken = process.env.PERFECTPAY_AFFILIATE_TOKEN;
  if (!expectedToken) {
    console.error("[perfectpay-affiliate] PERFECTPAY_AFFILIATE_TOKEN is not set");
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }
  if (!providedToken || providedToken !== expectedToken) {
    console.warn("[perfectpay-affiliate] Rejected request: invalid or missing x-affiliate-token");
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    console.error("[perfectpay-affiliate] Invalid JSON payload");
    return NextResponse.json({ ok: true, message: "Invalid JSON ignored." });
  }

  // 2. Filter to approved sales — accept either `sale_status` or `status`
  const rawStatus = String(body?.sale_status ?? body?.status ?? "").toLowerCase().trim();
  if (!ACCEPTED_STATUSES.includes(rawStatus)) {
    console.log(`[perfectpay-affiliate] Event ignored, status="${rawStatus}"`);
    return NextResponse.json({ ok: true, message: "Event ignored." });
  }

  // 3. Extract email with fallback chain
  const email: string | undefined =
    body?.customer?.email ?? body?.buyer_email ?? body?.email;
  const fullName: string =
    body?.customer?.name ?? body?.customer_name ?? body?.buyer_name ?? body?.name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";

  if (!email) {
    console.error("[perfectpay-affiliate] No email in payload");
    return NextResponse.json({ ok: true, message: "No email — skipped." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  console.log(`[perfectpay-affiliate] Processing approved sale for ${normalizedEmail}`);

  // 4a. Upsert user
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", normalizedEmail)
    .single();

  if (!existing) {
    const { error: insertError } = await insertUserWithSource({
      email: normalizedEmail,
      name: firstName,
      source: "perfectpay",
    });
    if (insertError) {
      console.error("[perfectpay-affiliate] Supabase user insert error:", insertError);
      // Keep returning 200 to avoid PerfectPay retry storms
      return NextResponse.json({ ok: true, message: "User insert failed." });
    }
    console.log(`[perfectpay-affiliate] Created new user ${normalizedEmail}`);
  } else {
    console.log(`[perfectpay-affiliate] User ${normalizedEmail} already exists`);
  }

  // 4b. Create magic link (30-day expiry)
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });
  if (linkError) {
    console.error("[perfectpay-affiliate] Failed to create magic link:", linkError);
    // Don't fail — user was created; let support handle if email fails too
  }

  const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;

  // 4c. Welcome email (same template as hotmart webhook)
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
                <a href="${DISCORD_INVITE_URL}" style="display:inline-block;background-color:#5865F2;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:12px;">💬 Join Our Community on Discord</a>
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
    console.error("[perfectpay-affiliate] Resend email error:", emailError);
    return NextResponse.json({ ok: true, message: "Welcome email failed." });
  }

  console.log(`[perfectpay-affiliate] Welcome email sent to ${normalizedEmail}`);

  // Realtime Discord alert — PerfectPay was deprecated, so every hit
  // should be inspected. Surface it loudly with the unexpected-channel
  // treatment.
  await notifySale({
    channel: "perfectpay",
    email: normalizedEmail,
    name: fullName,
    product: "AIM Method (course)",
  });

  return NextResponse.json({ ok: true });
}
