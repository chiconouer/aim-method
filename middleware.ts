import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  // /dashboard/funnel is the quiz-analytics dashboard — it has its
  // own client-side password gate and is intentionally NOT behind
  // the course's aim_session cookie. Let it through before the
  // cookie check would redirect anonymous visitors to /.
  const path = req.nextUrl.pathname;
  if (path === "/dashboard/funnel" || path.startsWith("/dashboard/funnel/")) {
    return NextResponse.next();
  }

  const session = req.cookies.get("aim_session");
  const userCookie = req.cookies.get("aim_user");
  // Accept either cookie — mobile browsers sometimes drop httpOnly cookies from
  // redirect chains, so aim_user (non-httpOnly) acts as a reliable fallback.
  if (!session?.value && !userCookie?.value) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
