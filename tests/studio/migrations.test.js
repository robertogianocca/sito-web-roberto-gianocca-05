import { describe, expect, it } from "vitest";
import { createClient } from "@libsql/client";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { MIGRATIONS, runMigrations } from "@/lib/studio/migrations";
import { ARCHIVE_DRIVES, PROJECT_TYPES } from "@/data/archive/config";

function newDatabase() {
  const dir = mkdtempSync(path.join(tmpdir(), "studio-migrations-"));
  return createClient({ url: `file:${path.join(dir, "test.db")}` });
}

async function tableNames(db) {
  const { rows } = await db.execute(
    "SELECT name FROM sqlite_master WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'"
  );
  return rows.map((r) => r.name);
}

async function settingsMap(db) {
  const { rows } = await db.execute("SELECT key, value FROM settings");
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

const LATEST = MIGRATIONS.at(-1).version;

describe("runMigrations", () => {
  it("creates a complete database from scratch", async () => {
    const db = newDatabase();
    const ran = await runMigrations(db);
    expect(ran).toEqual(MIGRATIONS.map((m) => m.version));

    const names = await tableNames(db);
    for (const table of [
      "projects",
      "clients",
      "settings",
      "time_entries",
      "time_timer",
      "login_attempts",
      "schema_migrations",
      "idx_time_entries_startedAt",
      "idx_time_entries_projectId",
    ]) {
      expect(names).toContain(table);
    }
    const settings = await settingsMap(db);
    expect(JSON.parse(settings.projectTypes)).toEqual(PROJECT_TYPES);
    expect(JSON.parse(settings.archiveDrives)).toEqual(ARCHIVE_DRIVES);
  });

  it("does nothing on an up-to-date database", async () => {
    const db = newDatabase();
    await runMigrations(db);
    expect(await runMigrations(db)).toEqual([]);
    const { rows } = await db.execute("SELECT MAX(version) AS v FROM schema_migrations");
    expect(Number(rows[0].v)).toBe(LATEST);
  });

  it("is safe when two instances run it at the same time", async () => {
    const db = newDatabase();
    await Promise.all([runMigrations(db), runMigrations(db)]);
    const { rows } = await db.execute("SELECT COUNT(*) AS n FROM schema_migrations");
    expect(Number(rows[0].n)).toBe(MIGRATIONS.length);
  });

  it("brings an old database up to date without losing data", async () => {
    // A database as an early version of the site left it: no size/backupType/
    // contact/paid columns, no flags, a separate backup-drive list, entries
    // that still use activityType.
    const db = newDatabase();
    await db.batch(
      [
        `CREATE TABLE projects (
          id TEXT PRIMARY KEY, projectId TEXT NOT NULL DEFAULT '',
          invoiceNumber TEXT NOT NULL DEFAULT '', title TEXT NOT NULL DEFAULT '',
          client TEXT NOT NULL DEFAULT '', type TEXT NOT NULL DEFAULT '',
          date TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '',
          archiveDrive TEXT NOT NULL DEFAULT '', backupDrive TEXT NOT NULL DEFAULT '',
          cleaned INTEGER NOT NULL DEFAULT 0, backupCompleted INTEGER NOT NULL DEFAULT 0,
          notes TEXT NOT NULL DEFAULT '', tags TEXT NOT NULL DEFAULT '[]',
          createdAt TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL DEFAULT '')`,
        "CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
        `CREATE TABLE time_entries (
          id TEXT PRIMARY KEY, projectId TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '', activityType TEXT NOT NULL DEFAULT '',
          startedAt TEXT NOT NULL DEFAULT '', endedAt TEXT NOT NULL DEFAULT '',
          durationSeconds INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'manual',
          createdAt TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL DEFAULT '')`,
        `INSERT INTO projects (id, title, backupCompleted) VALUES ('p1', 'Old project', 1)`,
        `INSERT INTO settings (key, value) VALUES ('projectTypes', '["Mine"]')`,
        `INSERT INTO settings (key, value) VALUES ('archiveDrives', '["A"]')`,
        `INSERT INTO settings (key, value) VALUES ('backupDrives', '["A","Backup 2"]')`,
        `INSERT INTO time_entries (id, activityType, description) VALUES ('t1', 'Editing', '')`,
      ],
      "write"
    );

    await runMigrations(db);

    const { rows: projects } = await db.execute("SELECT * FROM projects");
    expect(projects[0].title).toBe("Old project");
    expect(projects[0].backupType).toBe("full");
    expect(Number(projects[0].paid)).toBe(1);
    expect(projects[0].size).toBe("");

    const { rows: entries } = await db.execute("SELECT description FROM time_entries");
    expect(entries[0].description).toBe("Editing");

    const settings = await settingsMap(db);
    expect(JSON.parse(settings.projectTypes)).toEqual(["Mine"]); // not overwritten
    expect(JSON.parse(settings.archiveDrives)).toEqual(["A", "Backup 2"]);
    expect(settings.backupDrives).toBeUndefined();
  });

  it("leaves a database the previous code already migrated as it is", async () => {
    // Like production: flags set, so the one-time data fixes must not run again.
    const db = newDatabase();
    await db.batch(
      [
        "CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
        `CREATE TABLE time_entries (
          id TEXT PRIMARY KEY, projectId TEXT NOT NULL DEFAULT '',
          description TEXT NOT NULL DEFAULT '', activityType TEXT NOT NULL DEFAULT '',
          startedAt TEXT NOT NULL DEFAULT '', endedAt TEXT NOT NULL DEFAULT '',
          durationSeconds INTEGER NOT NULL DEFAULT 0, source TEXT NOT NULL DEFAULT 'manual',
          createdAt TEXT NOT NULL DEFAULT '', updatedAt TEXT NOT NULL DEFAULT '')`,
        "INSERT INTO settings (key, value) VALUES ('backupTypeLegacyMigrated', '1')",
        "INSERT INTO settings (key, value) VALUES ('activityToDescriptionMigrated', '1')",
        // A description the user cleared on purpose after the old migration.
        "INSERT INTO time_entries (id, activityType, description) VALUES ('t1', 'Editing', '')",
      ],
      "write"
    );

    await runMigrations(db);

    const { rows } = await db.execute("SELECT description FROM time_entries");
    expect(rows[0].description).toBe("");
    const settings = await settingsMap(db);
    expect(settings.backupTypeLegacyMigrated).toBe("1"); // still there for the old code
  });
});
