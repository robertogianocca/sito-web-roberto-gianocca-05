import { NextResponse } from "next/server";
import {
  readProjects,
  updateProject,
  deleteProject,
  normalizeBackupType,
} from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";


export const PUT = withStudioAuth(async (request, { params }) => {
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  await ensureInit();

  const fields = {
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
    updatedAt: new Date().toISOString(),
  };

  await updateProject(id, fields);

  const projects = await readProjects();
  const updated = projects.find((p) => p.id === id);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
});

export const DELETE = withStudioAuth(async (request, { params }) => {
  const { id } = await params;
  await ensureInit();
  await deleteProject(id);
  return NextResponse.json({ ok: true });
});
