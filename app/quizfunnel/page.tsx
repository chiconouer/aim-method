// =============================================================
// /quizfunnel — quiz-funnel analytics dashboard
// -------------------------------------------------------------
// Reads aggregated step counts from /api/quiz-funnel/stats and
// renders horizontal funnel bars per platform (/ttk/quiz or
// /fb/quiz) and per time window. The browser NEVER queries
// Supabase directly — that route is the only reader, and it
// uses the service-role client server-side.
//
// Unique-visitor counting:
//   - Counts are DISTINCT visitor_id per step (not events). A
//     single visitor's repeated taps register as one person.
//   - Server-side: the stats route fetches (visitor_id, step,
//     country) for the platform+period and aggregates into
//     Set<visitor_id> per step in JS. Rows with NULL visitor_id
//     (legacy, before the visitor_id migration) are excluded.
//   - The previous "hide bots" toggle was removed: step-1-only
//     visitors are real data we want to keep (a real person who
//     landed and quit is part of the funnel).
//
// "By Country" breakdown:
//   - Unknown / null-country rows are excluded entirely.
//   - Percentages computed against the total of KNOWN
//     countries only (excludes unknown from the denominator).
//   - Country codes are rendered as full English names via
//     Intl.DisplayNames (falls back to the code if the API is
//     unavailable in the visitor's runtime).
//
// Standalone route on purpose: lives at top-level /quizfunnel
// (NOT under /dashboard) so it does not inherit the members-area
// layout/sidebar in app/dashboard/layout.tsx and is not caught
// by the /dashboard/:path* middleware matcher. Only its own
// password gate guards it.
//
// Light client-only password gate: hardcoded "AIM1234", stored
// in localStorage so the dashboard stays unlocked on this
// device/browser permanently. This is not real auth — just a
// friction layer so a leaked dashboard URL isn't drive-by
// accessible. Anyone with devtools can find the literal in the
// bundle; accepted trade-off.
//
// Visual identity: dark page background (#050505), purple-accent
// cards with the #0d0a1a → #080810 gradient, green highlights
// for "positive" numbers, red highlight for the biggest drop-off
// step. Same tokens used across /sales, /ttk/quiz, /fb/quiz.
// =============================================================

"use client";

import { useEffect, useMemo, useState } from "react";

const PASSWORD = "AIM1234";
const STORAGE_KEY = "aim_funnel_unlocked";

// Server-side sentinel meaning "country IS NULL". Excluded from
// the breakdown UI but the constant stays in scope for the
// filter that drops it.
const UNKNOWN_COUNTRY = "__unknown__";

type Platform = "ttk" | "fb";
type Period = "24h" | "7d" | "30d" | "all";

const PLATFORM_LABELS: Record<Platform, string> = {
  ttk: "TikTok",
  fb: "Facebook",
};
const PERIOD_LABELS: Record<Period, string> = {
  "24h": "24 hours",
  "7d": "7 days",
  "30d": "30 days",
  all: "All time",
};

// Step labels — 1..8 are quiz steps, 9 is the post-quiz VSL view,
// 10 is the visitor clicking the buy button on the sales page.
function stepLabel(step: number): string {
  if (step === 9) return "Reached VSL";
  if (step === 10) return "Reached Checkout";
  return `Step ${step}`;
}

// Cached Intl.DisplayNames instance — created once on first
// call to avoid the allocation cost per render. Falls back to
// the ISO code when the runtime doesn't expose the API (very
// old browsers) so we never display a blank cell.
let displayNamesInstance: Intl.DisplayNames | null = null;
function getDisplayNames(): Intl.DisplayNames | null {
  if (displayNamesInstance) return displayNamesInstance;
  try {
    if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
      displayNamesInstance = new Intl.DisplayNames(["en"], { type: "region" });
      return displayNamesInstance;
    }
  } catch {
    /* fall through */
  }
  return null;
}

function countryDisplay(code: string): string {
  if (code === UNKNOWN_COUNTRY) return "Unknown";
  try {
    const name = getDisplayNames()?.of(code);
    if (name && name !== code) return name;
  } catch {
    /* fall through to the code */
  }
  return code;
}

