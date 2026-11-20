"use client";

import { useMemo, useRef } from "react";
import { useListbox } from "@/components/studio/hooks/useListbox";
import { useOutsideClick } from "@/components/studio/hooks/useOutsideClick";

const MAX_SUGGESTIONS = 8;

/** Descriptions already used on `projectId`, most recent first. */
export function descriptionsForProject(recentTasks, projectId) {
  return recentTasks
    .filter((t) => t.projectId === (projectId ?? "") && t.description)
    .map((t) => t.description);
}

/**
 * Free-text field with suggestions (descriptions already used). Nothing is
 * highlighted until ↓ is pressed, so Enter keeps the typed text.
 */
export function DescriptionCombobox({
  id,
  value,
  onChange,
  suggestions,
  disabled = false,
  placeholder,
  inputClassName,
}) {
  const rootRef = useRef(null);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    return suggestions
      .filter((s) => {
        const text = s.toLowerCase();
        return text !== q && text.includes(q);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [suggestions, value]);

  const listbox = useListbox({
    items: matches,
    resetKey: value,
    initialIndex: -1,
    disabled,
    onPick: (text) => {
      onChange(text);
      listbox.closeList();
    },
  });
  const showList = listbox.open && !disabled && matches.length > 0;

  useOutsideClick(rootRef, listbox.closeList, listbox.open);

  function onKeyDown(e) {
    // Nothing shown: let Escape reach a surrounding drawer.
    if (e.key === "Escape" && !showList) {
      listbox.closeList();
      return;
    }
    listbox.inputProps.onKeyDown(e);
  }

  return (
    <div ref={rootRef} className="relative">
      <input
        id={id}
        type="text"
        {...listbox.inputProps}
        role="combobox"
        aria-controls={listbox.listProps.id}
        aria-expanded={showList}
        onKeyDown={onKeyDown}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          listbox.openList();
        }}
        onFocus={() => listbox.openList()}
        disabled={disabled}
        placeholder={placeholder}
        className={inputClassName}
      />
      {showList && (
        <ul
          {...listbox.listProps}
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-zinc-200 bg-background py-1 shadow-lg"
        >
          {matches.map((text, i) => (
            <li
              key={text}
              {...listbox.optionProps(i, { selected: i === listbox.active })}
              className={`block cursor-pointer truncate px-3 py-2 text-sm ${
                i === listbox.active ? "bg-zinc-100 text-zinc-900" : "text-zinc-700"
              }`}
            >
              {text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
