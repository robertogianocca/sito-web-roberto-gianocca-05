import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { setupTempDatabase } from "../helpers/db.js";
import { ensureInit, getTursoClient } from "@/lib/turso";
import {
  TimerConflictError,
  createTimeEntry,
  getReport,
  getTimer,
  getTodayTotalSeconds,
  getWeekSummary,
  listRecentTasks,
  listTimeEntries,
  pauseTimer,
  renameDescription,
  startTimer,
  stopTimer,
  checkAndCompletePomodoro,
  updateRunningTimer,
  updateTimeEntry,
} from "@/lib/time";

setupTempDatabase();

const db = () => getTursoClient();
const count = async (table) =>
  Number((await db().execute(`SELECT COUNT(*) AS n FROM ${table}`)).rows[0].n);
const setTimerColumns = (sql, args) =>
  db().execute({ sql: `UPDATE time_timer SET ${sql}`, args });
const minutesAgo = (m) => new Date(Date.now() - m * 60e3).toISOString();

beforeAll(() => ensureInit());

beforeEach(async () => {
  await db().execute("DELETE FROM time_entries");
  await db().execute("DELETE FROM time_timer");
});

describe("timer", () => {
  it("records one entry when a due Pomodoro is completed by many requests at once", async () => {
    await startTimer({ pomodoroEnabled: true, pomodoroMinutes: 25 });
    await setTimerColumns("startedAt = ?", [minutesAgo(26)]);

    const results = await Promise.allSettled([
      ...Array.from({ length: 5 }, () => checkAndCompletePomodoro()),
      stopTimer(),
    ]);

    expect(await count("time_entries")).toBe(1);
    expect(await count("time_timer")).toBe(0);
    const completed = results.filter(
      (r) => r.status === "fulfilled" && (r.value.completed || r.value.entry)
    );
    expect(completed).toHaveLength(1);
  });

  it("refuses a second start instead of overwriting the running timer", async () => {
    await startTimer({ description: "first" });
    await expect(startTimer({ description: "second" })).rejects.toBeInstanceOf(
      TimerConflictError
    );
    expect((await getTimer()).description).toBe("first");
  });

  it("does not bring back a timer that was stopped while pausing", async () => {
    await startTimer({ description: "task" });
    await Promise.allSettled([stopTimer(), pauseTimer()]);
    expect(await count("time_timer")).toBe(0);
    expect(await count("time_entries")).toBe(1);
  });

  it("refuses to update a timer that is no longer running", async () => {
    await startTimer();
    await stopTimer();
    await expect(updateRunningTimer({ description: "x" })).rejects.toBeInstanceOf(
      TimerConflictError
    );
  });

  it("saves the description sent with stop, over the stored one", async () => {
    await startTimer({ description: "old text" });
    const { entry } = await stopTimer({ description: "new text" });
    expect(entry.description).toBe("new text");
  });

  it("keeps the stored description when stop sends none", async () => {
    await startTimer({ description: "stored" });
    const { entry } = await stopTimer();
    expect(entry.description).toBe("stored");
  });

  it("excludes paused time from the duration", async () => {
    await startTimer();
    await setTimerColumns("startedAt = ?, pauseSeconds = ?", [minutesAgo(10), 120]);
    const { entry } = await stopTimer();
    expect(entry.durationSeconds).toBeGreaterThanOrEqual(479);
    expect(entry.durationSeconds).toBeLessThanOrEqual(481);
  });

  it("caps a Pomodoro entry at the Pomodoro length", async () => {
    await startTimer({ pomodoroEnabled: true, pomodoroMinutes: 25 });
    await setTimerColumns("startedAt = ?", [minutesAgo(40)]);
    const { entry } = await stopTimer();
    expect(entry.durationSeconds).toBe(25 * 60);
    expect(entry.source).toBe("pomodoro");
  });

  it("does not complete a Pomodoro before it is due", async () => {
    await startTimer({ pomodoroEnabled: true, pomodoroMinutes: 25 });
    const result = await checkAndCompletePomodoro();
    expect(result.completed).toBe(false);
    expect(result.timer).not.toBeNull();
    expect(await count("time_entries")).toBe(0);
  });
});

