import { createClient } from "@libsql/client";
import { ARCHIVE_DRIVES, BACKUP_DRIVES, PROJECT_TYPES } from "@/data/archive/config";

let client = null;

export function getTursoClient() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!url) {
      throw new Error(
        "TURSO_DATABASE_URL is not set. Add it to .env.local and Vercel environment variables."
      );
    }

    client = createClient({ url, authToken });
  }
  return client;
}

let initialized = false;

export async function ensureInit() {
  if (initialized) return;
  const db = getTursoClient();

  await db.execute(`CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    projectId TEXT NOT NULL DEFAULT '',
    invoiceNumber TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL DEFAULT '',
    client TEXT NOT NULL DEFAULT '',
    type TEXT NOT NULL DEFAULT '',
    date TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    archiveDrive TEXT NOT NULL DEFAULT '',
    backupDrive TEXT NOT NULL DEFAULT '',
    cleaned INTEGER NOT NULL DEFAULT 0,
    backupCompleted INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT '',
    updatedAt TEXT NOT NULL DEFAULT ''
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS clients (
    name TEXT PRIMARY KEY
  )`);

  await db.execute(`CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`);

  await db
    .execute("ALTER TABLE projects ADD COLUMN size TEXT NOT NULL DEFAULT ''")
    .catch(() => {});

  const { rows } = await db.execute("SELECT COUNT(*) as count FROM settings");
  const count = Number(rows[0]?.count ?? 0);

  if (count === 0) {
    await db.batch(
      [
        {
          sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
          args: ["projectTypes", JSON.stringify(PROJECT_TYPES)],
        },
        {
          sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
          args: ["archiveDrives", JSON.stringify(ARCHIVE_DRIVES)],
        },
        {
          sql: "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
          args: ["backupDrives", JSON.stringify(BACKUP_DRIVES)],
        },
      ],
      "write"
    );
  }

  initialized = true;
}
