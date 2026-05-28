// Stripe webhook — provisions course access for every successful Stripe
// purchase (initial $29, upsell $197, downsell $97).
//
// Mirrors the side-effect pattern from app/api/webhook/hotmart/route.ts:
//   1. upsert user in Supabase
//   2. create magic_link (30-day expiry)
//   3. send welcome email via Resend
//
// Returns 200 even on partial failures to prevent Stripe retry storms.

import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { Resend } from "resend";
import stripe from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY!);

function welcomeEmailHTML(firstName: string, loginUrl: string, productName: string) {
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

            <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Welcome to ${productName}! 🎉</h1>
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

        <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2026 AIM Method · All rights reserved</p>

      </div>
    </div>
  `;
}

// Mirror of the Hotmart upsell flow: creates an upsell_orders row and emails
// the customer the link to /upsell-1/preferences/<id> so they can fill the
// Tally form. Same row schema, same email template — Stripe upsell delivers
// identical product (11 AI photos) as Hotmart upsell.
async function provisionUpsellOrderFromStripe({
  paymentIntentId,
  email,
  amount,
  currency,
  metadata,
}: {
  paymentIntentId: string;
  email: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
}) {
  const normalizedEmail = email.toLowerCase().trim();
  // Reuse the existing `hotmart_transaction_id` UNIQUE column for idempotency.
  // Prefix "stripe:" distinguishes Stripe-originated orders from real Hotmart
  // txIds without requiring a schema migration.
  const externalId = `stripe:${paymentIntentId}`;
  const notes = `stripe_upsell:amount=${amount}/${currency} is_upsell=${metadata.is_upsell ?? ""} content_id=${metadata.content_id ?? ""}`;

  const { error: upsertErr } = await supabaseAdmin
    .from("upsell_orders")
    .upsert(
      {
        hotmart_transaction_id: externalId,
        customer_email: normalizedEmail,
        customer_name: null,
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
      `[stripe webhook] upsell upsert error pi=${paymentIntentId} err=${upsertErr.message}`,
    );
    return;
  }

  const { data: row, error: selectErr } = await supabaseAdmin
    .from("upsell_orders")
    .select("id")
    .eq("hotmart_transaction_id", externalId)
    .single();
  if (selectErr || !row) {
    console.error(
      `[stripe webhook] upsell select-back error pi=${paymentIntentId} err=${selectErr?.message}`,
    );
    return;
  }

  const preferencesUrl = `https://aimodelmethods.com/upsell-1/preferences/${row.id}`;
  const upsellFirstName = "there"; // safe-payment doesn't send name in PI payload

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
      `[stripe webhook] upsell email error pi=${paymentIntentId}:`,
      emailErr,
    );
    return;
  }

  console.log(
    `[stripe webhook] upsell order created order_id=${row.id} email=${normalizedEmail} pi=${paymentIntentId}`,
  );
}

async function provisionAccess({
  email,
  fullName,
  productName,
}: {
  email: string;
  fullName: string;
  productName: string;
}) {
  const normalizedEmail = email.toLowerCase().trim();
  const firstName = fullName.split(" ")[0] || "Student";

  // 1. Upsert user
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", normalizedEmail)
    .single();

  if (!existing) {
    const { error: insertError } = await supabaseAdmin.from("users").insert({
      email: normalizedEmail,
      name: firstName,
    });
    if (insertError) {
      console.error("[stripe webhook] user insert error:", insertError);
      return;
    }
    console.log(`[stripe webhook] created user ${normalizedEmail}`);
  } else {
    console.log(`[stripe webhook] user ${normalizedEmail} already exists`);
  }

  // 2. Magic link (30-day expiry)
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { error: linkError } = await supabaseAdmin.from("magic_links").insert({
    email: normalizedEmail,
    token,
    expires_at: expiresAt,
  });
  if (linkError) {
    console.error("[stripe webhook] magic_link insert error:", linkError);
    // continue — try email anyway
  }

  // 3. Welcome email
  const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;
  const { error: emailError } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: normalizedEmail,
    subject: `Welcome to ${productName}!`,
    html: welcomeEmailHTML(firstName, loginUrl, productName),
  });
  if (emailError) {
    console.error("[stripe webhook] resend error:", emailError);
    return;
  }

  console.log(`[stripe webhook] welcome email sent to ${normalizedEmail} (${productName})`);
}

export async function POST(req: NextRequest) {
  const signature = headers().get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    console.error("[stripe webhook] missing signature or STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  // IMPORTANT: signature verification needs the raw body bytes, not parsed JSON.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    console.error("[stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log(`[stripe webhook] received event ${event.type} (id: ${event.id})`);

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const email =
        session.customer_details?.email ?? session.customer_email ?? undefined;
      const fullName = session.customer_details?.name ?? "Student";

      if (!email) {
        console.warn(`[stripe webhook] no email on session ${session.id}`);
      } else {
        await provisionAccess({
          email,
          fullName,
          productName: "AIM Method",
        });
      }
    } else if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object as Stripe.PaymentIntent;

      // Recognize both safe-payment.store schema (metadata.is_upsell="1")
      // AND legacy schema (metadata.product="upsell"|"downsell"). Both
      // converge to the same delivery: 11 AI photos via upsell_orders +
      // Tally preferences flow (identical to Hotmart upsell).
      const isUpsell =
        pi.metadata?.is_upsell === "1" ||
        pi.metadata?.product === "upsell" ||
        pi.metadata?.product === "downsell";

      if (!isUpsell) {
        console.log(`[stripe webhook] PI ${pi.id} not an upsell, skipping`);
      } else {
        const email = pi.receipt_email;
        if (!email) {
          console.warn(
            `[stripe webhook] PI ${pi.id} is upsell but has no receipt_email — cannot deliver`,
          );
        } else {
          await provisionUpsellOrderFromStripe({
            paymentIntentId: pi.id,
            email,
            amount: pi.amount,
            currency: pi.currency,
            metadata: (pi.metadata ?? {}) as Record<string, string>,
          });
        }
      }
    } else if (event.type === "payment_intent.payment_failed") {
      const pi = event.data.object as Stripe.PaymentIntent;
      console.warn(
        `[stripe webhook] PI ${pi.id} failed: ${pi.last_payment_error?.message ?? "unknown"}`,
      );
    } else {
      console.log(`[stripe webhook] ignoring event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[stripe webhook] handler error:", err);
    // 200 anyway — don't trigger Stripe retry storm.
    return NextResponse.json({ received: true });
  }
}
