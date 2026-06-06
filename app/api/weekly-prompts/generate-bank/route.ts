// Admin-only endpoint that (re)generates the entire 12-week weekly prompt
// bank in one shot using Claude Sonnet 4.6. Auth via Authorization: Bearer
// <CRON_SECRET> header (same pattern as app/api/daily-report/route.ts).
//
// Output: 12 weeks × 7 prompts/day = 84 distinct Instagram post prompts,
// generic (no per-subscriber placeholders), saved into the
// weekly_prompt_bank table (upsert by week_number).
//
// The single-call strategy lets Sonnet see the whole bank as it writes,
// so it can distribute scenes/outfits/lighting naturally and avoid
// repetition across weeks. All-or-nothing validation before saving — if
// the model returns malformed or short output, nothing is written.
//
// Long-running: typical wall-clock 60-180s. maxDuration=300 covers it.
// Streaming via .stream().finalMessage() avoids HTTP timeouts that a
// non-streamed long generation could hit.

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

export const maxDuration = 300;

const MODEL = "claude-sonnet-4-6";
const TOTAL_WEEKS = 12;
const DAYS_PER_WEEK = 7;
const TOTAL_PROMPTS = TOTAL_WEEKS * DAYS_PER_WEEK;
const MIN_PROMPT_BODY_CHARS = 500;
const MIN_TITLE_CHARS = 3;
const MAX_TITLE_CHARS = 80;

const SYSTEM_PROMPT = `You are a senior Instagram content strategist for AI-influencer accounts. Your job is to generate a 12-week content bank — 84 distinct Instagram post prompts (12 weeks × 7 days each) for AI-generated model accounts in the girl-next-door / clean-girl / model-off-duty aesthetic. These prompts will be fed into an image generator (Gemini Nano Banana Pro via Replicate) to create posts of each subscriber's custom AI model.

OUTPUT FORMAT — CRITICAL

Return a SINGLE JSON object with NO surrounding markdown fences, NO preamble, NO commentary. Exact shape:

{
  "weeks": [
    {
      "week_number": 1,
      "prompts": [
        {
          "day": 1,
          "title": "Short 3-6 word descriptor",
          "prompt": "Full 13-section prompt body (150-250 words)",
          "suggested_post_time": "HH:MM ET"
        }
        // ... 6 more, days 2-7
      ]
    }
    // ... 11 more weeks, week_number 2 through 12
  ]
}

Exactly 12 weeks. Each week exactly 7 prompts. Days numbered 1..7 within each week. No prose outside the JSON.

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
- Camera mix: ~60% handheld phone shots (iPhone front-camera selfies OR iPhone main-camera mirror selfies) and ~40% candid shots from a friend with a 35mm lens. Spread the ratio across the 84 prompts, not clustered.
- Aesthetic anchor: girl-next-door, casual, realistic. NOT high-fashion editorial. NOT studio. NOT lingerie/swimwear-heavy. Think "prettiest girl in your university dorm", not "Vogue cover".
- Diversity is critical. Across the 84, vary:
  • Scene type (bedroom, kitchen, café, gym, park, restaurant, car, beach, street, rooftop, bookstore, museum, brunch spot, library, mall, dog park, balcony, etc.)
  • Outfit (loungewear, athleisure, jeans + tee, midi dress, sweater, blazer, sundress, hoodie, oversized button-down, etc.)
  • Lighting (golden hour, midday, morning, candle, blue hour, overcast, gym fluorescent, neon, warm interior, etc.)
  • Pose (sitting, walking, leaning, mid-laugh, mid-step, lying down, looking over shoulder, etc.)
  • Expression (neutral confident, soft smile, mid-laugh, contemplative, playful, sleepy, focused, etc.)
  • Composition (chest-up selfie, full-body mirror, 3/4 candid, profile candid, etc.)
- Scenes CAN repeat type across weeks (e.g., 2 different gym shots across 12 weeks) but MUST vary angle/outfit/background/expression so each feels fresh. Avoid 2 similar scenes in the same week.
- IMPORTANT: do NOT copy existing photo-pack prompts verbatim. Create NEW scenes — different from the 11 known onboarding scenes (car driver-seat selfie, morning bedroom selfie, coffee shop selfie with matcha, car passenger with sunglasses, golden hour park selfie, bedroom mirror full-body, gym locker-room mirror, beach walking sundress, restaurant dinner with wine, city street blazer walking, rooftop sunset cocktail).
- Each prompt body: 150-250 words. Under 500 chars total will be rejected by validation.

TITLE FIELD

3-6 words, descriptive of the shot. Examples: "Sunday Morning Bedroom Selfie", "Café Reading Candid", "Rooftop Cocktail Hour", "Post-Workout Locker Mirror", "Linen Dress Beach Walk".

SUGGESTED POST TIMES

US Instagram engagement-peak windows. Vary across the 84 — don't cluster. Good slots: 08:00, 12:00, 18:00, 18:30, 19:00, 19:30, 20:00, 20:30, 21:00. Match the slot to the vibe (golden hour shot → 19:00 ET, morning bedroom → 08:00 ET, café midday → 12:00 ET, dinner → 20:00 ET, rooftop sunset → 18:30 ET).

Format strictly as "HH:MM ET" (24-hour, e.g., "19:30 ET" or "08:00 ET").

Be precise. Be thorough. Generate all 84 prompts in a single JSON response, exactly per the schema above.`;

