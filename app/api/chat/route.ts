import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

const DAILY_LIMIT = 30;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;

// System prompt is ~600 tokens — below the 4096-token minimum for Haiku 4.5
// prompt caching, so cache_control would be a no-op. Skipped intentionally.
const SYSTEM_PROMPT = `You are AIM Assistant, the in-platform support chat for the AIM Method course — an online program that teaches people how to create AI models/influencers for Instagram and monetize them on Fanvue. You are a SUPPORT assistant, not a coach.

HOW THE PLATFORM WORKS (use this to answer navigation/support questions):
- After logging in, students land on the Dashboard (home): a greeting, a "Continue where you left off" card that takes them to their next lesson, and a "Your Course" card.
- The left sidebar has: Home Page, Dashboard, AI Model Store, and AIM Assistant (this chat).
- Clicking "Your Course" (or Course) opens the course page: all lessons grouped by module ("Module 1 · ...", "Module 2 · ...", etc.). The course has 5 modules and 20 lessons total.
- Each lesson page has the video + content on the left, and a sidebar on the right listing every lesson of every module to jump around.
- At the END of each module there is a QUIZ. Students must complete a module's quiz to UNLOCK the next module. Module 1 is open from the start. Locked modules show a lock icon and can't be opened until the previous module's quiz is done.
- Progress is tracked automatically as they complete lessons.
- The AI Model Store is where students can get AI model reference image packs (accessible from the sidebar).

YOUR JOB — TWO TYPES OF QUESTIONS, HANDLE THEM DIFFERENTLY:

TYPE A — SUPPORT & NAVIGATION (answer these fully and helpfully):
Questions like "where do I find X", "how does the platform work", "how do I unlock the next module", "where are my lessons", "how do quizzes work", "I can't access a module", "where is the store". Answer clearly, briefly, and helpfully using the platform info above. This is your main job — be genuinely useful for support.

TYPE B — VALUABLE STRATEGY / COACHING CONTENT (do NOT give this away — sell the 1-on-1 instead):
Questions like "what content should I post", "how do I grow fast", "what's the posting strategy", "give me viral reel ideas", "how do I get more followers", "how do I make money faster", or anything that's the actual money-making strategy/coaching the course and mentorship provide. For these: do NOT hand over the detailed strategy. Instead, give a short, intriguing teaser (1-2 sentences max, enough to show you know your stuff) and then AGGRESSIVELY pitch the 1-on-1 Mentorship as where they get the real answers.

THE 1-ON-1 MENTORSHIP PITCH (push it hard for Type B questions):
Frame it like this: in the 1-on-1 Mentorship you get direct, personal guidance from a REAL coach — Professor Nouer himself — through a private 24/7 chat where you can ask ANY question, any doubt, anything you're stuck on, and he'll answer you and walk you through it personally, getting you results way faster. Sell it by the outcome and the access to a real expert. Be confident and persuasive, like a sharp closer who believes in it. Always spell it "Professor Nouer".

RULES:
- Tone: friendly, sharp, motivating, like a young successful creator. Real person, not a corporate bot. English only.
- Keep every reply tight and short. No walls of text. No essays.
- For Type B, the teaser must be SHORT — never actually teach the strategy. The point is to make them want the 1-on-1.
- Don't repeat the exact same pitch wording every time; vary it, but always drive to the 1-on-1 for Type B.
- Never make up specific facts you don't know (exact prices, links, schedules). If unknown, say the team can confirm and steer to the 1-on-1.
- Never produce explicit sexual content. Keep it professional even though the niche involves adult-content monetization — business and strategy framing only.`;

const client = new Anthropic();

const RATE_LIMIT_REPLY =
  "You've reached your daily limit of 30 messages with me. Come back tomorrow and I'll be fresh — or jump into the community if you need help right now. 💪";

const ERROR_REPLY = "I'm having a quick hiccup, try again in a sec.";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email;
  const messages = body?.messages;

  if (!email || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "email and messages are required." },
      { status: 400 },
    );
  }

  // Basic shape check on every message
  for (const m of messages) {
    if (
      !m ||
      (m.role !== "user" && m.role !== "assistant") ||
      typeof m.content !== "string"
    ) {
      return NextResponse.json(
        { error: "Invalid message format." },
        { status: 400 },
      );
    }
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const today = new Date().toISOString().slice(0, 10);

  // Rate-limit check (read current count for today)
  const { data: existing, error: readError } = await supabaseAdmin
    .from("chat_usage")
    .select("count")
    .eq("email", normalizedEmail)
    .eq("date", today)
    .maybeSingle();

  if (readError) {
    console.error("[chat] usage read failed:", readError);
    // Don't block the user for a DB hiccup — proceed without rate-limit info
  }

  const currentCount = existing?.count ?? 0;

  if (currentCount >= DAILY_LIMIT) {
    return NextResponse.json({ reply: RATE_LIMIT_REPLY, limited: true });
  }

  // Call Anthropic
  let reply: string;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      messages: messages as ChatMessage[],
    });

    reply = response.content
      .filter(
        (b): b is Anthropic.TextBlock => b.type === "text",
      )
      .map((b) => b.text)
      .join("")
      .trim();

    if (!reply) reply = ERROR_REPLY;
  } catch (err) {
    console.error("[chat] anthropic call failed:", err);
    return NextResponse.json({ reply: ERROR_REPLY, error: true });
  }

  // Increment usage AFTER a successful call
  const { error: upsertError } = await supabaseAdmin.from("chat_usage").upsert(
    {
      email: normalizedEmail,
      date: today,
      count: currentCount + 1,
    },
    { onConflict: "email,date" },
  );

  if (upsertError) {
    console.error("[chat] usage upsert failed:", upsertError);
    // Reply still goes back to the user — usage tracking is best-effort
  }

  return NextResponse.json({ reply });
}
