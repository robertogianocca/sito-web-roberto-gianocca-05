import { NextResponse } from "next/server";
import { readProjects } from "@/lib/archive";
import ExcelJS from "exceljs";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

const COLUMNS = [
  { header: "Project ID", key: "projectId", width: 14 },
  { header: "Invoice Number", key: "invoiceNumber", width: 16 },
  { header: "Title", key: "title", width: 32 },
  { header: "Client", key: "client", width: 22 },
  { header: "Type", key: "type", width: 16 },
  { header: "Date", key: "date", width: 12 },
  { header: "Location", key: "location", width: 22 },
  { header: "Archive Drive", key: "archiveDrive", width: 16 },
  { header: "Backup Drive", key: "backupDrive", width: 16 },
  { header: "Cleaned", key: "cleaned", width: 10 },
  { header: "Backup Completed", key: "backupCompleted", width: 18 },
  { header: "Verified", key: "verified", width: 10 },
  { header: "Notes", key: "notes", width: 40 },
  { header: "Tags", key: "tags", width: 30 },
  { header: "Created At", key: "createdAt", width: 22 },
  { header: "Updated At", key: "updatedAt", width: 22 },
];

function boolStr(val) {
  return val ? "Yes" : "No";
}

function escapeCsvCell(val) {
  if (val === null || val === undefined) return "";
  return `"${String(val).replace(/"/g, '""')}"`;
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "xlsx";
  const projects = await readProjects();
  const dateStamp = new Date().toISOString().slice(0, 10);

  if (format === "csv") {
    const header = COLUMNS.map((c) => escapeCsvCell(c.header)).join(",");
    const rows = projects.map((p) =>
      COLUMNS.map((c) => {
        const val = p[c.key];
        if (Array.isArray(val)) return escapeCsvCell(val.join(", "));
        if (typeof val === "boolean") return escapeCsvCell(boolStr(val));
        return escapeCsvCell(val);
      }).join(",")
    );
    const csv = [header, ...rows].join("\r\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="archive-${dateStamp}.csv"`,
      },
    });
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Archive";
  const sheet = workbook.addWorksheet("Archive");

  sheet.columns = COLUMNS;

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFF5F1EE" }, size: 11 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF2F2B28" },
  };
  headerRow.alignment = { vertical: "middle" };
  headerRow.height = 22;

  for (const p of projects) {
    const row = sheet.addRow({
      ...p,
      cleaned: boolStr(p.cleaned),
      backupCompleted: boolStr(p.backupCompleted),
      verified: boolStr(p.verified),
      tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
    });
    row.height = 18;
  }

  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: COLUMNS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="archive-${dateStamp}.xlsx"`,
    },
  });
}
