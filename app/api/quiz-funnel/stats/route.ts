// =============================================================
// GET /api/quiz-funnel/stats?platform=ttk&period=7d[&hideBots=true]
// -------------------------------------------------------------
// Read-side counterpart to /api/quiz-funnel. Returns one count
// per step (1..10) for the requested platform within the
// requested time window, plus a per-country breakdown of the
// step-1 (or step-2 when hideBots=true) events for the same
// platform + period.
//
// Step semantics:
//   1..8  quiz step views
//   9     reached the /[platform]/sales VSL
//   10    clicked the buy button on /[platform]/sales (deduped
//         per visitor session client-side)
//
// Bot filter:
//   ?hideBots=true (default)  → counts[1] is replaced with
//                                counts[2]. Practical semantic:
//                                "treat the step-2 reachers as
//                                the real base/population" since
//                                bots (mostly TikTok ad-review
//                                crawlers) hit step 1 and never
//                                advance. Steps 2..10 keep their
//                                raw counts.
//   ?hideBots=false           → all counts are raw (bot
//                                visitors included in step 1).
//   The country breakdown uses step 2 events when hideBots=true
//   (matches the filtered population) and step 1 events
//   otherwise.
//
// Auth: uses the SERVICE ROLE client (supabaseAdmin) — the
// quiz_funnel_events table is RLS-locked and the anon role has
// zero row visibility. The browser never queries Supabase
// directly for this data; it hits this route.
//
// Performance:
//   - 10 parallel HEAD-style count queries for the funnel bars,
//     each hitting the (platform, step) index.
//   - 1 extra query that fetches just the `country` column for
//     the breakdown's anchor step (1 or 2). PostgREST doesn't
//     expose GROUP BY so we fetch then bucket in JS; capped at
//     100k rows, comfortably above current funnel volume.
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

// Returns ISO timestamp of (now - period), or null for "all".
function cutoffFor(period: Period): string | null {
  if (period === "all") return null;
  const ms: Record<Exclude<Period, "all">, number> = {
    "24h": 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  };
  return new Date(Date.now() - ms[period]).toISOString();
}

// hideBots defaults to true (filter out single-step bots).
// Accepted truthy values: "true", "1". Anything else → false.
// An absent param keeps the default (true).
function parseHideBots(v: string | null): boolean {
  if (v === null) return true;
  return v === "true" || v === "1";
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

  // ───── Per-step funnel counts ─────
  // 10 parallel index lookups — one per step. head:true means no
  // rows ship over the wire, just the count. Each query is wrapped
  // in an async IIFE so the array holds real Promises (Supabase's
  // PostgrestFilterBuilder is a thenable, not a Promise).
  const counts: Record<number, number> = {};
  for (let s = 1; s <= 10; s++) counts[s] = 0;

  type CountResult = { step: number; count: number; error: string | null };

  const countQueries: Promise<CountResult>[] = [];
  for (let s = 1; s <= 10; s++) {
    countQueries.push(
      (async (): Promise<CountResult> => {
        let q = supabaseAdmin
          .from("quiz_funnel_events")
          .select("*", { count: "exact", head: true })
          .eq("platform", platform)
          .eq("step", s);
        if (cutoff) q = q.gte("created_at", cutoff);
        const { count, error } = await q;
        return {
          step: s,
          count: count ?? 0,
          error: error?.message ?? null,
        };
      })(),
    );
  }

  // ───── Per-country breakdown ─────
  // Anchored to step 1 by default; switches to step 2 when
  // hideBots=true so the breakdown stays consistent with the
  // human-only funnel (bots aren't in step 2). Fetch just the
  // `country` column for the chosen step + platform + period,
  // bucket in JS. 100k-row cap is way above current funnel volume.
  const breakdownStep = hideBots ? 2 : 1;
  const breakdownPromise = (async (): Promise<{
    counts: Record<string, number>;
    error: string | null;
  }> => {
    let q = supabaseAdmin
      .from("quiz_funnel_events")
      .select("country")
      .eq("platform", platform)
      .eq("step", breakdownStep)
      .limit(100000);
    if (cutoff) q = q.gte("created_at", cutoff);
    const { data, error } = await q;
    if (error) return { counts: {}, error: error.message };
    const buckets: Record<string, number> = {};
    for (const row of data ?? []) {
      const c = (row as { country?: string | null }).country;
      const key = c == null ? UNKNOWN_COUNTRY : c;
      buckets[key] = (buckets[key] ?? 0) + 1;
    }
    return { counts: buckets, error: null };
  })();

  const [countResults, breakdownResult] = await Promise.all([
    Promise.all(countQueries),
    breakdownPromise,
  ]);

  for (const r of countResults) {
    if (r.error) {
      console.error(
        `[quiz-funnel-stats] count failed platform=${platform} period=${period} hideBots=${hideBots} step=${r.step} err=${r.error}`,
      );
    } else {
      counts[r.step] = r.count;
    }
  }
  if (breakdownResult.error) {
    console.error(
      `[quiz-funnel-stats] breakdown failed platform=${platform} period=${period} hideBots=${hideBots} err=${breakdownResult.error}`,
    );
  }

  // Apply the hideBots adjustment AFTER all queries land: replace
  // counts[1] with counts[2] so the funnel baseline becomes "real
  // visitors who advanced past the intro guess". counts[2..10]
  // unchanged. We persist the raw step-1 number under
  // `rawCounts[1]` for transparency on the wire (debugging /
  // future "compare with/without bots" UI).
  const rawStep1 = counts[1];
  if (hideBots) {
    counts[1] = counts[2];
  }

  return NextResponse.json(
    {
      platform,
      period,
      hideBots,
      counts,
      rawStep1Count: rawStep1,
      countryBreakdown: breakdownResult.counts,
    },
    {
      status: 200,
      // Short cache so a refresh-heavy dashboard session doesn't
      // hammer the DB with identical queries. 30s is short enough
      // that "live" tab still feels live.
      headers: { "Cache-Control": "private, max-age=30" },
    },
  );
}
