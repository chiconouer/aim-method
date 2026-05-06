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

              <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Your Login Link</h1>
              <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${user.name}, click below to sign in. This link expires in <strong style="color:#ffffff;">15 minutes</strong> and can only be used once.</p>

              <div style="text-align:center;">
                <a href="${verifyUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:12px;">Access Your Course →</a>
                <br>
                <a href="https://discord.gg/9ZdNpbbfC" style="display:inline-block;background-color:#5865F2;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:12px;">💬 Join Our Community on Discord</a>
              </div>

              <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
                <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                  If you didn't request this link, you can safely ignore this email. It will expire on its own.
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
    console.error("Resend error:", emailError);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
