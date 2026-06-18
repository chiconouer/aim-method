// =============================================================
// POST /api/quiz-funnel
// -------------------------------------------------------------
// Records a single step-view event for one of the quiz funnels
// (/ttk/quiz or /fb/quiz). The browser fires this via
// navigator.sendBeacon() inside the step-change useEffect (and
// once more with step=9 right before routing to the VSL).
//
// Body: { platform: "ttk" | "fb", step: 1..9 }
//   - platform = traffic-source slug (matches the URL prefix)
//   - step 1..8 = viewed step N of the quiz
//   - step 9    = reached the /[platform]/sales VSL after step 8
//
// Country tagging:
//   The visitor's country is read SERVER-SIDE from Vercel's
//   `x-vercel-ip-country` header (ISO 3166-1 alpha-2 like "US",
//   "BR", "SG"). The browser never sends it — geo from the
//   client is unreliable and spoofable. Header may be absent in
//   local dev / preview / non-Vercel environments → stored as
//   null and the dashboard treats null as "unknown".
//
// Auth model: the browser must NEVER touch Supabase directly for
// quiz_funnel_events — that table's RLS denies anon access. This
// route is the only writer, and it uses the SERVICE ROLE client
// (supabaseAdmin), which is server-only and bypasses RLS by
// design.
//
// Error policy: always responds 200, regardless of payload
// validity or insert success. Beacons are fire-and-forget; a
// non-2xx would just trigger pointless retries from browsers
// that do honor beacon retries, and we'd rather log a server-
// side error than spam the client logs / network panel.
// =============================================================

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const VALID_PLATFORMS = ["ttk", "fb"] as const;
type Platform = (typeof VALID_PLATFORMS)[number];

function isPlatform(v: unknown): v is Platform {
  return (
    typeof v === "string" &&
    (VALID_PLATFORMS as readonly string[]).includes(v)
  );
}

function isValidStep(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 9;
}

// Read Vercel's geo header and normalize. Anything that doesn't look
// like a 2-letter ISO code becomes null so we don't pollute the
// column with junk.
function readCountry(req: NextRequest): string | null {
  const raw = req.headers.get("x-vercel-ip-country");
  if (!raw) return null;
  const trimmed = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(trimmed)) return null;
  return trimmed;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Malformed JSON — silently ack. No need to surface client-side
    // failures the visitor can't fix.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const platform = (body as { platform?: unknown })?.platform;
  const step = (body as { step?: unknown })?.step;

  if (!isPlatform(platform) || !isValidStep(step)) {
    // Defense in depth against accidental misuse / drive-by spam.
    // Still 200 so beacon clients don't retry.
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const country = readCountry(req);

  const { error } = await supabaseAdmin
    .from("quiz_funnel_events")
    .insert({ platform, step, country });

  if (error) {
    // Log loudly — missing rows in the dashboard are debuggable
    // from Vercel logs by grepping this prefix.
    console.error(
      `[quiz-funnel] insert failed platform=${platform} step=${step} country=${country ?? "null"} err=${error.message}`,
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
