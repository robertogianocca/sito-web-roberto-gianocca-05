import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { readProjects } from "@/lib/archive";
import { listTimeEntries, formatDuration, formatDurationHours } from "@/lib/time";

export async function GET(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "csv" ? "csv" : "xlsx";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const [entries, projects] = await Promise.all([
    listTimeEntries({ from, to }),
    readProjects(),
  ]);
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const rows = entries.map((e) => {
    const project = projectMap.get(e.projectId);
    return {
      date: e.startedAt ? e.startedAt.slice(0, 10) : "",
      startedAt: e.startedAt,
      endedAt: e.endedAt,
      duration: formatDuration(e.durationSeconds),
      hours: formatDurationHours(e.durationSeconds),
      projectId: project?.projectId ?? "",
      projectTitle: project?.title ?? "",
      client: Array.isArray(project?.client)
        ? project.client.join(", ")
        : "",
      activityType: e.activityType,
      description: e.description,
      source: e.source,
    };
  });

  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const headers = [
      "Date",
      "Started At",
      "Ended At",
      "Duration",
      "Hours",
      "Project ID",
      "Project Title",
      "Client",
      "Activity",
      "Description",
      "Source",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.date,
          r.startedAt,
          r.endedAt,
          r.duration,
          r.hours,
          r.projectId,
          r.projectTitle,
          r.client,
          r.activityType,
          r.description,
          r.source,
        ]
          .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
          .join(",")
      ),
    ];
    return new NextResponse(lines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="time-${dateStamp}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Time");
  sheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Started At", key: "startedAt", width: 22 },
    { header: "Ended At", key: "endedAt", width: 22 },
    { header: "Duration", key: "duration", width: 12 },
    { header: "Hours", key: "hours", width: 10 },
    { header: "Project ID", key: "projectId", width: 14 },
    { header: "Project Title", key: "projectTitle", width: 32 },
    { header: "Client", key: "client", width: 22 },
    { header: "Activity", key: "activityType", width: 14 },
    { header: "Description", key: "description", width: 40 },
    { header: "Source", key: "source", width: 10 },
  ];
  sheet.addRows(rows);

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="time-${dateStamp}.xlsx"`,
    },
  });
}
