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
