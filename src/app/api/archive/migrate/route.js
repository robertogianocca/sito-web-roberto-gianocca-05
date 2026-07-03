/**
 * One-time migration endpoint.
 * POST /api/archive/migrate
 *
 * Reads the legacy projects.json and clients.json files (if they exist)
 * and imports them into Turso. Safe to call multiple times — uses
 * INSERT OR IGNORE so existing rows are never overwritten.
 *
 * After a successful migration you can delete this file.
 */
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { createProject, addClient } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

async function readJson(filePath) {
  try {
    const text = await readFile(filePath, "utf-8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await ensureInit();

  const root = process.cwd();
  const projectsData = await readJson(
    path.join(root, "src/data/archive/projects.json")
  );
  const clientsData = await readJson(
    path.join(root, "src/data/archive/clients.json")
  );

  let projectsImported = 0;
  let clientsImported = 0;

  if (Array.isArray(projectsData)) {
    for (const p of projectsData) {
      if (!p.id) continue;
      try {
        await createProject({
          id: p.id,
          projectId: p.projectId ?? "",
          invoiceNumber: p.invoiceNumber ?? "",
          title: p.title ?? "",
          client: p.client ?? "",
          type: p.type ?? "",
          date: p.date ?? "",
          location: p.location ?? "",
          archiveDrive: p.archiveDrive ?? "",
          backupDrive: p.backupDrive ?? "",
          cleaned: Boolean(p.cleaned),
          backupCompleted: Boolean(p.backupCompleted),
          notes: p.notes ?? "",
          tags: Array.isArray(p.tags) ? p.tags : [],
          createdAt: p.createdAt ?? new Date().toISOString(),
          updatedAt: p.updatedAt ?? new Date().toISOString(),
        });
        projectsImported++;
      } catch {
        // INSERT OR IGNORE handles duplicates; skip errors silently
      }
    }
  }

  if (Array.isArray(clientsData)) {
    for (const name of clientsData) {
      if (typeof name === "string" && name.trim()) {
        await addClient(name.trim());
        clientsImported++;
      }
    }
  }

  return NextResponse.json({
    ok: true,
    projectsImported,
    clientsImported,
  });
}
