// Digistore24 IPN webhook.
//
// Auth: requires `ipn_password` field in the payload matching env
// DIGISTORE_IPN_PASSWORD (same shared secret configured under each
// product's IPN settings in Digistore admin).
//
// Success contract: returns plaintext "OK" with status 200 on every
// handled path (including ignored events / missing optional fields).
// Digistore retries the IPN until it sees plaintext "OK" — JSON
// responses cause retry storms even when the status is 200.
//
// Product routing (5 owned products on the new Digistore account):
//   688387                 → $29 course access (welcome email + magic link)
//   688372 ($197 upsell),  → 11 AI Model photos (upsell_orders + Tally
//   688369 ($97  downsell)   preferences pipeline; mirrors Hotmart upsell)
//   688382 ($47 upsell),   → video product — NOT YET WIRED UP. Records
//   688378 ($27 downsell)    sale + Discord alert; no customer email.
//   anything else          → fallback to course access (no sales row;
//                            preserves prior behavior for unknown ids)

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";

const resend = new Resend(process.env.RESEND_API_KEY!);

const ACCEPTED_EVENTS = ["CHECKOUT_COMPLETED", "ORDER_COMPLETED"];

const PRODUCT_COURSE = "688387";
const PRODUCT_VIDEO_UPSELL = "688382";
const PRODUCT_VIDEO_DOWNSELL = "688378";
const PRODUCT_PHOTO_UPSELL = "688372";
const PRODUCT_PHOTO_DOWNSELL = "688369";

const OK_RESPONSE = () =>
  new NextResponse("OK", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

type DigistoreFields = {
  email: string | null;
  firstName: string;
  fullName: string;
  event: string | null;
  ipnPassword: string | null;
  productId: string | null;
  orderId: string | null;
  amountCents: number | null;
  currency: string | null;
  productName: string | null;
  raw: Record<string, unknown>;
};

function pickField(
  get: (k: string) => string | null,
  ...keys: string[]
): string | null {
  for (const k of keys) {
    const v = get(k);
    if (v != null && String(v).trim() !== "") return String(v);
  }
  return null;
}

function parseAmountToCents(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 100);
}

async function parseBody(req: NextRequest): Promise<DigistoreFields> {
  const contentType = req.headers.get("content-type") ?? "";
  let get: (k: string) => string | null;
  let raw: Record<string, unknown>;

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    get = (k) => params.get(k);
    raw = Object.fromEntries(params.entries());
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    raw = body;
    get = (k) => {
      const v = body[k];
      return v == null ? null : String(v);
    };
  }

  const firstName =
    pickField(
      get,
      "first_name",
      "billing_first_name",
      "address_first_name",
    ) ?? "Student";
  const lastName =
    pickField(get, "last_name", "billing_last_name", "address_last_name") ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Student";

  return {
    email: pickField(get, "email", "billing_email"),
    firstName,
    fullName,
    event: pickField(get, "event", "event_type"),
    ipnPassword: pickField(get, "ipn_password"),
    productId: pickField(get, "product_id"),
    orderId: pickField(get, "order_id", "purchase_id", "transaction_id"),
    amountCents: parseAmountToCents(pickField(get, "amount", "amount_brutto")),
    currency: pickField(get, "currency"),
    productName: pickField(get, "product_name"),
    raw,
  };
}

function courseWelcomeEmailHTML(firstName: string, loginUrl: string): string {
  return `
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
  `;
}

function photoPreferencesEmailHTML(
  firstName: string,
  preferencesUrl: string,
): string {
  return `
    <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Your custom AI model is being prepared. Tell us your preferences.</span>
    <div style="background-color:#0a0a0a;padding:48px 20px;font-family:sans-serif;">
      <div style="max-width:520px;margin:0 auto;">

        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AIM</span>
          <span style="font-size:22px;font-weight:800;color:#8b5cf6;letter-spacing:-0.5px;"> Method</span>
        </div>

        <div style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
          <div style="height:3px;background-color:#8b5cf6;"></div>
          <div style="padding:40px 36px;">

            <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Your AI model is being created! 🎨</h1>
            <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${firstName}, thanks for your purchase. We just need a few details to build your custom AI model exactly the way you want it.</p>

            <div style="text-align:center;">
              <a href="${preferencesUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Tell Us Your Preferences →</a>
            </div>

            <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
              <p style="font-size:13px;color:#9ca3af;margin:0 0 12px;line-height:1.6;">
                It takes 2 minutes. Once you submit, we&apos;ll generate 11 hyperrealistic photos of your custom AI model and email them to you within 24&ndash;48 hours in 4K quality.
              </p>
              <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
                This link is unique to your order. Don&apos;t share it.
              </p>
            </div>

          </div>
        </div>

        <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2025 AIM Method · All rights reserved</p>

      </div>
    </div>
  `;
}

