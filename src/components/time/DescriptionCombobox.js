"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const MAX_SUGGESTIONS = 8;

/** Descriptions already used on `projectId`, most recent first. */
export function descriptionsForProject(recentTasks, projectId) {
  return recentTasks
    .filter((t) => t.projectId === (projectId ?? "") && t.description)
    .map((t) => t.description);
}

export function DescriptionCombobox({
  id,
  value,
  onChange,
  suggestions,
  disabled = false,
  placeholder,
  inputClassName,
}) {
  const listId = `${id}-list`;
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    return suggestions
      .filter((s) => {
        const text = s.toLowerCase();
        return text !== q && text.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [suggestions, value]);

  const showList = open && !disabled && matches.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    function onDoc(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  // The highlighted option resets whenever the list changes (typing, opening).
  // Stored with the state it belongs to, so no effect is needed to reset it.
  const highlightKey = `${open}|${value}`;
  const [highlightState, setHighlightState] = useState({
    key: highlightKey,
    index: -1,
  });
  const highlight =
    highlightState.key === highlightKey ? highlightState.index : -1;
  function setHighlight(next) {
    setHighlightState((prev) => {
      const current = prev.key === highlightKey ? prev.index : -1;
      return {
        key: highlightKey,
        index: typeof next === "function" ? next(current) : next,
      };
    });
  }

  function select(text) {
    onChange(text);
    setOpen(false);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, matches.length - 1));
      return;
    }
    if (!showList) return;
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, -1));
    } else if (e.key === "Enter" && highlight >= 0) {
      e.preventDefault();
      select(matches[highlight]);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-background py-1 shadow-lg"
        >
          {matches.map((text, i) => (
            <li key={text} role="option" aria-selected={i === highlight}>
              <button
                type="button"
                className={`block w-full truncate px-3 py-2 text-left text-sm ${
                  i === highlight
                    ? "bg-zinc-100 text-zinc-900"
                    : "text-zinc-700 hover:bg-zinc-50"
                }`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(text);
                }}
              >
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
