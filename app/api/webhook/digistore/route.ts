// Digistore24 IPN webhook.
//
// Auth: validates Digistore24's official SHA-512 signature in the
// `sha_sign` field. Algorithm (per Digistore's reference PHP impl):
//   1. Drop sha_sign / SHASIGN from the params.
//   2. Sort remaining keys lexicographically (case-sensitive).
//   3. Build the string concat "${key}=${value}${passphrase}" for
//      every non-empty value, in sorted order.
//   4. SHA-512 hex, uppercase.
//   5. Constant-time compare against the received sha_sign.
// The passphrase is read from env DIGISTORE_IPN_PASSWORD (this env
// var holds the Digistore "SHA passphrase for IPN" string set under
// Account → Settings → Master data).
//
// Success contract: returns plaintext "OK" with status 200 on every
// handled path (including ignored events / missing optional fields).
// Digistore retries the IPN until it sees plaintext "OK" — JSON
// responses cause retry storms even when the status is 200.
//
// Product routing (5 owned products on the Digistore account):
//   688952                 → $29 course access (welcome email + magic link)
//   688942                 → $197 11 AI Model photos (upsell_orders + Tally
//                            preferences pipeline; mirrors Hotmart upsell)
//   688941                 → $47 "3x More Results" PDF — auto-emails the
//                            download link when UPSELL_47_PDF_URL is set;
//                            sale-only + Discord alert while URL is empty.
//   688946                 → Lifetime access order bump — INERT for now
//                            (sale + Discord notify; no email, no delivery).
//   688943                 → Weekly content calendar order bump — INERT for
//                            now (sale + Discord notify; no email, no delivery).
//   anything else          → fallback to course access (no sales row;
//                            preserves prior behavior for unknown ids)

import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";

const resend = new Resend(process.env.RESEND_API_KEY!);

// Digistore IPN event names (per Digistore24 dev docs Events page).
// Only on_payment triggers delivery; refund/chargeback are handled
// separately. All other events (subscription / rebill / affiliate
// signup / etc.) are silently 200-OK'd.
const PAYMENT_EVENTS = ["on_payment"];
const REFUNDED_EVENTS = ["on_refund", "on_chargeback"];

const PRODUCT_COURSE = "688952";
const PRODUCT_PHOTO = "688942";
const PRODUCT_PDF_47 = "688941";
const PRODUCT_LIFETIME_BUMP = "688946";
const PRODUCT_WEEKLY_BUMP = "688943";

// TODO: paste the $47 PDF URL here when ready.
// While empty, $47 sales are recorded + Discord-notified but the
// buyer receives no email (no broken download link). Pasting the
// URL flips the flow live — no other change required.
const UPSELL_47_PDF_URL = "";

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
  productId: string | null;
  orderId: string | null;
  amountCents: number | null;
  currency: string | null;
  productName: string | null;
  raw: Record<string, unknown>;
};

// ============================================================
// SHA signature validation — port of Digistore24's official
// digistore_signature() PHP function.
// Reference: https://www.digistore24.com/download/ipn/examples/ipn/sha_sign.php
// ============================================================
const SIGNATURE_EXCLUDED_KEYS = new Set(["sha_sign", "SHASIGN"]);

function computeDigistoreSignature(
  passphrase: string,
  params: Record<string, unknown>,
): string {
  const keys = Object.keys(params)
    .filter((k) => !SIGNATURE_EXCLUDED_KEYS.has(k))
    // Lexicographic case-sensitive sort — matches PHP `SORT_STRING`
    // with `$sort_case_sensitive = true` (Digistore's default).
    .sort();

  let shaString = "";
  for (const key of keys) {
    const raw = params[key];
    // Skip empties — matches PHP `!isset($v) || $v === "" || $v === false`.
    if (raw === null || raw === undefined || raw === false) continue;
    const value = String(raw);
    if (value === "") continue;
    shaString += `${key}=${value}${passphrase}`;
  }

  return createHash("sha512")
    .update(shaString, "utf8")
    .digest("hex")
    .toUpperCase();
}

