"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDuration, formatDurationHMS } from "@/lib/timeFormat";
import { formatLiveDurationHMS, liveElapsedSeconds } from "./timerLive";
import { ProjectCombobox } from "./ProjectCombobox";

function ClockIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 7v5l3 2" />
    </svg>
  );
}

function PlayIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l11-6.86a1 1 0 0 0 0-1.72l-11-6.86a1 1 0 0 0-1.5.86z" />
    </svg>
  );
}

function PauseIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function TimerBar({
  timer,
  tick,
  projects,
  todayTotalSeconds,
  onAction,
  draftRef,
}) {
  const [projectId, setProjectId] = useState(timer?.projectId ?? "");
  const [description, setDescription] = useState(timer?.description ?? "");
  const [pomodoro, setPomodoro] = useState(Boolean(timer?.pomodoroEnabled));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (timer) {
      setProjectId(timer.projectId ?? "");
      setDescription(timer.description ?? "");
      setPomodoro(Boolean(timer.pomodoroEnabled));
    }
  }, [
    timer?.startedAt,
    timer?.projectId,
    timer?.description,
    timer?.pomodoroEnabled,
  ]);

  function applyDraft(next) {
    if (next.projectId !== undefined) setProjectId(next.projectId ?? "");
    if (next.description !== undefined) setDescription(next.description ?? "");
    if (next.pomodoro !== undefined) setPomodoro(Boolean(next.pomodoro));
  }

  useEffect(() => {
    if (!draftRef) return;
    draftRef.current = {
      projectId,
      description,
      pomodoro,
      applyDraft,
    };
  }, [draftRef, projectId, description, pomodoro]);

  const isRunning = Boolean(timer) && timer.status === "running";
  const isPaused = Boolean(timer) && timer.status === "paused";
  const elapsedLabel = timer ? formatLiveDurationHMS(timer) : "0:00:00";

  const pomodoroRemaining = useMemo(() => {
    if (!timer?.pomodoroEnabled) return null;
    const elapsed = liveElapsedSeconds(timer);
    const total = (timer.pomodoroMinutes || 25) * 60;
    return Math.max(0, total - elapsed);
  }, [timer, tick]);

  const clockColor = isPaused
    ? "text-amber-600"
    : isRunning
      ? "text-emerald-700"
      : "text-zinc-400";

  const timeColor = isPaused
    ? "text-amber-600"
    : isRunning
      ? "text-foreground"
      : "text-zinc-800";

  async function run(action, payload) {
    setBusy(true);
    try {
      await onAction(action, payload);
    } finally {
      setBusy(false);
    }
  }

  const btnBase =
    "inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-sm font-medium transition disabled:opacity-60";

  return (
    <header className="shrink-0 border-b border-zinc-200 bg-background px-6 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold text-foreground">Time</h1>
      </div>

      {/* Hero: clock + controls */}
      <div className="mb-4 flex flex-wrap items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4 sm:gap-6 sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
          <ClockIcon className={`h-8 w-8 shrink-0 sm:h-9 sm:w-9 ${clockColor}`} />
          <div className="min-w-0">
            <p
              className={`font-mono text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${timeColor}`}
              aria-live="polite"
            >
              {elapsedLabel}
            </p>
            <p className="mt-0.5 text-sm text-zinc-500">
              Today{" "}
              <span className="font-mono font-medium text-zinc-700">
                {formatDurationHMS(todayTotalSeconds)}
              </span>
              {pomodoroRemaining !== null && timer ? (
                <span className="ml-3 text-zinc-400" title="Pomodoro remaining">
                  Pomodoro {formatDuration(pomodoroRemaining)}
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {!timer && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run("start", {
                  projectId,
                  description,
                  pomodoroEnabled: pomodoro,
                })
              }
              className={`${btnBase} bg-emerald-700 text-white hover:bg-emerald-600`}
            >
              <PlayIcon className="h-4 w-4" />
              Start
            </button>
          )}
          {isRunning && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("pause")}
              className={`${btnBase} border border-zinc-300 bg-background text-zinc-700 hover:bg-zinc-100`}
            >
              <PauseIcon className="h-4 w-4" />
              Pause
            </button>
          )}
          {isPaused && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("resume")}
              className={`${btnBase} bg-emerald-700 text-white hover:bg-emerald-600`}
            >
              <PlayIcon className="h-4 w-4" />
              Resume
            </button>
          )}
          {timer && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run("stop")}
              className={`${btnBase} bg-zinc-900 text-zinc-50 hover:bg-zinc-700`}
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[12rem] flex-1 space-y-1">
          <label
            htmlFor="timer-project"
            className="text-2xs font-mono uppercase tracking-wider text-zinc-400"
          >
            Project
          </label>
          <ProjectCombobox
            id="timer-project"
            projects={projects}
            value={projectId}
            onChange={setProjectId}
            disabled={Boolean(timer) || busy}
          />
        </div>

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

        <div className="flex items-center gap-2 pb-2">
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
      </div>

      {timer && description !== timer.description && (
        <div className="mt-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => run("update", { description })}
            className="text-xs text-zinc-500 underline hover:text-zinc-800"
          >
            Save description to running timer
          </button>
        </div>
      )}
    </header>
  );
}
