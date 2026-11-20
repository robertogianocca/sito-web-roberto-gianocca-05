import { NextResponse } from "next/server";
import { readClients, addClient, deleteClient, cascadeFieldRename } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";


export const GET = withStudioAuth(async (request) => {
  await ensureInit();
  const clients = await readClients();
  return NextResponse.json(clients);
});

export const POST = withStudioAuth(async (request) => {
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
});

export const PUT = withStudioAuth(async (request) => {
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
});

export const DELETE = withStudioAuth(async (request) => {
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
});
