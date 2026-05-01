import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  const { data: link } = await supabaseAdmin
    .from("magic_links")
    .select("email, expires_at")
    .eq("token", token)
    .single();

  if (!link) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  if (new Date(link.expires_at) < new Date()) {
    await supabaseAdmin.from("magic_links").delete().eq("token", token);
    return NextResponse.redirect(new URL("/auth/sign-in?error=expired", req.url));
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("email", link.email)
    .single();

  if (!user) {
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  // Delete token — one-time use
  await supabaseAdmin.from("magic_links").delete().eq("token", token);

  const response = NextResponse.redirect("https://course.aimodelmethods.com/dashboard");

  // HttpOnly cookie used by middleware to guard /dashboard routes
  response.cookies.set("aim_session", user.email, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: true,
  });

  // Non-httpOnly cookie read by client-side getSession() for display (name + email)
  const userInfo = Buffer.from(
    JSON.stringify({ email: user.email, name: user.name ?? "Student" })
  ).toString("base64");

  response.cookies.set("aim_user", userInfo, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
    secure: true,
  });

  return response;
}
