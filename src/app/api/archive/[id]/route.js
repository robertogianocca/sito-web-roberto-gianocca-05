import { NextResponse } from "next/server";
import { patchProject, deleteProject } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";
import { NotFoundError } from "@/lib/studio/errors";
import { parseJsonBody, projectSchema } from "@/lib/studio/schemas";

/**
 * Updates only the fields sent (others are kept); new clients/types/drives
 * are added to the lists in the same transaction.
 */
async function updateProjectFields(request, { params }) {
  const { id } = await params;
  const fields = await parseJsonBody(request, projectSchema);
  await ensureInit();
  const project = await patchProject(id, fields);
  if (!project) throw new NotFoundError();
  return NextResponse.json(project);
}

export const PATCH = withStudioAuth(updateProjectFields);

/** Kept for older clients: same as PATCH (fields not sent are kept). */
export const PUT = withStudioAuth(updateProjectFields);

export const DELETE = withStudioAuth(async (request, { params }) => {
  const { id } = await params;
  await ensureInit();
  await deleteProject(id);
  return NextResponse.json({ ok: true });
});
