import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = body?.email;
  const moduleId = body?.moduleId;
  const score = body?.score;
  const total = body?.total;

  if (
    !email ||
    typeof moduleId !== "number" ||
    typeof score !== "number" ||
    typeof total !== "number"
  ) {
    return NextResponse.json(
      { error: "email, moduleId, score and total are required." },
      { status: 400 },
    );
  }

  if (total <= 0 || score < 0 || score > total) {
    return NextResponse.json(
      { error: "Invalid score/total." },
      { status: 400 },
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const passed = score / total >= 0.7;

  const { error } = await supabaseAdmin.from("quiz_completions").upsert(
    {
      email: normalizedEmail,
      module_id: moduleId,
      score,
      total,
      passed,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "email,module_id" },
  );

  if (error) {
    console.error("[quiz/submit] upsert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    passed,
    nextModuleUnlocked: moduleId + 1,
  });
}
