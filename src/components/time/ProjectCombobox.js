"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useListbox } from "@/components/studio/hooks/useListbox";
import { useOutsideClick } from "@/components/studio/hooks/useOutsideClick";
import { projectLabel } from "./projectLabel";


function projectSearchText(p) {
  const clients = (p.client ?? []).join(" ");
  return `${p.projectId ?? ""} ${p.title ?? ""} ${clients}`.toLowerCase();
}

/**
 * Project picker: type to search by ID, title or client. The list opens on a
 * click, on typing or with ↓ (not on focus, so a drawer that focuses this
 * field does not pop the list open). Keyboard and ARIA from useListbox.
 */
export function ProjectCombobox({
  projects,
  value,
  onChange,
  disabled = false,
  id: idProp,
}) {
  const autoId = useId();
  const inputId = idProp ?? autoId;
  const rootRef = useRef(null);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => (value ? projects.find((p) => p.id === value) : null),
    [projects, value]
  );

  const sorted = useMemo(
    () =>
      [...projects].sort((a, b) =>
        projectLabel(a).localeCompare(projectLabel(b), undefined, {
          sensitivity: "base",
        })
      ),
    [projects]
  );

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q ? sorted.filter((p) => projectSearchText(p).includes(q)) : sorted;
    return [
      { id: "", label: "No project" },
      ...matches.map((p) => ({ id: p.id, label: projectLabel(p) })),
    ];
  }, [sorted, query]);

  function close() {
    listbox.closeList();
    setQuery("");
  }

  const listbox = useListbox({
    items: options,
    resetKey: query,
    disabled,
    onPick: (option) => {
      onChange(option.id);
      close();
    },
  });

  useOutsideClick(rootRef, close, listbox.open);

  function onKeyDown(e) {
    if (e.key === "Enter" && !listbox.open) {
      e.preventDefault();
      listbox.openList();
      return;
    }
    if (e.key === "Escape" && listbox.open) setQuery("");
    listbox.inputProps.onKeyDown(e);
  }

  const displayValue = listbox.open
    ? query
    : selected
      ? projectLabel(selected)
      : "No project";

  return (
    <div ref={rootRef} className="relative">
      <input
        id={inputId}
        type="text"
        {...listbox.inputProps}
        onKeyDown={onKeyDown}
        disabled={disabled}
        value={displayValue}
        placeholder="Search projects…"
        onFocus={(e) => e.target.select()}
        onClick={() => {
          if (!listbox.open) {
            setQuery("");
            listbox.openList();
          }
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!listbox.open) listbox.openList();
        }}
        className="w-full rounded-lg border border-zinc-300 bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400 disabled:opacity-60"
      />
      {listbox.open && !disabled && (
        <ul
          {...listbox.listProps}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-background py-1 shadow-lg"
        >
          {options.map((option, i) => (
            <li
              key={option.id || "__none__"}
              {...listbox.optionProps(i, { selected: value === option.id })}
              className={`block cursor-pointer truncate px-3 py-2 text-sm ${
                i === listbox.active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
              } ${value === option.id ? "font-medium" : ""}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
