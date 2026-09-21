"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

export function projectLabel(p) {
  if (!p) return "No project";
  const id = p.projectId ? `${p.projectId} — ` : "";
  return `${id}${p.title || "Untitled"}`;
}

function projectSearchText(p) {
  const clients = Array.isArray(p.client) ? p.client.join(" ") : p.client ?? "";
  return `${p.projectId ?? ""} ${p.title ?? ""} ${clients}`.toLowerCase();
}

export function ProjectCombobox({
  projects,
  value,
  onChange,
  disabled = false,
  id: idProp,
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const listId = `${inputId}-list`;
  const rootRef = useRef(null);
  const selected = useMemo(
    () => (value ? projects.find((p) => p.id === value) : null),
    [projects, value]
  );

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) =>
        projectLabel(a).localeCompare(projectLabel(b), undefined, {
          sensitivity: "base",
        })
      ),
    [projects]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((p) => projectSearchText(p).includes(q));
  }, [sorted, query]);

  const options = useMemo(
    () => [{ id: "", label: "No project" }, ...filtered.map((p) => ({ id: p.id, label: projectLabel(p), project: p }))],
    [filtered]
  );

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query, open]);

  function select(id) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  function onKeyDown(e) {
    if (disabled) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) select(opt.id);
    }
  }

  const displayValue = open
    ? query
    : selected
      ? projectLabel(selected)
      : "No project";

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        disabled={disabled}
        value={displayValue}
        placeholder="Search projects…"
        onChange={(e) => {
          setQuery(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => {
          if (!disabled) {
            setOpen(true);
            setQuery("");
          }
        }}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
      />
      {open && !disabled && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-background py-1 shadow-lg"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-400">No matches</li>
          ) : (
            options.map((opt, i) => (
              <li key={opt.id || "__none__"} role="option" aria-selected={value === opt.id}>
                <button
                  type="button"
                  className={`block w-full truncate px-3 py-2 text-left text-sm ${
                    i === highlight
                      ? "bg-zinc-100 text-zinc-900"
                      : "text-zinc-700 hover:bg-zinc-50"
                  } ${value === opt.id ? "font-medium" : ""}`}
                  onMouseEnter={() => setHighlight(i)}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    select(opt.id);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
