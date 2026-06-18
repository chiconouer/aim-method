// =============================================================
// GET /api/quiz-funnel/stats?platform=ttk&period=7d
// -------------------------------------------------------------
// Read-side counterpart to /api/quiz-funnel. Returns counts of
// UNIQUE VISITORS per step (1..10) for the requested platform
// within the requested time window, plus an unfiltered per-
// country breakdown anchored to step 1.
//
// Step semantics:
//   1..8   quiz step views
//   9      reached the /[platform]/sales VSL
//   10     clicked the buy button on /[platform]/sales (deduped
//          per visitor session client-side too)
//
// Counting model — UNIQUE VISITORS, not events:
//   For each step, "count = number of distinct visitor_id rows
//   recorded for that step in the period". A single visitor's
//   repeated taps therefore count as ONE. This is what the
//   previous event-count model got wrong (later steps appeared
//   bigger than earlier ones, percentages >100%, etc.).
//
//   Rows with visitor_id IS NULL (legacy data from before the
//   visitor_id migration) are EXCLUDED from the count. Going
//   forward every client passes a visitor_id, so this only
//   matters for historic noise.
//
// Auth: uses the SERVICE ROLE client (supabaseAdmin) — the
// quiz_funnel_events table is RLS-locked and the anon role has
// zero row visibility. The browser never queries Supabase
// directly for this data; it hits this route.
//
// Performance:
//   - ONE query that fetches (visitor_id, step, country) for
//     the platform+period, then aggregates in JS into:
//       * a Set<visitor_id> per step → counts[1..10]
//       * a Set<visitor_id> per country for step 1 →
//         countryBreakdown
//   - Capped at 200k rows. At current volume that covers any
//     window comfortably (~30k events/month). PostgREST doesn't
//     expose COUNT DISTINCT natively, so a JS-side Set is the
//     practical option without adding an RPC function.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_PLATFORMS = ["ttk", "fb"] as const;
const VALID_PERIODS = ["24h", "7d", "30d", "all"] as const;
const UNKNOWN_COUNTRY = "__unknown__";

type Platform = (typeof VALID_PLATFORMS)[number];
type Period = (typeof VALID_PERIODS)[number];

function isPlatform(v: string | null): v is Platform {
  return v !== null && (VALID_PLATFORMS as readonly string[]).includes(v);
}
function isPeriod(v: string | null): v is Period {
  return v !== null && (VALID_PERIODS as readonly string[]).includes(v);
}

function cutoffFor(period: Period): string | null {
  if (period === "all") return null;
  const ms: Record<Exclude<Period, "all">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - ms[period]).toISOString();
}

interface EventRow {
  visitor_id: string | null;
  step: number | null;
  country: string | null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const period = searchParams.get("period");

  if (!isPlatform(platform) || !isPeriod(period)) {
    return NextResponse.json(
      { error: "Invalid platform or period" },
      { status: 400 },
    );
  }

  const cutoff = cutoffFor(period);

  let q = supabaseAdmin
    .from("quiz_funnel_events")
    .select("visitor_id, step, country")
    .eq("platform", platform)
    .not("visitor_id", "is", null)
    .limit(200000);
  if (cutoff) q = q.gte("created_at", cutoff);

  const { data, error } = await q;
  if (error) {
    console.error(
      `[quiz-funnel-stats] fetch failed platform=${platform} period=${period} err=${error.message}`,
    );
    return NextResponse.json(
      { error: "Stats query failed" },
      { status: 500 },
    );
  }

  // Aggregate in a single pass:
  //   stepSets[step]            → Set<visitor_id> per step
  //   countryStep1Sets[country] → Set<visitor_id> for step 1
  const stepSets: Record<number, Set<string>> = {};
  for (let s = 1; s <= 10; s++) stepSets[s] = new Set();
  const countryStep1Sets: Record<string, Set<string>> = {};

  for (const row of (data ?? []) as EventRow[]) {
    const v = row.visitor_id;
    const s = row.step;
    if (!v || typeof s !== "number" || s < 1 || s > 10) continue;
    stepSets[s].add(v);
    if (s === 1) {
      const c = row.country ?? UNKNOWN_COUNTRY;
      if (!countryStep1Sets[c]) countryStep1Sets[c] = new Set();
      countryStep1Sets[c].add(v);
    }
  }

  const counts: Record<number, number> = {};
  for (let s = 1; s <= 10; s++) counts[s] = stepSets[s].size;

  const countryBreakdown: Record<string, number> = {};
  for (const [c, set] of Object.entries(countryStep1Sets)) {
    countryBreakdown[c] = set.size;
  }

  return NextResponse.json(
    {
      platform,
      period,
      counts,
      countryBreakdown,
    },
    {
      status: 200,
      // Short cache so a refresh-heavy dashboard session doesn't
      // hammer the DB with identical queries. 30s is short enough
      // that "live" still feels live.
      headers: { "Cache-Control": "private, max-age=30" },
    },
  );
}