interface StatsResponse {
  platform: Platform;
  period: Period;
  counts: Record<string, number>;
  countryBreakdown: Record<string, number>;
}

export default function FunnelDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const [platform, setPlatform] = useState<Platform>("ttk");
  const [period, setPeriod] = useState<Period>("24h");
  const [counts, setCounts] = useState<Record<number, number> | null>(null);
  const [breakdown, setBreakdown] = useState<Record<string, number> | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Hydrate from localStorage on mount. The `hydrated` flag stops
  // the password gate from flashing on first paint for already-
  // unlocked sessions.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(STORAGE_KEY) === "1") {
        setUnlocked(true);
      }
    } catch {
      // localStorage blocked (private mode / extension) — gate
      // stays up. User retypes each time. Acceptable degradation.
    }
    setHydrated(true);
  }, []);

  // Refetch whenever the user unlocks or flips a filter. Tracks a
  // cancelled flag so a stale response from a slow request can't
  // overwrite the result of a newer one.
  useEffect(() => {
    if (!unlocked) return;
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const params = new URLSearchParams({
      platform,
      period,
    });

    fetch(`/api/quiz-funnel/stats?${params.toString()}`, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as StatsResponse;
        return json;
      })
      .then((json) => {
        if (cancelled) return;
        // API returns counts keyed by string — normalize to numbers.
        const normalized: Record<number, number> = {};
        for (let s = 1; s <= 10; s++) {
          const k = String(s);
          normalized[s] =
            typeof json.counts?.[k] === "number" ? json.counts[k] : 0;
        }
        setCounts(normalized);
        setBreakdown(json.countryBreakdown ?? {});
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setFetchError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [unlocked, platform, period]);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* private mode — gate just re-shows on next refresh */
      }
      setUnlocked(true);
      setPasswordError(false);
      setPasswordInput("");
    } else {
      setPasswordError(true);
    }
  }

  // Avoid the gate flash on already-unlocked sessions — wait for
  // the localStorage check to complete before deciding what to
  // render.
  if (!hydrated) {
    return <PageShell><div /></PageShell>;
  }

  if (!unlocked) {
    return (
      <PageShell>
        <PasswordGate
          value={passwordInput}
          onChange={setPasswordInput}
          onSubmit={handleUnlock}
          error={passwordError}
        />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <DashboardView
        platform={platform}
        period={period}
        counts={counts}
        breakdown={breakdown}
        loading={loading}
        error={fetchError}
        onPlatformChange={setPlatform}
        onPeriodChange={setPeriod}
      />
    </PageShell>
  );
}

// ───────────────────────────────────────────────────────────────
// Shell — same logo treatment and dark background used across the
// rest of the product (see /sales, /ttk/quiz, etc.).
// ───────────────────────────────────────────────────────────────
function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <nav className="flex items-center justify-center py-3 border-b border-white/5">
        <span className="text-lg font-black tracking-tight">
          <span className="text-white">AIM </span>
          <span className="text-purple-400">Method</span>
        </span>
      </nav>
      <main className="px-4 sm:px-6 py-6 sm:py-10 max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Password gate — single input + Unlock button. Submit-on-enter
