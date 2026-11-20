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
import {
  entriesQuerySchema,
  parseJsonBody,
  parseSearchParams,
  renameDescriptionSchema,
  timeEntryCreateSchema,
} from "@/lib/studio/schemas";

export const GET = withStudioAuth(async (request) => {
  const query = parseSearchParams(request, entriesQuerySchema);
  await ensureInit();

  if (query.view === "today") {
    // "Today" in the studio time zone, not the server's (UTC on Vercel).
    const now = new Date();
    const { start, end } = zonedDayRange(now);
    const [entries, todayTotalSeconds, recentTasks] = await Promise.all([
      listTimeEntries({ from: start.toISOString(), to: end.toISOString() }),
      getTodayTotalSeconds(now),
      listRecentTasks(),
    ]);
    return NextResponse.json({ entries, todayTotalSeconds, recentTasks });
  }

  if (query.view === "week") {
    const summary = await getWeekSummary(query.week ? new Date(query.week) : new Date());
    return NextResponse.json(summary);
  }

  const entries = await listTimeEntries({ from: query.from, to: query.to });
  return NextResponse.json({ entries });
});

export const POST = withStudioAuth(async (request) => {
  const body = await parseJsonBody(request, timeEntryCreateSchema);
  await ensureInit();
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

/** Renames a description on every entry of a project. */
export const PATCH = withStudioAuth(async (request) => {
  const body = await parseJsonBody(request, renameDescriptionSchema);
  await ensureInit();
  return NextResponse.json(await renameDescription(body));
});
