-- =============================================================
-- quiz_funnel_events — append-only log of which step of the
-- /ttk/quiz and /fb/quiz funnels each visitor reached.
--
-- Powers the FASE-1 funnel-analytics dashboard (read aggregated
-- counts per (platform, step) to compute drop-off rates per
-- traffic source).
--
-- Step value semantics:
--   1..8  → reached intro/persuasion step N
--   9     → reached the /ttk/sales or /fb/sales VSL after step 8
--
-- Why this table is RLS-locked to service_role:
--   The browser never touches Supabase directly — it POSTs to
--   /api/quiz-funnel which writes via the server-only service
--   role client (supabaseAdmin). Even if someone reverse-engineers
--   the bundled anon key, they can't read this table or pollute it
--   with fake events because the only policy grants service_role,
--   and the anon role has no row visibility at all.
--
-- Idempotent — safe to re-run via DROP POLICY IF EXISTS and
-- IF NOT EXISTS on the table + indexes. Mirrors the pattern used
-- in 20260610120000_enable_rls_on_user_facing_tables.sql.
-- =============================================================

CREATE TABLE IF NOT EXISTS quiz_funnel_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform   TEXT NOT NULL CHECK (platform IN ('ttk', 'fb')),
  step       INT  NOT NULL CHECK (step BETWEEN 1 AND 9),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Composite indexes tuned for the two dashboard query shapes:
--   "events per platform over time"      → (platform, created_at DESC)
--   "drop-off counts per step, platform" → (platform, step)
CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_platform_created
  ON quiz_funnel_events (platform, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_platform_step
  ON quiz_funnel_events (platform, step);

ALTER TABLE quiz_funnel_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on quiz_funnel_events"
  ON quiz_funnel_events;
CREATE POLICY "Service role full access on quiz_funnel_events"
  ON quiz_funnel_events FOR ALL TO service_role
  USING (true) WITH CHECK (true);
