import { NextResponse } from "next/server";
import { withStudioAuth } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import {
  listTimeEntries,
  createTimeEntry,
  getTodayTotalSeconds,
  getWeekSummary,
  renameDescription,
  listRecentTasks,
} from "@/lib/time";
import { zonedDayRange } from "@/lib/timeZone";

export const GET = withStudioAuth(async (request) => {
  await ensureInit();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "today") {
    // "Today" in the studio time zone, not the server's (UTC on Vercel).
    const now = new Date();
    const { start, end } = zonedDayRange(now);
    const entries = await listTimeEntries({
      from: start.toISOString(),
      to: end.toISOString(),
    });
    const [todayTotalSeconds, recentTasks] = await Promise.all([
      getTodayTotalSeconds(now),
      listRecentTasks(),
    ]);
    return NextResponse.json({ entries, todayTotalSeconds, recentTasks });
  }

  if (view === "week") {
    const weekParam = searchParams.get("week");
    const weekDate = weekParam ? new Date(weekParam) : new Date();
    if (Number.isNaN(weekDate.getTime())) {
      return NextResponse.json({ error: "Invalid week date" }, { status: 400 });
    }
    const summary = await getWeekSummary(weekDate);
    return NextResponse.json(summary);
  }

  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const entries = await listTimeEntries({ from, to });
  return NextResponse.json({ entries });
});

export const POST = withStudioAuth(async (request) => {
  await ensureInit();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const entry = await createTimeEntry({
    projectId: body.projectId ?? "",
    description: body.description ?? "",
    startedAt: body.startedAt,
    endedAt: body.endedAt,
    durationSeconds: body.durationSeconds,
    source: "manual",
  });

  return NextResponse.json(entry, { status: 201 });
});

export const PATCH = withStudioAuth(async (request) => {
  await ensureInit();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!String(body.to ?? "").trim()) {
    return NextResponse.json(
      { error: "The new description cannot be empty." },
      { status: 400 }
    );
  }

  const result = await renameDescription({
    projectId: body.projectId ?? "",
    from: body.from ?? "",
    to: body.to,
  });
  return NextResponse.json(result);
});
