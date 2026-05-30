import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { processApply } from "@/lib/applies";
import { supabaseAdmin } from "@/lib/supabase";

const DAILY_LIMIT_PER_EMAIL = 3;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AimUser {
  email: string;
  name?: string;
}

function readSessionEmail(req: NextRequest): string | null {
  // Match middleware.ts: accept either cookie. Prefer httpOnly aim_session
  // (plain email string); fall back to aim_user (base64 of {email, name}).
  const sessionCookie = req.cookies.get("aim_session");
  if (sessionCookie?.value && sessionCookie.value.includes("@")) {
    return sessionCookie.value.toLowerCase().trim();
  }

  const userCookie = req.cookies.get("aim_user");
  if (userCookie?.value) {
    try {
      const decoded = JSON.parse(
        Buffer.from(userCookie.value, "base64").toString(),
      ) as AimUser;
      if (decoded?.email) return decoded.email.toLowerCase().trim();
    } catch {
      // fall through
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const sessionEmail = readSessionEmail(req);
  if (!sessionEmail) {
    return NextResponse.json(
      { error: "You must be signed in to apply." },
      { status: 401 },
    );
  }

  // Validate the session email exists in the users table — defense in depth.
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("email")
    .eq("email", sessionEmail)
    .maybeSingle();
  if (!userRow) {
    return NextResponse.json(
      { error: "Session is invalid. Please sign in again." },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.toLowerCase().trim() : "";
  const answers = body?.answers;

  if (!name || !email || !answers || typeof answers !== "object") {
    return NextResponse.json(
      { error: "name, email, and answers are required." },
      { status: 400 },
    );
  }

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Invalid email format." },
      { status: 400 },
    );
  }

  // Rate limit: max N applications per day, looked up by typed email against
  // the applies table — no extra rate-limit table needed. A determined user
  // could in theory type different emails to dodge this; if that becomes a
  // real problem we'd add a session_email column and filter by both.
  const oneDayAgoIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("applies")
    .select("source_id", { count: "exact", head: true })
    .eq("applicant_email", email)
    .gte("submitted_at", oneDayAgoIso);

  if ((count ?? 0) >= DAILY_LIMIT_PER_EMAIL) {
    return NextResponse.json(
      {
        error:
          "You've already submitted several applications today. Please wait until tomorrow.",
        limited: true,
      },
      { status: 429 },
    );
  }

  const sourceId = `apply_${randomUUID()}`;

  await processApply({
    name,
    email,
    answers: answers as Record<string, unknown>,
    sourceId,
    submittedAt: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