function verifyDigistoreSignature(
  passphrase: string,
  params: Record<string, unknown>,
  received: string | null | undefined,
): boolean {
  if (!received || typeof received !== "string") return false;
  const expected = computeDigistoreSignature(passphrase, params);
  // Length check before timingSafeEqual — buffers must match length
  // or it throws. Valid signatures are always 128 hex chars (SHA-512).
  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

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
      "buyer_first_name",
      "first_name",
      "billing_first_name",
      "address_first_name",
    ) ?? "Student";
  const lastName =
    pickField(
      get,
      "buyer_last_name",
      "last_name",
      "billing_last_name",
      "address_last_name",
    ) ?? "";
  const fullName = `${firstName} ${lastName}`.trim() || "Student";

  return {
    email: pickField(get, "buyer_email", "email", "billing_email"),
    firstName,
    fullName,
    event: pickField(get, "event", "event_type"),
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

function pdfDeliveryEmailHTML(firstName: string, pdfUrl: string): string {
  return `
    <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Your 3x More Results PDF is ready to download</span>
    <div style="background-color:#0a0a0a;padding:48px 20px;font-family:sans-serif;">
      <div style="max-width:520px;margin:0 auto;">

        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AIM</span>
          <span style="font-size:22px;font-weight:800;color:#8b5cf6;letter-spacing:-0.5px;"> Method</span>
        </div>

        <div style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
          <div style="height:3px;background-color:#8b5cf6;"></div>
          <div style="padding:40px 36px;">

            <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Your 3x More Results PDF 📄</h1>
            <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${firstName}, thanks for your purchase. Your guide is ready — download it below.</p>

            <div style="text-align:center;">
              <a href="${pdfUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Download PDF →</a>
            </div>

            <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
              <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
                Save the file once you download it — bookmark the PDF locally so you always have it on hand.
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

// Refund / chargeback dispatch.
// For the photo product, mark the upsell_orders row "refunded"
// (mirrors the Hotmart refund pattern). For the course and the PDF
// products, refund is informational only — no automatic access
// revocation, no PDF email rollback (matches Hotmart behavior for
// the $29 course flow); owner handles manually via Discord notification.
async function handleDigistoreRefund({
  event,
  fields,
}: {
  event: string;
  fields: DigistoreFields;
}) {
  const productId = fields.productId ?? "";
  const orderId = fields.orderId;
  const email = fields.email?.toLowerCase().trim() ?? "";

  const isPhoto = productId === PRODUCT_PHOTO;

  if (isPhoto && orderId) {
    const { error } = await supabaseAdmin
      .from("upsell_orders")
      .update({ status: "refunded" })
      .eq("hotmart_transaction_id", `digistore:${orderId}`);
    if (error) {
      console.error(
        `[digistore-webhook] refund update error orderId=${orderId} err=${error.message}`,
      );
    } else {
      console.log(
        `[digistore-webhook] photo order refunded orderId=${orderId} event=${event}`,
      );
    }
  } else if (isPhoto && !orderId) {
    console.warn(
      `[digistore-webhook] photo refund missing order_id — cannot match row. event=${event} email=${email}`,
    );
  } else {
    console.log(
      `[digistore-webhook] refund logged (no DB rollback) productId=${productId} orderId=${orderId} event=${event}`,
    );
  }

  await notifySale({
    channel: "digistore",
    eventKind: "refund",
    email,
    name: fields.fullName,
    amountCents: fields.amountCents,
    currency: fields.currency,
    product: fields.productName ?? `product_id=${productId}`,
    extraNote: `Event: ${event} · order_id=${orderId ?? "?"}`,
  });
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

  // ============================================================
  // 3. Auth gate — SHA-512 signature validation (Digistore spec)
  // ============================================================
  const receivedSign =
    (fields.raw["sha_sign"] as string | undefined) ??
    (fields.raw["SHASIGN"] as string | undefined) ??
    null;
  const signatureValid = verifyDigistoreSignature(
    expectedPassword,
    fields.raw,
    receivedSign,
  );
  if (!signatureValid) {
    console.warn(
      `[digistore-webhook] Rejected: sha_sign invalid or missing (productId=${fields.productId}, sig_present=${!!receivedSign}, sig_len=${receivedSign?.length ?? 0})`,
    );
    return new NextResponse("Unauthorized", {
      status: 401,
      headers: { "Content-Type": "text/plain" },
    });
  }

  // ============================================================
  // 4. Event dispatch
  //    - on_refund / on_chargeback → handleDigistoreRefund
  //    - on_payment                → delivery path below
  //    - everything else           → silently ignored (200 OK)
  // ============================================================
  const event = fields.event ?? "";

  if (REFUNDED_EVENTS.includes(event)) {
    await handleDigistoreRefund({ event, fields });
    return OK_RESPONSE();
  }

  if (!PAYMENT_EVENTS.includes(event)) {
    console.log(`[digistore-webhook] Event ignored: ${event || "(missing)"}`);
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
    `[digistore-webhook] received product_id=${productId} order_id=${fields.orderId} email=${email} event=${event}`,
  );

  // ============================================================
  // BRANCH A: photo delivery — 688942 ($197)
  // Mirrors the Hotmart photo upsell pipeline (upsell_orders +
  // Tally preferences flow). Same downstream pipeline generates
  // the 11 photos and delivers them.
  // ============================================================
  if (productId === PRODUCT_PHOTO) {
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
  // BRANCH B: PDF delivery — 688941 ($47 "3x More Results")
  // Auto-emails the download link when UPSELL_47_PDF_URL is set.
  // While the constant is empty, records the sale + fires a loud
  // Discord alert so the owner knows to deliver manually — no
  // broken-link email goes to the buyer. Pasting the URL flips
  // this to live delivery on the very next sale, no other change.
  // ============================================================
  if (productId === PRODUCT_PDF_47) {
    await insertDigistoreSale({ email, fields });

    if (UPSELL_47_PDF_URL.length > 0) {
      const { error: emailErr } = await resend.emails.send({
        from: "AIM Method <noreply@aimodelmethods.com>",
        to: email,
        subject: "Your 3x More Results PDF is ready 📄",
        html: pdfDeliveryEmailHTML(fields.firstName, UPSELL_47_PDF_URL),
      });
      if (emailErr) {
        console.error(
          `[digistore-webhook] PDF email error orderId=${fields.orderId}:`,
          emailErr,
        );
      } else {
        console.log(
          `[digistore-webhook] PDF email sent to ${email} orderId=${fields.orderId}`,
        );
      }

      await notifySale({
        channel: "digistore",
        email,
        name: fields.fullName,
        amountCents: fields.amountCents,
        currency: fields.currency,
        product: fields.productName ?? "3x More Results PDF",
        extraNote: emailErr
          ? `⚠️ PDF email FAILED to send: ${emailErr.message ?? "unknown"}. Customer paid — reach out manually.`
          : null,
      });
    } else {
      console.warn(
        `[digistore-webhook] PDF PRODUCT SOLD product_id=${productId} email=${email} order_id=${fields.orderId} — UPSELL_47_PDF_URL is empty, no email sent`,
      );
      await notifySale({
        channel: "digistore",
        email,
        name: fields.fullName,
        amountCents: fields.amountCents,
        currency: fields.currency,
        product: fields.productName ?? "3x More Results PDF",
        extraNote:
          "⚠️ $47 PDF product paid — NO PDF URL configured yet. Customer was charged but received no email. Set UPSELL_47_PDF_URL or reach out manually.",
      });
    }
    return OK_RESPONSE();
  }

  // ============================================================
  // BRANCH D: Lifetime access order bump — 688946
  // INERT for now — records the sale + alerts Discord, no email,
  // no delivery. Owner extends course access manually until the
  // automated extension is built.
  // TODO: extend course access duration when Lifetime delivery is built.
  // ============================================================
  if (productId === PRODUCT_LIFETIME_BUMP) {
    console.warn(
      `[digistore-webhook] LIFETIME ORDER BUMP SOLD product_id=${productId} email=${email} order_id=${fields.orderId} — no delivery wired up yet`,
    );
    await insertDigistoreSale({ email, fields });
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "Lifetime access bump",
      extraNote:
        "⚠️ Lifetime access order bump paid — DELIVERY NOT WIRED YET. Customer was charged but received no email. Extend their course access manually (3-4 years) until the automated extension is built.",
    });
    return OK_RESPONSE();
  }

  // ============================================================
  // BRANCH E: Weekly content calendar order bump — 688943
  // INERT for now — records the sale + alerts Discord, no email,
  // no delivery. Owner delivers the weekly calendar/prompts manually
  // until the subscription automation is built.
  // TODO: build weekly calendar automation when subscription delivery is ready.
  // ============================================================
  if (productId === PRODUCT_WEEKLY_BUMP) {
    console.warn(
      `[digistore-webhook] WEEKLY CALENDAR ORDER BUMP SOLD product_id=${productId} email=${email} order_id=${fields.orderId} — no delivery wired up yet`,
    );
    await insertDigistoreSale({ email, fields });
    await notifySale({
      channel: "digistore",
      email,
      name: fields.fullName,
      amountCents: fields.amountCents,
      currency: fields.currency,
      product: fields.productName ?? "Weekly content calendar bump",
      extraNote:
        "⚠️ Weekly content calendar order bump paid — DELIVERY NOT WIRED YET. Customer was charged but received no email. Deliver the weekly calendar + prompts manually until the subscription automation is built.",
    });
    return OK_RESPONSE();
  }

  // ============================================================
  // BRANCH C: course (688952) + unknown fallback
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