const USER_PROMPT =
  "Generate the 12-week bank now. Return only the JSON object — no prose, no markdown fences.";

const client = new Anthropic();

interface PromptEntry {
  day: number;
  title: string;
  prompt: string;
  suggested_post_time: string;
}

interface WeekEntry {
  week_number: number;
  prompts: PromptEntry[];
}

interface Bank {
  weeks: WeekEntry[];
}

// Accepts "HH:MM" or "HH:MM ET" (case-insensitive), 24-hour clock.
function isValidPostTime(s: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d(\s*ET)?$/i.test(s.trim());
}

function validateBank(
  parsed: unknown,
): { ok: true; bank: Bank } | { ok: false; reason: string } {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "root is not an object" };
  }
  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.weeks)) {
    return { ok: false, reason: "root.weeks is not an array" };
  }
  if (root.weeks.length !== TOTAL_WEEKS) {
    return {
      ok: false,
      reason: `expected ${TOTAL_WEEKS} weeks, got ${root.weeks.length}`,
    };
  }

  const seenWeekNumbers = new Set<number>();
  const validatedWeeks: WeekEntry[] = [];

  for (let i = 0; i < root.weeks.length; i++) {
    const rawWeek = root.weeks[i];
    if (!rawWeek || typeof rawWeek !== "object" || Array.isArray(rawWeek)) {
      return { ok: false, reason: `weeks[${i}] is not an object` };
    }
    const week = rawWeek as Record<string, unknown>;
    const weekNumber = week.week_number;
    if (
      typeof weekNumber !== "number" ||
      !Number.isInteger(weekNumber) ||
      weekNumber < 1 ||
      weekNumber > TOTAL_WEEKS
    ) {
      return {
        ok: false,
        reason: `weeks[${i}].week_number invalid: ${JSON.stringify(weekNumber)}`,
      };
    }
    if (seenWeekNumbers.has(weekNumber)) {
      return { ok: false, reason: `duplicate week_number: ${weekNumber}` };
    }
    seenWeekNumbers.add(weekNumber);

    if (!Array.isArray(week.prompts)) {
      return {
        ok: false,
        reason: `week ${weekNumber}: prompts is not an array`,
      };
    }
    if (week.prompts.length !== DAYS_PER_WEEK) {
      return {
        ok: false,
        reason: `week ${weekNumber}: expected ${DAYS_PER_WEEK} prompts, got ${week.prompts.length}`,
      };
    }

    const seenDays = new Set<number>();
    const validatedPrompts: PromptEntry[] = [];

    for (let j = 0; j < week.prompts.length; j++) {
      const rawPrompt = week.prompts[j];
      if (
        !rawPrompt ||
        typeof rawPrompt !== "object" ||
        Array.isArray(rawPrompt)
      ) {
        return {
          ok: false,
          reason: `week ${weekNumber} prompts[${j}] is not an object`,
        };
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
          reason: `week ${weekNumber} prompts[${j}].day invalid: ${JSON.stringify(day)}`,
        };
      }
      if (seenDays.has(day)) {
        return {
          ok: false,
          reason: `week ${weekNumber}: duplicate day ${day}`,
        };
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
          reason: `week ${weekNumber} day ${day}: title invalid (must be ${MIN_TITLE_CHARS}-${MAX_TITLE_CHARS} chars, got ${typeof title === "string" ? title.length : "non-string"})`,
        };
      }

      const prompt = p.prompt;
      if (typeof prompt !== "string" || prompt.length < MIN_PROMPT_BODY_CHARS) {
        return {
          ok: false,
          reason: `week ${weekNumber} day ${day}: prompt body too short (got ${typeof prompt === "string" ? prompt.length : 0} chars, need >= ${MIN_PROMPT_BODY_CHARS})`,
        };
      }

      // Reject leftover placeholders that should have been substituted.
      if (/\{[A-Z_]+\}/.test(prompt)) {
        return {
          ok: false,
          reason: `week ${weekNumber} day ${day}: prompt contains unresolved {PLACEHOLDER} — must be generic`,
        };
      }

      const postTime = p.suggested_post_time;
      if (typeof postTime !== "string" || !isValidPostTime(postTime)) {
        return {
          ok: false,
          reason: `week ${weekNumber} day ${day}: suggested_post_time invalid: ${JSON.stringify(postTime)}`,
        };
      }

      validatedPrompts.push({
        day,
        title: title.trim(),
        prompt: prompt.trim(),
        suggested_post_time: postTime.trim(),
      });
    }

    validatedWeeks.push({
      week_number: weekNumber,
      prompts: validatedPrompts,
    });
  }

  const totalPrompts = validatedWeeks.reduce(
    (sum, w) => sum + w.prompts.length,
    0,
  );
  if (totalPrompts !== TOTAL_PROMPTS) {
    return {
      ok: false,
      reason: `total prompts mismatch: ${totalPrompts} (expected ${TOTAL_PROMPTS})`,
    };
  }

  return { ok: true, bank: { weeks: validatedWeeks } };
}

