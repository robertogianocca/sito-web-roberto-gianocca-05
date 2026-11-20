import { NextResponse } from "next/server";
import { withStudioAuth } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { readProjects } from "@/lib/archive";
import { getReport } from "@/lib/time";
import { parseSearchParams, rangeQuerySchema } from "@/lib/studio/schemas";

export const GET = withStudioAuth(async (request) => {
  const { from, to } = parseSearchParams(request, rangeQuerySchema);
  await ensureInit();
  const projects = await readProjects();
  return NextResponse.json(await getReport({ from, to, projects }));
});