// works because it's a real <form>.
// ───────────────────────────────────────────────────────────────
function PasswordGate({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error: boolean;
}) {
  return (
    <div
      className="max-w-sm mx-auto mt-12 sm:mt-20 rounded-2xl border border-purple-900/30 px-6 py-7"
      style={{
        background: "linear-gradient(160deg,#0d0a1a,#080810)",
        boxShadow: "0 0 40px rgba(124,58,237,0.12)",
      }}
    >
      <h1 className="text-2xl font-black text-white text-center mb-1">
        Funnel Analytics
      </h1>
      <p className="text-xs text-gray-500 text-center mb-6">
        Enter the dashboard password to continue.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Password"
          autoFocus
          autoComplete="off"
          className="w-full px-4 py-3 rounded-xl bg-[#050505] text-white text-sm placeholder-gray-600 border border-purple-900/40 focus:outline-none focus:border-purple-400 transition-colors"
          aria-invalid={error}
          aria-describedby={error ? "pwd-error" : undefined}
        />
        {error && (
          <p
            id="pwd-error"
            className="text-xs text-red-400 text-center"
            role="alert"
          >
            Wrong password. Try again.
          </p>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-xl text-white text-sm font-black tracking-wide transition-transform active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
            boxShadow:
              "0 8px 24px rgba(124,58,237,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
          }}
        >
          Unlock
        </button>
      </form>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Dashboard — title, tabs (platform), period buttons, bot toggle,
// summary cards, funnel bars, country breakdown.
// ───────────────────────────────────────────────────────────────
function DashboardView({
  platform,
  period,
  counts,
  breakdown,
  loading,
  error,
  onPlatformChange,
  onPeriodChange,
}: {
  platform: Platform;
  period: Period;
  counts: Record<number, number> | null;
  breakdown: Record<string, number> | null;
  loading: boolean;
  error: string | null;
  onPlatformChange: (p: Platform) => void;
  onPeriodChange: (p: Period) => void;
}) {
  const step1 = counts?.[1] ?? 0;
  const step9 = counts?.[9] ?? 0;
  const conversionPct = step1 > 0 ? (step9 / step1) * 100 : 0;

  // Find the step with the biggest drop relative to its preceding
  // step. Used to highlight the bar that owns the most attrition.
  const biggestDropStep = useMemo(() => {
    if (!counts) return null;
    let worstStep: number | null = null;
    let worstDropPct = 0;
    for (let s = 2; s <= 10; s++) {
      const prev = counts[s - 1];
      const curr = counts[s];
      if (prev > 0 && curr <= prev) {
        const dropPct = ((prev - curr) / prev) * 100;
        if (dropPct > worstDropPct) {
          worstDropPct = dropPct;
          worstStep = s;
        }
      }
    }
    return worstStep;
  }, [counts]);

  // Known countries only — exclude the UNKNOWN_COUNTRY bucket
  // entirely from BOTH the rendered rows AND the percentage
  // denominator, per the spec.
  const knownBreakdown = useMemo(() => {
    if (!breakdown) return [] as Array<{ code: string; count: number }>;
    return Object.entries(breakdown)
      .filter(([code]) => code !== UNKNOWN_COUNTRY)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count);
  }, [breakdown]);

  const totalKnown = useMemo(
    () => knownBreakdown.reduce((s, r) => s + r.count, 0),
    [knownBreakdown],
  );

  return (
    <>
      <h1 className="text-3xl sm:text-4xl font-black text-white text-center mb-6">
        Funnel <span className="text-purple-400">Analytics</span>
      </h1>

      <PlatformTabs value={platform} onChange={onPlatformChange} />
      <PeriodButtons value={period} onChange={onPeriodChange} />

      <SummaryCards
        started={step1}
        reachedVsl={step9}
        conversionPct={conversionPct}
      />

      {error && (
        <div
          className="rounded-xl border border-red-500/40 bg-red-950/30 px-4 py-3 text-sm text-red-300 mb-6"
          role="alert"
        >
          Failed to load stats: {error}
        </div>
      )}

      {loading && !counts && (
        <p className="text-center text-sm text-gray-500 py-12">
          Loading funnel…
        </p>
      )}

      {counts && (
        <FunnelBars
          counts={counts}
          biggestDropStep={biggestDropStep}
          dim={loading}
        />
      )}

      {breakdown && knownBreakdown.length > 0 && (
        <CountryBreakdown
          rows={knownBreakdown}
          total={totalKnown}
          dim={loading}
        />
      )}
    </>
  );
}

function PlatformTabs({
  value,
  onChange,
}: {
  value: Platform;
  onChange: (p: Platform) => void;
}) {
  const tabs: Platform[] = ["ttk", "fb"];
  return (
    <div className="flex justify-center mb-3">
      <div className="inline-flex rounded-xl border border-purple-900/40 bg-[#0d0a1a] p-1">
        {tabs.map((tab) => {
          const active = tab === value;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => onChange(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-black tracking-wide transition-colors ${
                active ? "text-white" : "text-gray-500 hover:text-gray-300"
              }`}
              style={
                active
                  ? {
                      background:
                        "linear-gradient(135deg,#5b21b6,#7c3aed,#8b5cf6)",
                      boxShadow: "0 4px 16px rgba(124,58,237,0.4)",
                    }
                  : undefined
              }
              aria-pressed={active}
            >
              {PLATFORM_LABELS[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PeriodButtons({
  value,
  onChange,
}: {
  value: Period;
  onChange: (p: Period) => void;
}) {
  const periods: Period[] = ["24h", "7d", "30d", "all"];
  return (
    <div className="flex flex-wrap justify-center gap-2 mb-6">
      {periods.map((p) => {
        const active = p === value;
        return (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide border transition-colors ${
              active
                ? "border-purple-400 text-white bg-purple-900/40"
                : "border-purple-900/40 text-gray-400 hover:text-gray-200 hover:border-purple-700/60"
            }`}
            aria-pressed={active}
          >
            {PERIOD_LABELS[p]}
          </button>
        );
      })}
    </div>
  );
}

