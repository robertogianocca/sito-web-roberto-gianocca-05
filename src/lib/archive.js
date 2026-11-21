import { getTursoClient } from "./turso";
import { formatProjectId } from "./archiveFormat";
import { normalizeBackupType, isBackupDone } from "./archiveBackup";

export { normalizeBackupType, isBackupDone, backupTypeLabel } from "./archiveBackup";

// ── Rows ↔ projects ──────────────────────────────────────────────────────

function parseArrayField(val) {
  if (!val) return [];
  try {
    const parsed = JSON.parse(val);
    return Array.isArray(parsed) ? parsed : [String(parsed)];
  } catch {
    return [val];
  }
}

function rowToProject(row) {
  return {
    id: row.id,
    projectId: formatProjectId(row.projectId),
    invoiceNumber: row.invoiceNumber ?? "",
    title: row.title ?? "",
    client: parseArrayField(row.client),
    type: parseArrayField(row.type),
    date: row.date ?? "",
    location: row.location ?? "",
    archiveDrive: parseArrayField(row.archiveDrive),
    backupDrive: parseArrayField(row.backupDrive),
    size: row.size ?? "",
    cleaned: Boolean(row.cleaned),
    backupType: normalizeBackupType(row.backupType),
    contact: row.contact ?? "",
    paid: row.paid !== 0 && row.paid !== false,
    notes: row.notes ?? "",
    tags: parseArrayField(row.tags),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

const LIST_FIELDS = new Set(["client", "type", "archiveDrive", "backupDrive", "tags"]);
const TEXT_FIELDS = new Set([
  "invoiceNumber",
  "title",
  "date",
  "location",
  "size",
  "contact",
  "notes",
]);

/**
 * Database columns and values for the given project fields. Only fields that
 * are present are returned, so it serves both inserts and partial updates.
 */
function projectColumns(fields) {
  const columns = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (key === "projectId") columns.projectId = formatProjectId(value);
    else if (LIST_FIELDS.has(key)) columns[key] = JSON.stringify(Array.isArray(value) ? value : []);
    else if (TEXT_FIELDS.has(key)) columns[key] = value ?? "";
    else if (key === "cleaned") columns.cleaned = value ? 1 : 0;
    else if (key === "paid") columns.paid = value !== false ? 1 : 0;
    else if (key === "backupType") {
      const backupType = normalizeBackupType(value);
      columns.backupType = backupType;
      columns.backupCompleted = isBackupDone(backupType) ? 1 : 0;
    } else if (key === "createdAt" || key === "updatedAt") columns[key] = value ?? "";
  }
  return columns;
}

/** Defaults for a new project; `fields` overrides them. */
function newProjectFields(fields) {
  return {
    projectId: "",
    invoiceNumber: "",
    title: "",
    client: [],
    type: [],
    date: "",
    location: "",
    archiveDrive: [],
    backupDrive: [],
    size: "",
    cleaned: false,
    backupType: "",
    contact: "",
    paid: true,
    notes: "",
    tags: [],
    ...fields,
  };
}

function insertProjectStatement(project) {
  const columns = { id: project.id, ...projectColumns(newProjectFields(project)) };
  const names = Object.keys(columns);
  return {
    sql: `INSERT INTO projects (${names.join(", ")}) VALUES (${names.map(() => "?").join(", ")})`,
    args: Object.values(columns),
  };
}

// ── Projects ─────────────────────────────────────────────────────────────

export async function readProjects() {
  const db = getTursoClient();
  const { rows } = await db.execute(
    "SELECT * FROM projects ORDER BY date DESC, createdAt DESC"
  );
  return rows.map(rowToProject);
}

/** One project by id, or null. */
export async function readProject(id) {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: "SELECT * FROM projects WHERE id = ?",
    args: [id],
  });
  return rows[0] ? rowToProject(rows[0]) : null;
}

/** Inserts a project as given (missing fields get defaults). */
export async function createProject(project) {
  const db = getTursoClient();
  await db.execute(insertProjectStatement(project));
}

/**
 * Statements that add the project's clients, types and drives that are not
 * in the lists yet, so a value created inline in the project form is saved
 * together with the project.
 */
async function vocabularyStatements(fields) {
  const statements = [];
  for (const name of fields.client ?? []) {
    statements.push({ sql: "INSERT OR IGNORE INTO clients (name) VALUES (?)", args: [name] });
  }

  const wantedTypes = fields.type ?? [];
  const wantedDrives = [...(fields.archiveDrive ?? []), ...(fields.backupDrive ?? [])];
  if (wantedTypes.length === 0 && wantedDrives.length === 0) return statements;

  const settings = await readSettings();
  const newTypes = [...new Set(wantedTypes)].filter((t) => !settings.projectTypes.includes(t));
  const newDrives = [...new Set(wantedDrives)].filter((d) => !settings.archiveDrives.includes(d));
  if (newTypes.length > 0) {
    statements.push(settingStatement("projectTypes", [...settings.projectTypes, ...newTypes]));
  }
  if (newDrives.length > 0) {
    statements.push(settingStatement("archiveDrives", [...settings.archiveDrives, ...newDrives]));
  }
  return statements;
}

