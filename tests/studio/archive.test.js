import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit, getTursoClient } from "@/lib/turso";
import {
  cascadeFieldRename,
  createProject,
  createProjectWithVocabulary,
  generateId,
  patchProject,
  readClients,
  readProjects,
  readSettings,
  renameClient,
  saveSettings,
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
  await db().execute("DELETE FROM clients");
  await writeSettings({ projectTypes: ["Video"], archiveDrives: ["A"], driveCapacities: {} });
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

  it("updates only the fields given", async () => {
    const id = await addProject({ title: "Old", paid: false, notes: "keep me", client: ["Anna"] });
    const updated = await patchProject(id, { title: "New" });
    expect(updated.title).toBe("New");
    expect(updated.notes).toBe("keep me");
    expect(updated.paid).toBe(false);
    expect(updated.client).toEqual(["Anna"]);
  });

  it("keeps backupCompleted in step with backupType", async () => {
    const id = await addProject({});
    await patchProject(id, { backupType: "export" });
    const { rows } = await db().execute({ sql: "SELECT backupCompleted FROM projects WHERE id = ?", args: [id] });
    expect(Number(rows[0].backupCompleted)).toBe(1);
  });

  it("returns null for a project that does not exist, and adds nothing", async () => {
    expect(await patchProject("missing", { client: ["Ghost"] })).toBeNull();
    expect(await readClients()).toEqual([]);
  });

  it("adds new clients, types and drives together with the project", async () => {
    const now = new Date().toISOString();
    await createProjectWithVocabulary({
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      client: ["New client"],
      type: ["Video", "Drone"],
      archiveDrive: ["A", "B"],
      backupDrive: ["C"],
    });
    expect(await readClients()).toEqual(["New client"]);
    const settings = await readSettings();
    expect(settings.projectTypes).toEqual(["Video", "Drone"]);
    expect(settings.archiveDrives).toEqual(["A", "B", "C"]);
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

  it("returns only the editable lists, not internal rows", async () => {
    await db().execute("INSERT OR REPLACE INTO settings (key, value) VALUES ('backupTypeLegacyMigrated', '1')");
    expect(Object.keys(await readSettings()).sort()).toEqual([
      "archiveDrives",
      "driveCapacities",
      "projectTypes",
    ]);
  });

  it("saves lists, renames and clients in one go", async () => {
    await writeSettings({ projectTypes: ["Video"], archiveDrives: ["A"], driveCapacities: { A: "4 TB" } });
    await saveSettings({ projectTypes: [], archiveDrives: [], clients: ["Anna", "Shop"] });
    await addProject({ type: ["Video"], archiveDrive: ["A"], backupDrive: ["A"], client: ["Anna"] });

    await saveSettings({
      projectTypes: ["Film"],
      archiveDrives: ["Main"],
      driveCapacities: { A: "4 TB" },
      renames: {
        projectTypes: [{ from: "Video", to: "Film" }],
        archiveDrives: [{ from: "A", to: "Main" }],
        clients: [{ from: "Anna", to: "Anna B." }],
      },
      clients: ["Anna B.", "New"], // "Shop" removed, "New" added
    });

    const [project] = await readProjects();
    expect(project.type).toEqual(["Film"]);
    expect(project.archiveDrive).toEqual(["Main"]);
    expect(project.backupDrive).toEqual(["Main"]);
    expect(project.client).toEqual(["Anna B."]);
    expect(await readClients()).toEqual(["Anna B.", "New"]);
    expect((await readSettings()).driveCapacities).toEqual({ Main: "4 TB" });
  });

  it("saves nothing when one statement fails", async () => {
    await addProject({ type: ["Video"] });
    // A client name that is not a string makes the batch fail half-way.
    await expect(
      saveSettings({
        projectTypes: ["Film"],
        archiveDrives: [],
        renames: { projectTypes: [{ from: "Video", to: "Film" }] },
        clients: [{ not: "a string" }],
      })
    ).rejects.toThrow();
    expect((await readSettings()).projectTypes).toEqual(["Video"]);
    expect((await readProjects())[0].type).toEqual(["Video"]);
  });

  it("renames a client in the list and in its projects", async () => {
    await saveSettings({ projectTypes: [], archiveDrives: [], clients: ["Anna"] });
    await addProject({ client: ["Anna"] });
    expect(await renameClient("Anna", "Anna B.")).toEqual(["Anna B."]);
    expect((await readProjects())[0].client).toEqual(["Anna B."]);
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