function SummaryCards({
  started,
  reachedVsl,
  conversionPct,
}: {
  started: number;
  reachedVsl: number;
  conversionPct: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
      <SummaryCard label="Started" value={started.toLocaleString()} />
      <SummaryCard
        label="Reached VSL"
        value={reachedVsl.toLocaleString()}
        accent="green"
      />
      <SummaryCard
        label="Quiz Completion Rate"
        value={`${conversionPct.toFixed(1)}%`}
        accent="purple"
      />
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "green" | "purple";
}) {
  const valueColor =
    accent === "green"
      ? "text-green-400"
      : accent === "purple"
        ? "text-purple-400"
        : "text-white";
  return (
    <div
      className="rounded-xl border border-purple-900/30 px-4 py-3"
      style={{ background: "linear-gradient(160deg,#0d0a1a,#080810)" }}
    >
      <p className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">
        {label}
      </p>
      <p className={`text-2xl font-black ${valueColor}`}>{value}</p>
    </div>
  );
}

function FunnelBars({
  counts,
  biggestDropStep,
  dim,
}: {
  counts: Record<number, number>;
  biggestDropStep: number | null;
  dim: boolean;
}) {
  const step1 = counts[1] ?? 0;
  // Order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10.
  // (9 = Reached VSL; 10 = Reached Checkout, the buy-button click.)
  const steps = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div
      className={`rounded-2xl border border-purple-900/30 p-4 sm:p-5 transition-opacity ${
        dim ? "opacity-60" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(160deg,#0d0a1a,#080810)",
        boxShadow: "0 0 28px rgba(124,58,237,0.08)",
      }}
    >
      <div className="flex flex-col gap-3">
        {steps.map((s) => {
          const count = counts[s] ?? 0;
          const retentionPct = step1 > 0 ? (count / step1) * 100 : 0;
          const isWorstDrop = s === biggestDropStep;
          // Step-to-step conversion: % of the PREVIOUS step that made
          // it to this one. Null for step 1 (no previous) and for any
          // case where the previous step had zero visitors (no
          // denominator). The bar renders the secondary label only
          // when fromPrevPct is non-null so step 1 stays uncluttered.
          const prevCount = s > 1 ? counts[s - 1] ?? 0 : 0;
          const fromPrevPct =
            s > 1 && prevCount > 0 ? (count / prevCount) * 100 : null;
          return (
            <FunnelBar
              key={s}
              label={stepLabel(s)}
              count={count}
              retentionPct={retentionPct}
              fromPrevPct={fromPrevPct}
              isWorstDrop={isWorstDrop}
            />
          );
        })}
      </div>
      {biggestDropStep !== null && (
        <p className="text-[11px] text-gray-500 text-center mt-4">
          Biggest drop:{" "}
          <span className="text-red-400 font-bold">
            {stepLabel(biggestDropStep)}
          </span>
        </p>
      )}
    </div>
  );
}

function FunnelBar({
  label,
  count,
  retentionPct,
  fromPrevPct,
  isWorstDrop,
}: {
  label: string;
  count: number;
  retentionPct: number;
  fromPrevPct: number | null;
  isWorstDrop: boolean;
}) {
  // Clamp the bar width to a small floor so empty steps still
  // render a visible sliver (otherwise the bar disappears and the
  // user can't tell whether it's "0" or "loading").
  const widthPct = Math.max(retentionPct, 1);
  const barGradient = isWorstDrop
    ? // Red-tinted gradient draws the eye to the biggest drop step.
      "linear-gradient(90deg,#7c3aed,#dc2626)"
    : "linear-gradient(90deg,#5b21b6,#7c3aed,#8b5cf6)";
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1">
        <span className="text-sm font-bold text-white">{label}</span>
        <span className="text-xs text-gray-400 text-right">
          <span
            className={`font-black ${isWorstDrop ? "text-red-400" : "text-purple-300"}`}
          >
            {retentionPct.toFixed(1)}%
          </span>{" "}
          <span className="text-gray-500">
            · {count.toLocaleString()} {count === 1 ? "person" : "people"}
          </span>
          {fromPrevPct !== null && (
            // Step-to-step conversion — small secondary line so you
            // can see where the biggest drop between consecutive
            // steps is, beyond just the % vs step 1.
            <span className="block text-[10px] text-gray-600 mt-0.5">
              {fromPrevPct.toFixed(1)}% from prev
            </span>
          )}
        </span>
      </div>
      <div className="h-7 rounded-lg bg-[#050505] border border-purple-900/30 overflow-hidden">
        <div
          className="h-full rounded-lg transition-[width] duration-500 ease-out"
          style={{
            width: `${widthPct}%`,
            background: barGradient,
            boxShadow: isWorstDrop
              ? "0 0 18px rgba(220,38,38,0.45), inset 0 1px 0 rgba(255,255,255,0.1)"
              : "0 0 16px rgba(124,58,237,0.35), inset 0 1px 0 rgba(255,255,255,0.1)",
          }}
        />
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────
// Country breakdown — list of known countries with count + share
// of total known-country visitors. Unknown / null country bucket
// is excluded entirely (filtered upstream in DashboardView).
// Country codes render as full English names via Intl.DisplayNames
// (e.g. "United States", "Brazil", "Singapore", "Belgium"), with
// the raw code as fallback if the API isn't available.
// ───────────────────────────────────────────────────────────────
function CountryBreakdown({
  rows,
  total,
  dim,
}: {
  rows: Array<{ code: string; count: number }>;
  total: number;
  dim: boolean;
}) {
  const max = rows.length > 0 ? rows[0].count : 0;
  return (
    <div
      className={`mt-6 rounded-2xl border border-purple-900/30 p-4 sm:p-5 transition-opacity ${
        dim ? "opacity-60" : "opacity-100"
      }`}
      style={{
        background: "linear-gradient(160deg,#0d0a1a,#080810)",
        boxShadow: "0 0 28px rgba(124,58,237,0.08)",
      }}
    >
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-sm sm:text-base font-black tracking-wide text-white">
          By <span className="text-purple-400">Country</span>
        </h2>
        <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
          Known countries only
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {rows.map(({ code, count }) => {
          const sharePct = total > 0 ? (count / total) * 100 : 0;
          // Width of the inline bar is relative to the LARGEST country
          // bucket, not to the total — that makes mid-tier countries
          // readable when one country dominates.
          const barWidthPct = max > 0 ? (count / max) * 100 : 0;
          return (
            <div key={code}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm font-bold text-white">
                  {countryDisplay(code)}
                </span>
                <span className="text-xs text-gray-400">
                  <span className="font-black text-purple-300">
                    {sharePct.toFixed(1)}%
                  </span>{" "}
                  <span className="text-gray-500">
                    · {count.toLocaleString()}{" "}
                    {count === 1 ? "person" : "people"}
                  </span>
                </span>
              </div>
              <div className="h-5 rounded-lg bg-[#050505] border border-purple-900/30 overflow-hidden">
                <div
                  className="h-full rounded-lg transition-[width] duration-500 ease-out"
                  style={{
                    width: `${Math.max(barWidthPct, 1)}%`,
                    background:
                      "linear-gradient(90deg,#5b21b6,#7c3aed,#8b5cf6)",
                    boxShadow:
                      "0 0 12px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.08)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
