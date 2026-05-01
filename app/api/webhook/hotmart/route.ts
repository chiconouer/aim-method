import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Only process approved purchases
  if (body.event !== "PURCHASE_APPROVED") {
    return NextResponse.json({ ok: true, message: "Event ignored." });
  }

  const email: string | undefined = body?.data?.buyer?.email;
  const fullName: string = body?.data?.buyer?.name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", normalizedEmail)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, message: "User already exists." });
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    email: normalizedEmail,
    name: firstName,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
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
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#ffffff;padding:40px 32px;border-radius:16px;">
        <h1 style="color:#8b5cf6;font-size:28px;margin-bottom:8px;">Welcome to AIM Method! 🎉</h1>
        <p style="color:#d1d5db;font-size:16px;margin-bottom:32px;">
          Hi ${firstName}, your purchase was successful. Click the button below to access your course — no password needed.
        </p>
        <a href="${loginUrl}" style="display:inline-block;background-color:#8b5cf6;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;">Access Your Course</a>
        <br>
        <a href="https://discord.gg/9ZdNpbbfC" style="display:inline-block;background-color:#5865F2;color:white;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px;margin-top:12px;">💬 Join Our Community on Discord</a>
        <p style="color:#9ca3af;font-size:14px;margin-top:32px;">
          To sign in again later, visit
          <a href="https://course.aimodelmethods.com/auth/sign-in" style="color:#a78bfa;">course.aimodelmethods.com/auth/sign-in</a>
          and enter your email to receive a new login link.
        </p>
        <p style="color:#6b7280;font-size:13px;margin-top:16px;">
          This welcome link is valid for 30 days. If you have any issues, reply to this email.
        </p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend email error:", emailError);
  }

  return NextResponse.json({ ok: true });
}
