import { NextRequest, NextResponse } from "next/server";
import { processApply } from "@/lib/applies";

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

  // Email from the first answer of type "email"
  const emailAnswer = answers.find((a) => a?.type === "email");
  const email = typeof emailAnswer?.email === "string" ? emailAnswer.email.toLowerCase().trim() : null;

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  // Build field id → title map so cleanAnswers keys are human-readable.
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

  // Resolve applicant name + email by matching field-title hints.
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

  const sourceId =
    (typeof response?.token === "string" ? response.token : null) ??
    (typeof response?.response_id === "string" ? response.response_id : null);

  if (!sourceId) {
    console.error("Typeform applies skipped: missing response token/response_id.");
    return NextResponse.json({ ok: true });
  }

  const submittedAt =
    (typeof response?.submitted_at === "string" ? response.submitted_at : null) ??
    new Date().toISOString();

  await processApply({
    name: applicantName ?? "",
    email: applicantEmail,
    answers: cleanAnswers,
    sourceId,
    rawPayload: body,
    submittedAt,
  });

  return NextResponse.json({ ok: true });
}