describe("today and week (Europe/Zurich, server in UTC)", () => {
  it("puts an entry made just after local midnight on the right day", async () => {
    await createTimeEntry({
      startedAt: "2026-11-24T23:30:00.000Z", // Wed 25 Nov, 00:30 in Zurich
      endedAt: "2026-11-25T00:30:00.000Z",
      durationSeconds: 3600,
    });
    const wednesdayMorning = new Date("2026-11-25T08:00:00.000Z");

    expect(await getTodayTotalSeconds(wednesdayMorning)).toBe(3600);
    const week = await getWeekSummary(wednesdayMorning);
    expect(week.weekStart).toBe("2026-11-22T23:00:00.000Z");
    expect(week.days.find((d) => d.entries.length)?.date).toBe("2026-11-25");
    expect(week.weekTotalSeconds).toBe(3600);
  });

  it("counts only today's part of a timer started yesterday", async () => {
    await startTimer();
    await setTimerColumns("startedAt = ?", ["2026-11-24T22:00:00.000Z"]); // 23:00 local
    const oneAm = new Date("2026-11-25T00:00:00.000Z"); // 01:00 local
    expect(await getTodayTotalSeconds(oneAm)).toBe(3600);
  });

  it("returns 7 calendar days for a DST week", async () => {
    const week = await getWeekSummary(new Date("2026-03-29T12:00:00.000Z"));
    expect(week.days.map((d) => d.date)).toEqual([
      "2026-03-23",
      "2026-03-24",
      "2026-03-25",
      "2026-03-26",
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
    ]);
    expect(week.weekEnd).toBe("2026-03-29T22:00:00.000Z");
  });
});

describe("entries", () => {
  it("recomputes the duration when start or end change", async () => {
    const entry = await createTimeEntry({
      startedAt: "2026-11-20T09:00:00.000Z",
      endedAt: "2026-11-20T10:00:00.000Z",
    });
    expect(entry.durationSeconds).toBe(3600);
    const updated = await updateTimeEntry(entry.id, {
      endedAt: "2026-11-20T09:30:00.000Z",
    });
    expect(updated.durationSeconds).toBe(1800);
  });

  it("returns null when updating an entry that does not exist", async () => {
    expect(await updateTimeEntry("missing", { description: "x" })).toBeNull();
  });

  it("renames a description on every entry of the project, ignoring case", async () => {
    await createTimeEntry({ projectId: "p1", description: "Editing" });
    await createTimeEntry({ projectId: "p1", description: " editing " });
    await createTimeEntry({ projectId: "p1", description: "Color" });
    await createTimeEntry({ projectId: "p2", description: "Editing" });

    const { updated } = await renameDescription({
      projectId: "p1",
      from: "EDITING",
      to: "Edit v2",
    });

    expect(updated).toBe(2);
    const p1 = (await listTimeEntries()).filter((e) => e.projectId === "p1");
    expect(p1.map((e) => e.description).sort()).toEqual(["Color", "Edit v2", "Edit v2"]);
    const p2 = (await listTimeEntries()).filter((e) => e.projectId === "p2");
    expect(p2[0].description).toBe("Editing");
  });

  it("lists recent tasks by project and description, most recent first", async () => {
    await createTimeEntry({ projectId: "p1", description: "A", startedAt: "2026-11-18T09:00:00.000Z" });
    await createTimeEntry({ projectId: "p1", description: "a", startedAt: "2026-11-19T09:00:00.000Z" });
    await createTimeEntry({ projectId: "p2", description: "B", startedAt: "2026-11-20T09:00:00.000Z" });

    const tasks = await listRecentTasks();
    expect(tasks.map((t) => [t.projectId, t.description, t.count])).toEqual([
      ["p2", "B", 1],
      ["p1", "a", 2],
    ]);
  });
});

describe("report", () => {
  const projects = [
    { id: "p1", projectId: "001", title: "Wedding", client: ["Anna"] },
    { id: "p2", projectId: "002", title: "Catalogue", client: ["Anna", "Shop"] },
  ];
  const hour = 3600;

  beforeEach(async () => {
    const at = (h) => `2026-11-20T${String(h).padStart(2, "0")}:00:00.000Z`;
    await createTimeEntry({ projectId: "p1", startedAt: at(8), durationSeconds: hour });
    await createTimeEntry({ projectId: "p1", startedAt: at(9), durationSeconds: hour / 2 });
    await createTimeEntry({ projectId: "p2", startedAt: at(10), durationSeconds: hour });
    await createTimeEntry({ projectId: "", startedAt: at(11), durationSeconds: hour / 4 });
  });

  it("totals by project, largest first", async () => {
    const report = await getReport({ projects });
    expect(report.totalSeconds).toBe(2.75 * hour);
    expect(report.entryCount).toBe(4);
    expect(report.byProject.map((p) => [p.label, p.totalSeconds])).toEqual([
      ["001 — Wedding", 1.5 * hour],
      ["002 — Catalogue", hour],
      ["No project", hour / 4],
    ]);
  });

  it("counts a project with two clients in full for each client (current rule)", async () => {
    const report = await getReport({ projects });
    const byClient = Object.fromEntries(
      report.byClient.map((c) => [c.client, c.totalSeconds])
    );
    expect(byClient).toEqual({ Anna: 2.5 * hour, Shop: hour, "No client": hour / 4 });
  });

  it("filters by date range", async () => {
    const report = await getReport({
      from: "2026-11-20T09:00:00.000Z",
      to: "2026-11-20T11:00:00.000Z",
      projects,
    });
    expect(report.entryCount).toBe(2);
    expect(report.totalSeconds).toBe(1.5 * hour);
  });
});