// Strip a single set of leading/trailing markdown fences if Sonnet
// adds them despite instructions. Defensive — most calls return raw JSON.
function stripMarkdownFences(s: string): string {
  const trimmed = s.trim();
  if (!trimmed.startsWith("```")) return trimmed;
  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();
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

  // 2. Call Anthropic with streaming (long output, avoid HTTP timeouts).
  const startedAt = Date.now();
  let rawText = "";
  let inputTokens = 0;
  let outputTokens = 0;

  try {
    // output_config + adaptive thinking are recent SDK additions; cast at
    // the param boundary so a slightly older @types build doesn't block us.
    const params = {
      model: MODEL,
      max_tokens: 32000,
      thinking: { type: "adaptive" as const },
      output_config: { effort: "high" as const },
      system: SYSTEM_PROMPT,
      messages: [{ role: "user" as const, content: USER_PROMPT }],
    };
    const stream = client.messages.stream(
      params as unknown as Parameters<typeof client.messages.stream>[0],
    );
    const final = await stream.finalMessage();

    rawText = final.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    inputTokens = final.usage.input_tokens;
    outputTokens = final.usage.output_tokens;

    console.log(
      `[weekly-bank-gen] Anthropic returned ${rawText.length} chars, in=${inputTokens} out=${outputTokens}`,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[weekly-bank-gen] Anthropic call failed:", msg);
    return NextResponse.json(
      { error: "Anthropic call failed", detail: msg },
      { status: 502 },
    );
  }

  // 3. Parse JSON (defensive against accidental markdown fences).
  const cleaned = stripMarkdownFences(rawText);
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[weekly-bank-gen] JSON parse failed:", msg);
    return NextResponse.json(
      {
        error: "Model returned invalid JSON",
        detail: msg,
        preview: rawText.slice(0, 300),
      },
      { status: 422 },
    );
  }

  // 4. Validate (all-or-nothing — fail before writing anything).
  const validation = validateBank(parsed);
  if (!validation.ok) {
    console.error(
      `[weekly-bank-gen] Validation failed: ${validation.reason}`,
    );
    return NextResponse.json(
      {
        error: "Generated bank failed validation",
        detail: validation.reason,
      },
      { status: 422 },
    );
  }

  // 5. Upsert all 12 weeks. On any DB error, return 500 — partial state is
  // self-healing on re-run since upsert is idempotent by week_number.
  const generatedAt = new Date().toISOString();
  for (const week of validation.bank.weeks) {
    const { error } = await supabaseAdmin
      .from("weekly_prompt_bank")
      .upsert(
        {
          week_number: week.week_number,
          prompts: week.prompts,
          generated_at: generatedAt,
        },
        { onConflict: "week_number" },
      );
    if (error) {
      console.error(
        `[weekly-bank-gen] DB upsert failed for week ${week.week_number}:`,
        error.message,
      );
      return NextResponse.json(
        {
          error: `DB upsert failed for week ${week.week_number}`,
          detail: error.message,
        },
        { status: 500 },
      );
    }
  }

  const durationMs = Date.now() - startedAt;
  console.log(
    `[weekly-bank-gen] saved ${TOTAL_WEEKS} weeks (${TOTAL_PROMPTS} prompts) in ${durationMs}ms`,
  );

  return NextResponse.json({
    ok: true,
    weeks_saved: TOTAL_WEEKS,
    prompts_total: TOTAL_PROMPTS,
    model: MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    duration_ms: durationMs,
  });
}
