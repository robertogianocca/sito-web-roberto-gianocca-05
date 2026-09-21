import { getTursoClient } from "./turso";
import {
  formatDuration,
  formatDurationHours,
  toLocalDateInput,
} from "./timeFormat";

export { formatDuration, formatDurationHours } from "./timeFormat";

const TIMER_ROW_ID = "current";
const DEFAULT_POMODORO_MINUTES = 25;
const DEFAULT_ACTIVITY_TYPES = [
  "Working",
  "Shooting",
  "Editing",
  "Motion",
  "Meeting",
  "Admin",
  "Travel",
];

export function generateTimeId() {
  return `time_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function rowToEntry(row) {
  return {
    id: row.id,
    projectId: row.projectId ?? "",
    description: row.description ?? "",
    activityType: row.activityType ?? "",
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
    activityType: row.activityType ?? "",
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

export async function getActivityTypes() {
  const db = getTursoClient();
  const { rows } = await db.execute(
    "SELECT value FROM settings WHERE key = 'activityTypes'"
  );
  if (rows.length === 0) return [...DEFAULT_ACTIVITY_TYPES];
  try {
    const parsed = JSON.parse(rows[0].value);
    return Array.isArray(parsed) ? parsed.map(String) : [...DEFAULT_ACTIVITY_TYPES];
  } catch {
    return [...DEFAULT_ACTIVITY_TYPES];
  }
}

export async function setActivityTypes(types) {
  const db = getTursoClient();
  const list = (Array.isArray(types) ? types : [])
    .map((t) => String(t).trim())
    .filter(Boolean);
  await db.execute({
    sql: "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
    args: ["activityTypes", JSON.stringify(list)],
  });
  return list;
}

export async function getTimer() {
  const db = getTursoClient();
  const { rows } = await db.execute({
    sql: "SELECT * FROM time_timer WHERE id = ?",
    args: [TIMER_ROW_ID],
  });
  return enrichTimer(rowToTimer(rows[0] ?? null));
}

async function writeTimer(timer) {
  const db = getTursoClient();
  await db.execute({
    sql: `INSERT OR REPLACE INTO time_timer
      (id, projectId, description, activityType, startedAt, pausedAt, pauseSeconds, pomodoroEnabled, pomodoroMinutes)
      VALUES (?,?,?,?,?,?,?,?,?)`,
    args: [
      TIMER_ROW_ID,
      timer.projectId ?? "",
      timer.description ?? "",
      timer.activityType ?? "",
      timer.startedAt,
      timer.pausedAt ?? null,
      Number(timer.pauseSeconds ?? 0),
      timer.pomodoroEnabled ? 1 : 0,
      Number(timer.pomodoroMinutes ?? DEFAULT_POMODORO_MINUTES),
    ],
  });
  return getTimer();
}

async function clearTimer() {
  const db = getTursoClient();
  await db.execute({
    sql: "DELETE FROM time_timer WHERE id = ?",
    args: [TIMER_ROW_ID],
  });
}

export async function startTimer({
  projectId = "",
  description = "",
  activityType = "",
  pomodoroEnabled = false,
  pomodoroMinutes = DEFAULT_POMODORO_MINUTES,
} = {}) {
  const existing = await getTimer();
  if (existing) {
    throw new Error("A timer is already running. Stop or pause it first.");
  }
  const now = new Date().toISOString();
  return writeTimer({
    projectId,
    description,
    activityType,
    startedAt: now,
    pausedAt: null,
    pauseSeconds: 0,
    pomodoroEnabled: Boolean(pomodoroEnabled),
    pomodoroMinutes: Number(pomodoroMinutes) || DEFAULT_POMODORO_MINUTES,
  });
}

export async function pauseTimer() {
  const timer = await getTimer();
  if (!timer) throw new Error("No timer is running.");
  if (timer.pausedAt) throw new Error("Timer is already paused.");
  return writeTimer({
    ...timer,
    pausedAt: new Date().toISOString(),
  });
}

export async function resumeTimer() {
  const timer = await getTimer();
  if (!timer) throw new Error("No timer is running.");
  if (!timer.pausedAt) throw new Error("Timer is not paused.");

  const pausedMs = new Date(timer.pausedAt).getTime();
  const extraPause = Math.max(0, Math.floor((Date.now() - pausedMs) / 1000));

  return writeTimer({
    ...timer,
    pausedAt: null,
    pauseSeconds: Number(timer.pauseSeconds ?? 0) + extraPause,
  });
}

export async function stopTimer({ source } = {}) {
  const timer = await getTimer();
  if (!timer) throw new Error("No timer is running.");

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

  const entry = await createTimeEntry({
    projectId: timer.projectId,
    description: timer.description,
    activityType: timer.activityType,
    startedAt: timer.startedAt,
    endedAt,
    durationSeconds,
    source: entrySource,
  });

  await clearTimer();
  return { entry, timer: null };
}

/** Auto-stop when pomodoro duration is reached (idempotent if already stopped). */
export async function checkAndCompletePomodoro() {
  const timer = await getTimer();
  if (!timer || !timer.pomodoroEnabled || timer.pausedAt) {
    return { completed: false, timer, entry: null };
  }
  const elapsed = computeRunningSeconds(timer);
  if (elapsed < timer.pomodoroMinutes * 60) {
    return { completed: false, timer, entry: null };
  }
  const result = await stopTimer({ source: "pomodoro" });
  return { completed: true, timer: null, entry: result.entry };
}

export async function updateRunningTimer(patch = {}) {
  const timer = await getTimer();
  if (!timer) throw new Error("No timer is running.");
  return writeTimer({
    ...timer,
    projectId:
      patch.projectId !== undefined ? patch.projectId : timer.projectId,
    description:
      patch.description !== undefined ? patch.description : timer.description,
    activityType:
      patch.activityType !== undefined
        ? patch.activityType
        : timer.activityType,
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

export async function createTimeEntry(data) {
  const db = getTursoClient();
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

  const entry = {
    id: data.id || generateTimeId(),
    projectId: data.projectId ?? "",
    description: data.description ?? "",
    activityType: data.activityType ?? "",
    startedAt,
    endedAt,
    durationSeconds,
    source: data.source ?? "manual",
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };

  await db.execute({
    sql: `INSERT INTO time_entries
      (id, projectId, description, activityType, startedAt, endedAt, durationSeconds, source, createdAt, updatedAt)
      VALUES (?,?,?,?,?,?,?,?,?,?)`,
    args: [
      entry.id,
      entry.projectId,
      entry.description,
      entry.activityType,
      entry.startedAt,
      entry.endedAt,
      entry.durationSeconds,
      entry.source,
      entry.createdAt,
      entry.updatedAt,
    ],
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

  const updated = {
    ...current,
    projectId: data.projectId !== undefined ? data.projectId : current.projectId,
    description:
      data.description !== undefined ? data.description : current.description,
    activityType:
      data.activityType !== undefined
        ? data.activityType
        : current.activityType,
    startedAt,
    endedAt,
    durationSeconds,
    updatedAt: new Date().toISOString(),
  };

  await db.execute({
    sql: `UPDATE time_entries SET
      projectId = ?, description = ?, activityType = ?, startedAt = ?, endedAt = ?,
      durationSeconds = ?, updatedAt = ?
      WHERE id = ?`,
    args: [
      updated.projectId,
      updated.description,
      updated.activityType,
      updated.startedAt,
      updated.endedAt,
      updated.durationSeconds,
      updated.updatedAt,
      id,
    ],
  });

  return updated;
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

function startOfLocalDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday 00:00 local of the week containing `date`. */
export function startOfWeek(date = new Date()) {
  const d = startOfLocalDay(date);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(d, diff);
}

export async function getTodayTotalSeconds(now = new Date()) {
  const from = startOfLocalDay(now).toISOString();
  const to = addDays(startOfLocalDay(now), 1).toISOString();
  const entries = await listTimeEntries({ from, to });
  let total = entries.reduce((sum, e) => sum + e.durationSeconds, 0);

  const timer = await getTimer();
  if (timer) {
    // Count running timer toward today if it started today or overlaps today
    const timerStart = new Date(timer.startedAt);
    const todayStart = startOfLocalDay(now);
    if (timerStart >= todayStart || !timer.pausedAt) {
      total += computeRunningSeconds(timer, now);
    }
  }
  return total;
}

export async function getWeekSummary(weekStartDate = new Date()) {
  const weekStart = startOfWeek(weekStartDate);
  const weekEnd = addDays(weekStart, 7);
  const entries = await listTimeEntries({
    from: weekStart.toISOString(),
    to: weekEnd.toISOString(),
  });

  const days = [];
  for (let i = 0; i < 7; i++) {
    const dayStart = addDays(weekStart, i);
    const dayEnd = addDays(weekStart, i + 1);
    const dayEntries = entries.filter((e) => {
      const t = new Date(e.startedAt).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    });
    const totalSeconds = dayEntries.reduce(
      (sum, e) => sum + e.durationSeconds,
      0
    );
    days.push({
      date: toLocalDateInput(dayStart),
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
