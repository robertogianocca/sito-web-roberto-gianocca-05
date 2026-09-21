"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDuration } from "@/lib/timeFormat";
import { formatLiveDuration, liveElapsedSeconds } from "./timerLive";

function projectLabel(p) {
  if (!p) return "No project";
  const id = p.projectId ? `${p.projectId} — ` : "";
  return `${id}${p.title || "Untitled"}`;
}

export function TimerBar({
  timer,
  tick,
  projects,
  activityTypes,
  todayTotalSeconds,
  onAction,
  onOpenSettings,
}) {
  const [projectId, setProjectId] = useState(timer?.projectId ?? "");
  const [description, setDescription] = useState(timer?.description ?? "");
  const [activityType, setActivityType] = useState(timer?.activityType ?? "");
  const [pomodoro, setPomodoro] = useState(Boolean(timer?.pomodoroEnabled));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (timer) {
      setProjectId(timer.projectId ?? "");
      setDescription(timer.description ?? "");
      setActivityType(timer.activityType ?? "");
      setPomodoro(Boolean(timer.pomodoroEnabled));
    }
  }, [timer?.startedAt, timer?.projectId]);

  const sortedProjects = useMemo(() => {
    return [...projects].sort((a, b) =>
      projectLabel(a).localeCompare(projectLabel(b), undefined, {
        sensitivity: "base",
      })
    );
  }, [projects]);

  const isRunning = Boolean(timer) && timer.status === "running";
  const isPaused = Boolean(timer) && timer.status === "paused";
  const elapsedLabel = timer ? formatLiveDuration(timer) : "00:00";

  const pomodoroRemaining = useMemo(() => {
    if (!timer?.pomodoroEnabled) return null;
    const elapsed = liveElapsedSeconds(timer);
    const total = (timer.pomodoroMinutes || 25) * 60;
    return Math.max(0, total - elapsed);
  }, [timer, tick]);

  async function run(action, payload) {
    setBusy(true);
    try {
      await onAction(action, payload);
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="shrink-0 border-b border-zinc-200 bg-background px-6 py-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold text-foreground">Time</h1>
          <p className="text-sm text-zinc-500">
            Today{" "}
            <span className="font-mono font-medium text-zinc-800">
              {formatDuration(todayTotalSeconds)}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenSettings}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          title="Activity types"
          aria-label="Activity types settings"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
            aria-hidden
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[12rem] flex-1 space-y-1">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            Project
          </span>
          <select
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            disabled={Boolean(timer) || busy}
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
          >
            <option value="">No project</option>
            {sortedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {projectLabel(p)}
              </option>
            ))}
          </select>
        </label>

        <label className="min-w-[10rem] flex-[1.5] space-y-1">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            Description
          </span>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={busy}
            placeholder="What are you working on?"
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
          />
        </label>

        <label className="min-w-[8rem] space-y-1">
          <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
            Activity
          </span>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            disabled={busy}
            className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
          >
            <option value="">—</option>
            {activityTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2 pb-0.5">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600">
            <input
              type="checkbox"
              checked={pomodoro}
              onChange={(e) => setPomodoro(e.target.checked)}
              disabled={Boolean(timer) || busy}
              className="rounded border-zinc-300"
            />
            Pomodoro
          </label>
        </div>

        <div className="flex items-center gap-2">
          <p
            className={`min-w-[5.5rem] text-right font-mono text-2xl font-semibold tabular-nums ${
              isPaused ? "text-amber-600" : "text-foreground"
            }`}
            aria-live="polite"
          >
            {elapsedLabel}
          </p>
          {pomodoroRemaining !== null && timer && (
            <span className="text-xs text-zinc-400" title="Pomodoro remaining">
              P {formatDuration(pomodoroRemaining)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!timer && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run("start", {
                  projectId,
                  description,
                  activityType,
                  pomodoroEnabled: pomodoro,
                })
              }
              className="h-9 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              Start
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("pause")}
              className="h-9 rounded-lg border border-zinc-300 px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-60"
            >
              Pause
            </button>
          )}
          {isPaused && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("resume")}
              className="h-9 rounded-lg bg-emerald-700 px-4 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
            >
              Resume
            </button>
          )}
          {timer && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("stop")}
              className="h-9 rounded-lg bg-zinc-900 px-4 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700 disabled:opacity-60"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {timer && (description !== timer.description || activityType !== timer.activityType) && (
        <div className="mt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("update", { description, activityType })}
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
          >
            Save description / activity to running timer
          </button>
        </div>
      )}
    </header>
  );
}
