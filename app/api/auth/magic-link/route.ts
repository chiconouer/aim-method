import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const normalizedEmail = (email as string).toLowerCase().trim();

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("email", normalizedEmail)
    .single();

  // Always return success to avoid email enumeration
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: insertError } = await supabaseAdmin
    .from("magic_links")
    .insert({ email: normalizedEmail, token, expires_at: expiresAt });

  if (insertError) {
    console.error("Failed to store magic link:", insertError);
    return NextResponse.json({ error: "Failed to send link." }, { status: 500 });
  }

  const verifyUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;

  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: normalizedEmail,
    subject: "Your AIM Method Login Link",
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; background: #0a0a0a; color: #ffffff; padding: 40px 32px; border-radius: 16px;">
        <h1 style="color: #8b5cf6; font-size: 24px; margin-bottom: 8px;">Sign in to AIM Method</h1>
        <p style="color: #d1d5db; font-size: 15px; margin-bottom: 32px;">
          Hi ${user.name}, click the button below to sign in. This link expires in 15 minutes and can only be used once.
        </p>
        <a href="${verifyUrl}"
           style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: #ffffff; font-weight: bold; font-size: 15px; padding: 14px 32px; border-radius: 10px; text-decoration: none;">
          Sign In to Your Course →
        </a>
        <p style="color: #6b7280; font-size: 13px; margin-top: 32px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend error:", emailError);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
