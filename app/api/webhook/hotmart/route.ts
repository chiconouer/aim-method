import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";

const resend = new Resend(process.env.RESEND_API_KEY!);

// =============================================================
// BULLETPROOF PAYLOAD PARSING — Postback 2.0 (JSON) or legacy
// 1.0 (application/x-www-form-urlencoded). Reads raw body once,
// tries JSON first (fast path), falls back to URL-decoded form.
// If both fail returns null so the caller can 400 cleanly.
// =============================================================
async function parseHotmartBody(
  req: NextRequest,
): Promise<Record<string, unknown> | null> {
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  const raw = await req.text().catch(() => "");
  if (!raw) return null;

  const trimmed = raw.trim();
  const looksLikeJson =
    contentType.includes("application/json") ||
    trimmed.startsWith("{") ||
    trimmed.startsWith("[");
  if (looksLikeJson) {
    try {
      return JSON.parse(raw);
    } catch {
      // fall through to form-decode
    }
  }

  // Form-encoded fallback — Postback 1.0 ships flat key=value pairs
  // (e.g. `prod_id=8039531&buyer_email=…&event=PURCHASE_APPROVED`).
  const looksLikeForm =
    contentType.includes("application/x-www-form-urlencoded") ||
    (raw.includes("=") && !trimmed.startsWith("{"));
  if (looksLikeForm) {
    try {
      const params = new URLSearchParams(raw);
      const flat: Record<string, string> = {};
      params.forEach((v, k) => {
        flat[k] = v;
      });
      return flat;
    } catch {
      // fall through
    }
  }

  // Last-resort: raw is neither valid JSON nor form-encoded.
  return null;
}

// =============================================================
// DEFENSIVE FIELD EXTRACTOR — walks a list of dot-paths and
// returns the FIRST non-empty value. For each path, first tries
// nested lookup ("data.product.id" → body.data.product.id), then
// falls back to a flat lookup using the whole path as a single
// key ("data.product.id" as one flat form-encoded key). This
// makes the same list of paths work for both JSON (nested) and
// form-encoded (flat with any naming convention).
// =============================================================
function pickField(body: Record<string, unknown>, paths: string[]): string {
  for (const path of paths) {
    // Attempt 1: walk nested keys
    let cursor: unknown = body;
    let ok = true;
    for (const key of path.split(".")) {
      if (
        cursor !== null &&
        typeof cursor === "object" &&
        key in (cursor as Record<string, unknown>)
      ) {
        cursor = (cursor as Record<string, unknown>)[key];
      } else {
        ok = false;
        break;
      }
    }
    if (
      ok &&
      cursor !== undefined &&
      cursor !== null &&
      cursor !== ""
    ) {
      return String(cursor);
    }

    // Attempt 2: flat key on the root (form-encoded may have
    // "prod_id" as a top-level key, or even "data.product.id"
    // as a single flat key).
    const flat = (body as Record<string, unknown>)[path];
    if (flat !== undefined && flat !== null && flat !== "") {
      return String(flat);
    }
  }
  return "";
}

