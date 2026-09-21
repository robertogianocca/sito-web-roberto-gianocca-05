"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatDuration,
  toLocalDateInput,
} from "@/lib/timeFormat";
import { projectLabel } from "./ProjectCombobox";

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 30);
  return {
    from: toLocalDateInput(from),
    to: toLocalDateInput(to),
  };
}

function formatEntryMeta(entry) {
  const opts = { hour: "2-digit", minute: "2-digit" };
  const dateOpts = { day: "numeric", month: "short" };
  const start = entry.startedAt ? new Date(entry.startedAt) : null;
  const end = entry.endedAt ? new Date(entry.endedAt) : null;
  const datePart = start
    ? start.toLocaleDateString(undefined, dateOpts)
    : "—";
  const timePart = start
    ? `${start.toLocaleTimeString(undefined, opts)}${
        end ? ` – ${end.toLocaleTimeString(undefined, opts)}` : ""
      }`
    : "";
  const bits = [datePart, timePart];
  if (entry.activityType) bits.push(entry.activityType);
  if (entry.description) bits.push(entry.description);
  return bits.filter(Boolean).join(" · ");
}

export function ProjectsView({ projectMap, onEdit, onDelete }) {
  const defaults = defaultRange();
  const [from, setFrom] = useState(defaults.from);
  const [to, setTo] = useState(defaults.to);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fromIso = from ? new Date(`${from}T00:00:00`).toISOString() : "";
      const toEnd = to ? new Date(`${to}T00:00:00`) : null;
      if (toEnd) toEnd.setDate(toEnd.getDate() + 1);
      const toIso = toEnd ? toEnd.toISOString() : "";
      const qs = new URLSearchParams();
      if (fromIso) qs.set("from", fromIso);
      if (toIso) qs.set("to", toIso);
      const res = await fetch(`/api/time/entries?${qs}`);
      if (!res.ok) throw new Error("Failed to load entries.");
      const data = await res.json();
      setEntries(data.entries ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const map = new Map();
    for (const entry of entries) {
      const key = entry.projectId || "__none__";
      const prev = map.get(key) ?? {
        projectId: entry.projectId || "",
        totalSeconds: 0,
        entries: [],
      };
      prev.totalSeconds += entry.durationSeconds || 0;
      prev.entries.push(entry);
      map.set(key, prev);
    }
    return [...map.values()]
      .map((g) => ({
        ...g,
        label: g.projectId
          ? projectLabel(projectMap.get(g.projectId))
          : "No project",
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);
  }, [entries, projectMap]);

  function toggle(key) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const grandTotal = groups.reduce((s, g) => s + g.totalSeconds, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-sm font-medium text-zinc-700">Projects</h2>
        <div className="flex flex-wrap items-end gap-3">
          <label className="space-y-1">
            <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
              From
            </span>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="block rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </label>
          <label className="space-y-1">
            <span className="text-2xs font-mono uppercase tracking-wider text-zinc-400">
              To
            </span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="block rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
            />
          </label>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading && <p className="text-sm text-zinc-500">Loading…</p>}

      {!loading && (
        <>
          <p className="font-mono text-sm text-zinc-600">
            Total{" "}
            <span className="font-semibold text-foreground">
              {formatDuration(grandTotal)}
            </span>
            <span className="text-zinc-400">
              {" "}
              · {groups.length} project{groups.length === 1 ? "" : "s"}
            </span>
          </p>

          {groups.length === 0 ? (
            <p className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">
              No time logged in this range.
            </p>
          ) : (
            <ul className="space-y-2">
              {groups.map((g) => {
                const key = g.projectId || "__none__";
                const isOpen = expanded.has(key);
                return (
                  <li
                    key={key}
                    className="overflow-hidden rounded-xl border border-zinc-200"
                  >
                    <button
                      type="button"
                      onClick={() => toggle(key)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-zinc-50"
                    >
                      <span
                        className="text-zinc-400"
                        aria-hidden
                      >
                        {isOpen ? "▾" : "▸"}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {g.label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {g.entries.length} task
                        {g.entries.length === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-800">
                        {formatDuration(g.totalSeconds)}
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/50">
                        {g.entries.map((entry) => (
                          <li
                            key={entry.id}
                            className="flex flex-wrap items-center gap-3 px-4 py-2.5 pl-10"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs text-zinc-500">
                                {formatEntryMeta(entry)}
                              </p>
                            </div>
                            <p className="font-mono text-sm tabular-nums text-zinc-800">
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
                                  if (confirm("Delete this time entry?")) {
                                    onDelete(entry.id);
                                  }
                                }}
                                className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
