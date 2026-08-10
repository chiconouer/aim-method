#!/usr/bin/env node
/**
 * grant-access.js
 * ===============
 * Manually provision course access for a customer who paid through a
 * pre-platform channel (Wuup, etc.) where no automated provisioning
 * webhook ever fired. Mirrors the side effects of the Hotmart webhook
 * so the customer sees the same welcome experience.
 *
 *   1. Upserts the user into the `users` table (lowercase+trim email)
 *   2. Inserts a 30-day magic-link token into `magic_links`
 *   3. Sends the standard "Welcome to AIM Method!" email via Resend
 *      with the access link pointing at /api/auth/verify
 *
 * Usage:
 *   node grant-access.js <email> "<full name>"
 *
 * Example:
 *   node grant-access.js erikziza11@gmail.com Erik
 *
 * Requires SUPABASE_URL, SUPABASE_SERVICE_KEY, and RESEND_API_KEY in
 * .env.local (loaded automatically).
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { createClient } = require("@supabase/supabase-js");
const { Resend } = require("resend");

// SYNC WITH lib/discord.ts DISCORD_INVITE_URL — this script is CJS and
// can't import from the TS module. If you rotate the community invite,
// update BOTH this constant AND the export in lib/discord.ts.
const DISCORD_INVITE_URL = "https://discord.gg/MqpBq3CshD";

// ---------- env loading (no dotenv dep) ----------
function loadEnvLocal() {
  const envPath = path.join(__dirname, ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf-8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = value;
  }
}

// ---------- email template (mirror of app/api/webhook/hotmart/route.ts) ----------
function welcomeEmailHTML(firstName, loginUrl) {
  return `
    <span style="display:none;font-size:1px;max-height:0;overflow:hidden;opacity:0;">Click here to access your AIM Method course</span>
    <div style="background-color:#0a0a0a;padding:48px 20px;font-family:sans-serif;">
      <div style="max-width:520px;margin:0 auto;">

        <div style="text-align:center;margin-bottom:32px;">
          <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">AIM</span>
          <span style="font-size:22px;font-weight:800;color:#8b5cf6;letter-spacing:-0.5px;"> Method</span>
        </div>

        <div style="background-color:#111111;border:1px solid #222222;border-radius:16px;overflow:hidden;">
          <div style="height:3px;background-color:#8b5cf6;"></div>
          <div style="padding:40px 36px;">

            <h1 style="font-size:24px;font-weight:800;color:#8b5cf6;margin:0 0 6px;">Welcome to AIM Method! 🎉</h1>
            <p style="font-size:15px;color:#9ca3af;margin:0 0 32px;">Hi ${firstName}, your purchase was successful. Your access is ready below.</p>

            <div style="text-align:center;">
              <a href="${loginUrl}" style="display:inline-block;background-color:#8b5cf6;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-bottom:12px;">Access Your Course →</a>
              <br>
              <a href="${DISCORD_INVITE_URL}" style="display:inline-block;background-color:#5865F2;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:8px;text-decoration:none;margin-top:12px;">💬 Join Our Community on Discord</a>
            </div>

            <div style="border-top:1px solid #222222;margin-top:40px;padding-top:24px;">
              <p style="font-size:13px;color:#6b7280;margin:0;line-height:1.6;">
                To sign in again later, visit <a href="https://course.aimodelmethods.com/auth/sign-in" style="color:#8b5cf6;text-decoration:none;">course.aimodelmethods.com</a> and enter your email to receive a new login link.
              </p>
            </div>

          </div>
        </div>

        <p style="text-align:center;font-size:12px;color:#374151;margin-top:28px;">© 2025 AIM Method · All rights reserved</p>

      </div>
    </div>
  `;
}

// ---------- main ----------
async function main() {
  loadEnvLocal();

  const [, , emailArg, ...nameArgs] = process.argv;
  if (!emailArg || nameArgs.length === 0) {
    console.error('Usage: node grant-access.js <email> "<full name>"');
    process.exit(1);
  }

  const email = emailArg.toLowerCase().trim();
  const fullName = nameArgs.join(" ").trim();
  const firstName = fullName.split(" ")[0] || "Student";

  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local"
    );
    process.exit(1);
  }
  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // 1) Upsert user
  const { data: existing, error: lookupErr } = await supabase
    .from("users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (lookupErr) {
    console.error("Supabase lookup error:", lookupErr.message);
    process.exit(1);
  }

  if (!existing) {
    // Defensive insert: try with `source` first, fall back without it if the
    // column doesn't exist yet (same pattern as the webhooks).
    let insertErr = null;
    {
      const { error } = await supabase
        .from("users")
        .insert({ email, name: firstName, source: "manual" });
      insertErr = error;
    }
    if (insertErr && /source/i.test(insertErr.message || "")) {
      console.warn("source column missing — retrying without it");
      const { error } = await supabase
        .from("users")
        .insert({ email, name: firstName });
      insertErr = error;
    }
    if (insertErr) {
      console.error("Supabase insert error:", insertErr.message);
      process.exit(1);
    }
    console.log(`Created new user: ${email}`);
  } else {
    console.log(`User already exists: ${email}`);
  }

  // 2) Magic link (30-day expiry — matches the welcome-email magic link
  //    lifetime used by the Hotmart/Stripe webhooks)
  const token = crypto.randomUUID();
  const expiresAt = new Date(
    Date.now() + 30 * 24 * 60 * 60 * 1000
  ).toISOString();
  const { error: linkErr } = await supabase.from("magic_links").insert({
    email,
    token,
    expires_at: expiresAt,
  });
  if (linkErr) {
    console.error("Magic link insert error:", linkErr.message);
    process.exit(1);
  }

  // 3) Welcome email
  const loginUrl = `https://course.aimodelmethods.com/api/auth/verify?token=${token}`;
  const { error: emailErr } = await resend.emails.send({
    from: "AIM Method <noreply@aimodelmethods.com>",
    to: email,
    subject: "Welcome to AIM Method!",
    html: welcomeEmailHTML(firstName, loginUrl),
  });
  if (emailErr) {
    console.error(
      "Resend email error:",
      emailErr.message || JSON.stringify(emailErr)
    );
    process.exit(1);
  }

  console.log(`✅ Access granted to ${email}. Welcome email sent.`);

  // Realtime Discord notification (best-effort). Mirrors what the
  // webhooks do via lib/notifySale.ts — duplicated inline here because
  // this script is CommonJS and can't import the TS module.
  const discordWebhook = process.env.DISCORD_WEBHOOK_SALES_REALTIME;
  if (discordWebhook) {
    const stamp = new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC";
    const content = [
      "🔧 **MANUAL ACCESS GRANTED** 🔧",
      "━━━━━━━━━━━━━━━━━━",
      "📡 Channel: **Manual (grant-access)**",
      `👤 **${firstName || "Unknown name"}**`,
      `📧 ${email}`,
      `⏰ ${stamp}`,
    ].join("\n");
    try {
      const res = await fetch(discordWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error(`Discord notify failed (${res.status}): ${body}`);
      }
    } catch (err) {
      console.error("Discord notify threw:", err?.message || err);
    }
  } else {
    console.warn("DISCORD_WEBHOOK_SALES_REALTIME not set — skipping Discord notification");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err?.message || err);
  process.exit(1);
});
