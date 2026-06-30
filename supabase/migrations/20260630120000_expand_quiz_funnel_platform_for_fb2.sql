-- =============================================================
-- Expand quiz_funnel_events.platform CHECK constraint to allow
-- 'fb2' — the second Facebook paid-traffic funnel for a new
-- traffic manager. Without this, every insert from /fb2/quiz +
-- /fb2/sales would silently fail (the /api/quiz-funnel route
-- always responds 200 to keep beacons fire-and-forget; rows
-- would just never appear in Supabase and the new manager would
-- see an empty dashboard tab forever).
--
-- Approach: drop the old constraint by name, add a new one with
-- the expanded value set. The constraint name pattern matches
-- Postgres's auto-generated `<table>_<column>_check`. If the
-- original constraint was named differently in a particular
-- environment, the DROP IF EXISTS no-ops and the ADD still
-- succeeds with whatever name Postgres picks.
--
-- Indexes on `platform` keep working — they're b-tree, value-
-- agnostic. No data migration needed; the column is TEXT and
-- existing 'ttk'/'fb' rows stay valid under the new set.
--
-- Idempotent: safe to re-run.
-- =============================================================

ALTER TABLE quiz_funnel_events
  DROP CONSTRAINT IF EXISTS quiz_funnel_events_platform_check;

ALTER TABLE quiz_funnel_events
  ADD CONSTRAINT quiz_funnel_events_platform_check
  CHECK (platform IN ('ttk', 'fb', 'fb2'));
