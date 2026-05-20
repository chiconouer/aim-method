#!/usr/bin/env node
/**
 * grant-hotmart-access.js
 * =======================
 * One-off provisioning for the Hotmart compliance reviewer account.
 *
 *   1. Generates a strong random password (no ambiguous chars)
 *   2. Hashes it with bcrypt (cost 10)
 *   3. Upserts the user (email + name + password_hash) via Supabase
 *      service-role client
 *   4. Prints the plaintext password so you can hand it off
 *
 * Re-runnable: upserts, so running it twice rotates the password.
 *
 * Usage:
 *   node grant-hotmart-access.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

// ---------- env loading (no dotenv) ----------
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

// ---------- password generation ----------
// 20-char alphanumeric + safe symbols, excluding ambiguous chars
// (no 0/O, 1/l/I). Uses crypto.randomInt for cryptographic randomness.
function generateStrongPassword(length = 20) {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
  const lower = "abcdefghjkmnpqrstuvwxyz"; // no i, l, o
  const digits = "23456789"; // no 0, 1
  const symbols = "!@#$%&*+-=?";
  const all = upper + lower + digits + symbols;

  // Guarantee at least one char from each class
  const must = [
    upper[crypto.randomInt(0, upper.length)],
    lower[crypto.randomInt(0, lower.length)],
    digits[crypto.randomInt(0, digits.length)],
    symbols[crypto.randomInt(0, symbols.length)],
  ];
  const rest = Array.from({ length: length - must.length }, () =>
    all[crypto.randomInt(0, all.length)],
  );
  const chars = [...must, ...rest];
  // Fisher–Yates shuffle so the required chars aren't always at the front
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

async function main() {
  loadEnvLocal();

  const email = "hotmart-review@aimodelmethods.com";
  const name = "Hotmart Reviewer";

  const SUPABASE_URL =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local",
    );
    process.exit(1);
  }

  const password = generateStrongPassword(20);
  const password_hash = await bcrypt.hash(password, 10);

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Upsert keyed on email so re-runs rotate the password.
  const { error } = await supabase
    .from("users")
    .upsert(
      { email, name, password_hash },
      { onConflict: "email" },
    );

  if (error) {
    console.error("Supabase upsert error:", error.message);
    process.exit(1);
  }

  console.log("✅ Hotmart reviewer account provisioned.");
  console.log("");
  console.log("---- COPY BELOW ----");
  console.log(`URL: https://course.aimodelmethods.com/auth/password-login`);
  console.log(`Login: ${email}`);
  console.log(`Password: ${password}`);
  console.log("---- COPY ABOVE ----");
}

main().catch((err) => {
  console.error("Unexpected error:", err?.message || err);
  process.exit(1);
});
