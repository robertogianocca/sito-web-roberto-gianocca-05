import { NextResponse } from "next/server";
import { withStudioAuth } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { projectTimeSummary } from "@/lib/time";

/** Time logged on a project: `{ entryCount, totalSeconds }` (before deleting it). */
export const GET = withStudioAuth(async (request, { params }) => {
  const { id } = await params;
  await ensureInit();
  return NextResponse.json(await projectTimeSummary(id));
});
