// 1-click downsell ($97) — Prompt Engineering Pro Pack.
// Same off_session pattern as the upsell route.

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
      console.error(`[downsell/charge] no customer on session ${body.session_id}`);
      return NextResponse.json(
        { success: false, error: "No customer on session." },
        { status: 400 },
      );
    }

    const pi = session.payment_intent as Stripe.PaymentIntent | null;
    const pm = pi?.payment_method;
    const paymentMethodId = typeof pm === "string" ? pm : pm?.id;
    if (!paymentMethodId) {
      console.error(`[downsell/charge] no payment method on session ${body.session_id}`);
      return NextResponse.json(
        { success: false, error: "No payment method on session." },
        { status: 400 },
      );
    }

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: 9700,
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        off_session: true,
        confirm: true,
        description: "Prompt Engineering Pro Pack",
        metadata: {
          product: "downsell",
          source_session_id: body.session_id,
        },
      });

      console.log(`[downsell/charge] PI ${paymentIntent.id} for customer ${customerId}`);
      return NextResponse.json({ success: true, paymentIntentId: paymentIntent.id });
    } catch (chargeErr) {
      if (chargeErr instanceof Stripe.errors.StripeCardError) {
        const requiresAction = chargeErr.code === "authentication_required";
        console.warn(
          `[downsell/charge] card error code=${chargeErr.code} for customer ${customerId}`,
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
    console.error("[downsell/charge] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
