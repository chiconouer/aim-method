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

  // Typeform sends responses under form_response
  const answers: Array<Record<string, unknown>> = body?.form_response?.answers ?? [];
  const definitionFields: Array<Record<string, unknown>> =
    body?.form_response?.definition?.fields ?? [];
  const response = body?.form_response ?? {};

  // Extract email from the first answer of type "email"
  const emailAnswer = answers.find((a) => a?.type === "email");
  const email = typeof emailAnswer?.email === "string" ? emailAnswer.email.toLowerCase().trim() : null;

  // Extract name from the first answer of type "text" (name field)
  const nameAnswer = answers.find((a) => a?.type === "text");
  const firstName = typeof nameAnswer?.text === "string" ? nameAnswer.text.split(" ")[0] || "there" : "there";

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

  const fieldTitleById = new Map<string, string>();
  for (const field of definitionFields) {
    const id = typeof field?.id === "string" ? field.id : null;
    const title = typeof field?.title === "string" ? field.title : null;
    if (id && title) fieldTitleById.set(id, title);
  }

  const cleanAnswers: Record<string, unknown> = {};
  for (const answer of answers) {
    const field = (answer?.field ?? {}) as Record<string, unknown>;
    const fieldId = typeof field.id === "string" ? field.id : null;
    const fallbackRef = typeof field.ref === "string" ? field.ref : null;
    const key = (fieldId && fieldTitleById.get(fieldId)) || fallbackRef || fieldId;
    if (!key) continue;

    const type = typeof answer?.type === "string" ? answer.type : "";
    let value: unknown = null;

    if (type === "text" && typeof answer?.text === "string") value = answer.text;
    else if (type === "email" && typeof answer?.email === "string") value = answer.email;
    else if (type === "phone_number" && typeof answer?.phone_number === "string") value = answer.phone_number;
    else if (type === "number" && typeof answer?.number === "number") value = answer.number;
    else if (type === "boolean" && typeof answer?.boolean === "boolean") value = answer.boolean;
    else if (type === "date" && typeof answer?.date === "string") value = answer.date;
    else if (type === "choice" && answer?.choice && typeof answer.choice === "object") {
      const choice = answer.choice as Record<string, unknown>;
      if (typeof choice.label === "string") value = choice.label;
      else value = choice;
    } else if (type === "choices" && answer?.choices && typeof answer.choices === "object") {
      const choices = answer.choices as Record<string, unknown>;
      if (Array.isArray(choices.labels)) value = choices.labels;
      else value = choices;
    } else if (type === "url" && typeof answer?.url === "string") value = answer.url;
    else value = answer;

    cleanAnswers[key] = value;
  }

  const answerEntries = Object.entries(cleanAnswers);
  const firstByHint = (hint: string) =>
    answerEntries.find(([k]) => k.toLowerCase().includes(hint.toLowerCase()))?.[1];

  const fullNameRaw = firstByHint("full name") ?? firstByHint("name");
  const firstNameRaw = firstByHint("first name");
  const lastNameRaw = firstByHint("last name");
  const applicantName =
    typeof fullNameRaw === "string"
      ? fullNameRaw
      : [firstNameRaw, lastNameRaw]
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .join(" ") || null;

  const applicantEmailRaw = firstByHint("email");
  const applicantEmail =
    typeof applicantEmailRaw === "string" ? applicantEmailRaw.toLowerCase().trim() : email;

  const responseId =
    (typeof response?.token === "string" ? response.token : null) ??
    (typeof response?.response_id === "string" ? response.response_id : null);

  if (!responseId) {
    console.error("Typeform applies insert skipped: missing response token/response_id.");
  } else {
    const submittedAt =
      (typeof response?.submitted_at === "string" ? response.submitted_at : null) ??
      new Date().toISOString();

    const { error: appliesInsertError } = await supabaseAdmin.from("applies").upsert(
      {
        typeform_response_id: responseId,
        applicant_name: applicantName,
        applicant_email: applicantEmail,
        answers: cleanAnswers,
        raw_payload: body,
        submitted_at: submittedAt,
      },
      { onConflict: "typeform_response_id", ignoreDuplicates: true }
    );

    if (appliesInsertError) {
      // Keep webhook response successful to avoid retries and duplicate emails.
      console.error("Failed to persist apply record:", appliesInsertError);
    }

    const appliesRealtimeWebhook = process.env.DISCORD_WEBHOOK_APPLIES_REALTIME;
    if (appliesRealtimeWebhook) {
      const answersLines = Object.entries(cleanAnswers).map(([question, answer]) => {
        const value =
          typeof answer === "string" || typeof answer === "number" || typeof answer === "boolean"
            ? String(answer)
            : JSON.stringify(answer);
        return `📝 **${question}**: ${value}`;
      });
      const content = [
        "📋 **NEW 1-ON-1 APPLY** 📋",
        "━━━━━━━━━━━━━━━━━━",
        `👤 **${applicantName ?? "Unknown Applicant"}**`,
        `📧 ${applicantEmail ?? "No email"}`,
        `⏰ Submitted at ${formatEtTimestamp(submittedAt)}`,
        "",
        "**Answers:**",
        ...answersLines,
        "",
        "🔗 [View in Typeform](https://admin.typeform.com/form/javrkILE/results#responses)",
      ].join("\n");

      try {
        await postToDiscordWebhook(appliesRealtimeWebhook, content);
      } catch (discordError) {
        console.error("Failed to post realtime applies Discord message:", discordError);
      }
    }
  }

  return NextResponse.json({ ok: true });
}
