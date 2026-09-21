import { NextResponse } from "next/server";
import { isStudioAuthenticated, unauthorizedJson } from "@/lib/studio-auth";
import { ensureInit } from "@/lib/turso";
import { updateTimeEntry, deleteTimeEntry } from "@/lib/time";

export async function PUT(request, { params }) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await updateTimeEntry(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  if (!isStudioAuthenticated(request)) return unauthorizedJson();
  await ensureInit();

  const { id } = await params;
  await deleteTimeEntry(id);
  return NextResponse.json({ ok: true });
}
