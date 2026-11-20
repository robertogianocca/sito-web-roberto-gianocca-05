"use client";

import { useState } from "react";
import { formatDuration } from "@/lib/timeFormat";
import { RestartButton } from "../RestartButton";
import { EntryActions } from "../EntryActions";
import { ExpandToggle } from "./ExpandToggle";

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
      <EntryActions entry={entry} onEdit={onEdit} onDelete={onDelete} />
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

export function DescriptionGroup({
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
