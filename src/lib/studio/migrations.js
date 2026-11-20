import { ARCHIVE_DRIVES, PROJECT_TYPES } from "@/data/archive/config";

/**
 * Versioned schema migrations for the studio database.
 *
 * `schema_migrations` records which versions ran. On start, a database that
 * is up to date costs one round trip; pending migrations run in order, each
 * recorded in the same batch as its writes.
 *
 * Rules for new migrations:
 * - append to MIGRATIONS with the next version, never edit a published one;
 * - keep them idempotent (IF NOT EXISTS, OR IGNORE, guarded updates): two
 *   serverless instances may start at the same time and both run them;
 * - keep them compatible with the code currently deployed: preview
 *   deployments share the production database and run migrations as soon as
 *   they are visited, before the change is merged.
 */

const PROJECT_COLUMNS_ADDED_LATER = [
  ["size", "TEXT NOT NULL DEFAULT ''"],
  ["backupType", "TEXT NOT NULL DEFAULT ''"],
  ["contact", "TEXT NOT NULL DEFAULT ''"],
  ["paid", "INTEGER NOT NULL DEFAULT 1"],
];

function recordVersion(migration) {
  return {
    sql: "INSERT OR IGNORE INTO schema_migrations (version, name, appliedAt) VALUES (?, ?, ?)",
    args: [migration.version, migration.name, new Date().toISOString()],
  };
}

async function settingKeys(db, keys) {
  const { rows } = await db.execute({
    sql: `SELECT key, value FROM settings WHERE key IN (${keys.map(() => "?").join(", ")})`,
    args: keys,
  });
  return new Map(rows.map((row) => [row.key, row.value]));
}

/**
 * v1: the schema and data fixes that `ensureInit` used to apply on every
 * start, so existing databases (already in this state) only get recorded,
 * and new ones are created complete.
 */
