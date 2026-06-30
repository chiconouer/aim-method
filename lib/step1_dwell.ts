// =============================================================
// Step-1 dwell + interaction measurement for the funnel's
// multi-signal bot filter. The quiz pages mark step 1 mounted
// on render, register interaction listeners while step 1 is
// active, then fire BOTH the elapsed ms and the interacted
// boolean to /api/quiz-funnel/dwell exactly once when the
// visitor leaves step 1 — either by advancing (next() in the
// page calls fireStep1Dwell) or by leaving the page
// (visibilitychange / pagehide / beforeunload listeners in the
// page also call fireStep1Dwell).
//
// State is intentionally module-level: only one quiz page mounts
// per tab at a time, and the singleton flag (step1DwellSent)
// guarantees a single beacon per visit even if multiple leave-
// events fire (e.g. pagehide + visibilitychange firing in
// sequence on iOS).
//
// Defensive everywhere — the quiz UX must never break because of
// analytics. Beacon failure / no-window / blocked storage are
// all silent no-ops.
// =============================================================

let step1MountedAt = 0;
let step1DwellSent = false;
let step1Interacted = false;

export function markStep1Mounted(): void {
  if (typeof window === "undefined") return;
  step1MountedAt = Date.now();
  step1DwellSent = false;
  step1Interacted = false;
}

// Called from any user-interaction listener on step 1
// (touchstart / pointerdown / click / scroll). Idempotent —
// flips the flag once and stays true until the next mount.
export function markStep1Interaction(): void {
  step1Interacted = true;
}

export function fireStep1Dwell(
  platform: "ttk" | "fb" | "fb2",
  visitor_id: string,
): void {
  try {
    if (typeof window === "undefined") return;
    if (step1DwellSent) return;
    if (step1MountedAt === 0) return;
    step1DwellSent = true;

    const dwell_ms = Math.max(0, Date.now() - step1MountedAt);
    const body = JSON.stringify({
      platform,
      visitor_id,
      dwell_ms,
      interacted: step1Interacted,
    });

    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      const ok = navigator.sendBeacon("/api/quiz-funnel/dwell", blob);
      if (ok) return;
    }
    fetch("/api/quiz-funnel/dwell", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Silent — analytics failures must never break the quiz.
  }
}
