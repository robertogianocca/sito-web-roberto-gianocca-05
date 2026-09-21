"use client";

import { formatDuration } from "@/lib/timeFormat";
import { projectLabel } from "./ProjectCombobox";

function formatTimeRange(startedAt, endedAt) {
  const opts = { hour: "2-digit", minute: "2-digit" };
  const start = startedAt
    ? new Date(startedAt).toLocaleTimeString(undefined, opts)
    : "—";
  const end = endedAt
    ? new Date(endedAt).toLocaleTimeString(undefined, opts)
    : "—";
  return `${start} – ${end}`;
}

export function TodayView({
  entries,
  loading,
  projectMap,
  todayTotalSeconds,
  timerActive,
  onEdit,
  onDelete,
  onRestart,
}) {
  if (loading) {
    return <p className="text-sm text-zinc-500">Loading…</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Today&apos;s entries</h2>
        <p className="font-mono text-sm text-zinc-500">
          Total {formatDuration(todayTotalSeconds)}
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
          No time logged today. Start the timer or add hours manually.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
          {entries.map((entry) => {
            const project = projectMap.get(entry.projectId);
            return (
              <li
                key={entry.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 hover:bg-zinc-50"
              >
                <button
                  type="button"
                  disabled={timerActive}
                  onClick={() => onRestart(entry)}
                  title={
                    timerActive
                      ? "Stop the current timer first"
                      : "Start timer with this project"
                  }
                  aria-label="Start timer for this entry"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg
                    className="h-3.5 w-3.5"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {projectLabel(project)}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {formatTimeRange(entry.startedAt, entry.endedAt)}
                    {entry.activityType ? ` · ${entry.activityType}` : ""}
                    {entry.description ? ` · ${entry.description}` : ""}
                    {entry.source === "pomodoro" ? " · Pomodoro" : ""}
                  </p>
                </div>
                <p className="font-mono text-sm font-medium tabular-nums text-zinc-800">
                  {formatDuration(entry.durationSeconds)}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(entry)}
                    className="rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Delete this time entry?")) onDelete(entry.id);
                    }}
                    className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
