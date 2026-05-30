import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "email is required." },
      { status: 400 },
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { data, error } = await supabaseAdmin
    .from("quiz_completions")
    .select("module_id")
    .eq("email", normalizedEmail);

  if (error) {
    console.error("[quiz/status] select failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const completedModules = (data ?? []).map((r) => r.module_id);
  return NextResponse.json({ completedModules });
}