async function baseline(db, migration) {
  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS projects (
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
        backupType TEXT NOT NULL DEFAULT '',
        contact TEXT NOT NULL DEFAULT '',
        paid INTEGER NOT NULL DEFAULT 1,
        notes TEXT NOT NULL DEFAULT '',
        tags TEXT NOT NULL DEFAULT '[]',
        createdAt TEXT NOT NULL DEFAULT '',
        updatedAt TEXT NOT NULL DEFAULT '',
        size TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS clients (name TEXT PRIMARY KEY)`,
      `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS time_entries (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        activityType TEXT NOT NULL DEFAULT '',
        startedAt TEXT NOT NULL DEFAULT '',
        endedAt TEXT NOT NULL DEFAULT '',
        durationSeconds INTEGER NOT NULL DEFAULT 0,
        source TEXT NOT NULL DEFAULT 'manual',
        createdAt TEXT NOT NULL DEFAULT '',
        updatedAt TEXT NOT NULL DEFAULT ''
      )`,
      `CREATE TABLE IF NOT EXISTS time_timer (
        id TEXT PRIMARY KEY,
        projectId TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        activityType TEXT NOT NULL DEFAULT '',
        startedAt TEXT NOT NULL DEFAULT '',
        pausedAt TEXT,
        pauseSeconds INTEGER NOT NULL DEFAULT 0,
        pomodoroEnabled INTEGER NOT NULL DEFAULT 0,
        pomodoroMinutes INTEGER NOT NULL DEFAULT 25
      )`,
      `CREATE TABLE IF NOT EXISTS login_attempts (
        key TEXT PRIMARY KEY,
        failures INTEGER NOT NULL DEFAULT 0,
        windowStart TEXT NOT NULL DEFAULT ''
      )`,
    ],
    "write"
  );

  // Columns added to `projects` over time, for databases created before them.
  const { rows: columns } = await db.execute("PRAGMA table_info(projects)");
  const existing = new Set(columns.map((c) => c.name));
  for (const [name, definition] of PROJECT_COLUMNS_ADDED_LATER) {
    if (existing.has(name)) continue;
    try {
      await db.execute(`ALTER TABLE projects ADD COLUMN ${name} ${definition}`);
    } catch (err) {
      // Another instance added it meanwhile; anything else is a real error.
      if (!/duplicate column/i.test(String(err?.message))) throw err;
    }
  }

  // One-time data fixes, guarded by the flags the previous code wrote (kept,
  // because code deployed before this migration still reads them).
  const flags = await settingKeys(db, [
    "backupTypeLegacyMigrated",
    "activityToDescriptionMigrated",
  ]);
  const writes = [];
  if (!flags.has("backupTypeLegacyMigrated")) {
    writes.push(
      "UPDATE projects SET backupType = 'full' WHERE backupCompleted = 1 AND backupType = ''",
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('backupTypeLegacyMigrated', '1')"
    );
  }
  if (!flags.has("activityToDescriptionMigrated")) {
    writes.push(
      "UPDATE time_entries SET description = activityType WHERE TRIM(description) = '' AND TRIM(activityType) != ''",
      "UPDATE time_timer SET description = activityType WHERE TRIM(description) = '' AND TRIM(activityType) != ''",
      "INSERT OR REPLACE INTO settings (key, value) VALUES ('activityToDescriptionMigrated', '1')"
    );
  }
  await db.batch(
    [
      ...writes,
      // Default lists for a new database; existing lists are left alone.
      {
        sql: "INSERT OR IGNORE INTO settings (key, value) VALUES ('projectTypes', ?)",
        args: [JSON.stringify(PROJECT_TYPES)],
      },
      {
        sql: "INSERT OR IGNORE INTO settings (key, value) VALUES ('archiveDrives', ?)",
        args: [JSON.stringify(ARCHIVE_DRIVES)],
      },
      recordVersion(migration),
    ],
    "write"
  );
}

/** v2: indexes for the time queries (by date range, by project). */
async function timeEntryIndexes(db, migration) {
  await db.batch(
    [
      "CREATE INDEX IF NOT EXISTS idx_time_entries_startedAt ON time_entries (startedAt)",
      "CREATE INDEX IF NOT EXISTS idx_time_entries_projectId ON time_entries (projectId)",
      recordVersion(migration),
    ],
    "write"
  );
}

function parseList(value) {
  try {
    const parsed = JSON.parse(value ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string" && v) : [];
  } catch {
    return [];
  }
}

/**
 * v3: the old separate backup-drive list is merged into the shared drive
 * list once, here, instead of on every settings read.
 */
async function mergeLegacyBackupDrives(db, migration) {
  const settings = await settingKeys(db, ["archiveDrives", "backupDrives"]);
  const writes = [];
  if (settings.has("backupDrives")) {
    const drives = parseList(settings.get("archiveDrives"));
    const extras = parseList(settings.get("backupDrives")).filter((d) => !drives.includes(d));
    writes.push(
      {
        sql: "INSERT OR REPLACE INTO settings (key, value) VALUES ('archiveDrives', ?)",
        args: [JSON.stringify([...drives, ...extras])],
      },
      "DELETE FROM settings WHERE key = 'backupDrives'"
    );
  }
  await db.batch([...writes, recordVersion(migration)], "write");
}

export const MIGRATIONS = [
  { version: 1, name: "baseline", up: baseline },
  { version: 2, name: "time-entry-indexes", up: timeEntryIndexes },
  { version: 3, name: "merge-legacy-backup-drives", up: mergeLegacyBackupDrives },
];

/** Applies pending migrations. Returns the versions it ran. */
export async function runMigrations(db) {
  const [, current] = await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        appliedAt TEXT NOT NULL
      )`,
      "SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations",
    ],
    "write"
  );
  const version = Number(current.rows[0].version);

  const ran = [];
  for (const migration of MIGRATIONS) {
    if (migration.version <= version) continue;
    await migration.up(db, migration);
    ran.push(migration.version);
  }
  return ran;
}
