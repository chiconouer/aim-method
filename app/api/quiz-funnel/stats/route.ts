// =============================================================
// GET /api/quiz-funnel/stats?platform=ttk&period=7d
// -------------------------------------------------------------
// Read-side counterpart to /api/quiz-funnel. Returns one count
// per step (1..9) for the requested platform within the
// requested time window, ready to be turned into funnel bars by
// the dashboard page.
//
// Auth: uses the SERVICE ROLE client (supabaseAdmin) — the
// quiz_funnel_events table is RLS-locked and the anon role has
// zero row visibility. The browser never queries Supabase
// directly for this data; it hits this route.
//
// Performance: 9 parallel HEAD-style count queries, one per
// step. Each lookup hits the (platform, step) index we created
// in the FASE-1 migration, so they're O(log N) and fast even
// at millions of rows. We deliberately don't `select *` and
// group in JS because Supabase's default 1000-row cap could
// silently miss data on busy funnels.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_PLATFORMS = ["ttk", "fb"] as const;
const VALID_PERIODS = ["24h", "7d", "30d", "all"] as const;

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

  // 9 parallel index lookups — one per step. head:true means no
  // rows ship over the wire, just the count. Each query is wrapped
  // in an async IIFE so the array holds real Promises (Supabase's
  // PostgrestFilterBuilder is a thenable, not a Promise).
  const counts: Record<number, number> = {};
  for (let s = 1; s <= 9; s++) counts[s] = 0;

  type CountResult = { step: number; count: number; error: string | null };

  const queries: Promise<CountResult>[] = [];
  for (let s = 1; s <= 9; s++) {
    queries.push(
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

  const results = await Promise.all(queries);

  for (const r of results) {
    if (r.error) {
      console.error(
        `[quiz-funnel-stats] count failed platform=${platform} period=${period} step=${r.step} err=${r.error}`,
      );
    } else {
      counts[r.step] = r.count;
    }
  }

  return NextResponse.json(
    { platform, period, counts },
    {
      status: 200,
      // Short cache so a refresh-heavy dashboard session doesn't
      // hammer the DB with identical queries. 30s is short enough
      // that "live" tab still feels live.
      headers: { "Cache-Control": "private, max-age=30" },
    },
  );
}