/** Creates a project and registers its new clients/types/drives, atomically. */
export async function createProjectWithVocabulary(project) {
  const db = getTursoClient();
  await db.batch(
    [...(await vocabularyStatements(project)), insertProjectStatement(project)],
    "write"
  );
  return readProject(project.id);
}

/**
 * Updates only the given fields of a project (and registers new
 * clients/types/drives), atomically. Returns the project, or null if it does
 * not exist.
 */
export async function patchProject(id, fields) {
  const db = getTursoClient();
  const columns = {
    ...projectColumns(fields),
    updatedAt: new Date().toISOString(),
  };
  const names = Object.keys(columns);
  // Nothing to register for a project that does not exist.
  const { rows } = await db.execute({ sql: "SELECT 1 FROM projects WHERE id = ?", args: [id] });
  if (rows.length === 0) return null;
  const results = await db.batch(
    [
      ...(await vocabularyStatements(fields)),
      {
        sql: `UPDATE projects SET ${names.map((n) => `${n} = ?`).join(", ")} WHERE id = ?`,
        args: [...Object.values(columns), id],
      },
    ],
    "write"
  );
  // Deleted in the meantime.
  if (results.at(-1).rowsAffected === 0) return null;
  return readProject(id);
}

export async function deleteProject(id) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM projects WHERE id=?", args: [id] });
}

// ── Clients ──────────────────────────────────────────────────────────────

export async function readClients() {
  const db = getTursoClient();
  const { rows } = await db.execute("SELECT name FROM clients ORDER BY name");
  return rows.map((r) => r.name);
}

export async function addClient(name) {
  const db = getTursoClient();
  await db.execute({
    sql: "INSERT OR IGNORE INTO clients (name) VALUES (?)",
    args: [name],
  });
  return readClients();
}

export async function deleteClient(name) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM clients WHERE name=?", args: [name] });
  return readClients();
}

function renameClientStatements(from, to) {
  return [
    { sql: "DELETE FROM clients WHERE name = ?", args: [from] },
    { sql: "INSERT OR IGNORE INTO clients (name) VALUES (?)", args: [to] },
    cascadeRenameStatement("client", from, to),
  ].filter(Boolean);
}

/** Renames a client in the list and in every project, atomically. */
export async function renameClient(from, to) {
  if (from !== to) {
    const db = getTursoClient();
    await db.batch(renameClientStatements(from, to), "write");
  }
  return readClients();
}

// ── Settings ─────────────────────────────────────────────────────────────

const SETTING_KEYS = ["projectTypes", "archiveDrives", "driveCapacities"];

function normalizeStringList(value) {
  return Array.isArray(value) ? value.filter((v) => typeof v === "string" && v) : [];
}

function normalizeDriveCapacities(value, driveNames) {
  const raw =
    value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const names = new Set(driveNames);
  const out = {};
  for (const [key, capacity] of Object.entries(raw)) {
    if (!names.has(key)) continue;
    if (typeof capacity !== "string") continue;
    const trimmed = capacity.trim();
    if (trimmed) out[key] = trimmed;
  }
  return out;
}

function settingStatement(key, value) {
  return {
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    args: [key, JSON.stringify(value)],
  };
}

/**
 * The editable lists: `{ projectTypes, archiveDrives, driveCapacities }`.
 * Reads only those keys, so internal rows of the settings table (migration
 * flags) are never exposed.
 */
export async function readSettings() {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: `SELECT key, value FROM settings WHERE key IN (${SETTING_KEYS.map(() => "?").join(", ")})`,
    args: SETTING_KEYS,
  });
  const raw = {};
  for (const row of rows) {
    try {
      raw[row.key] = JSON.parse(row.value);
    } catch {
      // ignore malformed rows
    }
  }
  const archiveDrives = normalizeStringList(raw.archiveDrives);
  return {
    projectTypes: normalizeStringList(raw.projectTypes),
    archiveDrives,
    driveCapacities: normalizeDriveCapacities(raw.driveCapacities, archiveDrives),
  };
}

function writeSettingsStatements(settings) {
  const archiveDrives = normalizeStringList(settings.archiveDrives);
  return [
    settingStatement("projectTypes", normalizeStringList(settings.projectTypes)),
    settingStatement("archiveDrives", archiveDrives),
    settingStatement(
      "driveCapacities",
      normalizeDriveCapacities(settings.driveCapacities, archiveDrives)
    ),
  ];
}

export async function writeSettings(settings) {
  const db = getTursoClient();
  await db.batch(writeSettingsStatements(settings), "write");
}

