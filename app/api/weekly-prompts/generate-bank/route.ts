// Admin-only endpoint that generates ONE WEEK of the weekly prompt bank
// using a single Claude Sonnet 4.6 call. Auth via Authorization: Bearer
// <CRON_SECRET> header (same pattern as app/api/daily-report/route.ts).
//
// Accepts the week number as ?week=N query param OR { "week": N } JSON
// body (N = 1..12). The endpoint generates that week's 7 prompts and
// upserts ONLY that week into weekly_prompt_bank.
//
// Why one week per call instead of all 12: the original single-call
// "generate all 84" approach hit Vercel's 300s maxDuration ceiling and
// 504'd before saving anything. Per-week calls finish in ~10-30s each
// — well under the timeout, with all-or-nothing validation per week
// and idempotent upsert (rerunning a week overwrites it cleanly).
//
// To generate the full 12-week bank, loop the endpoint 12 times. See
// the PR description for a ready-made shell loop.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;

const MODEL = "claude-sonnet-4-6";
const DAYS_PER_WEEK = 7;
const MIN_WEEK = 1;
const MAX_WEEK = 12;
const MIN_PROMPT_BODY_CHARS = 500;
const MIN_TITLE_CHARS = 3;
const MAX_TITLE_CHARS = 80;

const SYSTEM_PROMPT = `You are a senior Instagram content strategist for AI-influencer accounts. Your job is to generate ONE WEEK of content prompts (exactly 7 distinct Instagram post prompts, one per day) for AI-generated model accounts in the girl-next-door / clean-girl / model-off-duty aesthetic. These prompts will be fed into an image generator (Gemini Nano Banana Pro via Replicate) to create posts of each subscriber's custom AI model.

OUTPUT FORMAT — CRITICAL

Return a SINGLE JSON object with NO surrounding markdown fences, NO preamble, NO commentary. Exact shape for one week:

{
  "prompts": [
    {
      "day": 1,
      "title": "Short 3-6 word descriptor",
      "prompt": "Full 13-section prompt body (150-250 words)",
      "suggested_post_time": "HH:MM ET"
    }
    // ... 6 more, days 2-7 — exactly 7 prompts total
  ]
}

Exactly 7 prompts. Days numbered 1..7. No prose outside the JSON.

PROMPT STRUCTURE — every prompt body MUST contain these 13 sections in this order:

1. Opening shot context — declare camera type + scene context up front. Two main openings: "Authentic iPhone front-camera selfie of a stunning young woman ..." or "Candid photograph of a young woman ..."
2. Reference anchor — include verbatim: "Follow her exact face features just like the reference image — same face shape, same eyes, same nose, same lips, same jawline, identical model."
3. Hair — describe styling specific to the scene (sleek down, tousled, ponytail, blowing in breeze, damp from gym, slicked back, etc.)
4. Outfit + accessories — specific garments + gold chain / hoops / etc.
5. Setting / background — concrete details of the environment
6. Lighting — be specific (midday sun, golden hour backlight, candlelight, overcast daylight, gym fluorescent, blue hour, morning window light, etc.)
7. Pose + expression — what she's doing, where she's looking, type of smile/look
8. Face features detail — re-state for consistency: "large piercing eyes with long thick dark mascara-coated lashes, defined laminated brows, full plump glossy lips, sharp jawline, high cheekbones"
9. Makeup — appropriate to scene (clean-girl natural, post-workout minimal, evening glam, beachy dewy)
10. Camera meta — pick one: "Shot on iPhone 15 Pro front camera, slightly soft natural focus, no professional retouching" or "Shot on a 35mm lens with shallow depth of field, photographed by a friend"
11. Skin realism (anti-AI) — verbatim or near-verbatim: "Hyperrealistic skin with visible pores, fine peach fuzz, tiny natural freckles, healthy dewy glow, no AI plastic look, no over-smoothing"
12. Vibe summary — one line capturing the energy: "Vibe: cozy Sunday morning, the kind of selfie a girl-next-door influencer posts with a coffee emoji"
13. Technical close — "Composition [describe framing]. Aspect ratio 4:5, 4K quality."

CONSTRAINTS

- NO placeholder variables. NEVER write "{AGE}", "{ETHNICITY}", "{HAIR_COLOR}", "{NICHE}", "{BODY_TYPE}", "{EYE_COLOR}", or any other curly-brace placeholder. Use generic descriptors ("a stunning young woman", "soft natural makeup", "her hair styled in [describe]").
- Camera mix within this week of 7: aim for ~4 handheld phone shots (iPhone front-camera selfies OR iPhone main-camera mirror selfies) and ~3 candid shots from a friend with a 35mm lens. Don't make all 7 the same camera type.
- Aesthetic anchor: girl-next-door, casual, realistic. NOT high-fashion editorial. NOT studio. NOT lingerie/swimwear-heavy. Think "prettiest girl in your university dorm", not "Vogue cover".
- Diversity within these 7: vary scene type, outfit, lighting, pose, expression, composition. No two prompts should feel like the same shot.
- Scene type ideas to draw from (mix freely): bedroom, kitchen, café, gym, park, restaurant, car, beach, street, rooftop, bookstore, museum, brunch spot, library, mall, dog park, balcony, studio apartment, bathroom mirror, outdoor patio, hotel lobby.
- IMPORTANT: do NOT copy the existing 11 onboarding photo-pack prompts verbatim (car driver-seat selfie with car interior, morning bedroom selfie with cream knit sweater, coffee shop selfie with matcha latte, car passenger selfie with sunglasses on head, golden hour park selfie with crop top + denim shorts, bedroom mirror full-body selfie with white tank + low-rise jeans, gym locker-room mirror selfie with matching activewear set, beach walking sundress shot, restaurant dinner with red wine, city street blazer walking shot, rooftop sunset cocktail shot). Create NEW scenes/angles/outfits for this week.
- Each prompt body: 150-250 words. Under 500 chars total will be rejected by validation.

TITLE FIELD

3-6 words, descriptive of the shot. Examples: "Sunday Morning Bedroom Selfie", "Café Reading Candid", "Rooftop Cocktail Hour", "Post-Workout Locker Mirror", "Linen Dress Beach Walk".

SUGGESTED POST TIMES

US Instagram engagement-peak windows. Vary across this week's 7 — don't cluster them all at the same time. Good slots: 08:00, 12:00, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00. Match the slot to the vibe (golden hour shot → 19:00 ET, morning bedroom → 08:00 ET, café midday → 12:00 ET, dinner → 20:00 ET, rooftop sunset → 18:30 ET).

Format strictly as "HH:MM ET" (24-hour, e.g., "19:30 ET" or "08:00 ET").

Be precise. Be thorough. Generate exactly 7 prompts for this single week, per the schema above.`;

