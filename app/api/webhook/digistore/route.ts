import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let firstName = "Student";

  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    email = params.get("email") ?? params.get("billing_email");
    firstName = params.get("first_name") ?? params.get("billing_first_name") ?? "Student";
  } else {
    const body = await req.json().catch(() => ({}));
    email = body.email ?? body.billing_email ?? null;
    firstName = body.first_name ?? body.billing_first_name ?? "Student";
  }

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  email = email.toLowerCase().trim();

  // Check if user already exists
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ ok: true, message: "User already exists." });
  }

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    email,
    name: firstName,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }

  // Generate a magic link token (30-day expiry for welcome link)
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
    subject: "Welcome to AIM Method - Access Your Course",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
        <h1 style="color: #8b5cf6; font-size: 28px; margin-bottom: 8px;">Welcome to AIM Method! 🎉</h1>
        <p style="color: #d1d5db; font-size: 16px; margin-bottom: 32px;">
          Hi ${firstName}, your purchase was successful. Click the button below to access your course — no password needed.
        </p>

        <a href="${loginUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; font-weight: bold; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          Access Your Course →
        </a>

        <p style="color: #9ca3af; font-size: 14px; margin-top: 32px;">
          To sign in again later, go to{" "}
          <a href="https://course.aimodelmethods.com/auth/sign-in" style="color: #a78bfa;">
            course.aimodelmethods.com/auth/sign-in
          </a>{" "}
          and enter your email to receive a new login link.
        </p>

        <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
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