function remapDriveCapacities(capacities, renames) {
  const next = { ...(capacities ?? {}) };
  for (const { from, to } of renames) {
    if (from !== to && Object.prototype.hasOwnProperty.call(next, from)) {
      next[to] = next[from];
      delete next[from];
    }
  }
  return next;
}

/**
 * Saves the settings drawer in one transaction: the lists, the renames
 * cascaded to every project (types, drives on both drive fields, clients),
 * the values to remove from projects too (`removals`), and, when `clients` is
 * given, the final client list (clients not in it are removed, new ones
 * added).
 */
export async function saveSettings({
  projectTypes,
  archiveDrives,
  driveCapacities = {},
  renames = {},
  removals = {},
  clients,
}) {
  const typeRenames = renames.projectTypes ?? [];
  const driveRenames = renames.archiveDrives ?? [];
  const clientRenames = renames.clients ?? [];

  const statements = [
    ...writeSettingsStatements({
      projectTypes,
      archiveDrives,
      driveCapacities: remapDriveCapacities(driveCapacities, driveRenames),
    }),
    ...typeRenames.map(({ from, to }) => cascadeRenameStatement("type", from, to)),
    ...driveRenames.flatMap(({ from, to }) => [
      cascadeRenameStatement("archiveDrive", from, to),
      cascadeRenameStatement("backupDrive", from, to),
    ]),
  ];

  statements.push(...clientRenames.flatMap(({ from, to }) => renameClientStatements(from, to)));

  // Values removed from a list "and from its projects". Skipped when the name
  // is back in the final list (removed, then added again before saving).
  const removed = (names, finalList) =>
    (names ?? []).filter((name) => !(finalList ?? []).includes(name));
  statements.push(
    ...removed(removals.projectTypes, projectTypes).map((name) => removeValueStatement("type", name)),
    ...removed(removals.archiveDrives, archiveDrives).flatMap((name) => [
      removeValueStatement("archiveDrive", name),
      removeValueStatement("backupDrive", name),
    ]),
    ...removed(removals.clients, clients).map((name) => removeValueStatement("client", name))
  );
  if (clients) {
    const finalClients = [...new Set(clients)];
    statements.push(
      finalClients.length > 0
        ? {
            sql: `DELETE FROM clients WHERE name NOT IN (${finalClients.map(() => "?").join(", ")})`,
            args: finalClients,
          }
        : "DELETE FROM clients",
      ...finalClients.map((name) => ({
        sql: "INSERT OR IGNORE INTO clients (name) VALUES (?)",
        args: [name],
      }))
    );
  }

  const db = getTursoClient();
  await db.batch(statements.filter(Boolean), "write");
  return readSettings();
}

// ── Renames ──────────────────────────────────────────────────────────────

const RENAMEABLE_FIELDS = new Set([
  "type",
  "archiveDrive",
  "backupDrive",
  "client",
]);

/**
 * WHERE clause: the list column holds the value ?1. Uses SQLite's JSON
 * functions, so whole values match whatever characters they contain (quotes
 * included). A legacy row holding a plain string instead of a JSON list
 * matches when the string equals ?1. CASE (not AND) guarantees json_each never
 * runs on text that is not JSON.
 */
function listContains(column) {
  return `CASE WHEN json_valid(${column})
    THEN json_type(${column}) = 'array' AND EXISTS (SELECT 1 FROM json_each(projects.${column}) WHERE value = ?1)
    ELSE ${column} = ?1 END`;
}

/**
 * Statement renaming value `from` to `to` in a list column of every project,
 * or null when there is nothing to do. A project that already had `to` keeps
 * it once. The column name comes from a fixed list.
 */
function cascadeRenameStatement(dbField, from, to) {
  if (!RENAMEABLE_FIELDS.has(dbField) || !from || !to || from === to) return null;
  return {
    sql: `UPDATE projects SET ${dbField} = CASE WHEN json_valid(${dbField})
        THEN (SELECT json_group_array(DISTINCT CASE WHEN value = ?1 THEN ?2 ELSE value END)
              FROM json_each(projects.${dbField}))
        ELSE json_array(?2) END
      WHERE ${listContains(dbField)}`,
    args: [from, to],
  };
}

/** Statement removing value `name` from a list column of every project. */
function removeValueStatement(dbField, name) {
  if (!RENAMEABLE_FIELDS.has(dbField) || !name) return null;
  return {
    sql: `UPDATE projects SET ${dbField} = CASE WHEN json_valid(${dbField})
        THEN (SELECT json_group_array(value) FROM json_each(projects.${dbField}) WHERE value != ?1)
        ELSE '[]' END
      WHERE ${listContains(dbField)}`,
    args: [name],
  };
}

export async function cascadeFieldRename(dbField, from, to) {
  const statement = cascadeRenameStatement(dbField, from, to);
  if (!statement) return;
  const db = getTursoClient();
  await db.execute(statement);
}

export function generateId() {
  return `arc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
