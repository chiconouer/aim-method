-- =============================================================
-- Enable Row Level Security on the 5 remaining public-schema
-- tables that were flagged by the Supabase Security Advisor as
-- "RLS Disabled in Public". Each gets a service-role-only policy
-- mirroring the pattern already applied to upsell_orders (see
-- 20260515155703_create_upsell_orders.sql lines 38-46).
--
-- Why this is safe in this app:
--   Every Supabase access in the codebase goes through the
--   service-role client (supabaseAdmin in lib/supabase.ts, or
--   createClient(URL, SUPABASE_SERVICE_ROLE_KEY) in the two
--   Edge Functions). Service role bypasses RLS by design, so
--   server-side reads/writes keep working unchanged.
--
--   The anon client export in lib/supabase.ts exists but is
--   NEVER imported anywhere (verified by grep), so blocking
--   anon-key access via RLS does not break a single import.
--   The anon key IS bundled in the browser JS via the
--   NEXT_PUBLIC_SUPABASE_ANON_KEY env var, but with RLS on
--   that key becomes harmless on its own — it can only do
--   what the policies allow (in our case: nothing on these
--   5 tables).
--
-- Tables NOT in this migration:
--   sales         — already protected (anon probe sees 0 rows
--                   while service-role sees 8). RLS was applied
--                   via dashboard at some point.
--   upsell_orders — already protected by
--                   20260515155703_create_upsell_orders.sql.
--
-- Idempotent — safe to re-run:
--   - ALTER TABLE ... ENABLE ROW LEVEL SECURITY is a no-op when
--     RLS is already enabled.
--   - DROP POLICY IF EXISTS + CREATE POLICY guards re-runs from
--     duplicate-policy errors.
-- =============================================================

-- users (84 rows currently visible to anon — leaking emails,
-- name, source channel, subscription state, password_hash)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on users" ON users;
CREATE POLICY "Service role full access on users"
  ON users FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- magic_links (99 rows currently visible to anon — these are
-- ACTIVE auth tokens, anyone with the anon key + a customer
-- email could in theory forge a login link. Highest-priority
-- fix in this migration.)
ALTER TABLE magic_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on magic_links" ON magic_links;
CREATE POLICY "Service role full access on magic_links"
  ON magic_links FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- weekly_prompt_bank (12 rows — generated prompt IP)
ALTER TABLE weekly_prompt_bank ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on weekly_prompt_bank" ON weekly_prompt_bank;
CREATE POLICY "Service role full access on weekly_prompt_bank"
  ON weekly_prompt_bank FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- quiz_completions (59 rows — per-user course progress)
ALTER TABLE quiz_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on quiz_completions" ON quiz_completions;
CREATE POLICY "Service role full access on quiz_completions"
  ON quiz_completions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- chat_usage (10 rows — AIM Assistant rate-limit counters)
ALTER TABLE chat_usage ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role full access on chat_usage" ON chat_usage;
CREATE POLICY "Service role full access on chat_usage"
  ON chat_usage FOR ALL TO service_role
  USING (true) WITH CHECK (true);
