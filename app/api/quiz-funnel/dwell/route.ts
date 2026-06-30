// =============================================================
// POST /api/quiz-funnel/dwell
// -------------------------------------------------------------
// Records the elapsed ms a visitor spent on step 1 of the quiz.
// Powers the dashboard's behavior-based bot filter: a visitor
// whose max step reached is 1 AND whose dwell is < 2000 ms is
// classified as a bot (matches the Singapore TikTok-review
// bots' ~1-second sessions in Clarity recordings).
//
// Body: { platform: "ttk" | "fb", visitor_id: string,
//         dwell_ms: integer, interacted?: boolean }
//
// Action: UPDATEs quiz_funnel_events rows for the (platform,
// visitor_id, step=1) tuple where step1_dwell_ms is currently
// NULL. The IS NULL guard means subsequent dwell pings (e.g. a
// visitor reloading the page mid-session) only fill in unset
// rows; rows from earlier visits stay frozen at their previous
// dwell value. The `interacted` boolean rides on the same row
// — a true value means the visitor touched/clicked/scrolled
// at least once while step 1 was active.
//
// Auth: uses the SERVICE ROLE client (supabaseAdmin) — the
// quiz_funnel_events table is RLS-locked and the anon role has
// zero row visibility. The browser never queries Supabase
// directly; it hits this route.
//
// Error policy: always responds 200, regardless of payload
// validity or UPDATE success. Beacons are fire-and-forget;
// 4xx/5xx would just trigger pointless retries.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_PLATFORMS = ["ttk", "fb", "fb2"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

const MAX_DWELL_MS = 24 * 60 * 60 * 1000; // 24h ceiling on junk values

function isPlatform(v: unknown): v is Platform {
  return (
    typeof v === "string" &&
    (VALID_PLATFORMS as readonly string[]).includes(v)
  );
}

function isValidVisitorId(v: unknown): v is string {
  return typeof v === "string" && v.length > 0 && v.length <= 64;
}

function isValidDwell(v: unknown): v is number {
  return (
    typeof v === "number" &&
    Number.isInteger(v) &&
    v >= 0 &&
    v <= MAX_DWELL_MS
  );
}

// `interacted` is optional. Boolean values are accepted as-is;
// anything else (missing / wrong type) is normalized to null and
// the UPDATE leaves that column untouched.
function parseInteracted(v: unknown): boolean | null {
  if (v === true || v === false) return v;
  return null;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const platform = (body as { platform?: unknown })?.platform;
  const visitor_id = (body as { visitor_id?: unknown })?.visitor_id;
  const dwell_ms = (body as { dwell_ms?: unknown })?.dwell_ms;
  const interacted = parseInteracted(
    (body as { interacted?: unknown })?.interacted,
  );

  if (
    !isPlatform(platform) ||
    !isValidVisitorId(visitor_id) ||
    !isValidDwell(dwell_ms)
  ) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  // Always set step1_dwell_ms. interacted is conditionally added so
  // a legacy client that doesn't send it doesn't wipe an existing
  // value (UPDATE leaves the column alone if it's not in the patch).
  const patch: { step1_dwell_ms: number; interacted?: boolean } = {
    step1_dwell_ms: dwell_ms,
  };
  if (interacted !== null) {
    patch.interacted = interacted;
  }

  const { error } = await supabaseAdmin
    .from("quiz_funnel_events")
    .update(patch)
    .eq("platform", platform)
    .eq("visitor_id", visitor_id)
    .eq("step", 1)
    .is("step1_dwell_ms", null);

  if (error) {
    console.error(
      `[quiz-funnel-dwell] update failed platform=${platform} visitor_id=${visitor_id} dwell_ms=${dwell_ms} interacted=${interacted ?? "null"} err=${error.message}`,
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
