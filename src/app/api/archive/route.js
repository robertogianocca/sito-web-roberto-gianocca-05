import { NextResponse } from "next/server";
import {
  readProjects,
  createProjectWithVocabulary,
  generateId,
} from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";
import { parseJsonBody, projectSchema } from "@/lib/studio/schemas";

export const GET = withStudioAuth(async () => {
  await ensureInit();
  return NextResponse.json(await readProjects());
});

/** Creates a project; new clients/types/drives it uses are added to the lists. */
export const POST = withStudioAuth(async (request) => {
  const fields = await parseJsonBody(request, projectSchema);
  await ensureInit();
  const now = new Date().toISOString();
  const project = await createProjectWithVocabulary({
    ...fields,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  });
  return NextResponse.json(project, { status: 201 });
});
