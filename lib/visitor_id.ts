// =============================================================
// Anonymous visitor identifier — random opaque id used to count
// UNIQUE visitors in the quiz funnel analytics. NOT personal
// data: just a UUID (or fallback timestamp+random string) stored
// in localStorage so the same visitor's events across steps and
// sessions get bucketed as one person.
//
// Imported by the 4 paid-funnel pages (/ttk/quiz, /fb/quiz,
// /ttk/sales, /fb/sales) — they pass it to recordFunnelStep
// which forwards it to /api/quiz-funnel. The server stores
// the value verbatim in quiz_funnel_events.visitor_id.
//
// Defensive paths:
//   - SSR / no `window` → returns "ssr" sentinel (never used by
//     client-fired events but lets server code call this
//     safely without throwing).
//   - localStorage blocked (private mode / extension) → falls
//     back to a module-level in-memory id that lives for the
//     page session.
//   - crypto.randomUUID unavailable → falls back to
//     timestamp + Math.random, plenty unique for our volume.
// =============================================================

export const VISITOR_ID_STORAGE_KEY = "aim_visitor_id";

// Module-level fallback for when localStorage is unavailable.
// Lives for the page session; lost on full reload.
let inMemoryVisitorId: string | null = null;

function generateVisitorId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    /* crypto.randomUUID unavailable — fall through */
  }
  // Fallback — not a real UUID but unique enough at our volume.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string {
  if (typeof window === "undefined") {
    return "ssr";
  }
  try {
    let id = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    if (!id) {
      id = generateVisitorId();
      localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
    }
    return id;
  } catch {
    if (!inMemoryVisitorId) inMemoryVisitorId = generateVisitorId();
    return inMemoryVisitorId;
  }
}
