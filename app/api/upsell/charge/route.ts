// 1-click upsell ($197) — Advanced AI Workflows Masterclass.
// Reuses the payment method from the original /api/checkout/start session
// via Stripe's off_session confirm flow.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import stripe from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.session_id) {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.retrieve(body.session_id, {
      expand: ["customer", "payment_intent.payment_method"],
    });

    const customer = session.customer;
    const customerId = typeof customer === "string" ? customer : customer?.id;
    if (!customerId) {
      console.error(`[upsell/charge] no customer on session ${body.session_id}`);
      return NextResponse.json(
        { success: false, error: "No customer on session." },
        { status: 400 },
      );
    }

    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const pm = pi?.payment_method;
    const paymentMethodId = typeof pm === "string" ? pm : pm?.id;
    if (!paymentMethodId) {
      console.error(`[upsell/charge] no payment method on session ${body.session_id}`);
      return NextResponse.json(
        { success: false, error: "No payment method on session." },
        { status: 400 },
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 19700,
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: "Advanced AI Workflows Masterclass",
        metadata: {
          product: "upsell",
          source_session_id: body.session_id,
        },
      });

      console.log(`[upsell/charge] PI ${paymentIntent.id} for customer ${customerId}`);
      return NextResponse.json({ success: true, paymentIntentId: paymentIntent.id });
    } catch (chargeErr) {
      // Card declined, authentication_required, etc.
      if (chargeErr instanceof Stripe.errors.StripeCardError) {
        const requiresAction = chargeErr.code === "authentication_required";
        console.warn(
          `[upsell/charge] card error code=${chargeErr.code} for customer ${customerId}`,
        );
        return NextResponse.json({
          success: false,
          error: chargeErr.message,
          requiresAction,
        });
      }
      throw chargeErr;
    }
  } catch (err) {
    console.error("[upsell/charge] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
