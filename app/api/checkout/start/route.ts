// Stripe Checkout — initial $29 purchase for the AIM Method course.
// Creates a Checkout Session with setup_future_usage so we can do 1-click
// upsell/downsell charges later without a second card prompt.

import { NextResponse } from "next/server";
import stripe from "@/lib/stripe";

export async function POST() {
  try {
    const priceId = process.env.STRIPE_PRICE_ID_29;
    if (!priceId) {
      console.error("[checkout/start] STRIPE_PRICE_ID_29 not set");
      return NextResponse.json({ error: "Server not configured." }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      payment_intent_data: {
        setup_future_usage: "off_session",
        description: "AIM Method – AI Image Generation Course",
        metadata: { product: "initial_29" },
      },
      success_url:
        "https://aimodelmethods.com/start/upsell?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://aimodelmethods.com/start",
    });

    console.log(`[checkout/start] created session ${session.id}`);
    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout/start] error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
