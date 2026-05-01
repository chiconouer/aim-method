import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

function generatePassword(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password;
}

export async function POST(req: NextRequest) {
  let email: string | null = null;
  let firstName = "Student";

  const contentType = req.headers.get("content-type") ?? "";

  // Digistore24 sends form-encoded data
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
    // Already provisioned — don't resend, just acknowledge
    return NextResponse.json({ ok: true, message: "User already exists." });
  }

  const plainPassword = generatePassword();
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  const { error: insertError } = await supabaseAdmin.from("users").insert({
    email,
    name: firstName,
    password_hash: passwordHash,
  });

  if (insertError) {
    console.error("Supabase insert error:", insertError);
    return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
  }

  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: email,
    subject: "Welcome to AIM Method - Your Login Details",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
        <h1 style="color: #8b5cf6; font-size: 28px; margin-bottom: 8px;">Welcome to AIM Method! 🎉</h1>
        <p style="color: #d1d5db; font-size: 16px; margin-bottom: 32px;">
          Hi ${firstName}, your purchase was successful. Here are your login credentials to access the course:
        </p>

        <div style="background: #1a1a2e; border: 1px solid rgba(139,92,246,0.3); border-radius: 12px; padding: 24px; margin-bottom: 32px;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px;">Login URL</p>
          <p style="color: #a78bfa; font-size: 15px; font-weight: bold; margin: 0 0 20px;">https://course.aimodelmethods.com/auth/sign-in</p>

          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px;">Email</p>
          <p style="color: #ffffff; font-size: 15px; font-weight: bold; margin: 0 0 20px;">${email}</p>

          <p style="color: #9ca3af; font-size: 13px; margin: 0 0 6px;">Password</p>
          <p style="color: #ffffff; font-size: 15px; font-weight: bold; margin: 0; letter-spacing: 0.05em;">${plainPassword}</p>
        </div>

        <a href="https://course.aimodelmethods.com/auth/sign-in"
           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; font-weight: bold; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          Access Your Course →
        </a>

        <p style="color: #6b7280; font-size: 13px; margin-top: 32px;">
          You can change your password after logging in. If you have any issues, reply to this email.
        </p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend email error:", emailError);
    // User was created — don't fail the webhook, just log
  }

  return NextResponse.json({ ok: true });
}
