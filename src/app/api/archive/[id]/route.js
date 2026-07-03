import { NextResponse } from "next/server";
import { readProjects, writeProjects } from "@/lib/archive";

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

  const projects = await readProjects();
  const idx = projects.findIndex((p) => p.id === id);

  if (idx === -1) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = {
    ...projects[idx],
    projectId: body.projectId ?? projects[idx].projectId,
    invoiceNumber: body.invoiceNumber ?? projects[idx].invoiceNumber,
    title: body.title ?? projects[idx].title,
    client: body.client ?? projects[idx].client,
    type: body.type ?? projects[idx].type,
    date: body.date ?? projects[idx].date,
    location: body.location ?? projects[idx].location,
    archiveDrive: body.archiveDrive ?? projects[idx].archiveDrive,
    backupDrive: body.backupDrive ?? projects[idx].backupDrive,
    cleaned: typeof body.cleaned === "boolean" ? body.cleaned : projects[idx].cleaned,
    backupCompleted: typeof body.backupCompleted === "boolean" ? body.backupCompleted : projects[idx].backupCompleted,
    verified: typeof body.verified === "boolean" ? body.verified : projects[idx].verified,
    notes: body.notes ?? projects[idx].notes,
    tags: Array.isArray(body.tags) ? body.tags : projects[idx].tags,
    id: projects[idx].id,
    createdAt: projects[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  projects[idx] = updated;
  await writeProjects(projects);
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const projects = await readProjects();
  const filtered = projects.filter((p) => p.id !== id);

  if (filtered.length === projects.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeProjects(filtered);
  return NextResponse.json({ ok: true });
}
