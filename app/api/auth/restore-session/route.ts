import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.session) {
    return NextResponse.json({ error: "No session provided." }, { status: 400 });
  }

  let email: string;

  try {
    const parsed = JSON.parse(body.session);
    if (!parsed?.email) throw new Error("no email");
    email = parsed.email;
  } catch {
    if (typeof body.session === "string" && body.session.includes("@")) {
      email = body.session;
    } else {
      return NextResponse.json({ error: "Invalid session." }, { status: 400 });
    }
  }

  // Validate against DB — never trust client data blindly
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 401 });
  }

  const userInfo = Buffer.from(
    JSON.stringify({ email: user.email, name: user.name ?? "Student" })
  ).toString("base64");

  const response = NextResponse.json({ ok: true });

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
