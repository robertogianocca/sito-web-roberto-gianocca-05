import { NextResponse } from "next/server";
import { readProjects, writeProjects, generateId } from "@/lib/archive";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projects = await readProjects();
  return NextResponse.json(projects);
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const projects = await readProjects();
  const now = new Date().toISOString();

  const project = {
    id: generateId(),
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
    verified: Boolean(body.verified),
    notes: body.notes ?? "",
    tags: Array.isArray(body.tags) ? body.tags : [],
    createdAt: now,
    updatedAt: now,
  };

  projects.push(project);
  await writeProjects(projects);
  return NextResponse.json(project, { status: 201 });
}
