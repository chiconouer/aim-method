import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { supabaseAdmin } from "@/lib/supabase";
import { notifySale } from "@/lib/notifySale";
import { insertUserWithSource } from "@/lib/insertUserWithSource";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (!body) {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  // Pull product + transaction context up front — used both for the
  // upsell branch below and as the receipt log line for every event.
  const productId = String(body?.data?.product?.id ?? "");
  const eventType: string = body?.event ?? "";
  const txId =
    body?.data?.purchase?.transaction ??
    body?.data?.purchase?.transaction_id ??
    body?.data?.purchase?.id ??
    body?.data?.transaction ??
    null;
  console.log(
    `[hotmart-webhook] received event=${eventType} product_id=${productId} transaction=${txId}`,
  );

  // ============================================================
  // BRANCH: $197 / $97 upsell (AI Model Customization Service)
  // ------------------------------------------------------------
  // Hotmart product ID 7822152. Two offers route here:
  //   - l3jwqomo  ($197 main upsell)
  //   - pqis6sbk  ($97  downsell)
  // Self-contained: returns early so the existing $29 course flow
  // below is never reached for this product.
  // ============================================================
  if (productId === "7822152") {
    try {
      const customerEmail: string | undefined = body?.data?.buyer?.email;
      const customerName: string | null = body?.data?.buyer?.name ?? null;
      const offerCode: string | null =
        body?.data?.purchase?.offer?.code ??
        body?.data?.purchase?.offer_code ??
        null;

      const APPROVED = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"];
      const REFUNDED = [
        "PURCHASE_REFUNDED",
        "PURCHASE_CANCELED",
        "PURCHASE_CHARGEBACK",
        "PURCHASE_PROTEST",
      ];

      if (APPROVED.includes(eventType)) {
        if (!txId || !customerEmail) {
          console.error(
            `[hotmart-webhook] upsell missing required fields txId=${txId} email=${customerEmail} event=${eventType}`,
          );
          return NextResponse.json(
            { error: "Missing transaction or email." },
            { status: 400 },
          );
        }
        const normalizedEmail = String(customerEmail).toLowerCase().trim();

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
              notes: `offer_code=${offerCode}`,
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
        const upsellFirstName = customerName?.split(" ")[0] || "there";

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

        console.log(
          `[hotmart-webhook] upsell order created order_id=${row.id} email=${normalizedEmail} txId=${txId} offer=${offerCode}`,
        );
        return NextResponse.json(
          { ok: true, branch: "upsell", order_id: row.id },
          { status: 200 },
        );
      } else if (REFUNDED.includes(eventType)) {
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[hotmart-webhook] upsell error err=${msg}`);
      return NextResponse.json({ error: "Internal error." }, { status: 500 });
    }
  }

  // ============================================================
  // DEFAULT: $29 course flow (Hotmart product 7659354 — unchanged)
  // ============================================================

  // Only process approved/completed purchases
  const ACCEPTED_EVENTS = ["PURCHASE_APPROVED", "PURCHASE_COMPLETE"];
  if (!ACCEPTED_EVENTS.includes(body.event)) {
    return NextResponse.json({ ok: true, message: "Event ignored." });
  }

  const email: string | undefined = body?.data?.buyer?.email;
  const fullName: string = body?.data?.buyer?.name ?? "Student";
  const firstName = fullName.split(" ")[0] || "Student";

  if (!email) {
    return NextResponse.json({ error: "No email in payload." }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists — if not, create them
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", normalizedEmail)
    .single();

  if (!existing) {
    const { error: insertError } = await insertUserWithSource({
      email: normalizedEmail,
      name: firstName,
      source: "hotmart",
    });

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }
  }

  // Generate magic link — 30-day expiry for welcome email
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });

  if (linkError) {
    console.error("Failed to create magic link:", linkError);
    // User was created — don't fail the webhook
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
    console.error("Resend email error:", emailError);
    return NextResponse.json({ error: "Failed to send welcome email." }, { status: 500 });
  }

  const transactionId =
    body?.data?.purchase?.transaction ??
    body?.data?.purchase?.transaction_id ??
    body?.data?.purchase?.id ??
    body?.data?.transaction;

  const rawAmount = Number(body?.data?.purchase?.price?.value ?? 0);
  const amountCents = Math.round(rawAmount * 100);
  const occurredAt =
    body?.data?.purchase?.approved_date ?? new Date().toISOString();
  const currency = body?.data?.purchase?.price?.currency_code ?? "USD";
  const productName = body?.data?.product?.name ?? null;
  const buyerName = body?.data?.buyer?.name ?? null;

  if (!transactionId) {
    // Hotmart test postbacks frequently omit transaction IDs; we can't
    // create a sales row (UNIQUE NOT NULL constraint), but the user IS
    // provisioned above. Log loudly so this isn't invisible.
    console.error(
      `[hotmart-webhook] sales insert SKIPPED — no transaction id in payload. event=${body?.event} email=${normalizedEmail} amount=${amountCents}`,
    );
  } else {
    const { error: salesInsertError } = await supabaseAdmin
      .from("sales")
      .upsert(
        {
          hotmart_transaction_id: String(transactionId),
          buyer_name: buyerName,
          buyer_email: normalizedEmail,
          amount_cents: amountCents,
          currency,
          product_name: productName,
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
        `[hotmart-webhook] sales insert FAILED — code=${(salesInsertError as { code?: string }).code ?? "?"} message="${salesInsertError.message}" txId=${transactionId} email=${normalizedEmail}`,
      );
    } else {
      console.log(
        `[hotmart-webhook] sales row recorded txId=${transactionId} email=${normalizedEmail} amount=${amountCents}`,
      );
    }
  }

  // Realtime Discord notification — fires for every approved purchase
  // regardless of whether the sales insert succeeded or was skipped.
  // Wrapped in best-effort by notifySale() itself.
  if (body.event === "PURCHASE_APPROVED") {
    await notifySale({
      channel: "hotmart",
      email: normalizedEmail,
      name: buyerName,
      amountCents,
      currency,
      product: productName,
      extraNote: transactionId
        ? null
        : "⚠️ Test postback — no transaction id, sales row was skipped.",
    });
  }

  return NextResponse.json({ ok: true });
}
