import { NextResponse } from "next/server";
import { readClients, addClient, deleteClient, cascadeFieldRename } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { isStudioAuthenticated } from "@/lib/studio-auth";


export async function GET(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await ensureInit();
  const clients = await readClients();
  return NextResponse.json(clients);
}

export async function POST(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await ensureInit();
  const clients = await addClient(name);
  return NextResponse.json(clients);
}

export async function PUT(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const from = String(body.from ?? "").trim();
  const to = String(body.to ?? "").trim();
  if (!from || !to) {
    return NextResponse.json({ error: "from and to are required" }, { status: 400 });
  }
  if (from === to) {
    await ensureInit();
    const clients = await readClients();
    return NextResponse.json(clients);
  }

  await ensureInit();
  await deleteClient(from);
  const clients = await addClient(to);
  await cascadeFieldRename("client", from, to);
  return NextResponse.json(clients);
}

export async function DELETE(request) {
  if (!isStudioAuthenticated(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  await ensureInit();
  const clients = await deleteClient(name);
  return NextResponse.json(clients);
}
