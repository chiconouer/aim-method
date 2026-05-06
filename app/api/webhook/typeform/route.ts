import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Typeform sends responses under form_response
  const answers: { type: string; email?: string; text?: string }[] =
    body?.form_response?.answers ?? [];

  // Extract email from the first answer of type "email"
  const emailAnswer = answers.find((a) => a.type === "email");
  const email = emailAnswer?.email?.toLowerCase().trim() ?? null;

  // Extract name from the first answer of type "text" (name field)
  const nameAnswer = answers.find((a) => a.type === "text");
  const firstName = nameAnswer?.text?.split(" ")[0] || "there";

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: email,
    subject: "You're In! Book Your Call - AIM Method",
    html: `
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
    `,
  });

  if (emailError) {
    console.error("Resend email error:", emailError);
    return NextResponse.json({ error: "Failed to send email." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