// =============================================================
// UPSELL PRODUCT ALLOWLIST — configured via env so new vendor
// accounts (João's, future managers') can be onboarded without
// a code redeploy. Comma-separated numeric Hotmart product IDs.
// Falls back to just the original 7822152 (mine) if the env var
// is unset.
//   HOTMART_UPSELL_PRODUCT_IDS=7822152,<joao_197>,<joao_97>
// =============================================================
function getUpsellProductIds(): Set<string> {
  const raw = process.env.HOTMART_UPSELL_PRODUCT_IDS || "7822152";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

// =============================================================
// FUNNEL CLASSIFICATION — maps Hotmart product IDs to the funnel
// that produced the sale. Powers the color-coded Discord banner
// (# 🟢 ORGÂNICO vs # 🔴 TRÁFEGO PAGO (FB2)) so the dono spots
// paid-funnel volume without reading product names.
//
// Product ID is the source of truth — sck is only surfaced as a
// secondary "🔖 sck=..." line for context, never used to override
// the label.
//
// Add new paid-funnel product IDs here as new managers come online.
// =============================================================
const PAID_FB2_PRODUCT_IDS = new Set(["8039531", "8044010"]);
function funnelFor(productId: string): "organic" | "paid_fb2" {
  return PAID_FB2_PRODUCT_IDS.has(productId) ? "paid_fb2" : "organic";
}

// =============================================================
// EVENT NORMALIZATION — Hotmart uses different casings/formats
// across postback versions. Normalize to UPPER_SNAKE + strip
// dots so PURCHASE_APPROVED == purchase.approved == purchase_approved.
// =============================================================
function normalizeEvent(raw: string): string {
  return raw.toUpperCase().replace(/\./g, "_").trim();
}
const APPROVED_EVENTS = new Set(["PURCHASE_APPROVED", "PURCHASE_COMPLETE"]);
const REFUND_EVENTS = new Set([
  "PURCHASE_REFUNDED",
  "PURCHASE_CANCELED",
  "PURCHASE_CHARGEBACK",
  "PURCHASE_PROTEST",
]);

export async function POST(req: NextRequest) {
  try {
    const body = await parseHotmartBody(req);
    if (!body) {
      console.error(
        "[hotmart-webhook] parse FAILED — neither valid JSON nor form-encoded",
      );
      return NextResponse.json(
        { error: "Invalid payload." },
        { status: 400 },
      );
    }

    // Extract fields defensively — every path Hotmart is known to
    // use across Postback 1.0 (flat) and 2.0 (nested JSON).
    const productId = pickField(body, [
      "data.product.id",
      "data.purchase.product.id",
      "product.id",
      "prod_id",
      "prod",
      "product_id",
      "productid",
      "product",
    ]);
    const rawEvent = pickField(body, ["event", "event_type", "type"]);
    const eventType = normalizeEvent(rawEvent);
    const txId = pickField(body, [
      "data.purchase.transaction",
      "data.purchase.transaction_id",
      "data.purchase.id",
      "data.transaction",
      "transaction",
      "transaction_id",
      "trans_id",
      "trans",
    ]);
    const buyerEmail = pickField(body, [
      "data.buyer.email",
      "buyer.email",
      "customer.email",
      "buyer_email",
      "customer_email",
      "email",
    ]);
    const buyerName =
      pickField(body, [
        "data.buyer.name",
        "buyer.name",
        "customer.name",
        "buyer_name",
        "customer_name",
        "name",
      ]) || "";
    const offerCode = pickField(body, [
      "data.purchase.offer.code",
      "data.purchase.offer_code",
      "purchase.offer.code",
      "offer_code",
      "offer",
    ]);
    const productName = pickField(body, [
      "data.product.name",
      "product.name",
      "prod_name",
      "product_name",
    ]);
    const rawAmount = pickField(body, [
      "data.purchase.price.value",
      "purchase.price.value",
      "price",
      "value",
      "amount",
    ]);
    const currency = pickField(body, [
      "data.purchase.price.currency_code",
      "purchase.price.currency_code",
      "currency",
      "currency_code",
    ]) || "USD";
    const occurredAtRaw = pickField(body, [
      "data.purchase.approved_date",
      "purchase.approved_date",
      "approved_date",
    ]);
    // sck — Hotmart's checkout tracking param. Path varies by Postback
    // version and vendor account setup. Secondary signal only — funnel
    // classification uses productId (see funnelFor()). If none of these
    // paths match, sck stays empty and the Discord message just omits
    // the "🔖 sck=..." line.
    const sck = pickField(body, [
      "data.purchase.origin.sck",
      "data.purchase.origin.xcod",
      "data.checkout.sck",
      "data.affiliations.0.source",
      "data.affiliations.0.affiliation_code",
      "purchase.origin.sck",
      "sck",
      "src",
    ]);

    console.log(
      `[hotmart-webhook] received event=${rawEvent}(→${eventType}) product_id=${productId} transaction=${txId} email=${buyerEmail} name=${buyerName || "-"} offer=${offerCode || "-"}`,
    );

    const upsellIds = getUpsellProductIds();
    const isUpsellProduct = upsellIds.has(productId);

    // ============================================================
    // BRANCH: upsell (AI Model Customization Service — $197/$97)
    // Env-driven allowlist replaces the old hardcoded "7822152".
    // ============================================================
    if (isUpsellProduct) {
      if (APPROVED_EVENTS.has(eventType)) {
        if (!txId || !buyerEmail) {
          console.error(
            `[hotmart-webhook] upsell missing required fields txId=${txId} email=${buyerEmail} event=${eventType}`,
          );
          return NextResponse.json(
            { error: "Missing transaction or email." },
            { status: 400 },
          );
        }
        const normalizedEmail = buyerEmail.toLowerCase().trim();
        const customerName = buyerName || null;

        // Upsert by hotmart_transaction_id for idempotency. With
        // ignoreDuplicates the row isn't reliably returned by the
        // upsert call, so we SELECT it back to get the UUID for
        // the preferences URL.
        const { error: upsertErr } = await supabaseAdmin
          .from("upsell_orders")
          .upsert(
            {
              hotmart_transaction_id: String(txId),
              customer_email: normalizedEmail,
              customer_name: customerName,
              status: "pending",
              notes: `offer_code=${offerCode || "?"} product_id=${productId}`,
            },
            {
              onConflict: "hotmart_transaction_id",
              ignoreDuplicates: true,
            },
          );
        if (upsertErr) {
          console.error(
            `[hotmart-webhook] upsell upsert error txId=${txId} err=${upsertErr.message}`,
          );
          return NextResponse.json(
            { error: "Failed to upsert order." },
            { status: 500 },
          );
        }

        const { data: row, error: selectErr } = await supabaseAdmin
          .from("upsell_orders")
          .select("id")
          .eq("hotmart_transaction_id", String(txId))
          .single();
        if (selectErr || !row) {
          console.error(
            `[hotmart-webhook] upsell select-back error txId=${txId} err=${selectErr?.message}`,
          );
          return NextResponse.json(
            { error: "Failed to load order row." },
            { status: 500 },
          );
        }

        const preferencesUrl = `https://aimodelmethods.com/upsell-2/preferences/${row.id}`;
        const upsellFirstName = (customerName || "").split(" ")[0] || "there";

        const { error: emailErr } = await resend.emails.send({
          from: "AIM Method <noreply@aimodelmethods.com>",
          to: normalizedEmail,
          subject: "Tell us about your AI model 🎨",
          html: `
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
              <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${upsellFirstName}, thanks for your purchase. We just need a few details to build your custom AI model exactly the way you want it.</p>

              <div style="text-align:center;">
                <a href="${preferencesUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;">Tell Us Your Preferences →</a>
              </div>

              <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
                <p style="font-size:13px;color:#9ca3af;margin:0 0 12px;line-height:1.6;">
                  It takes 2 minutes. Once you submit, we'll generate 11 hyperrealistic photos of your custom AI model and email them to you within 24&ndash;48 hours in 4K quality.
                </p>
                <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
                  This link is unique to your order. Don't share it.
                </p>
              </div>

            </div>
          </div>

          <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2025 AIM Method · All rights reserved</p>

        </div>
      </div>
    `,
        });
        if (emailErr) {
          console.error(
            `[hotmart-webhook] upsell email error txId=${txId}:`,
            emailErr,
          );
          return NextResponse.json(
            { error: "Failed to send preferences email." },
            { status: 500 },
          );
        }

        // Realtime Discord notification for the upsell sale — same
        // funnel banner + sck subtitle the default $29 branch uses
        // (added in PR #106). Without this, $197/$97 AI Model
        // Customization purchases never showed up in the sales feed
        // even though the buyer + preferences email were provisioned.
        // notifySale is best-effort and never throws, so the return
        // below is unconditional. amountCents is parsed here (rawAmount
        // is a string from pickField) instead of reusing the default
        // branch's computation since we return before reaching it.
        const upsellAmountCents = rawAmount
          ? Math.round(Number(rawAmount) * 100)
          : 0;
        await notifySale({
          channel: "hotmart",
          email: normalizedEmail,
          name: customerName,
          amountCents: upsellAmountCents,
          currency,
          product: productName || null,
          funnel: funnelFor(productId),
          sck: sck || null,
        });

        console.log(
          `[hotmart-webhook] upsell order created order_id=${row.id} email=${normalizedEmail} txId=${txId} offer=${offerCode} product_id=${productId}`,
        );
        return NextResponse.json(
          { ok: true, branch: "upsell", order_id: row.id },
          { status: 200 },
        );
      } else if (REFUND_EVENTS.has(eventType)) {
        if (!txId) {
          console.warn(
            `[hotmart-webhook] upsell refund without txId — cannot match row event=${eventType}`,
          );
          return NextResponse.json(
            { ok: true, branch: "upsell-refund", message: "No txId" },
            { status: 200 },
          );
        }
        const { error: updateErr } = await supabaseAdmin
          .from("upsell_orders")
          .update({ status: "refunded" })
          .eq("hotmart_transaction_id", String(txId));
        if (updateErr) {
          console.error(
            `[hotmart-webhook] upsell refund update error txId=${txId} err=${updateErr.message}`,
          );
          // Still return 200 — Hotmart shouldn't keep retrying on our DB error.
        }
        console.log(
          `[hotmart-webhook] upsell order refunded transaction=${txId} event=${eventType}`,
        );
        return NextResponse.json(
          { ok: true, branch: "upsell-refund" },
          { status: 200 },
        );
      } else {
        console.log(
          `[hotmart-webhook] upsell event ignored event=${eventType} txId=${txId}`,
        );
        return NextResponse.json(
          { ok: true, message: "Event ignored." },
          { status: 200 },
        );
      }
    }

    // ============================================================
    // DEFAULT: $29 course flow — everything that isn't an upsell.
    // ============================================================

    if (!APPROVED_EVENTS.has(eventType)) {
      console.log(
        `[hotmart-webhook] default event ignored event=${eventType} product_id=${productId}`,
      );
      return NextResponse.json({ ok: true, message: "Event ignored." });
    }

    if (!buyerEmail) {
      console.error(
        `[hotmart-webhook] no email in payload — bodyKeys=${Object.keys(body).slice(0, 20).join(",")}`,
      );
      return NextResponse.json(
        { error: "No email in payload." },
        { status: 400 },
      );
    }

    const normalizedEmail = buyerEmail.toLowerCase().trim();
    const fullName = buyerName || "Student";
    const firstName = fullName.split(" ")[0] || "Student";

    // Check if user already exists — if not, create them
    const { data: existing } = await supabaseAdmin
      .from("users")
      .select("email")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await insertUserWithSource({
        email: normalizedEmail,
        name: firstName,
        source: "hotmart",
      });

      if (insertError) {
        console.error(
          `[hotmart-webhook] user insert FAILED email=${normalizedEmail} err=${insertError.message}`,
        );
        return NextResponse.json(
          { error: "Failed to create user." },
          { status: 500 },
        );
      }
    }

    // Generate magic link — 30-day expiry for welcome email
    const token = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
      email: normalizedEmail,
      token,
      expires_at: expiresAt,
    });

    if (linkError) {
      console.error(
        `[hotmart-webhook] magic link insert FAILED email=${normalizedEmail} err=${linkError.message}`,
      );
      // User was created — don't fail the webhook, but the button will 404 when clicked
    }

    const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;

    const { error: emailError } = await resend.emails.send({
      from: "AIM Method <noreply@aimodelmethods.com>",
      to: normalizedEmail,
      subject: "Welcome to AIM Method!",
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
    `,
    });

    if (emailError) {
      console.error(
        `[hotmart-webhook] welcome email FAILED email=${normalizedEmail} err=${emailError.message || emailError}`,
      );
      return NextResponse.json(
        { error: "Failed to send welcome email." },
        { status: 500 },
      );
    }

    const amountCents = rawAmount ? Math.round(Number(rawAmount) * 100) : 0;
    const occurredAt = occurredAtRaw || new Date().toISOString();

    if (!txId) {
      // Hotmart test postbacks frequently omit transaction IDs; we can't
      // create a sales row (UNIQUE NOT NULL constraint), but the user IS
      // provisioned above. Log loudly so this isn't invisible.
      console.error(
        `[hotmart-webhook] sales insert SKIPPED — no transaction id in payload. event=${eventType} email=${normalizedEmail} amount=${amountCents}`,
      );
    } else {
      const { error: salesInsertError } = await supabaseAdmin
        .from("sales")
        .upsert(
          {
            hotmart_transaction_id: String(txId),
            buyer_name: buyerName || null,
            buyer_email: normalizedEmail,
            amount_cents: amountCents,
            currency,
            product_name: productName || null,
            status: "approved",
            occurred_at: occurredAt,
            raw_payload: body,
          },
          { onConflict: "hotmart_transaction_id", ignoreDuplicates: true },
        );

      if (salesInsertError) {
        // Best-effort: keep the webhook response successful to avoid retry
        // storms, but log enough detail to debug from Vercel logs.
        console.error(
          `[hotmart-webhook] sales insert FAILED — code=${(salesInsertError as { code?: string }).code ?? "?"} message="${salesInsertError.message}" txId=${txId} email=${normalizedEmail}`,
        );
      } else {
        console.log(
          `[hotmart-webhook] sales row recorded txId=${txId} email=${normalizedEmail} amount=${amountCents}`,
        );
      }
    }

    // Realtime Discord notification — fires for every approved purchase
    // regardless of whether the sales insert succeeded or was skipped.
    // Wrapped in best-effort by notifySale() itself. `funnel` swaps the
    // generic "NEW SALE" banner for a color-coded classification header
    // (organic vs paid FB2); `sck` shows up as a secondary subtitle.
    if (eventType === "PURCHASE_APPROVED") {
      await notifySale({
        channel: "hotmart",
        email: normalizedEmail,
        name: buyerName || null,
        amountCents,
        currency,
        product: productName || null,
        funnel: funnelFor(productId),
        sck: sck || null,
        extraNote: txId
          ? null
          : "⚠️ Test postback — no transaction id, sales row was skipped.",
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Top-level catch — was previously missing on the default branch, so
    // any exception (Supabase timeout, Resend outage, malformed payload
    // that slipped past the parser) returned an opaque 500 with zero
    // trace in Vercel logs. Now every exception lands here with a full
    // stack for post-mortem.
    const msg = err instanceof Error ? err.stack || err.message : String(err);
    console.error(`[hotmart-webhook] UNCAUGHT ERROR — ${msg}`);
    return NextResponse.json(
      { error: "Internal error." },
      { status: 500 },
    );
  }
}
