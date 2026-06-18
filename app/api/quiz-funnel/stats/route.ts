// =============================================================
// GET /api/quiz-funnel/stats?platform=ttk&period=7d[&country=US]
// -------------------------------------------------------------
// Read-side counterpart to /api/quiz-funnel. Returns one count
// per step (1..10) for the requested platform within the
// requested time window, plus an unfiltered per-country
// breakdown of step-1 events for the same platform + period.
// Step 10 = "reached checkout" — fired by the sales pages when
// the visitor clicks the Digistore buy button.
//
// Country filter:
//   ?country=US      → step counts filtered to country = 'US'
//   ?country=__unknown__ → step counts where country IS NULL
//   (omit param)      → step counts include all countries
//   The countryBreakdown is ALWAYS computed unfiltered so the
//   dashboard dropdown stays populated regardless of the active
//   country filter.
//
// Auth: uses the SERVICE ROLE client (supabaseAdmin) — the
// quiz_funnel_events table is RLS-locked and the anon role has
// zero row visibility. The browser never queries Supabase
// directly for this data; it hits this route.
//
// Performance:
//   - 10 parallel HEAD-style count queries for the funnel bars,
//     each hitting (platform, step) [+ country] indexes.
//   - 1 extra query that fetches just the `country` column for
//     step-1 rows in the period (no group-by in PostgREST — we
//     fetch then bucket in JS). Capped at 100k rows which is
//     way above current funnel volume; covers 24h/7d/30d/all
//     windows without paginating.
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

// Validate the country query param. Returns null for "no filter".
// Returns "__unknown__" sentinel to mean "country IS NULL". Otherwise
// returns a 2-letter ISO code (uppercased). Anything else → null
// (treated as "no filter") so a junk URL can't quietly produce an
// always-empty funnel.
function parseCountryFilter(v: string | null): string | null {
  if (!v) return null;
  if (v === UNKNOWN_COUNTRY) return UNKNOWN_COUNTRY;
  const trimmed = v.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const platform = searchParams.get("platform");
  const period = searchParams.get("period");
  const country = parseCountryFilter(searchParams.get("country"));

  if (!isPlatform(platform) || !isPeriod(period)) {
    return NextResponse.json(
      { error: "Invalid platform or period" },
      { status: 400 },
    );
  }

  const cutoff = cutoffFor(period);

  // ───── Per-step funnel counts ─────
  // 9 parallel index lookups — one per step. head:true means no rows
  // ship over the wire, just the count. Each query is wrapped in an
  // async IIFE so the array holds real Promises (Supabase's
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
        if (country === UNKNOWN_COUNTRY) q = q.is("country", null);
        else if (country) q = q.eq("country", country);
        const { count, error } = await q;
        return {
          step: s,
          count: count ?? 0,
          error: error?.message ?? null,
        };
      })(),
    );
  }

  // ───── Per-country breakdown of step-1 events ─────
  // Always unfiltered by country so the dashboard dropdown stays
  // populated even when a country filter is active. Fetch just the
  // `country` column for the platform+period, bucket in JS. PostgREST
  // doesn't expose GROUP BY natively, but at the funnel's volume the
  // 100k-row ceiling is generous (current production is ~hundreds).
  const breakdownPromise = (async (): Promise<{
    counts: Record<string, number>;
    error: string | null;
  }> => {
    let q = supabaseAdmin
      .from("quiz_funnel_events")
      .select("country")
      .eq("platform", platform)
      .eq("step", 1)
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
        `[quiz-funnel-stats] count failed platform=${platform} period=${period} country=${country ?? "all"} step=${r.step} err=${r.error}`,
      );
    } else {
      counts[r.step] = r.count;
    }
  }
  if (breakdownResult.error) {
    console.error(
      `[quiz-funnel-stats] breakdown failed platform=${platform} period=${period} err=${breakdownResult.error}`,
    );
  }

  return NextResponse.json(
    {
      platform,
      period,
      country: country ?? null,
      counts,
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
