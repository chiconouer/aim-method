-- OPTIONAL: cache table for Stripe Checkout Sessions.
--
-- The 1-click upsell/downsell routes (app/api/upsell/charge, app/api/downsell/charge)
-- currently retrieve customer_id + payment_method_id by calling Stripe's API on
-- every request (stripe.checkout.sessions.retrieve). That works fine for the
-- volumes we're at — Stripe rate limits are generous.
--
-- If you want to cut the latency on the upsell page (one less API roundtrip) or
-- you start running into rate limits, apply this migration and have
-- /api/checkout/start cache the session ID, and the upsell/downsell routes read
-- from this table first.
--
-- This file does NOT have a timestamp prefix — rename to
-- 2026MMDDHHMMSS_create_stripe_sessions.sql before running supabase db push.

create table if not exists stripe_sessions (
  session_id        text        primary key,
  customer_id       text        not null,
  payment_method_id text,
  email             text,
  created_at        timestamptz default now(),
  expires_at        timestamptz default (now() + interval '24 hours')
);

create index if not exists idx_stripe_sessions_customer on stripe_sessions(customer_id);
