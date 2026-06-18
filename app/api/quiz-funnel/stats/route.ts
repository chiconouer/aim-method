// =============================================================
// GET /api/quiz-funnel/stats?platform=ttk&period=7d[&hideBots=true]
// -------------------------------------------------------------
// Returns counts of UNIQUE VISITORS per step (1..10) for the
// requested platform within the requested time window, plus a
// per-country breakdown anchored at step 1, plus the bot vs
// real counts.
//
// Step semantics:
//   1..8   quiz step views
//   9      reached the /[platform]/sales VSL
//   10     clicked the buy button on /[platform]/sales
//
// Counting model — DISTINCT visitors, not events:
//   counts[N] = number of distinct visitor_id values that have
//   at least one row at step N for this platform+period.
//
// Bot filter (default ON):
//   A visitor is classified as a BOT when:
//     max(step) == 1  AND  step1_dwell_ms IS NOT NULL  AND
//     step1_dwell_ms < 2000
//
//   "Real" otherwise — including visitors who hit step 1 and
//   left WITHOUT a dwell ping (treated as unknown → real,
//   conservative bias).
//
//   When hideBots=true (default) the route subtracts bots from
//   counts + countryBreakdown server-side. When hideBots=false
//   everyone is counted.
//
// Auth: SERVICE ROLE client (supabaseAdmin) — quiz_funnel_events
// is RLS-locked and the anon role has zero row visibility. The
// browser never queries Supabase directly; it hits this route.
//
// Performance: ONE fetch of (visitor_id, step, country,
// step1_dwell_ms) for the platform+period, then JS aggregates
// per visitor and applies the bot filter in memory. Capped at
// 200k rows.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_PLATFORMS = ["ttk", "fb"] as const;
const VALID_PERIODS = ["24h", "7d", "30d", "all"] as const;
const UNKNOWN_COUNTRY = "__unknown__";
const BOT_DWELL_MS_THRESHOLD = 2000;

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

// hideBots defaults to true (filter out behavior-based bots).
// Truthy values: "true", "1". Anything else → false.
function parseHideBots(v: string | null): boolean {
  if (v === null) return true;
  return v === "true" || v === "1";
}

interface EventRow {
  visitor_id: string | null;
  step: number | null;
  country: string | null;
  step1_dwell_ms: number | null;
}

interface VisitorAgg {
  steps: Set<number>;
  step1DwellMs: number | null;
  countryAtStep1: string | null;
}

function isBot(agg: VisitorAgg): boolean {
  let maxStep = 0;
  agg.steps.forEach((s) => {
    if (s > maxStep) maxStep = s;
  });
  if (maxStep > 1) return false;
  if (agg.step1DwellMs == null) return false;
  return agg.step1DwellMs < BOT_DWELL_MS_THRESHOLD;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const period = searchParams.get("period");
  const hideBots = parseHideBots(searchParams.get("hideBots"));

  if (!isPlatform(platform) || !isPeriod(period)) {
    return NextResponse.json(
      { error: "Invalid platform or period" },
      { status: 400 },
    );
  }

  const cutoff = cutoffFor(period);

  let q = supabaseAdmin
    .from("quiz_funnel_events")
    .select("visitor_id, step, country, step1_dwell_ms")
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

  // Aggregate per visitor in a single pass.
  const visitors = new Map<string, VisitorAgg>();
  for (const row of (data ?? []) as EventRow[]) {
    const v = row.visitor_id;
    const s = row.step;
    if (!v || typeof s !== "number" || s < 1 || s > 10) continue;

    let agg = visitors.get(v);
    if (!agg) {
      agg = { steps: new Set(), step1DwellMs: null, countryAtStep1: null };
      visitors.set(v, agg);
    }
    agg.steps.add(s);

    if (s === 1) {
      if (agg.countryAtStep1 == null && row.country != null) {
        agg.countryAtStep1 = row.country;
      }
      const dwell = row.step1_dwell_ms;
      if (typeof dwell === "number") {
        if (agg.step1DwellMs == null || dwell > agg.step1DwellMs) {
          agg.step1DwellMs = dwell;
        }
      }
    }
  }

  // Classify + count.
  const counts: Record<number, number> = {};
  for (let s = 1; s <= 10; s++) counts[s] = 0;
  const countryBreakdown: Record<string, number> = {};
  let botCount = 0;
  let realCount = 0;

  visitors.forEach((agg) => {
    const bot = isBot(agg);
    if (bot) botCount++;
    else realCount++;

    if (hideBots && bot) return;

    agg.steps.forEach((s) => {
      if (s >= 1 && s <= 10) counts[s]++;
    });
    if (agg.steps.has(1)) {
      const c = agg.countryAtStep1 ?? UNKNOWN_COUNTRY;
      countryBreakdown[c] = (countryBreakdown[c] ?? 0) + 1;
    }
  });

  return NextResponse.json(
    {
      platform,
      period,
      hideBots,
      counts,
      countryBreakdown,
      botCount,
      realCount,
      botDwellThresholdMs: BOT_DWELL_MS_THRESHOLD,
    },
    {
      status: 200,
      headers: { "Cache-Control": "private, max-age=30" },
    },
  );
}
