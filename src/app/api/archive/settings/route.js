import { NextResponse } from "next/server";
import { readSettings, writeSettings, cascadeFieldRename } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { isStudioAuthenticated } from "@/lib/studio-auth";


function remapDriveCapacities(capacities, renames) {
  const next =
    capacities && typeof capacities === "object" && !Array.isArray(capacities)
      ? { ...capacities }
      : {};

  for (const { from, to } of renames ?? []) {
    if (typeof from !== "string" || typeof to !== "string") continue;
    const fromName = from.trim();
    const toName = to.trim();
    if (!fromName || !toName || fromName === toName) continue;
    if (Object.prototype.hasOwnProperty.call(next, fromName)) {
      next[toName] = next[fromName];
      delete next[fromName];
    }
  }

  return next;
}

export async function GET(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureInit();
  const settings = await readSettings();
  return NextResponse.json(settings);
}

export async function PUT(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const driveRenames = body.renames?.archiveDrives ?? [];
  const driveCapacities = remapDriveCapacities(
    body.driveCapacities,
    driveRenames
  );

  const settings = {
    projectTypes: Array.isArray(body.projectTypes) ? body.projectTypes : [],
    archiveDrives: Array.isArray(body.archiveDrives) ? body.archiveDrives : [],
    driveCapacities,
  };

  await ensureInit();
  await writeSettings(settings);

  for (const { from, to } of body.renames?.projectTypes ?? []) {
    if (typeof from === "string" && typeof to === "string") {
      await cascadeFieldRename("type", from.trim(), to.trim());
    }
  }

  // Shared drive vocabulary: rename cascades to both project fields
  for (const { from, to } of driveRenames) {
    if (typeof from === "string" && typeof to === "string") {
      const fromName = from.trim();
      const toName = to.trim();
      await cascadeFieldRename("archiveDrive", fromName, toName);
      await cascadeFieldRename("backupDrive", fromName, toName);
    }
  }

  const saved = await readSettings();
  return NextResponse.json(saved);
}
