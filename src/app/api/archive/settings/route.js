import { NextResponse } from "next/server";
import { readSettings, writeSettings, cascadeFieldRename } from "@/lib/archive";
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

  const fieldMap = {
    projectTypes: "type",
    archiveDrives: "archiveDrive",
    backupDrives: "backupDrive",
  };
  for (const [key, dbField] of Object.entries(fieldMap)) {
    for (const { from, to } of body.renames?.[key] ?? []) {
      if (typeof from === "string" && typeof to === "string") {
        await cascadeFieldRename(dbField, from.trim(), to.trim());
      }
    }
  }

  return NextResponse.json(settings);
}
