"use client";

import { useEffect, useId, useState } from "react";

/**
 * Behaviour of a combobox list, following the WAI-ARIA combobox pattern:
 * focus stays in the text field, the highlighted option is announced through
 * `aria-activedescendant`, ↑/↓ move it, Enter picks it, Escape closes the
 * list (and only when it is open, so a surrounding drawer stays open).
 *
 * - `items`: the options currently shown (any values).
 * - `onPick(item, index)`: Enter or a click on an option.
 * - `resetKey`: when it changes (e.g. the typed query), the highlight goes
 *   back to `initialIndex` (-1 = nothing highlighted until ↓ is pressed).
 *
 * Returns the open state and props to spread on the input, list and options.
 */
export function useListbox({ items, onPick, resetKey = "", initialIndex = 0, disabled = false }) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState({ key: resetKey, index: initialIndex });
  const active = highlight.key === resetKey ? highlight.index : initialIndex;
  const optionId = (index) => `${listId}-option-${index}`;

  function setActive(index) {
    setHighlight({ key: resetKey, index });
  }

  function openList(index = initialIndex) {
    if (disabled) return;
    setOpen(true);
    setActive(index);
  }

  function closeList() {
    setOpen(false);
  }

  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: "nearest" });
    // optionId only depends on listId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function onKeyDown(e) {
    if (disabled) return;
    if (e.key === "Escape") {
      if (open) {
        e.preventDefault();
        closeList();
      }
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) {
        openList(Math.max(initialIndex, 0));
        return;
      }
      const last = items.length - 1;
      setActive(
        e.key === "ArrowDown"
          ? Math.min(active + 1, last)
          : Math.max(active - 1, initialIndex)
      );
      return;
    }
    if (e.key === "Enter" && open && active >= 0 && active < items.length) {
      e.preventDefault();
      onPick(items[active], active);
    }
  }

  const activeId = open && active >= 0 && active < items.length ? optionId(active) : undefined;

  return {
    open,
    openList,
    closeList,
    active,
    inputProps: {
      role: "combobox",
      "aria-expanded": open,
      "aria-controls": listId,
      "aria-autocomplete": "list",
      "aria-activedescendant": activeId,
      autoComplete: "off",
      onKeyDown,
    },
    listProps: { id: listId, role: "listbox" },
    optionProps: (index, { selected = false } = {}) => ({
      id: optionId(index),
      role: "option",
      "aria-selected": selected,
      onMouseEnter: () => setActive(index),
      // mousedown, not click: the input keeps focus and the list stays open.
      onMouseDown: (e) => {
        e.preventDefault();
        onPick(items[index], index);
      },
    }),
  };
}
