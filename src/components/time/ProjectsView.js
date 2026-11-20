"use client";

import { useMemo, useState } from "react";
import {
  formatDuration,
  lastDaysRange,
  localDateRangeParams,
} from "@/lib/timeFormat";
import { projectLabel } from "./ProjectCombobox";
import { RestartButton } from "./RestartButton";
import { useJsonResource } from "@/components/studio/hooks/useJsonResource";
import { apiFetch } from "@/components/studio/api";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";

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
  return [datePart, timePart].filter(Boolean).join(" · ");
}

function groupByDescription(entries) {
  const map = new Map();
  for (const entry of entries) {
    const text = (entry.description ?? "").trim();
    const key = text.toLowerCase();
    const prev = map.get(key) ?? {
      key,
      label: text || "No description",
      totalSeconds: 0,
      entries: [],
    };
    prev.totalSeconds += entry.durationSeconds || 0;
    prev.entries.push(entry);
    map.set(key, prev);
  }
  return [...map.values()].sort((a, b) => b.totalSeconds - a.totalSeconds);
}

function ExpandToggle({ isOpen, onClick, className, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 text-left ${className}`}
    >
      <span className="text-zinc-400" aria-hidden>
        {isOpen ? "▾" : "▸"}
      </span>
      {children}
    </button>
  );
}

function EntryRow({ entry, onEdit, onDelete }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-2.5 pl-16">
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
  );
}

function PencilIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.75}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.86 4.49a2.1 2.1 0 1 1 2.97 2.97L8.5 18.79l-4 1 1-4 11.36-11.3z"
      />
    </svg>
  );
}

function RenameForm({ initialValue, onSave, onCancel }) {
  const [draft, setDraft] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const canSave = draft.trim() !== "" && !saving;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const ok = await onSave(draft.trim());
    if (!ok) setSaving(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-1 flex-wrap items-center gap-2 px-4 py-2 pl-10"
    >
      <input
        type="text"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
        disabled={saving}
        placeholder="Description"
        className="min-w-40 flex-1 rounded-lg border border-zinc-300 bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!canSave}
        className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-50 hover:bg-zinc-700 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg px-2 py-1.5 text-xs text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
      >
        Cancel
      </button>
    </form>
  );
}

function DescriptionGroup({
  group,
  isOpen,
  onToggle,
  timerActive,
  onRestart,
  onRename,
  onEdit,
  onDelete,
}) {
  const [editing, setEditing] = useState(false);
  const isEmpty = group.key === "";

  async function handleSave(nextName) {
    const ok = await onRename(group, nextName);
    if (ok) setEditing(false);
    return ok;
  }

  return (
    <li>
      <div className="flex items-center hover:bg-zinc-100/60">
        {editing ? (
          <RenameForm
            initialValue={isEmpty ? "" : group.label}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
          />
        ) : (
          <>
            <ExpandToggle
              isOpen={isOpen}
              onClick={onToggle}
              className="min-w-0 flex-1 px-4 py-2.5 pl-10"
            >
              <span
                className={`min-w-0 flex-1 truncate text-sm ${
                  isEmpty ? "italic text-zinc-400" : "text-zinc-700"
                }`}
              >
                {group.label}
              </span>
              <span className="text-xs text-zinc-400">
                {group.entries.length} entr
                {group.entries.length === 1 ? "y" : "ies"}
              </span>
              <span className="font-mono text-sm font-medium tabular-nums text-zinc-800">
                {formatDuration(group.totalSeconds)}
              </span>
            </ExpandToggle>
            <RestartButton
              timerActive={timerActive}
              onClick={() => onRestart(isEmpty ? "" : group.label)}
              label="Start timer for this task"
            />
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mx-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700"
              title="Rename description"
              aria-label={`Rename ${group.label}`}
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      {isOpen && (
        <ul className="divide-y divide-zinc-100 border-t border-zinc-100 bg-background">
          {group.entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function ProjectsView({
  projectMap,
  timerActive,
  onRestart,
  onEdit,
  onDelete,
  onChanged,
}) {
  const [from, setFrom] = useState(() => lastDaysRange().from);
  const [to, setTo] = useState(() => lastDaysRange().to);
  const [reloadKey, setReloadKey] = useState(0);
  const [actionError, setActionError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());

  const {
    data,
    loading,
    error: loadError,
  } = useJsonResource(`/api/time/entries?${localDateRangeParams(from, to)}`, {
    reloadKey,
    errorMessage: "Failed to load entries.",
  });
  const entries = useMemo(() => data?.entries ?? [], [data]);
  const error = actionError ?? loadError;

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
        descriptions: groupByDescription(g.entries),
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

  async function handleRename(projectId, group, nextName) {
    setActionError(null);
    try {
      await apiFetch("/api/time/entries", {
        method: "PATCH",
        body: { projectId, from: group.key, to: nextName },
        fallbackMessage: "Failed to rename description.",
      });
    } catch (err) {
      setActionError(err.message);
      return false;
    }
    setReloadKey((k) => k + 1);
    onChanged?.();
    return true;
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

      <ErrorBanner>{error}</ErrorBanner>

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
                    <ExpandToggle
                      isOpen={isOpen}
                      onClick={() => toggle(key)}
                      className="px-4 py-3 hover:bg-zinc-50"
                    >
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {g.label}
                      </span>
                      <span className="text-xs text-zinc-400">
                        {g.descriptions.length} task
                        {g.descriptions.length === 1 ? "" : "s"}
                      </span>
                      <span className="font-mono text-sm font-semibold tabular-nums text-zinc-800">
                        {formatDuration(g.totalSeconds)}
                      </span>
                    </ExpandToggle>
                    {isOpen && (
                      <ul className="divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/50">
                        {g.descriptions.map((d) => {
                          const descKey = `${key}::${d.key}`;
                          return (
                            <DescriptionGroup
                              key={descKey}
                              group={d}
                              isOpen={expanded.has(descKey)}
                              onToggle={() => toggle(descKey)}
                              timerActive={timerActive}
                              onRestart={(description) =>
                                onRestart({
                                  projectId: g.projectId,
                                  description,
                                })
                              }
                              onRename={(group, nextName) =>
                                handleRename(g.projectId, group, nextName)
                              }
                              onEdit={onEdit}
                              onDelete={onDelete}
                            />
                          );
                        })}
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
