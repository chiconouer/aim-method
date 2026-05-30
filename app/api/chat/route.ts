import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase";

const DAILY_LIMIT = 30;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;

// System prompt is ~600 tokens — below the 4096-token minimum for Haiku 4.5
// prompt caching, so cache_control would be a no-op. Skipped intentionally.
const SYSTEM_PROMPT = `You are AIM Assistant, the support chat inside the AIM Method course — an online program that teaches people how to create AI models/influencers for Instagram and monetize them on Fanvue.

YOUR JOB (in priority order):
1. ALWAYS help with the student's actual question first. Be genuinely useful, clear, and concise. Answer basic questions about: using Instagram for AI models, warming up accounts, posting strategy, content ideas, Fanvue setup, creating an AI model persona, and general "how do I do X in the course" support. Keep answers short and practical (a few sentences, not essays).
2. After helping, AGGRESSIVELY but smartly promote the 1-on-1 Mentorship. The 1-on-1 is the premium offer: personalized mentorship with direct, hands-on guidance to get results faster, with ongoing support. You should actively push it whenever there's an opening — especially when the student wants faster results, asks something advanced, seems stuck, or shows ambition. Sell it by the OUTCOME (in the 1-on-1 we do this together and you get results way faster, with direct support), not by begging. Be persuasive and confident, like a sharp closer who truly believes in the product — but NEVER sacrifice actually answering the question, and don't repeat the pitch more than once or twice in the same conversation (that kills it).

RULES:
- Tone: friendly, sharp, motivating, like a young successful creator. Talk like a real person, not a corporate bot. English only.
- If a question is too advanced or very specific, give the best short answer you can, then pivot hard to the 1-on-1 as the real solution.
- Never make up specific facts you don't know (exact prices, schedules, links). If you don't know a specific detail, say the team can confirm, and steer to the 1-on-1 or the community.
- Never produce explicit sexual content. Keep it professional even though the niche involves adult-content monetization — talk strategy and business, not explicit material.
- Keep every reply tight. No walls of text.`;

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
