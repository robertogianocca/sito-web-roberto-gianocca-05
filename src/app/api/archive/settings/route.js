import { NextResponse } from "next/server";
import { readSettings, saveSettings } from "@/lib/archive";
import { ensureInit } from "@/lib/turso";
import { withStudioAuth } from "@/lib/studio-auth";
import { parseJsonBody, settingsSaveSchema } from "@/lib/studio/schemas";

export const GET = withStudioAuth(async () => {
  await ensureInit();
  return NextResponse.json(await readSettings());
});

/**
 * Saves lists, renames (cascaded to projects) and, when `clients` is sent,
 * the client list, in one transaction. Answers with the saved settings.
 */
export const PUT = withStudioAuth(async (request) => {
  const body = await parseJsonBody(request, settingsSaveSchema);
  await ensureInit();
  return NextResponse.json(await saveSettings(body));
});
