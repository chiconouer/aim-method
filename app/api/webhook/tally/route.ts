import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const LOG = "[tally-webhook]";

interface TallyOption {
  id: string;
  text: string;
}

interface TallyField {
  key?: string;
  label?: string;
  type?: string;
  value?: unknown;
  options?: TallyOption[];
}

interface TallyPayload {
  eventId?: string;
  eventType?: string;
  createdAt?: string;
  data?: {
    responseId?: string;
    submissionId?: string;
    respondentId?: string;
    formId?: string;
    formName?: string;
    createdAt?: string;
    fields?: TallyField[];
  };
}

// Dropdown / multiple-choice fields come back with `value` as an option id
// (or array of ids). Translate id → human-readable text using the field's
// own `options` table. Falls through to the raw value for non-choice fields.
function resolveFieldValue(field: TallyField): unknown {
  const value = field.value;
  if (field.options && Array.isArray(field.options)) {
    if (typeof value === "string") {
      const opt = field.options.find((o) => o.id === value);
      return opt ? opt.text : value;
    }
    if (Array.isArray(value)) {
      return value.map((v) => {
        if (typeof v === "string") {
          const opt = field.options!.find((o) => o.id === v);
          return opt ? opt.text : v;
        }
        return v;
      });
    }
  }
  return value;
}

// Match by case-insensitive label substring. ALL keywords must appear
// (used so "hair color" and "hair length" don't collide on just "hair").
function findFieldByLabel(
  fields: TallyField[],
  ...keywords: string[]
): TallyField | undefined {
  for (const field of fields) {
    const label = (field.label || "").toLowerCase();
    if (keywords.every((kw) => label.includes(kw.toLowerCase()))) return field;
  }
  return undefined;
}

// Hidden fields: match by exact label OR key name (whichever the customer
// configured in the Tally dashboard).
function findHiddenField(
  fields: TallyField[],
  name: string,
): TallyField | undefined {
  const target = name.toLowerCase();
  for (const field of fields) {
    if ((field.label || "").toLowerCase() === target) return field;
    if ((field.key || "").toLowerCase() === target) return field;
  }
  return undefined;
}

// Fire-and-forget the generation pipeline. Retries once on transient failure.
async function invokeGenerateImages(
  orderId: string,
): Promise<{ ok: boolean; error?: string }> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const { error } = await supabaseAdmin.functions.invoke("generate-images", {
        body: { order_id: orderId },
      });
      if (!error) return { ok: true };
      console.error(
        `${LOG} invoke attempt ${attempt} failed orderId=${orderId} err=${error.message}`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(
        `${LOG} invoke attempt ${attempt} threw orderId=${orderId} err=${msg}`,
      );
    }
    if (attempt < 2) await new Promise((r) => setTimeout(r, 500));
  }
  return { ok: false, error: "generate-images invoke failed after 2 attempts" };
}

