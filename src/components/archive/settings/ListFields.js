"use client";

import { TOUCH_TARGET } from "@/components/studio/ui/touch";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-foreground placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300";

export const sectionLabelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500";

function CheckIcon({ className }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CrossIcon({ className }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className={className} aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

/**
 * Inline rename: Enter confirms, Escape cancels only the rename (the drawer
 * stays open). `compact` for the small pills, full size for drive rows.
 */
export function RenameField({ value, onChange, onConfirm, onCancel, compact = false }) {
  const button = compact
    ? "flex h-3.5 w-3.5 items-center justify-center rounded-full"
    : "flex h-5 w-5 shrink-0 items-center justify-center rounded";
  const icon = compact ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span className="flex items-center gap-1">
      <input
        autoFocus
        aria-label="New name"
        className={`${compact ? "w-28" : "w-full"} rounded bg-white px-1.5 py-0.5 text-xs text-foreground outline-none ring-1 ring-zinc-300 focus:ring-zinc-400`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onConfirm();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onCancel();
          }
        }}
      />
      <button
        type="button"
        aria-label="Confirm rename"
        onClick={onConfirm}
        className={`${button} text-emerald-600 transition hover:bg-emerald-100 ${TOUCH_TARGET}`}
      >
        <CheckIcon className={icon} />
      </button>
      <button
        type="button"
        aria-label="Cancel rename"
        onClick={onCancel}
        className={`${button} text-zinc-400 transition hover:bg-zinc-200 hover:text-zinc-700 ${TOUCH_TARGET}`}
      >
        <CrossIcon className={icon} />
      </button>
    </span>
  );
}

/** "Add …" text field with its button; Enter adds too. */
export function AddField({ value, onChange, onAdd, placeholder, label }) {
  return (
    <div className="flex gap-1.5">
      <input
        className={`${inputClass} flex-1`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd();
          }
        }}
      />
      <button
        type="button"
        onClick={onAdd}
        className="rounded-lg bg-zinc-900 px-3 text-xs font-medium text-zinc-50 transition hover:bg-zinc-700"
      >
        Add
      </button>
    </div>
  );
}

/** "· 3" next to a name: how many projects use it. */
export function UsageCount({ count }) {
  if (!count) return null;
  return (
    <span className="font-normal text-zinc-400" title={`Used by ${count} project${count === 1 ? "" : "s"}`}>
      · {count}
      <span className="sr-only"> projects</span>
    </span>
  );
}

/** A short message under a list (duplicate name, …). */
export function ListNotice({ children }) {
  if (!children) return null;
  return (
    <p role="status" className="mt-1.5 text-xs text-amber-700">
      {children}
    </p>
  );
}

/**
 * Asked when removing a value that projects use: remove it from those
 * projects too, or only from the list (projects keep it).
 */
export function RemovalPrompt({ name, count, keepHint, onConfirm, onCancel }) {
  const button = "rounded-md px-2 py-1 text-xs font-medium transition";
  return (
    <div role="alertdialog" aria-label={`Remove ${name}`} className="mb-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <p>
        “{name}” is used by {count} project{count === 1 ? "" : "s"}.
        {keepHint ? ` ${keepHint}` : ""}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onConfirm({ fromProjects: true })} className={`${button} bg-amber-700 text-white hover:bg-amber-800`}>
          Remove from projects too
        </button>
        <button type="button" onClick={() => onConfirm({ fromProjects: false })} className={`${button} border border-amber-300 bg-white hover:bg-amber-100`}>
          Only from the list
        </button>
        <button type="button" onClick={onCancel} className={`${button} text-amber-800 hover:bg-amber-100`}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Names used by projects but missing from the list, each with "add back". */
export function UnlistedNames({ names, usageOf, onAdd }) {
  if (names.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="mb-1 text-2xs text-zinc-400">Used in projects but not in this list:</p>
      <div className="flex flex-wrap gap-1.5">
        {names.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => onAdd(name)}
            className="flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-500 transition hover:border-zinc-400 hover:text-zinc-800"
            aria-label={`Add ${name} back to the list`}
          >
            <span aria-hidden>＋</span> {name} <UsageCount count={usageOf(name)} />
          </button>
        ))}
      </div>
    </div>
  );
}
