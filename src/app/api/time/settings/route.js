import { NextResponse } from "next/server";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { getActivityTypes, setActivityTypes } from "@/lib/time";

export async function GET(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();
  const activityTypes = await getActivityTypes();
  return NextResponse.json({ activityTypes });
}

export async function PUT(request) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const activityTypes = await setActivityTypes(body.activityTypes);
  return NextResponse.json({ activityTypes });
}
