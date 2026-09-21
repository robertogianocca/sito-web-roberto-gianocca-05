import { NextResponse } from "next/server";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { readProjects } from "@/lib/archive";
import { getReport } from "@/lib/time";

export async function GET(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  const projects = await readProjects();
  const report = await getReport({ from, to, projects });
  return NextResponse.json(report);
}
