import { getTursoClient } from "./turso";

function rowToProject(row) {
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    invoiceNumber: row.invoiceNumber ?? "",
    title: row.title ?? "",
    client: row.client ?? "",
    type: row.type ?? "",
    date: row.date ?? "",
    location: row.location ?? "",
    archiveDrive: row.archiveDrive ?? "",
    backupDrive: row.backupDrive ?? "",
    cleaned: Boolean(row.cleaned),
    backupCompleted: Boolean(row.backupCompleted),
    notes: row.notes ?? "",
    tags: (() => {
      try {
        return JSON.parse(row.tags || "[]");
      } catch {
        return [];
      }
    })(),
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

export async function readProjects() {
  const db = getTursoClient();
  const { rows } = await db.execute(
    "SELECT * FROM projects ORDER BY date DESC, createdAt DESC"
  );
  return rows.map(rowToProject);
}

export async function createProject(project) {
  const db = getTursoClient();
  await db.execute({
    sql: `INSERT INTO projects
      (id, projectId, invoiceNumber, title, client, type, date, location,
       archiveDrive, backupDrive, cleaned, backupCompleted, notes, tags, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    args: [
      project.id,
      project.projectId ?? "",
      project.invoiceNumber ?? "",
      project.title ?? "",
      project.client ?? "",
      project.type ?? "",
      project.date ?? "",
      project.location ?? "",
      project.archiveDrive ?? "",
      project.backupDrive ?? "",
      project.cleaned ? 1 : 0,
      project.backupCompleted ? 1 : 0,
      project.notes ?? "",
      JSON.stringify(project.tags ?? []),
      project.createdAt ?? "",
      project.updatedAt ?? "",
    ],
  });
}

export async function updateProject(id, fields) {
  const db = getTursoClient();
  await db.execute({
    sql: `UPDATE projects SET
      projectId=?, invoiceNumber=?, title=?, client=?, type=?, date=?, location=?,
      archiveDrive=?, backupDrive=?, cleaned=?, backupCompleted=?, notes=?, tags=?, updatedAt=?
      WHERE id=?`,
    args: [
      fields.projectId ?? "",
      fields.invoiceNumber ?? "",
      fields.title ?? "",
      fields.client ?? "",
      fields.type ?? "",
      fields.date ?? "",
      fields.location ?? "",
      fields.archiveDrive ?? "",
      fields.backupDrive ?? "",
      fields.cleaned ? 1 : 0,
      fields.backupCompleted ? 1 : 0,
      fields.notes ?? "",
      JSON.stringify(fields.tags ?? []),
      fields.updatedAt ?? new Date().toISOString(),
      id,
    ],
  });
}

export async function deleteProject(id) {
  const db = getTursoClient();
  await db.execute({ sql: "DELETE FROM projects WHERE id=?", args: [id] });
}

export async function readClients() {
  const db = getTursoClient();
  const { rows } = await db.execute(
    "SELECT name FROM clients ORDER BY name"
  );
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
  await db.execute({
    sql: "DELETE FROM clients WHERE name=?",
    args: [name],
  });
  return readClients();
}

const DEFAULT_SETTINGS = {
  projectTypes: [],
  archiveDrives: [],
  backupDrives: [],
};

export async function readSettings() {
  const db = getTursoClient();
  const { rows } = await db.execute("SELECT key, value FROM settings");
  const settings = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      settings[row.key] = JSON.parse(row.value);
    } catch {
      // ignore malformed rows
    }
  }
  return settings;
}

export async function writeSettings(settings) {
  const db = getTursoClient();
  const entries = [
    ["projectTypes", settings.projectTypes],
    ["archiveDrives", settings.archiveDrives],
    ["backupDrives", settings.backupDrives],
  ];
  await db.batch(
    entries.map(([key, value]) => ({
      sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      args: [key, JSON.stringify(value)],
    })),
    "write"
  );
}

export function generateId() {
  return `arc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
