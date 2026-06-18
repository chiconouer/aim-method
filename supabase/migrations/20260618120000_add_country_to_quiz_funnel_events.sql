-- =============================================================
-- Add `country` column to quiz_funnel_events for per-country
-- funnel analytics (group/filter the dashboard by ISO country).
--
-- Populated server-side by the /api/quiz-funnel route from
-- Vercel's `x-vercel-ip-country` request header — never trusted
-- from the browser. Header is an ISO 3166-1 alpha-2 code
-- ("US", "BR", "SG", etc.) when geo data is available.
--
-- Nullable on purpose:
--   - Local dev / preview deploys without Vercel geo enrichment
--     send no header → null is recorded.
--   - Existing rows (created before this migration) stay null.
--     Dashboard consumers must handle null as "unknown" rather
--     than dropping the row.
--
-- Indexed for the (platform, country) dashboard query shape:
-- "show this platform's funnel filtered to country X" hits the
-- composite index directly.
--
-- Idempotent — safe to re-run via ADD COLUMN IF NOT EXISTS +
-- CREATE INDEX IF NOT EXISTS.
-- =============================================================

ALTER TABLE quiz_funnel_events
  ADD COLUMN IF NOT EXISTS country TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_funnel_events_platform_country
  ON quiz_funnel_events (platform, country);
