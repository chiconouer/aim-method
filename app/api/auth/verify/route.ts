import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  console.log("[verify] token received:", token);

  if (!token) {
    console.log("[verify] no token in URL, redirecting to sign-in");
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  const { data: link, error: linkError } = await supabaseAdmin
    .from("magic_links")
    .select("email, expires_at")
    .eq("token", token)
    .single();
  console.log("[verify] magic_link lookup:", { link, linkError });

  if (!link) {
    console.log("[verify] token not found in magic_links");
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  if (new Date(link.expires_at) < new Date()) {
    console.log("[verify] token expired");
    await supabaseAdmin.from("magic_links").delete().eq("token", token);
    return NextResponse.redirect(new URL("/auth/sign-in?error=expired", req.url));
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("email", link.email)
    .single();
  console.log("[verify] user lookup:", { user, userError });

  if (!user) {
    console.log("[verify] user not found for email:", link.email);
    return NextResponse.redirect(new URL("/auth/sign-in?error=invalid", req.url));
  }

  // Delete token — one-time use
  await supabaseAdmin.from("magic_links").delete().eq("token", token);

  const userInfo = Buffer.from(
    JSON.stringify({ email: user.email, name: user.name ?? "Student" })
  ).toString("base64");

  // Redirect to callback page — passes session in URL so the client page can write
  // it to localStorage. This ensures mobile browsers (where cookies from redirect
  // chains are sometimes dropped) still get a working session.
  const callbackUrl = new URL("https://course.aimodelmethods.com/auth/callback");
  callbackUrl.searchParams.set("email", user.email);
  callbackUrl.searchParams.set("session", userInfo);

  const response = NextResponse.redirect(callbackUrl.toString());

  // HttpOnly cookie for middleware (desktop browsers, reliable cookie handling)
  response.cookies.set("aim_session", user.email, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: true,
  });

  // Non-httpOnly cookie as middleware fallback (checked when aim_session is absent)
  response.cookies.set("aim_user", userInfo, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    httpOnly: false,
    secure: true,
  });

  return response;
}
