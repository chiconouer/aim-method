import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";

const resend = new Resend(process.env.RESEND_API_KEY!);

const ACCEPTED_EVENTS = ["CHECKOUT_COMPLETED", "ORDER_COMPLETED"];

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let firstName = "Student";
  let event: string | null = null;

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    email = params.get("email") ?? params.get("billing_email");
    firstName = params.get("first_name") ?? params.get("billing_first_name") ?? "Student";
    event = params.get("event") ?? params.get("event_type");
  } else {
    const body = await req.json().catch(() => ({}));
    email = body.email ?? body.billing_email ?? null;
    firstName = body.first_name ?? body.billing_first_name ?? "Student";
    event = body.event ?? body.event_type ?? null;
  }

  if (event && !ACCEPTED_EVENTS.includes(event)) {
    return NextResponse.json({ ok: true, message: "Event ignored." });
  }

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  email = email.toLowerCase().trim();

  // Check if user already exists — if not, create them
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  if (!existing) {
    const { error: insertError } = await insertUserWithSource({
      email,
      name: firstName,
      source: "digistore",
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
    email,
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
    to: email,
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

  // Realtime Discord alert — Digistore isn't supposed to be actively
  // provisioning right now (no product wired up yet). Surface any hit so
  // the owner notices misconfiguration / token leak / cloned funnel.
  await notifySale({
    channel: "digistore",
    email,
    name: firstName,
    product: "AIM Method (course)",
  });

  return NextResponse.json({ ok: true });
}
