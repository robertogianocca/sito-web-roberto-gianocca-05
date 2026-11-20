"use client";

import { useState } from "react";

const labelClass = "block text-xs font-medium text-zinc-600";

export function ToggleCheckbox({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-zinc-400 ${
        checked
          ? "border-emerald-300 bg-emerald-50/80 text-emerald-800"
          : "border-zinc-200 bg-zinc-50/80 text-zinc-500"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
          checked ? "border-emerald-500 bg-emerald-500" : "border-zinc-300"
        }`}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}

const BACKUP_TYPE_OPTIONS = [
  { value: "", label: "None" },
  { value: "full", label: "Full", hint: "Original files" },
  { value: "export", label: "Export", hint: "Exported files only" },
];

export function BackupTypeSelect({ value, onChange }) {
  return (
    <div>
      <p id="f-backupType-label" className={`${labelClass} mb-2`}>Backup type</p>
      <div className="grid grid-cols-3 gap-1.5" role="group" aria-labelledby="f-backupType-label">
        {BACKUP_TYPE_OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value || "none"}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={`rounded-lg border px-2 py-2 text-center transition ${
                selected
                  ? "border-emerald-300 bg-emerald-50/80 text-emerald-800"
                  : "border-zinc-200 bg-zinc-50/80 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700"
              }`}
            >
              <span className="block text-sm font-medium">{option.label}</span>
              {option.hint && (
                <span className="mt-0.5 block text-2xs leading-tight opacity-80">
                  {option.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  function addTag(raw) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="min-h-10 rounded-lg border border-zinc-300 bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-zinc-400">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-zinc-400 transition hover:text-zinc-700"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          id="tag-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? "Add tags…" : ""}
          className="min-w-24 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400"
        />
      </div>
    </div>
  );
}
