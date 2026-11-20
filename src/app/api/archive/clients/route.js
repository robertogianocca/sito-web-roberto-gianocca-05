import { NextResponse } from "next/server";
import { readClients, addClient, deleteClient, renameClient } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";
import {
  clientNameSchema,
  clientRenameSchema,
  parseJsonBody,
} from "@/lib/studio/schemas";

export const GET = withStudioAuth(async () => {
  await ensureInit();
  return NextResponse.json(await readClients());
});

export const POST = withStudioAuth(async (request) => {
  const { name } = await parseJsonBody(request, clientNameSchema);
  await ensureInit();
  return NextResponse.json(await addClient(name));
});

/** Renames a client in the list and in every project, atomically. */
export const PUT = withStudioAuth(async (request) => {
  const { from, to } = await parseJsonBody(request, clientRenameSchema);
  await ensureInit();
  return NextResponse.json(await renameClient(from, to));
});

export const DELETE = withStudioAuth(async (request) => {
  const { name } = await parseJsonBody(request, clientNameSchema);
  await ensureInit();
  return NextResponse.json(await deleteClient(name));
});
