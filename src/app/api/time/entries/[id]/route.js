import { NextResponse } from "next/server";
import { withStudioAuth } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { updateTimeEntry, deleteTimeEntry } from "@/lib/time";
import { NotFoundError } from "@/lib/studio/errors";
import { parseJsonBody, timeEntryUpdateSchema } from "@/lib/studio/schemas";

export const PUT = withStudioAuth(async (request, { params }) => {
  const { id } = await params;
  const body = await parseJsonBody(request, timeEntryUpdateSchema);
  await ensureInit();
  const updated = await updateTimeEntry(id, body);
  if (!updated) throw new NotFoundError();
  return NextResponse.json(updated);
});

export const DELETE = withStudioAuth(async (request, { params }) => {
  const { id } = await params;
  await ensureInit();
  await deleteTimeEntry(id);
  return NextResponse.json({ ok: true });
});
