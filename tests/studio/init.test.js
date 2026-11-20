import { describe, expect, it, vi } from "vitest";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit } from "@/lib/turso";
import { readSettings, writeSettings } from "@/lib/archive";
import { ARCHIVE_DRIVES, PROJECT_TYPES } from "@/data/archive/config";

setupTempDatabase();

describe("ensureInit on a new database", () => {
  it("creates the default project types and drives", async () => {
    await ensureInit();
    const settings = await readSettings();
    expect(settings.projectTypes).toEqual(PROJECT_TYPES);
    expect(settings.archiveDrives).toEqual(ARCHIVE_DRIVES);
  });

  it("keeps lists the user has changed, even emptied ones", async () => {
    await writeSettings({ projectTypes: [], archiveDrives: ["Mine"], driveCapacities: {} });
    // A fresh module instance, so ensureInit really runs again (like a new
    // serverless instance starting against the same database).
    vi.resetModules();
    const fresh = await import("@/lib/turso");
    await fresh.ensureInit();
    const settings = await readSettings();
    expect(settings.projectTypes).toEqual([]);
    expect(settings.archiveDrives).toEqual(["Mine"]);
  });
});
