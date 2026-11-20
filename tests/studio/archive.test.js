import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit, getTursoClient } from "@/lib/turso";
import {
  cascadeFieldRename,
  createProject,
  generateId,
  readProjects,
  readSettings,
  updateProject,
  writeSettings,
} from "@/lib/archive";
import { formatProjectId } from "@/lib/archiveFormat";
import { formatBytes, parseSize } from "@/lib/archiveSize";
import { normalizeBackupType } from "@/lib/archiveBackup";

setupTempDatabase();

const db = () => getTursoClient();

beforeAll(() => ensureInit());

beforeEach(async () => {
  await db().execute("DELETE FROM projects");
  await db().execute("DELETE FROM settings");
});

async function addProject(fields) {
  const now = new Date().toISOString();
  const id = generateId();
  await createProject({ id, createdAt: now, updatedAt: now, ...fields });
  return id;
}

describe("projects", () => {
  it("stores multi-value fields as lists and pads numeric ids", async () => {
    await addProject({ projectId: "7", client: ["Anna", "Shop"], tags: ["print"] });
    const [project] = await readProjects();
    expect(project.projectId).toBe("007");
    expect(project.client).toEqual(["Anna", "Shop"]);
    expect(project.tags).toEqual(["print"]);
    expect(project.paid).toBe(true);
  });

  it("replaces every field on update (current behaviour of PUT)", async () => {
    const id = await addProject({ title: "Old", paid: false, notes: "keep me?" });
    await updateProject(id, { title: "New" });
    const [project] = await readProjects();
    expect(project.title).toBe("New");
    expect(project.notes).toBe(""); // missing fields are reset
    expect(project.paid).toBe(true); // missing `paid` becomes "paid"
  });

  it("renames a value in every project that uses it, and nothing else", async () => {
    await addProject({ client: ["Anna"] });
    await addProject({ client: ["Anna Rossi", "Shop"] });
    await cascadeFieldRename("client", "Anna", "Anna B.");
    const clients = (await readProjects()).map((p) => p.client).sort();
    expect(clients).toEqual([["Anna B."], ["Anna Rossi", "Shop"]]);
  });

  it("ignores renames of fields that are not renameable", async () => {
    await addProject({ title: "Same" });
    await cascadeFieldRename("title", "Same", "Other");
    expect((await readProjects())[0].title).toBe("Same");
  });
});

describe("settings", () => {
  it("keeps capacities only for drives that exist", async () => {
    await writeSettings({
      projectTypes: ["Video"],
      archiveDrives: ["A", "B"],
      driveCapacities: { A: "4 TB", Gone: "1 TB", B: "  " },
    });
    const settings = await readSettings();
    expect(settings.archiveDrives).toEqual(["A", "B"]);
    expect(settings.driveCapacities).toEqual({ A: "4 TB" });
  });

  it("merges the legacy backup drive list into archive drives", async () => {
    await db().batch(
      [
        { sql: "INSERT INTO settings (key, value) VALUES ('archiveDrives', ?)", args: ['["A"]'] },
        { sql: "INSERT INTO settings (key, value) VALUES ('backupDrives', ?)", args: ['["A","Backup 2"]'] },
      ],
      "write"
    );
    expect((await readSettings()).archiveDrives).toEqual(["A", "Backup 2"]);
    const { rows } = await db().execute("SELECT key FROM settings WHERE key = 'backupDrives'");
    expect(rows).toHaveLength(0);
  });
});

describe("formatting helpers", () => {
  it("pads numeric project ids to three digits", () => {
    expect(formatProjectId("7")).toBe("007");
    expect(formatProjectId(" 1234 ")).toBe("1234");
    expect(formatProjectId("A-12")).toBe("A-12");
    expect(formatProjectId(null)).toBe("");
  });

  it("parses free-text sizes", () => {
    expect(parseSize("3 GB")).toBe(3 * 1024 ** 3);
    expect(parseSize("1,5TB")).toBe(1.5 * 1024 ** 4);
    expect(parseSize("500 mb")).toBe(500 * 1024 ** 2);
    expect(parseSize("lots")).toBe(0);
    expect(parseSize("")).toBe(0);
  });

  it("formats byte counts", () => {
    expect(formatBytes(1.5 * 1024 ** 4)).toBe("1.5 TB");
    expect(formatBytes(12 * 1024 ** 3)).toBe("12 GB");
    expect(formatBytes(0)).toBe("0 B");
  });

  it("normalizes backup types", () => {
    expect(normalizeBackupType(" full ")).toBe("full");
    expect(normalizeBackupType("export")).toBe("export");
    expect(normalizeBackupType("weird")).toBe("");
    expect(normalizeBackupType("", true)).toBe("full");
  });
});
