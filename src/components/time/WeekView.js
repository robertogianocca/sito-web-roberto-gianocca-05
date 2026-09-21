"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDuration } from "@/lib/timeFormat";

function projectLabel(project) {
  if (!project) return "No project";
  const id = project.projectId ? `${project.projectId} — ` : "";
  return `${id}${project.title || "Untitled"}`;
}

export function WeekView({ projectMap, locale }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const d = new Date();
      d.setDate(d.getDate() + weekOffset * 7);
      const res = await fetch(
        `/api/time/entries?view=week&week=${encodeURIComponent(d.toISOString())}`
      );
      if (!res.ok) throw new Error("Failed to load week.");
      setData(await res.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => {
    load();
  }, [load]);

  const weekLabel = data
    ? `${new Date(data.weekStart).toLocaleDateString(locale, {
        day: "numeric",
        month: "short",
      })} – ${new Date(new Date(data.weekEnd).getTime() - 1).toLocaleDateString(
        locale,
        { day: "numeric", month: "short", year: "numeric" }
      )}`
    : "";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Weekly timesheet</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o - 1)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset(0)}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            This week
          </button>
          <button
            type="button"
            onClick={() => setWeekOffset((o) => o + 1)}
            disabled={weekOffset >= 0}
            className="rounded-lg border border-zinc-200 px-2.5 py-1 text-sm text-zinc-600 hover:bg-zinc-100 disabled:opacity-40"
          >
            →
          </button>
          <span className="ml-2 text-sm text-zinc-500">{weekLabel}</span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loading && data && (
        <>
          <p className="font-mono text-sm text-zinc-600">
            Week total{" "}
            <span className="font-semibold text-foreground">
              {formatDuration(data.weekTotalSeconds)}
            </span>
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {data.days.map((day) => {
              const date = new Date(day.date + "T12:00:00");
              const weekday = date.toLocaleDateString(locale, {
                weekday: "short",
              });
              const dayNum = date.toLocaleDateString(locale, {
                day: "numeric",
                month: "short",
              });
              return (
                <div
                  key={day.date}
                  className="rounded-xl border border-zinc-200 p-3"
                >
                  <div className="mb-2 flex items-baseline justify-between gap-1">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        {weekday}
                      </p>
                      <p className="text-sm text-zinc-700">{dayNum}</p>
                    </div>
                    <p className="font-mono text-sm font-semibold tabular-nums">
                      {formatDuration(day.totalSeconds)}
                    </p>
                  </div>
                  {day.entries.length === 0 ? (
                    <p className="text-2xs text-zinc-300">—</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {day.entries.map((e) => (
                        <li key={e.id} className="text-xs text-zinc-500">
                          <span className="font-mono text-zinc-700">
                            {formatDuration(e.durationSeconds)}
                          </span>{" "}
                          {projectLabel(projectMap.get(e.projectId))}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
