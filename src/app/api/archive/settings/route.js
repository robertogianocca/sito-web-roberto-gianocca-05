import { NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureInit();
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const settings = {
    projectTypes: Array.isArray(body.projectTypes) ? body.projectTypes : [],
    archiveDrives: Array.isArray(body.archiveDrives) ? body.archiveDrives : [],
    backupDrives: Array.isArray(body.backupDrives) ? body.backupDrives : [],
  };

  await ensureInit();
  await writeSettings(settings);
  return NextResponse.json(settings);
}