async function provisionCourseAccess({
  email,
  firstName,
}: {
  email: string;
  firstName: string;
}) {
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
      console.error("[digistore-webhook] user insert error:", insertError);
      // Continue best-effort — magic link still issued so support can recover.
    }
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
    email,
    token,
    expires_at: expiresAt,
  });
  if (linkError) {
    console.error("[digistore-webhook] magic_link insert error:", linkError);
  }

  const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;
  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: email,
    subject: "Welcome to AIM Method!",
    html: courseWelcomeEmailHTML(firstName, loginUrl),
  });
  if (emailError) {
    console.error("[digistore-webhook] welcome email error:", emailError);
  } else {
    console.log(`[digistore-webhook] welcome email sent to ${email}`);
  }
}

async function provisionPhotoOrder({
  email,
  firstName,
  fullName,
  orderId,
  productId,
}: {
  email: string;
  firstName: string;
  fullName: string;
  orderId: string | null;
  productId: string;
}): Promise<{ ok: boolean; reason?: string }> {
  if (!orderId) {
    const reason = "missing order_id — cannot create idempotent upsell row";
    console.error(
      `[digistore-webhook] photo order ${reason}. email=${email} product=${productId}`,
    );
    return { ok: false, reason };
  }

  const externalId = `digistore:${orderId}`;
  const notes = `digistore_photo: product_id=${productId} order_id=${orderId}`;

  const { error: upsertErr } = await supabaseAdmin
    .from("upsell_orders")
    .upsert(
      {
        hotmart_transaction_id: externalId,
        customer_email: email,
        customer_name: fullName || null,
        status: "pending",
        notes,
      },
      {
        onConflict: "hotmart_transaction_id",
        ignoreDuplicates: true,
      },
    );
  if (upsertErr) {
    console.error(
      `[digistore-webhook] upsell_orders upsert error orderId=${orderId} err=${upsertErr.message}`,
    );
    return { ok: false, reason: `upsert failed: ${upsertErr.message}` };
  }

  const { data: row, error: selectErr } = await supabaseAdmin
    .from("upsell_orders")
    .select("id")
    .eq("hotmart_transaction_id", externalId)
    .single();
  if (selectErr || !row) {
    console.error(
      `[digistore-webhook] upsell_orders select-back error orderId=${orderId} err=${selectErr?.message}`,
    );
    return {
      ok: false,
      reason: `select-back failed: ${selectErr?.message ?? "no row"}`,
    };
  }

  const preferencesUrl = `https://aimodelmethods.com/upsell-2/preferences/${row.id}`;
  const greetingFirstName = firstName || "there";

  const { error: emailErr } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: email,
    subject: "Tell us about your AI model 🎨",
    html: photoPreferencesEmailHTML(greetingFirstName, preferencesUrl),
  });
  if (emailErr) {
    console.error(
      `[digistore-webhook] photo preferences email error orderId=${orderId}:`,
      emailErr,
    );
    return { ok: false, reason: "preferences email failed" };
  }

  console.log(
    `[digistore-webhook] photo order created order_id=${row.id} email=${email} digistore_order=${orderId}`,
  );
  return { ok: true };
}

async function insertDigistoreSale({
  email,
  fields,
}: {
  email: string;
  fields: DigistoreFields;
}) {
  if (!fields.orderId) {
    console.error(
      `[digistore-webhook] sales insert SKIPPED — no order_id in payload. email=${email}`,
    );
    return;
  }

  const upperCurrency = (fields.currency ?? "USD").toUpperCase();
  const { error } = await supabaseAdmin.from("sales").upsert(
    {
      hotmart_transaction_id: `digistore:${fields.orderId}`,
      buyer_name: fields.fullName || null,
      buyer_email: email,
      amount_cents: fields.amountCents ?? 0,
      currency: upperCurrency,
      product_name: fields.productName ?? null,
      status: "approved",
      occurred_at: new Date().toISOString(),
      raw_payload: {
        source: "digistore",
        order_id: fields.orderId,
        product_id: fields.productId,
        body: fields.raw,
      },
    },
    { onConflict: "hotmart_transaction_id", ignoreDuplicates: true },
  );
  if (error) {
    console.error(
      `[digistore-webhook] sales insert FAILED — code=${(error as { code?: string }).code ?? "?"} message="${error.message}" orderId=${fields.orderId} email=${email}`,
    );
  } else {
    console.log(
      `[digistore-webhook] sales row recorded orderId=${fields.orderId} email=${email} amount=${fields.amountCents ?? 0}`,
    );
  }
}

