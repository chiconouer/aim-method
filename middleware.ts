import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const session = req.cookies.get("aim_session");
  const userCookie = req.cookies.get("aim_user");
  // Accept either cookie — mobile browsers sometimes drop httpOnly cookies from
  // redirect chains, so aim_user (non-httpOnly) acts as a reliable fallback.
  if (!session?.value && !userCookie?.value) {
    return NextResponse.redirect(new URL("/auth/sign-in", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
