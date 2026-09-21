import { NextResponse } from "next/server";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import {
  listTimeEntries,
  createTimeEntry,
  getTodayTotalSeconds,
  getWeekSummary,
} from "@/lib/time";

export async function GET(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const { searchParams } = new URL(request.url);
  const view = searchParams.get("view");

  if (view === "today") {
    const now = new Date();
    const from = new Date(now);
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setDate(to.getDate() + 1);
    const entries = await listTimeEntries({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    const todayTotalSeconds = await getTodayTotalSeconds(now);
    return NextResponse.json({ entries, todayTotalSeconds });
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
}

export async function POST(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
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
    activityType: body.activityType ?? "",
    startedAt: body.startedAt,
    endedAt: body.endedAt,
    durationSeconds: body.durationSeconds,
    source: "manual",
  });

  return NextResponse.json(entry, { status: 201 });
}
