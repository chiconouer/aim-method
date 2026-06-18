-- =============================================================
-- Add `visitor_id` column to quiz_funnel_events so the dashboard
-- can count UNIQUE visitors per step instead of events. The
-- previous event-count model produced non-sensical funnels
-- (later steps with more "people" than earlier ones, because a
-- single visitor's repeated taps were each counted).
--
-- Populated client-side by the quiz pages and sales pages: a
-- random UUID generated on first visit and stored in
-- localStorage under "aim_visitor_id". Sent verbatim with every
-- recordFunnelStep call. The server stores it as-is.
--
-- Nullable on purpose:
--   - Existing rows (created before this migration) stay valid
--     as visitor_id = NULL. The dashboard's distinct-visitor
--     counting filters out null-visitor_id rows so legacy data
--     is just ignored — no need to backfill.
--   - Local dev / preview environments without the client
--     helper still record events with visitor_id = null and
--     don't break.
--
-- Composite index on (platform, visitor_id) supports the
-- dashboard's hot path: pulling rows for one platform in a
-- time window and grouping into distinct-visitor sets per step
-- in JS.
--
-- Idempotent — safe to re-run via the IF NOT EXISTS guards.
-- =============================================================

ALTER TABLE quiz_funnel_events
  ADD COLUMN IF NOT EXISTS visitor_id TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_platform_visitor
  ON quiz_funnel_events (platform, visitor_id);