const client = new Anthropic();

interface PromptEntry {
  day: number;
  title: string;
  prompt: string;
  suggested_post_time: string;
}

function isValidPostTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(\s*ET)?$/i.test(s.trim());
}

function validateWeek(
  parsed: unknown,
): { ok: true; prompts: PromptEntry[] } | { ok: false; reason: string } {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "root is not an object" };
  }
  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.prompts)) {
    return { ok: false, reason: "root.prompts is not an array" };
  }
  if (root.prompts.length !== DAYS_PER_WEEK) {
    return {
      ok: false,
      reason: `expected ${DAYS_PER_WEEK} prompts, got ${root.prompts.length}`,
    };
  }

  const seenDays = new Set<number>();
  const validated: PromptEntry[] = [];

  for (let i = 0; i < root.prompts.length; i++) {
    const rawPrompt = root.prompts[i];
    if (
      !rawPrompt ||
      typeof rawPrompt !== "object" ||
      Array.isArray(rawPrompt)
    ) {
      return { ok: false, reason: `prompts[${i}] is not an object` };
    }
    const p = rawPrompt as Record<string, unknown>;
    const day = p.day;
    if (
      typeof day !== "number" ||
      !Number.isInteger(day) ||
      day < 1 ||
      day > DAYS_PER_WEEK
    ) {
      return {
        ok: false,
        reason: `prompts[${i}].day invalid: ${JSON.stringify(day)}`,
      };
    }
    if (seenDays.has(day)) {
      return { ok: false, reason: `duplicate day ${day}` };
    }
    seenDays.add(day);

    const title = p.title;
    if (
      typeof title !== "string" ||
      title.length < MIN_TITLE_CHARS ||
      title.length > MAX_TITLE_CHARS
    ) {
      return {
        ok: false,
        reason: `day ${day}: title invalid (must be ${MIN_TITLE_CHARS}-${MAX_TITLE_CHARS} chars, got ${typeof title === "string" ? title.length : "non-string"})`,
      };
    }

    const prompt = p.prompt;
    if (typeof prompt !== "string" || prompt.length < MIN_PROMPT_BODY_CHARS) {
      return {
        ok: false,
        reason: `day ${day}: prompt body too short (got ${typeof prompt === "string" ? prompt.length : 0} chars, need >= ${MIN_PROMPT_BODY_CHARS})`,
      };
    }

    if (/\{[A-Z_]+\}/.test(prompt)) {
      return {
        ok: false,
        reason: `day ${day}: prompt contains unresolved {PLACEHOLDER} — must be generic`,
      };
    }

    const postTime = p.suggested_post_time;
    if (typeof postTime !== "string" || !isValidPostTime(postTime)) {
      return {
        ok: false,
        reason: `day ${day}: suggested_post_time invalid: ${JSON.stringify(postTime)}`,
      };
    }

    validated.push({
      day,
      title: title.trim(),
      prompt: prompt.trim(),
      suggested_post_time: postTime.trim(),
    });
  }

  return { ok: true, prompts: validated };
}

function stripMarkdownFences(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
}

