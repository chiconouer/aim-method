import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

const TIME_ZONE = "America/New_York";

type SaleRow = {
  buyer_email: string | null;
  buyer_name: string | null;
  amount_cents: number | null;
  occurred_at: string;
};

type ApplyRow = {
  applicant_email: string | null;
  applicant_name: string | null;
  answers: Record<string, unknown> | null;
  submitted_at: string;
};

type CalendlyEvent = {
  uri: string;
  start_time: string;
  location?: {
    join_url?: string;
  } | null;
};

type CalendlyInvitee = {
  name?: string | null;
  email?: string | null;
};

type CalendlyCall = {
  eventUri: string;
  startTime: string;
  joinUrl: string | null;
  invitees: CalendlyInvitee[];
};

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const byType = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";

  return {
    year: Number(byType("year")),
    month: Number(byType("month")),
    day: Number(byType("day")),
    hour: Number(byType("hour")),
    minute: Number(byType("minute")),
    second: Number(byType("second")),
  };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const p = getDatePartsInTimeZone(date, timeZone);
  const zonedAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return zonedAsUtc - date.getTime();
}

function zonedMidnightToUtcMs(year: number, month: number, day: number, timeZone: string) {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return utcGuess - offset;
}

function addDaysToYmd(year: number, month: number, day: number, days: number) {
  const d = new Date(Date.UTC(year, month - 1, day + days));
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

function formatDateInTz(dateIso: string, timeZone: string, includeYear = true) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "long",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(new Date(dateIso));
}

function formatTimeInTz(dateIso: string, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(dateIso));
}

function formatMoneyFromCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function chunkByDiscordLimit(lines: string[], limit = 2000) {
  const chunks: string[] = [];
  let current = "";
  for (const line of lines) {
    const candidate = current ? `${current}\n${line}` : line;
    if (candidate.length > limit) {
      if (current) chunks.push(current);
      if (line.length > limit) {
        chunks.push(line.slice(0, limit));
        current = "";
      } else {
        current = line;
      }
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function postDiscordMessages(webhookUrl: string, messages: string[]) {
  for (const message of messages) {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Discord webhook failed (${res.status}): ${text || "unknown error"}`);
    }
  }
}

function parseCalendlyPagingNext(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const pagination = obj.pagination;
  if (!pagination || typeof pagination !== "object") return null;
  const nextPage = (pagination as Record<string, unknown>).next_page;
  return typeof nextPage === "string" && nextPage.length > 0 ? nextPage : null;
}

async function fetchCalendlyEventsRange({
  minStartIso,
  maxStartIso,
  token,
  userUri,
}: {
  minStartIso: string;
  maxStartIso: string;
  token: string;
  userUri: string;
}) {
  const events: CalendlyEvent[] = [];
  let pageToken: string | null = null;

  do {
    const url = new URL("https://api.calendly.com/scheduled_events");
    url.searchParams.set("user", userUri);
    url.searchParams.set("min_start_time", minStartIso);
    url.searchParams.set("max_start_time", maxStartIso);
    url.searchParams.set("status", "active");
    url.searchParams.set("sort", "start_time:asc");
    if (pageToken) url.searchParams.set("page_token", pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Calendly scheduled_events failed (${res.status}): ${text || "unknown error"}`);
    }

    const payload = (await res.json()) as { collection?: CalendlyEvent[] };
    if (Array.isArray(payload.collection)) events.push(...payload.collection);
    pageToken = parseCalendlyPagingNext(payload);
  } while (pageToken);

  return events;
}

async function fetchInviteesForEvent(eventUri: string, token: string) {
  const invitees: CalendlyInvitee[] = [];
  let nextPage: string | null = `${eventUri}/invitees`;

  while (nextPage) {
    const res = await fetch(nextPage, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Calendly invitees failed (${res.status}): ${text || "unknown error"}`);
    }

    const payload = (await res.json()) as { collection?: CalendlyInvitee[] };
    if (Array.isArray(payload.collection)) invitees.push(...payload.collection);
    nextPage = parseCalendlyPagingNext(payload);
  }

  return invitees;
}

async function hydrateCalls(events: CalendlyEvent[], token: string) {
  const calls = await Promise.all(
    events.map(async (event) => {
      const invitees = await fetchInviteesForEvent(event.uri, token);
      return {
        eventUri: event.uri,
        startTime: event.start_time,
        joinUrl: event.location?.join_url ?? null,
        invitees,
      } as CalendlyCall;
    })
  );
  return calls;
}

function matchCallByEmail(email: string, calls: CalendlyCall[]) {
  const normalized = email.toLowerCase().trim();
  if (!normalized) return null;
  return (
    calls.find((call) =>
      call.invitees.some((invitee) => (invitee.email ?? "").toLowerCase().trim() === normalized)
    ) ?? null
  );
}

export async function GET(req: NextRequest) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_DAILY_STATS;
  const calendlyToken = process.env.CALENDLY_API_TOKEN;
  const calendlyUserUri = process.env.CALENDLY_USER_URI;
  const cronSecret = process.env.CRON_SECRET;
  const dailyCronSecret = process.env.DAILY_REPORT_CRON_SECRET;

  const authHeader = req.headers.get("authorization") ?? "";
  const expectedSecrets = [cronSecret, dailyCronSecret].filter(
    (s): s is string => typeof s === "string" && s.length > 0
  );
  const isAuthorized = expectedSecrets.some((secret) => authHeader === `Bearer ${secret}`);

  if (!isAuthorized) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!webhookUrl || !calendlyToken || !calendlyUserUri) {
    return NextResponse.json(
      { ok: false, error: "Missing required environment variables" },
      { status: 500 }
    );
  }

  try {
    const now = new Date();
    const nowTz = getDatePartsInTimeZone(now, TIME_ZONE);
    const todayStartMs = zonedMidnightToUtcMs(nowTz.year, nowTz.month, nowTz.day, TIME_ZONE);
    const tomorrowYmd = addDaysToYmd(nowTz.year, nowTz.month, nowTz.day, 1);
    const yesterdayYmd = addDaysToYmd(nowTz.year, nowTz.month, nowTz.day, -1);
    const tomorrowStartMs = zonedMidnightToUtcMs(
      tomorrowYmd.year,
      tomorrowYmd.month,
      tomorrowYmd.day,
      TIME_ZONE
    );
    const yesterdayStartMs = zonedMidnightToUtcMs(
      yesterdayYmd.year,
      yesterdayYmd.month,
      yesterdayYmd.day,
      TIME_ZONE
    );

    const yesterdayStartIso = new Date(yesterdayStartMs).toISOString();
    const todayStartIso = new Date(todayStartMs).toISOString();
    const tomorrowStartIso = new Date(tomorrowStartMs).toISOString();

    const { data: sales, error: salesError } = await supabaseAdmin
      .from("sales")
      .select("buyer_email,buyer_name,amount_cents,occurred_at")
      .gte("occurred_at", yesterdayStartIso)
      .lt("occurred_at", todayStartIso)
      .order("occurred_at", { ascending: true });
    if (salesError) throw salesError;

    const { data: applies, error: appliesError } = await supabaseAdmin
      .from("applies")
      .select("applicant_email,applicant_name,answers,submitted_at")
      .gte("submitted_at", yesterdayStartIso)
      .lt("submitted_at", todayStartIso)
      .order("submitted_at", { ascending: true });
    if (appliesError) throw appliesError;

    const callsYesterdayEvents = await fetchCalendlyEventsRange({
      minStartIso: yesterdayStartIso,
      maxStartIso: todayStartIso,
      token: calendlyToken,
      userUri: calendlyUserUri,
    });
    const callsTodayEvents = await fetchCalendlyEventsRange({
      minStartIso: todayStartIso,
      maxStartIso: tomorrowStartIso,
      token: calendlyToken,
      userUri: calendlyUserUri,
    });
    const futureWindowEndIso = new Date(tomorrowStartMs + 90 * 24 * 60 * 60 * 1000).toISOString();
    const callsFutureEvents = await fetchCalendlyEventsRange({
      minStartIso: todayStartIso,
      maxStartIso: futureWindowEndIso,
      token: calendlyToken,
      userUri: calendlyUserUri,
    });

    const callsYesterday = await hydrateCalls(callsYesterdayEvents, calendlyToken);
    const callsToday = await hydrateCalls(callsTodayEvents, calendlyToken);
    const callsFuture = await hydrateCalls(callsFutureEvents, calendlyToken);

    const callsYesterdayCount = callsYesterday.length;
    const callsTodayCount = callsToday.length;
    const salesRows = (sales ?? []) as SaleRow[];
    const appliesRows = (applies ?? []) as ApplyRow[];
    const totalSalesCents = salesRows.reduce((sum, sale) => sum + (sale.amount_cents ?? 0), 0);
    const yesterdayDateLabel = formatDateInTz(yesterdayStartIso, TIME_ZONE, true);
    const todayDateLabel = formatDateInTz(todayStartIso, TIME_ZONE, true);

    const messages: string[] = [];

    const summaryLines = [
      `**Daily Report - ${yesterdayDateLabel}**`,
      `💰 Sales: **${salesRows.length}** | **${formatMoneyFromCents(totalSalesCents)}**`,
      `📋 New Applies: **${appliesRows.length}**`,
      `📅 Calls Booked Yesterday: **${callsYesterdayCount}**`,
      `📅 Calls Today: **${callsTodayCount}**`,
    ];
    messages.push(...chunkByDiscordLimit(summaryLines));

    if (salesRows.length > 0) {
      const lines: string[] = [`**💰 Sales - ${yesterdayDateLabel}**`];
      salesRows.forEach((sale, idx) => {
        const amount = formatMoneyFromCents(sale.amount_cents ?? 0);
        const time = formatTimeInTz(sale.occurred_at, TIME_ZONE);
        lines.push(`${idx + 1}. ${time} EST - ${amount} - ${sale.buyer_name ?? "Unknown buyer"}`);
        lines.push(`✉️ ${sale.buyer_email ?? "No email"}`);
      });
      lines.push("");
      lines.push(`**Total: ${formatMoneyFromCents(totalSalesCents)} (${salesRows.length} sales)**`);
      messages.push(...chunkByDiscordLimit(lines));
    }

    if (appliesRows.length > 0) {
      const lines: string[] = [`**📋 New 1-on-1 Applies - ${yesterdayDateLabel}**`];
      const callPool = [...callsYesterday, ...callsToday, ...callsFuture];
      for (const apply of appliesRows) {
        const applicantName = apply.applicant_name ?? "Unknown name";
        const applicantEmail = (apply.applicant_email ?? "").toLowerCase().trim();
        const submittedTime = formatTimeInTz(apply.submitted_at, TIME_ZONE);
        lines.push(`👤 ${applicantName} (${applicantEmail || "no-email"})`);
        lines.push(`🕒 Submitted at ${submittedTime} EST`);

        const answerEntries = Object.entries(apply.answers ?? {});
        for (const [question, answer] of answerEntries) {
          const value =
            typeof answer === "string" || typeof answer === "number" || typeof answer === "boolean"
              ? String(answer)
              : JSON.stringify(answer);
          lines.push(`📝 ${question}: "${value}"`);
        }

        const match = applicantEmail ? matchCallByEmail(applicantEmail, callPool) : null;
        if (match) {
          const date = formatDateInTz(match.startTime, TIME_ZONE, true);
          const time = formatTimeInTz(match.startTime, TIME_ZONE);
          lines.push(`✅ Already booked call for ${date} at ${time} EST`);
        } else {
          lines.push(`⏳ Hasn't booked call yet`);
        }
        lines.push("");
      }
      messages.push(...chunkByDiscordLimit(lines));
    }

    if (callsToday.length > 0) {
      const lines: string[] = [`**📅 Today's Calls - ${todayDateLabel}**`];
      for (const call of callsToday) {
        const time = formatTimeInTz(call.startTime, TIME_ZONE);
        const primaryInvitee = call.invitees[0];
        const inviteeName = primaryInvitee?.name?.trim() || "Unknown name";
        const inviteeEmail = (primaryInvitee?.email ?? "").toLowerCase().trim();

        lines.push(`🕒 ${time} EST - ${inviteeName} (${inviteeEmail || "no-email"})`);

        let matchedApply: ApplyRow | null = null;
        if (inviteeEmail) {
          const { data, error } = await supabaseAdmin
            .from("applies")
            .select("applicant_email,applicant_name,answers,submitted_at")
            .ilike("applicant_email", inviteeEmail)
            .order("submitted_at", { ascending: false })
            .limit(1);
          if (error) throw error;
          matchedApply = (data?.[0] as ApplyRow | undefined) ?? null;
        }

        if (matchedApply) {
          lines.push(
            `📋 Apply submitted ${formatDateInTz(matchedApply.submitted_at, TIME_ZONE, true)} at ${formatTimeInTz(
              matchedApply.submitted_at,
              TIME_ZONE
            )} EST`
          );
          for (const [question, answer] of Object.entries(matchedApply.answers ?? {})) {
            const value =
              typeof answer === "string" || typeof answer === "number" || typeof answer === "boolean"
                ? String(answer)
                : JSON.stringify(answer);
            lines.push(`- ${question}: "${value}"`);
          }
          // (Detailed answers live in the realtime Discord notification + applies table.)
        } else {
          lines.push(`⚠️ No Typeform apply found`);
        }

        lines.push(`📞 Join meeting: ${call.joinUrl ?? "No join URL available"}`);
        lines.push("");
      }
      messages.push(...chunkByDiscordLimit(lines));
    }

    await postDiscordMessages(webhookUrl, messages);

    return NextResponse.json({
      ok: true,
      sales: salesRows.length,
      applies: appliesRows.length,
      calls_yesterday: callsYesterdayCount,
      calls_today: callsTodayCount,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Daily report failed:", error);

    if (webhookUrl) {
      try {
        await postDiscordMessages(webhookUrl, [
          `⚠️ **Daily report failed**\nError: ${message}`.slice(0, 2000),
        ]);
      } catch (discordError) {
        console.error("Failed to send fallback Discord alert:", discordError);
      }
    }

    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
