import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const { data: user, error } = await supabaseAdmin
    .from("users")
    .select("email, name, password_hash")
    .eq("email", normalizedEmail)
    .single();

  if (error || !user || !user.password_hash) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // Same session shape used by /api/auth/verify (magic-link login).
  // Two cookies because mobile browsers occasionally drop httpOnly cookies
  // set via redirect chains — see middleware.ts for the OR-check.
  const name = user.name ?? "Student";
  const userInfo = Buffer.from(
    JSON.stringify({ email: user.email, name }),
  ).toString("base64");

  const response = NextResponse.json({ ok: true, email: user.email, name });

  response.cookies.set("aim_session", user.email, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    secure: true,
  });

  response.cookies.set("aim_user", userInfo, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    secure: true,
  });

  return response;
}
