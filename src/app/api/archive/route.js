import { NextResponse } from "next/server";
import {
  readProjects,
  createProject,
  generateId,
  normalizeBackupType,
} from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { isStudioAuthenticated } from "@/lib/studio-auth";


export async function GET(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureInit();
  const projects = await readProjects();
  return NextResponse.json(projects);
}

export async function POST(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await ensureInit();
  const now = new Date().toISOString();

  const project = {
    id: generateId(),
    projectId: body.projectId ?? "",
    invoiceNumber: body.invoiceNumber ?? "",
    title: body.title ?? "",
    client: Array.isArray(body.client) ? body.client : [],
    type: Array.isArray(body.type) ? body.type : [],
    date: body.date ?? "",
    location: body.location ?? "",
    archiveDrive: Array.isArray(body.archiveDrive) ? body.archiveDrive : [],
    backupDrive: Array.isArray(body.backupDrive) ? body.backupDrive : [],
    size: body.size ?? "",
    cleaned: Boolean(body.cleaned),
    backupType: normalizeBackupType(body.backupType),
    contact: body.contact ?? "",
    paid: body.paid !== false,
    notes: body.notes ?? "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    createdAt: now,
    updatedAt: now,
  };

  await createProject(project);
  return NextResponse.json(project, { status: 201 });
}