export async function POST(req: NextRequest) {
  // ============================================================
  // 1. Server config check
  // ============================================================
  const expectedPassword = process.env.DIGISTORE_IPN_PASSWORD;
  if (!expectedPassword) {
    console.error("[digistore-webhook] DIGISTORE_IPN_PASSWORD not set");
    return new NextResponse("Server not configured", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ============================================================
  // 2. Parse body (form-urlencoded or JSON)
  // ============================================================
  const fields = await parseBody(req);

  // DEBUG (TEMPORARY — remove once Digistore field names are confirmed):
  // Real IPN calls are getting 401 because the password field name we
  // assumed (`ipn_password`) may not match what Digistore actually sends.
  // Logs ONLY the list of incoming field names + content-type; never
  // the values, so no secret/PII leaks into Vercel logs.
  console.log(
    `[digistore-webhook][DEBUG] content-type="${req.headers.get("content-type") ?? ""}" body_keys=[${Object.keys(fields.raw).join(", ")}] keys_count=${Object.keys(fields.raw).length}`,
  );

  // ============================================================
  // 3. Auth gate — reject before any side effects
  // ============================================================
  if (!fields.ipnPassword || fields.ipnPassword !== expectedPassword) {
    console.warn(
      `[digistore-webhook] Rejected: invalid or missing ipn_password (productId=${fields.productId}, email=${fields.email})`,
    );
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ============================================================
  // 4. Event filter (preserve existing accepted-events behavior)
  // ============================================================
  if (fields.event && !ACCEPTED_EVENTS.includes(fields.event)) {
    console.log(`[digistore-webhook] Event ignored: ${fields.event}`);
    return OK_RESPONSE();
  }

  if (!fields.email) {
    console.error(
      "[digistore-webhook] No email in payload — cannot provision. Returning OK to stop retries.",
    );
    return OK_RESPONSE();
  }

  const email = fields.email.toLowerCase().trim();
  const productId = fields.productId ?? "";

  console.log(
    `[digistore-webhook] received product_id=${productId} order_id=${fields.orderId} email=${email} event=${fields.event}`,
  );

  // ============================================================
  // BRANCH A: photo delivery — 688372 ($197) / 688369 ($97)
  // Mirrors the Hotmart photo upsell pipeline (upsell_orders +
  // Tally preferences flow). Same downstream pipeline generates
  // the 11 photos and delivers them.
  // ============================================================
  if (
    productId === PRODUCT_PHOTO_UPSELL ||
    productId === PRODUCT_PHOTO_DOWNSELL
  ) {
    const result = await provisionPhotoOrder({
      email,
      firstName: fields.firstName,
      fullName: fields.fullName,
      orderId: fields.orderId,
      productId,
    });
    await insertDigistoreSale({ email, fields });
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "AI Model photos (11)",
      extraNote: result.ok
        ? null
        : `⚠️ Photo provisioning FAILED: ${result.reason}. Customer paid — reach out manually.`,
    });
    return OK_RESPONSE();
  }

  // ============================================================
  // BRANCH B: video product — 688382 ($47) / 688378 ($27)
  // TODO: wire up $47/$27 video delivery once the video is
  // recorded & hosted. For now: log the sale, write the sales
  // row, fire the Discord notification. NO customer email is
  // sent because there's no product to deliver yet.
  // ============================================================
  if (
    productId === PRODUCT_VIDEO_UPSELL ||
    productId === PRODUCT_VIDEO_DOWNSELL
  ) {
    console.warn(
      `[digistore-webhook] VIDEO PRODUCT SOLD product_id=${productId} email=${email} order_id=${fields.orderId} — no delivery wired up yet`,
    );
    await insertDigistoreSale({ email, fields });
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "Video product",
      extraNote:
        "⚠️ Video product paid — NO DELIVERY WIRED UP YET. Customer was charged but received no email. Reach out manually.",
    });
    return OK_RESPONSE();
  }

  // ============================================================
  // BRANCH C: course (688387) + unknown fallback
  // Course access flow (existing $29 logic, extracted into
  // provisionCourseAccess). For the owned course id, write to
  // sales. For unknown ids, provision access as fallback but
  // skip the sales row and flag the unknown id in Discord.
  // ============================================================
  await provisionCourseAccess({ email, firstName: fields.firstName });

  if (productId === PRODUCT_COURSE) {
    await insertDigistoreSale({ email, fields });
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "AIM Method (course)",
    });
  } else {
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "Unknown product",
      extraNote: `⚠️ Unrecognized product_id="${productId}" — provisioned course access as fallback. Verify this isn't a misconfiguration.`,
    });
  }

  return OK_RESPONSE();
}
