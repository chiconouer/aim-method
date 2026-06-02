import { supabaseAdmin } from "@/lib/supabase";
import type { AccessChannel } from "@/lib/notifySale";

/**
 * Insert a new user with the originating channel recorded in the `source`
 * column. If the column doesn't exist yet (deploy-before-migration), retry
 * the insert without the source field so user provisioning never breaks.
 *
 * Returns the error (if any) from the final attempt, or null on success.
 */
export async function insertUserWithSource(args: {
  email: string;
  name: string;
  source: AccessChannel;
}): Promise<{ error: { message: string } | null }> {
  const { email, name, source } = args;

  // First attempt: include source.
  const { error: firstError } = await supabaseAdmin.from("users").insert({
    email,
    name,
    source,
  });

  if (!firstError) {
    return { error: null };
  }

  // If the column doesn't exist yet, the postgres error message contains
  // "column ... does not exist" or "source". Retry without the source field
  // so user provisioning isn't blocked by the pending migration.
  const msg = firstError.message ?? "";
  if (/source/i.test(msg) || /column.*does not exist/i.test(msg)) {
    console.warn(
      `[insertUserWithSource] source column missing — retrying without it (email=${email}, source=${source}). Run the ALTER TABLE migration to enable source tracking.`,
    );
    const { error: secondError } = await supabaseAdmin.from("users").insert({
      email,
      name,
    });
    return { error: secondError ? { message: secondError.message } : null };
  }

  return { error: { message: msg } };
}
