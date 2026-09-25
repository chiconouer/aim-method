import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Magic-link verification is a TWO-STEP flow to survive email-security
// scanners and link-preview bots (Outlook SafeLinks, corporate mail proxies,
// WhatsApp / iMessage / Slack / Discord unfurlers). Those bots issue a GET on
// every URL in a message to inspect or preview it. When a bare GET consumed
// the one-time token, the link was already dead before the human clicked it —
// this is exactly what locked out aitor@araitmultimedia.es and other buyers
// on scanned/corporate domains (2026-09-25).
//
//   GET  → validates the token WITHOUT consuming it, and renders a tiny
//          "Click to sign in" interstitial whose button POSTs the token back.
//   POST → the human actually clicked: re-validate, consume (one-time delete),
//          set the session cookies, and redirect into the course.
//
// Scanners/preview bots issue GETs but do not POST or run JS, so the token
// survives their probe and is only spent by a real click.
// ---------------------------------------------------------------------------

const SIGN_IN_INVALID = "/auth/sign-in?error=invalid";
const SIGN_IN_EXPIRED = "/auth/sign-in?error=expired";
const CALLBACK_URL = "https://course.aimodelmethods.com/auth/callback";

function interstitialHtml(token: string): string {
  // token is a server-generated UUID; hard-restrict to UUID charset anyway so
  // nothing user-influenced can ever break out of the hidden-input attribute.
  const safeToken = token.replace(/[^a-zA-Z0-9-]/g, "");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>Sign in to AIM Method</title>
<style>
  html,body{margin:0;min-height:100%;background:#0a0a0a;color:#fff;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
  .wrap{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
  .card{max-width:420px;width:100%;background:#111;border:1px solid #222;border-radius:16px;padding:40px 32px;text-align:center;box-sizing:border-box}
  .logo{font-weight:800;font-size:22px;letter-spacing:-.5px;margin-bottom:8px}
  .logo span{color:#8b5cf6}
  p{color:#9ca3af;font-size:15px;line-height:1.6;margin:0 0 28px}
  button{width:100%;background:#8b5cf6;color:#fff;font-size:16px;font-weight:700;border:0;border-radius:8px;padding:16px 24px;cursor:pointer}
  button:hover{background:#7c3aed}
</style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="logo">AIM <span>Method</span></div>
      <p>Your access is ready. Click below to sign in to your course.</p>
      <form method="POST" action="/api/auth/verify">
        <input type="hidden" name="token" value="${safeToken}" />
        <button type="submit">Access Your Course &rarr;</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

function htmlResponse(html: string, status = 200): NextResponse {
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// Look up a token and check expiry WITHOUT consuming it. Deletes only when the
// token is genuinely expired (housekeeping). Returns the owning email on success.
async function loadValidLink(
  token: string,
): Promise<{ ok: true; email: string } | { ok: false; redirect: string }> {
  const { data: link } = await supabaseAdmin
    .from("magic_links")
    .select("email, expires_at")
    .eq("token", token)
    .single();

  if (!link) return { ok: false, redirect: SIGN_IN_INVALID };

  if (new Date(link.expires_at) < new Date()) {
    await supabaseAdmin.from("magic_links").delete().eq("token", token);
    return { ok: false, redirect: SIGN_IN_EXPIRED };
  }

  return { ok: true, email: link.email };
}

// GET — NON-consuming. Validates the token and shows the click-to-sign-in
// interstitial. Safe for scanners/preview bots: it never deletes a valid token.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL(SIGN_IN_INVALID, req.url));
  }

  const result = await loadValidLink(token);
  if (!result.ok) {
    return NextResponse.redirect(new URL(result.redirect, req.url));
  }

  return htmlResponse(interstitialHtml(token));
}

// POST — the human clicked "Access Your Course". Consume the token (one-time
// use) and start the session. Only reached by a real form submission.
export async function POST(req: NextRequest) {
  // Token arrives as a form field from the interstitial; accept JSON too as a
  // defensive fallback.
  let token: string | null = null;
  const contentType = (req.headers.get("content-type") || "").toLowerCase();
  if (contentType.includes("application/json")) {
    const body = (await req.json().catch(() => null)) as { token?: string } | null;
    token = body?.token ?? null;
  } else {
    const form = await req.formData().catch(() => null);
    const raw = form?.get("token");
    token = typeof raw === "string" ? raw : null;
  }

  if (!token) {
    return NextResponse.redirect(new URL(SIGN_IN_INVALID, req.url), 303);
  }

  const result = await loadValidLink(token);
  if (!result.ok) {
    return NextResponse.redirect(new URL(result.redirect, req.url), 303);
  }

  const { data: user } = await supabaseAdmin
    .from("users")
    .select("email, name")
    .eq("email", result.email)
    .single();

  if (!user) {
    return NextResponse.redirect(new URL(SIGN_IN_INVALID, req.url), 303);
  }

  // Consume — one-time use. Only a real POST (human click) reaches here.
  await supabaseAdmin.from("magic_links").delete().eq("token", token);

  const userInfo = Buffer.from(
    JSON.stringify({ email: user.email, name: user.name ?? "Student" }),
  ).toString("base64");

  // Redirect to callback page — passes session in URL so the client page can
  // write it to localStorage. This ensures mobile browsers (where cookies from
  // redirect chains are sometimes dropped) still get a working session.
  // 303 See Other forces the browser to switch POST → GET for the redirect.
  const callbackUrl = new URL(CALLBACK_URL);
  callbackUrl.searchParams.set("email", user.email);
  callbackUrl.searchParams.set("session", userInfo);

  const response = NextResponse.redirect(callbackUrl.toString(), 303);

  // HttpOnly cookie for middleware (desktop browsers, reliable cookie handling)
  response.cookies.set("aim_session", user.email, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    secure: true,
  });

  // Non-httpOnly cookie as middleware fallback (checked when aim_session is absent)
  response.cookies.set("aim_user", userInfo, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    secure: true,
  });

  return response;
}
