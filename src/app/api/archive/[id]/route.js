import { NextResponse } from "next/server";
import { readProjects, updateProject, deleteProject } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

export async function PUT(request, { params }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    client: body.client ?? "",
    type: body.type ?? "",
    date: body.date ?? "",
    location: body.location ?? "",
    archiveDrive: body.archiveDrive ?? "",
    backupDrive: body.backupDrive ?? "",
    cleaned: Boolean(body.cleaned),
    backupCompleted: Boolean(body.backupCompleted),
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
}

export async function DELETE(request, { params }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await ensureInit();
  await deleteProject(id);
  return NextResponse.json({ ok: true });
}