async function resolveWeekParam(req: NextRequest): Promise<number | null> {
  // Query param first (used by the recommended shell-loop pattern).
  const urlWeek = req.nextUrl.searchParams.get("week");
  let weekStr: string | null = urlWeek;

  // JSON body fallback — for callers that prefer a body payload.
  if (!weekStr) {
    try {
      const body = await req.json();
      if (
        body &&
        typeof body === "object" &&
        !Array.isArray(body) &&
        "week" in body
      ) {
        weekStr = String((body as Record<string, unknown>).week);
      }
    } catch {
      // No body or invalid JSON — fall through, week check below rejects.
    }
  }

  if (weekStr === null || weekStr === undefined || weekStr === "") return null;
  const week = parseInt(weekStr, 10);
  if (!Number.isInteger(week) || week < MIN_WEEK || week > MAX_WEEK) return null;
  return week;
}

export async function POST(req: NextRequest) {
  // 1. Auth — Bearer CRON_SECRET (matches app/api/daily-report/route.ts pattern)
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("[weekly-bank-gen] CRON_SECRET not set");
    return NextResponse.json(
      { error: "Server not configured" },
      { status: 500 },
    );
  }
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn("[weekly-bank-gen] Unauthorized request");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Resolve target week (?week=N query param or { "week": N } JSON body).
  const week = await resolveWeekParam(req);
  if (week === null) {
    return NextResponse.json(
      {
        error: `Missing or invalid 'week' param — must be integer ${MIN_WEEK}-${MAX_WEEK}. Pass as ?week=N query param or { "week": N } JSON body.`,
      },
      { status: 400 },
    );
  }

  console.log(`[weekly-bank-gen] starting generation for week ${week}`);

  // 3. Call Anthropic with streaming (still streaming even though one week
  //    is much smaller than the original 84 — keeps the connection alive
  //    and avoids hidden timeouts).
  const startedAt = Date.now();
  let rawText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    const userPrompt = `Generate week #${week} of the 12-week series. Return ONE week of 7 prompts as a JSON object — no prose, no markdown fences.`;
    // No `thinking` and no `output_config.effort` here on purpose.
    //
    // The first version of this route used `thinking: { type: "adaptive" }`
    // + `effort: "high"` and the model consumed the entire max_tokens
    // budget on thinking tokens, returning zero text blocks (empty
    // rawText → 422 "Unexpected end of JSON input"). Generating a
    // structured JSON that follows a strict template doesn't benefit
    // from thinking — plain generation is faster, cheaper, and reliably
    // produces the JSON.
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const final = await stream.finalMessage();

    rawText = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    inputTokens = final.usage.input_tokens;
    outputTokens = final.usage.output_tokens;
    const stopReason = final.stop_reason ?? "unknown";

    console.log(
      `[weekly-bank-gen] week ${week} — Anthropic returned ${rawText.length} chars, stop_reason=${stopReason}, in=${inputTokens} out=${outputTokens}`,
    );

    // Distinguish "model returned nothing" from "model returned malformed
    // JSON" so future failures are easier to diagnose at a glance.
    if (!rawText) {
      return NextResponse.json(
        {
          error: "Model returned empty text",
          week,
          stop_reason: stopReason,
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          hint:
            stopReason === "max_tokens"
              ? "Output cut off — raise max_tokens or simplify the system prompt."
              : "Model produced no text blocks; check Anthropic dashboard for the request.",
        },
        { status: 502 },
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(
      `[weekly-bank-gen] week ${week} — Anthropic call failed:`,
      msg,
    );
    return NextResponse.json(
      { error: "Anthropic call failed", week, detail: msg },
      { status: 502 },
    );
  }

  // 4. Parse JSON (defensive markdown-fence strip).
  const cleaned = stripMarkdownFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[weekly-bank-gen] week ${week} — JSON parse failed:`, msg);
    return NextResponse.json(
      {
        error: "Model returned invalid JSON",
        week,
        detail: msg,
        preview: rawText.slice(0, 300),
      },
      { status: 422 },
    );
  }

  // 5. Validate (all-or-nothing for this week).
  const validation = validateWeek(parsed);
  if (!validation.ok) {
    console.error(
      `[weekly-bank-gen] week ${week} — validation failed: ${validation.reason}`,
    );
    return NextResponse.json(
      {
        error: "Generated week failed validation",
        week,
        detail: validation.reason,
      },
      { status: 422 },
    );
  }

  // 6. Upsert just this week. Idempotent — rerunning overwrites.
  const { error } = await supabaseAdmin
    .from("weekly_prompt_bank")
    .upsert(
      {
        week_number: week,
        prompts: validation.prompts,
        generated_at: new Date().toISOString(),
      },
      { onConflict: "week_number" },
    );
  if (error) {
    console.error(
      `[weekly-bank-gen] week ${week} — DB upsert failed:`,
      error.message,
    );
    return NextResponse.json(
      {
        error: `DB upsert failed for week ${week}`,
        week,
        detail: error.message,
      },
      { status: 500 },
    );
  }

  const durationMs = Date.now() - startedAt;
  console.log(
    `[weekly-bank-gen] week ${week} saved (${DAYS_PER_WEEK} prompts) in ${durationMs}ms`,
  );

  return NextResponse.json({
    ok: true,
    week,
    prompts_saved: DAYS_PER_WEEK,
    model: MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    duration_ms: durationMs,
  });
}
