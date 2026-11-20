"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useListbox } from "../hooks/useListbox";
import { useOutsideClick } from "../hooks/useOutsideClick";

function sortAlpha(list) {
  return [...list].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function CheckIcon() {
  return (
    <svg
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
      className="h-2.5 w-2.5 text-white"
      aria-hidden
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * Multi-select field: chosen values as removable pills, followed by a text
 * field that filters the list (a combobox, see useListbox).
 *
 * - ↑/↓ move through the list, Enter toggles the highlighted value; the list
 *   stays open to pick several.
 * - With `creatable`, a typed name that is not in the list appears first as
 *   "Add “name”" (Enter or click adds it).
 * - Backspace in the empty field removes the last value.
 * - Escape closes the list (a second Escape reaches the drawer).
 *
 * Give the field a label with `<label htmlFor={id}>`.
 */
export function MultiCombobox({
  id,
  options = [],
  selected,
  onChange,
  placeholder = "— Select —",
  creatable = false,
  addLabel = "Add",
}) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const [query, setQuery] = useState("");

  // Values chosen but not yet in the saved list (typed in) are listed too.
  const all = useMemo(
    () => sortAlpha([...new Set([...options, ...selected])]),
    [options, selected]
  );

  const trimmed = query.trim();
  const items = useMemo(() => {
    const q = trimmed.toLowerCase();
    const matches = (q ? all.filter((n) => n.toLowerCase().includes(q)) : all).map((name) => ({ name }));
    const canAdd = creatable && q && !all.some((n) => n.toLowerCase() === q);
    return canAdd ? [{ add: trimmed }, ...matches] : matches;
  }, [all, trimmed, creatable]);

  function pick(item) {
    if (item.add) {
      if (!selected.includes(item.add)) onChange([...selected, item.add]);
      setQuery("");
      return;
    }
    onChange(
      selected.includes(item.name)
        ? selected.filter((s) => s !== item.name)
        : [...selected, item.name]
    );
  }

  function close() {
    listbox.closeList();
    setQuery("");
  }

  const listbox = useListbox({ items, resetKey: query, onPick: pick });
  useOutsideClick(rootRef, close, listbox.open);

  function onKeyDown(e) {
    if (e.key === "Backspace" && query === "" && selected.length > 0) {
      onChange(selected.slice(0, -1));
      return;
    }
    if (e.key === "Escape" && listbox.open) setQuery("");
    listbox.inputProps.onKeyDown(e);
  }

  return (
    <div ref={rootRef} className="relative">
      <div
        className="flex min-h-9 cursor-text flex-wrap items-center gap-1 rounded-lg border border-zinc-300 bg-background px-2 py-1 focus-within:ring-2 focus-within:ring-zinc-400"
        onMouseDown={(e) => {
          // A click on the empty part of the field focuses the input.
          if (e.target === e.currentTarget) {
            e.preventDefault();
            inputRef.current?.focus();
            listbox.openList();
          }
        }}
      >
        {selected.map((name) => (
          <span
            key={name}
            className="flex items-center gap-1 rounded-md bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700"
          >
            {name}
            <button
              type="button"
              onClick={() => onChange(selected.filter((s) => s !== name))}
              className="ml-0.5 rounded text-zinc-400 transition hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-zinc-500"
              aria-label={`Remove ${name}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          {...listbox.inputProps}
          role="combobox"
          aria-controls={listbox.listProps.id}
          aria-expanded={listbox.open}
          onKeyDown={onKeyDown}
          value={query}
          placeholder={selected.length === 0 ? placeholder : ""}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!listbox.open) listbox.openList();
          }}
          onClick={() => {
            if (!listbox.open) listbox.openList();
          }}
          className="min-w-20 flex-1 bg-transparent py-0.5 text-sm text-foreground outline-none placeholder:text-zinc-400"
        />
      </div>

      {listbox.open && (
        <ul
          {...listbox.listProps}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {items.length === 0 ? (
            <li role="presentation" className="px-3 py-2 text-xs text-zinc-400">
              {trimmed ? "No matches" : creatable ? "Type a name to add one" : "No items yet"}
            </li>
          ) : (
            items.map((item, i) => {
              const isSelected = Boolean(item.name) && selected.includes(item.name);
              return (
                <li
                  key={item.add ? `add:${item.add}` : item.name}
                  {...listbox.optionProps(i, { selected: isSelected })}
                  className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm ${
                    i === listbox.active ? "bg-zinc-100" : ""
                  } ${isSelected ? "font-medium text-zinc-900" : "text-zinc-700"}`}
                >
                  {item.add ? (
                    <>
                      <span className="text-base leading-none" aria-hidden>
                        ＋
                      </span>
                      {addLabel} “{item.add}”
                    </>
                  ) : (
                    <>
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          isSelected ? "border-zinc-700 bg-zinc-700" : "border-zinc-300"
                        }`}
                        aria-hidden
                      >
                        {isSelected && <CheckIcon />}
                      </span>
                      {item.name}
                    </>
                  )}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
