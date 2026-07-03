import { NextResponse } from "next/server";
import { readClients, writeClients } from "@/lib/archive";

function checkAuth(request) {
  const session = request.cookies.get("archive_session");
  const secret = process.env.ARCHIVE_SESSION_SECRET;
  return Boolean(secret && session?.value === secret);
}

export async function GET(request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const clients = await readClients();
  return NextResponse.json(clients);
}

export async function POST(request) {
  if (!checkAuth(request)) {
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

  const clients = await readClients();
  if (!clients.includes(name)) {
    clients.push(name);
    clients.sort((a, b) => a.localeCompare(b));
    await writeClients(clients);
  }

  return NextResponse.json(clients);
}
