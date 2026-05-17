# Stripe setup checklist

This is the manual configuration required to turn the Stripe code on. Code is already deployed; nothing works until these are done.

## 1. Stripe Dashboard — keys

Go to **Stripe Dashboard → Developers → API keys**.

- Copy the **Secret key** (`sk_live_...` for production, `sk_test_...` for testing). This will be `STRIPE_SECRET_KEY`.

## 2. Stripe Dashboard — product + price

You should already have the $29 product created. Open it and copy its **Price ID** (starts with `price_...`, not the product ID `prod_...`). This will be `STRIPE_PRICE_ID_29`.

The $197 (upsell) and $97 (downsell) charges are created via the API as standalone `paymentIntents` — they do **not** need a product or price object configured in the Dashboard. The amounts are hardcoded in:

- `app/api/upsell/charge/route.ts` → `amount: 19700`
- `app/api/downsell/charge/route.ts` → `amount: 9700`

(If you want them as proper products in Stripe for reporting, create them and add their price IDs as env vars + update the routes. Optional.)

## 3. Stripe Dashboard — webhook endpoint

Go to **Stripe Dashboard → Developers → Webhooks → Add endpoint**.

- **Endpoint URL**: `https://aimodelmethods.com/api/webhook/stripe`
- **Events to send** (select these three):
  - `checkout.session.completed`
  - `payment_intent.succeeded`
  - `payment_intent.payment_failed`
- Click **Add endpoint**.

After creation, click into the endpoint and copy the **Signing secret** (starts with `whsec_...`). This will be `STRIPE_WEBHOOK_SECRET`.

## 4. Vercel — environment variables

Go to **Vercel Dashboard → your project → Settings → Environment Variables**.

Add these (Production + Preview + Development):

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` for testing) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from step 3 |
| `STRIPE_PRICE_ID_29` | `price_...` from step 2 |

## 5. Vercel — redeploy

Vercel does **not** pick up new env vars automatically. Trigger a redeploy:

- Go to **Deployments → ... menu on latest deploy → Redeploy**.
- Or push any commit to `main`.

## 6. Verify end-to-end

1. Open `https://aimodelmethods.com/start` in an incognito window.
2. Click **Enroll Now — $29 →**. You should redirect to Stripe Checkout.
3. Pay with a test card (`4242 4242 4242 4242`, any future expiry, any CVC) if using test mode.
4. After payment, you should land on `/start/upsell?session_id=cs_...`.
5. Click **Get Instant Access — $197 →**. You should briefly see "Processing..." then redirect to `/start/upsell/downsell?session_id=...` (the 1-click charge worked silently).
6. Click **Get Instant Access — $97 →**. After processing, you should redirect to `https://course.aimodelmethods.com`.
7. Check Resend logs / your inbox — you should have received **3 welcome emails**, one per purchase.

If any step fails, check **Vercel → Logs** for `[stripe webhook]`, `[checkout/start]`, `[upsell/charge]`, `[downsell/charge]` entries.

## 7. Optional — Stripe sessions cache table

`supabase/migrations/stripe_sessions.sql` defines an optional cache table for Stripe session metadata. It's **not required** — the upsell/downsell routes already hit the Stripe API directly. Apply it only if you want to reduce API roundtrips. See the SQL file for details.
