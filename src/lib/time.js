import { getTursoClient } from "./turso";
import {
  addZonedDays,
  startOfZonedWeek,
  toZonedDateKey,
  zonedDayRange,
} from "./timeZone";

import { InputError, StudioError } from "./studio/errors";

export { formatDuration, formatDurationHours } from "./timeFormat";

const TIMER_ROW_ID = "current";
const DEFAULT_POMODORO_MINUTES = 25;

/**
 * The timer is not in the state the action expects (already running, already
 * stopped, …). Expected during normal use, e.g. two tabs; the API answers 409.
 */
export class TimerConflictError extends StudioError {
  constructor(message) {
    super(message, 409);
    this.name = "TimerConflictError";
  }
}

export function generateTimeId() {
  return `time_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function rowToEntry(row) {
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    description: row.description ?? "",
    startedAt: row.startedAt ?? "",
    endedAt: row.endedAt ?? "",
    durationSeconds: Number(row.durationSeconds ?? 0),
    source: row.source ?? "manual",
    createdAt: row.createdAt ?? "",
    updatedAt: row.updatedAt ?? "",
  };
}

function rowToTimer(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    description: row.description ?? "",
    startedAt: row.startedAt ?? "",
    pausedAt: row.pausedAt || null,
    pauseSeconds: Number(row.pauseSeconds ?? 0),
    pomodoroEnabled: Boolean(row.pomodoroEnabled),
    pomodoroMinutes: Number(row.pomodoroMinutes ?? DEFAULT_POMODORO_MINUTES),
  };
}

/** Running (non-paused) elapsed seconds at `now`. */
export function computeRunningSeconds(timer, now = new Date()) {
  if (!timer?.startedAt) return 0;
  const startMs = new Date(timer.startedAt).getTime();
  if (Number.isNaN(startMs)) return 0;

  const pauseSeconds = Number(timer.pauseSeconds ?? 0);
  if (timer.pausedAt) {
    const pausedMs = new Date(timer.pausedAt).getTime();
    if (Number.isNaN(pausedMs)) return 0;
    return Math.max(0, Math.floor((pausedMs - startMs) / 1000) - pauseSeconds);
  }

  return Math.max(0, Math.floor((now.getTime() - startMs) / 1000) - pauseSeconds);
}

export function enrichTimer(timer, now = new Date()) {
  if (!timer) return null;
  const elapsedSeconds = computeRunningSeconds(timer, now);
  const status = timer.pausedAt ? "paused" : "running";
  let pomodoroEndsAt = null;
  if (timer.pomodoroEnabled && !timer.pausedAt) {
    const remaining =
      timer.pomodoroMinutes * 60 - elapsedSeconds;
    if (remaining > 0) {
      pomodoroEndsAt = new Date(now.getTime() + remaining * 1000).toISOString();
    }
  }
  return {
    ...timer,
    status,
    elapsedSeconds,
    pomodoroEndsAt,
  };
}

export async function getTimer() {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: "SELECT * FROM time_timer WHERE id = ?",
    args: [TIMER_ROW_ID],
  });
  return enrichTimer(rowToTimer(rows[0] ?? null));
}

/** Creates the timer row; fails if one already exists (never overwrites). */
async function insertTimer(timer) {
  const db = getTursoClient();
  const result = await db.execute({
    sql: `INSERT OR IGNORE INTO time_timer
      (id, projectId, description, startedAt, pausedAt, pauseSeconds, pomodoroEnabled, pomodoroMinutes)
      VALUES (?,?,?,?,?,?,?,?)`,
    args: [
      TIMER_ROW_ID,
      timer.projectId ?? "",
      timer.description ?? "",
      timer.startedAt,
      timer.pausedAt ?? null,
      Number(timer.pauseSeconds ?? 0),
      timer.pomodoroEnabled ? 1 : 0,
      Number(timer.pomodoroMinutes ?? DEFAULT_POMODORO_MINUTES),
    ],
  });
  if (result.rowsAffected === 0) {
    throw new TimerConflictError(
      "A timer is already running. Stop or pause it first."
    );
  }
  return getTimer();
}

/**
 * Updates the running timer, but only if it is still the one that was read
 * (same `startedAt`). A plain upsert could bring back a timer that another
 * request stopped in the meantime, which would later create a second entry.
 */
async function updateTimer(timer) {
  const db = getTursoClient();
  const result = await db.execute({
    sql: `UPDATE time_timer SET
      projectId = ?, description = ?, pausedAt = ?, pauseSeconds = ?,
      pomodoroEnabled = ?, pomodoroMinutes = ?
      WHERE id = ? AND startedAt = ?`,
    args: [
      timer.projectId ?? "",
      timer.description ?? "",
      timer.pausedAt ?? null,
      Number(timer.pauseSeconds ?? 0),
      timer.pomodoroEnabled ? 1 : 0,
      Number(timer.pomodoroMinutes ?? DEFAULT_POMODORO_MINUTES),
      TIMER_ROW_ID,
      timer.startedAt,
    ],
  });
  if (result.rowsAffected === 0) {
    throw new TimerConflictError("No timer is running.");
  }
  return getTimer();
}

export async function startTimer({
  projectId = "",
  description = "",
  pomodoroEnabled = false,
  pomodoroMinutes = DEFAULT_POMODORO_MINUTES,
} = {}) {
  const now = new Date().toISOString();
  return insertTimer({
    projectId,
    description,
    startedAt: now,
    pausedAt: null,
    pauseSeconds: 0,
    pomodoroEnabled: Boolean(pomodoroEnabled),
    pomodoroMinutes: Number(pomodoroMinutes) || DEFAULT_POMODORO_MINUTES,
  });
}

export async function pauseTimer() {
  const timer = await getTimer();
  if (!timer) throw new TimerConflictError("No timer is running.");
  if (timer.pausedAt) throw new TimerConflictError("Timer is already paused.");
  return updateTimer({
    ...timer,
    pausedAt: new Date().toISOString(),
  });
}

export async function resumeTimer() {
  const timer = await getTimer();
  if (!timer) throw new TimerConflictError("No timer is running.");
  if (!timer.pausedAt) throw new TimerConflictError("Timer is not paused.");

  const pausedMs = new Date(timer.pausedAt).getTime();
  const extraPause = Math.max(0, Math.floor((Date.now() - pausedMs) / 1000));

  return updateTimer({
    ...timer,
    pausedAt: null,
    pauseSeconds: Number(timer.pauseSeconds ?? 0) + extraPause,
  });
}

/**
 * Stops the timer and records its entry, atomically: removing the timer row
 * and inserting the entry run in one transaction, and the entry is inserted
 * only if this request is the one that removed the row. Two concurrent stops
 * (double click, two tabs, Pomodoro check) therefore record one entry; the
 * other gets a TimerConflictError.
 *
 * `description` (optional) overrides the stored one, so text typed in the
 * timer bar but not yet saved is not lost.
 */
export async function stopTimer({ source, description } = {}) {
  const timer = await getTimer();
  if (!timer) throw new TimerConflictError("No timer is running.");

  const now = new Date();
  const endedAt = now.toISOString();
  let durationSeconds = computeRunningSeconds(timer, now);

  // If still paused, duration is already frozen at pause time
  if (timer.pausedAt) {
    durationSeconds = computeRunningSeconds(timer, new Date(timer.pausedAt));
  }

  let entrySource = source ?? "timer";
  if (
    timer.pomodoroEnabled &&
    durationSeconds >= timer.pomodoroMinutes * 60
  ) {
    entrySource = "pomodoro";
    durationSeconds = timer.pomodoroMinutes * 60;
  }

  const entry = buildTimeEntry({
    projectId: timer.projectId,
    description:
      typeof description === "string" ? description : timer.description,
    startedAt: timer.startedAt,
    endedAt,
    durationSeconds,
    source: entrySource,
  });

  const db = getTursoClient();
  const [, inserted] = await db.batch(
    [
      {
        sql: "DELETE FROM time_timer WHERE id = ? AND startedAt = ?",
        args: [TIMER_ROW_ID, timer.startedAt],
      },
      {
        // changes() = rows removed by the DELETE above, in this transaction.
        sql: `INSERT INTO time_entries (${ENTRY_COLUMNS.join(", ")})
          SELECT ${ENTRY_COLUMNS.map(() => "?").join(", ")}
          WHERE changes() = 1`,
        args: entryArgs(entry),
      },
    ],
    "write"
  );

  if (inserted.rowsAffected === 0) {
    throw new TimerConflictError("No timer is running.");
  }
  return { entry, timer: null };
}

/**
 * Auto-stop when pomodoro duration is reached. Safe to call repeatedly or
 * concurrently: only one call records the entry.
 */
export async function checkAndCompletePomodoro({ description } = {}) {
  const timer = await getTimer();
  if (!timer || !timer.pomodoroEnabled || timer.pausedAt) {
    return { completed: false, timer, entry: null };
  }
  const elapsed = computeRunningSeconds(timer);
  if (elapsed < timer.pomodoroMinutes * 60) {
    return { completed: false, timer, entry: null };
  }
  try {
    const result = await stopTimer({ source: "pomodoro", description });
    return { completed: true, timer: null, entry: result.entry };
  } catch (err) {
    // Another request stopped it first and reported the completion.
    if (err instanceof TimerConflictError) {
      return { completed: false, timer: await getTimer(), entry: null };
    }
    throw err;
  }
}

export async function updateRunningTimer(patch = {}) {
  const timer = await getTimer();
  if (!timer) throw new TimerConflictError("No timer is running.");
  return updateTimer({
    ...timer,
    projectId:
      patch.projectId !== undefined ? patch.projectId : timer.projectId,
    description:
      patch.description !== undefined ? patch.description : timer.description,
    pomodoroEnabled:
      patch.pomodoroEnabled !== undefined
        ? Boolean(patch.pomodoroEnabled)
        : timer.pomodoroEnabled,
    pomodoroMinutes:
      patch.pomodoroMinutes !== undefined
        ? Number(patch.pomodoroMinutes) || DEFAULT_POMODORO_MINUTES
        : timer.pomodoroMinutes,
  });
}

const ENTRY_COLUMNS = [
  "id",
  "projectId",
  "description",
  "startedAt",
  "endedAt",
  "durationSeconds",
  "source",
  "createdAt",
  "updatedAt",
];

function entryArgs(entry) {
  return ENTRY_COLUMNS.map((column) => entry[column]);
}

/** Normalizes entry data (defaults, duration from start/end if missing). */
function buildTimeEntry(data) {
  const now = new Date().toISOString();
  const startedAt = data.startedAt || now;
  const endedAt = data.endedAt || now;
  let durationSeconds = Number(data.durationSeconds);
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    const startMs = new Date(startedAt).getTime();
    const endMs = new Date(endedAt).getTime();
    durationSeconds =
      Number.isNaN(startMs) || Number.isNaN(endMs)
        ? 0
        : Math.max(0, Math.floor((endMs - startMs) / 1000));
  }

  return {
    id: data.id || generateTimeId(),
    projectId: data.projectId ?? "",
    description: data.description ?? "",
    startedAt,
    endedAt,
    durationSeconds,
    source: data.source ?? "manual",
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

export async function createTimeEntry(data) {
  const db = getTursoClient();
  const entry = buildTimeEntry(data);

  await db.execute({
    sql: `INSERT INTO time_entries (${ENTRY_COLUMNS.join(", ")})
      VALUES (${ENTRY_COLUMNS.map(() => "?").join(", ")})`,
    args: entryArgs(entry),
  });

  return entry;
}

export async function updateTimeEntry(id, data) {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: "SELECT * FROM time_entries WHERE id = ?",
    args: [id],
  });
  if (rows.length === 0) return null;

  const current = rowToEntry(rows[0]);
  const startedAt = data.startedAt ?? current.startedAt;
  const endedAt = data.endedAt ?? current.endedAt;
  let durationSeconds =
    data.durationSeconds !== undefined
      ? Number(data.durationSeconds)
      : current.durationSeconds;

  if (data.startedAt !== undefined || data.endedAt !== undefined) {
    if (data.durationSeconds === undefined) {
      const startMs = new Date(startedAt).getTime();
      const endMs = new Date(endedAt).getTime();
      durationSeconds =
        Number.isNaN(startMs) || Number.isNaN(endMs)
          ? current.durationSeconds
          : Math.max(0, Math.floor((endMs - startMs) / 1000));
    }
  }

  if (new Date(endedAt).getTime() < new Date(startedAt).getTime()) {
    throw new InputError("End must not be before start.");
  }

  const updated = {
    ...current,
    projectId: data.projectId !== undefined ? data.projectId : current.projectId,
    description:
      data.description !== undefined ? data.description : current.description,
    startedAt,
    endedAt,
    durationSeconds,
    updatedAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `UPDATE time_entries SET
      projectId = ?, description = ?, startedAt = ?, endedAt = ?,
      durationSeconds = ?, updatedAt = ?
      WHERE id = ?`,
    args: [
      updated.projectId,
      updated.description,
      updated.startedAt,
      updated.endedAt,
      updated.durationSeconds,
      updated.updatedAt,
      id,
    ],
  });

  return updated;
}

function descriptionKey(text) {
  return String(text ?? "").trim().toLowerCase();
}

/** Rename every entry of a project whose description matches `from` (trimmed, case-insensitive). */
export async function renameDescription({ projectId = "", from = "", to = "" } = {}) {
  const next = String(to ?? "").trim();
  if (!next) throw new Error("The new description cannot be empty.");

  const db = getTursoClient();
  const fromKey = descriptionKey(from);
  const { rows } = await db.execute({
    sql: "SELECT id, description FROM time_entries WHERE projectId = ?",
    args: [projectId],
  });
  const ids = rows
    .filter((row) => descriptionKey(row.description) === fromKey)
    .map((row) => row.id);

  if (ids.length > 0) {
    const now = new Date().toISOString();
    await db.batch(
      ids.map((id) => ({
        sql: "UPDATE time_entries SET description = ?, updatedAt = ? WHERE id = ?",
        args: [next, now, id],
      })),
      "write"
    );
  }

  const timer = await getTimer();
  if (
    timer &&
    timer.projectId === projectId &&
    descriptionKey(timer.description) === fromKey
  ) {
    try {
      await updateTimer({ ...timer, description: next });
    } catch (err) {
      // The timer was stopped meanwhile: nothing left to rename.
      if (!(err instanceof TimerConflictError)) throw err;
    }
  }

  return { updated: ids.length };
}

/**
 * Distinct project + description pairs, most recently used first.
 * The database groups exact descriptions (one row per distinct text instead
 * of one per entry); variants that differ only in case are then merged here
 * with the same rule as renameDescription (JS toLowerCase, which unlike
 * SQLite's LOWER also folds accented letters).
 */
export async function listRecentTasks() {
  const db = getTursoClient();
  const { rows } = await db.execute(
    `SELECT projectId, TRIM(description) AS description,
        MAX(startedAt) AS lastUsedAt, COUNT(*) AS count
      FROM time_entries
      WHERE projectId != '' OR TRIM(description) != ''
      GROUP BY projectId, TRIM(description)
      ORDER BY lastUsedAt DESC`
  );
  const map = new Map();
  for (const row of rows) {
    const projectId = row.projectId ?? "";
    const description = String(row.description ?? "");
    const key = `${projectId}::${descriptionKey(description)}`;
    const prev = map.get(key);
    if (prev) {
      prev.count += Number(row.count);
      continue;
    }
    map.set(key, {
      projectId,
      description,
      lastUsedAt: row.lastUsedAt ?? "",
      count: Number(row.count),
    });
  }
  return [...map.values()];
}

export async function deleteTimeEntry(id) {
  const db = getTursoClient();
  await db.execute({
    sql: "DELETE FROM time_entries WHERE id = ?",
    args: [id],
  });
}

export async function listTimeEntries({ from, to } = {}) {
  const db = getTursoClient();
  let sql = "SELECT * FROM time_entries";
  const args = [];
  const clauses = [];

  if (from) {
    clauses.push("startedAt >= ?");
    args.push(from);
  }
  if (to) {
    clauses.push("startedAt < ?");
    args.push(to);
  }
  if (clauses.length) sql += ` WHERE ${clauses.join(" AND ")}`;
  sql += " ORDER BY startedAt DESC";

  const { rows } = await db.execute({ sql, args });
  return rows.map(rowToEntry);
}

/** Day and week boundaries are in the studio time zone (see ./timeZone). */
export async function getTodayTotalSeconds(now = new Date()) {
  const { start, end } = zonedDayRange(now);
  const entries = await listTimeEntries({
    from: start.toISOString(),
    to: end.toISOString(),
  });
  let total = entries.reduce((sum, e) => sum + e.durationSeconds, 0);

  const timer = await getTimer();
  if (timer) {
    // Only the part of the timer that falls within today counts.
    const elapsed = computeRunningSeconds(timer, now);
    const timerStartMs = new Date(timer.startedAt).getTime();
    const timerEndMs = timer.pausedAt
      ? new Date(timer.pausedAt).getTime()
      : now.getTime();
    const todaySeconds = Math.floor(
      (timerEndMs - Math.max(timerStartMs, start.getTime())) / 1000
    );
    total += Math.max(0, Math.min(elapsed, todaySeconds));
  }
  return total;
}

export async function getWeekSummary(weekStartDate = new Date()) {
  const weekStart = startOfZonedWeek(weekStartDate);
  const weekEnd = addZonedDays(weekStart, 7);
  const entries = await listTimeEntries({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });

  const days = [];
  for (let i = 0; i < 7; i++) {
    // Calendar days, so a DST week has one 23 h and one 25 h day.
    const dayStart = addZonedDays(weekStart, i);
    const dayEnd = addZonedDays(weekStart, i + 1);
    const dayEntries = entries.filter((e) => {
      const t = new Date(e.startedAt).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    const totalSeconds = dayEntries.reduce(
      (sum, e) => sum + e.durationSeconds,
      0
    );
    days.push({
      date: toZonedDateKey(dayStart),
      totalSeconds,
      entries: dayEntries,
    });
  }

  const weekTotalSeconds = days.reduce((s, d) => s + d.totalSeconds, 0);
  return {
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    weekTotalSeconds,
    days,
  };
}

/**
 * Report grouped by project and by client.
 * `projects` is the archive project list for join.
 */
export async function getReport({ from, to, projects = [] }) {
  const entries = await listTimeEntries({ from, to });
  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const byProject = new Map();
  const byClient = new Map();

  for (const entry of entries) {
    const project = projectMap.get(entry.projectId);
    const projectKey = entry.projectId || "__none__";
    const projectLabel = project
      ? `${project.projectId ? project.projectId + " — " : ""}${project.title || "Untitled"}`
      : entry.projectId
        ? "Unknown project"
        : "No project";

    const prevP = byProject.get(projectKey) ?? {
      projectId: entry.projectId,
      label: projectLabel,
      totalSeconds: 0,
      entryCount: 0,
    };
    prevP.totalSeconds += entry.durationSeconds;
    prevP.entryCount += 1;
    byProject.set(projectKey, prevP);

    const clients =
      project && Array.isArray(project.client) && project.client.length
        ? project.client
        : ["No client"];

    for (const client of clients) {
      const prevC = byClient.get(client) ?? {
        client,
        totalSeconds: 0,
        entryCount: 0,
      };
      prevC.totalSeconds += entry.durationSeconds;
      prevC.entryCount += 1;
      byClient.set(client, prevC);
    }
  }

  const totalSeconds = entries.reduce((s, e) => s + e.durationSeconds, 0);

  return {
    from: from ?? null,
    to: to ?? null,
    totalSeconds,
    entryCount: entries.length,
    byProject: [...byProject.values()].sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    ),
    byClient: [...byClient.values()].sort(
      (a, b) => b.totalSeconds - a.totalSeconds
    ),
  };
}