export async function POST(req: NextRequest) {
  const payload: TallyPayload | null = await req.json().catch(() => null);

  if (!payload || !payload.data) {
    console.error(`${LOG} invalid payload`);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const fields = payload.data.fields ?? [];
  const submissionId =
    payload.data.submissionId || payload.data.responseId || null;

  // 1. Extract order_id from hidden field
  const orderIdField = findHiddenField(fields, "order_id");
  const rawOrderId =
    typeof orderIdField?.value === "string" ? orderIdField.value.trim() : null;

  if (!rawOrderId || !UUID_RE.test(rawOrderId)) {
    console.error(
      `${LOG} missing or invalid order_id="${rawOrderId}" submissionId=${submissionId}`,
    );
    return NextResponse.json(
      { error: "Missing or invalid order_id hidden field" },
      { status: 400 },
    );
  }
  const orderId = rawOrderId;

  // 2. Fetch the order (need customer_email + notes too for reliability work)
  const { data: order, error: fetchErr } = await supabaseAdmin
    .from("upsell_orders")
    .select("id, status, customer_email, notes")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchErr) {
    console.error(
      `${LOG} db fetch error orderId=${orderId} err=${fetchErr.message}`,
    );
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
  if (!order) {
    // Tally retrying won't conjure a row that doesn't exist — return 200.
    console.error(`${LOG} order not found orderId=${orderId}`);
    return NextResponse.json(
      { ok: false, reason: "order_not_found" },
      { status: 200 },
    );
  }

  // 3. Idempotency — short-circuit if order already advanced past pending
  if (order.status !== "pending") {
    console.log(
      `${LOG} order already submitted status=${order.status} orderId=${orderId} submissionId=${submissionId}`,
    );
    return NextResponse.json(
      { ok: true, skipped: true, reason: "already_submitted" },
      { status: 200 },
    );
  }

  // 4. Map known fields by label keyword
  const ageField = findFieldByLabel(fields, "age");
  const ethnicityField = findFieldByLabel(fields, "ethnicity");
  const hairColorField = findFieldByLabel(fields, "hair", "color");
  const hairLengthField = findFieldByLabel(fields, "hair", "length");
  const eyeColorField = findFieldByLabel(fields, "eye");
  const bodyTypeField = findFieldByLabel(fields, "body");
  const aestheticField = findFieldByLabel(fields, "aesthetic");
  const referenceField = findFieldByLabel(fields, "reference");
  const emailField = findFieldByLabel(fields, "email");

  const asStr = (f?: TallyField): string | null => {
    if (!f) return null;
    const v = resolveFieldValue(f);
    if (v === null || v === undefined) return null;
    const s = String(v).trim();
    return s || null;
  };

  const formResponses: Record<string, unknown> = {
    age: asStr(ageField),
    ethnicity: asStr(ethnicityField),
    hair_color: asStr(hairColorField),
    hair_length: asStr(hairLengthField),
    eye_color: asStr(eyeColorField),
    body_type: asStr(bodyTypeField),
    aesthetic: asStr(aestheticField),
    tally_submission_id: submissionId,
    tally_email: asStr(emailField),
  };

  // Warn (don't fail) on missing critical fields — generate-images has
  // sensible defaults but we want operational visibility if the Tally form
  // is mis-configured.
  for (const key of [
    "age",
    "ethnicity",
    "hair_color",
    "hair_length",
    "eye_color",
    "body_type",
    "aesthetic",
  ]) {
    if (!formResponses[key]) {
      console.warn(
        `${LOG} missing field "${key}" orderId=${orderId} submissionId=${submissionId}`,
      );
    }
  }

  // Source-of-truth: customer_email from Hotmart wins. Tally email is logged
  // only — if they diverge it's almost always the customer mistyping the
  // form, and we'd rather mail the address they paid with.
  if (typeof formResponses.tally_email === "string") {
    const tallyEmailNorm = (formResponses.tally_email as string)
      .toLowerCase()
      .trim();
    const hotmartEmailNorm = (order.customer_email || "").toLowerCase().trim();
    if (
      tallyEmailNorm &&
      hotmartEmailNorm &&
      tallyEmailNorm !== hotmartEmailNorm
    ) {
      console.warn(
        `${LOG} email mismatch orderId=${orderId} hotmart=${hotmartEmailNorm} tally=${tallyEmailNorm} — using hotmart`,
      );
    }
  }

  // 5. Pull reference image URL out of the FILE_UPLOAD field (optional)
  let referenceImageUrl: string | null = null;
  if (
    referenceField &&
    Array.isArray(referenceField.value) &&
    referenceField.value.length > 0
  ) {
    const file = referenceField.value[0] as Record<string, unknown>;
    if (typeof file.url === "string") referenceImageUrl = file.url;
  }

  // 6. Persist form data + flip status atomically
  const { error: updateErr } = await supabaseAdmin
    .from("upsell_orders")
    .update({
      form_responses: formResponses,
      reference_image_url: referenceImageUrl,
      status: "form_submitted",
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (updateErr) {
    console.error(
      `${LOG} db update failed orderId=${orderId} err=${updateErr.message}`,
    );
    // 500 so Tally retries — re-applying the same update is safe (idempotent).
    return NextResponse.json({ error: "DB update failed" }, { status: 500 });
  }

  console.log(
    `${LOG} order ${orderId} → form_submitted, invoking generate-images`,
  );

  // 7. Fire the generation pipeline (with retry)
  const invokeResult = await invokeGenerateImages(orderId);

  if (!invokeResult.ok) {
    // Mark the order so admins can spot stuck pipelines without ambiguity.
    // Append to existing notes (preserves offer_code=... from Hotmart webhook).
    const failureNote = `INVOKE_FAILED: ${invokeResult.error}`;
    const mergedNotes = order.notes
      ? `${order.notes}; ${failureNote}`
      : failureNote;

    await supabaseAdmin
      .from("upsell_orders")
      .update({
        notes: mergedNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    console.error(
      `${LOG} order ${orderId} stuck in form_submitted — generate-images invoke failed permanently`,
    );

    // 200 to Tally — data is safe, retry would just no-op (status check).
    // Recovery is admin re-invoke or a future cron picker.
    return NextResponse.json(
      { ok: true, warning: "data_saved_but_invoke_failed" },
      { status: 200 },
    );
  }

  console.log(`${LOG} order ${orderId} pipeline started successfully`);
  return NextResponse.json({ ok: true }, { status: 200 });
}
