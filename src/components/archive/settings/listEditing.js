"use client";

import { useState } from "react";

/**
 * Editing a list of unique names (project types, drives, clients): add,
 * rename, remove. The pure functions are what the settings drawer does;
 * useListEditor adds the "new name" and "rename in progress" field state.
 */

export function sortAlpha(list) {
  return [...(list ?? [])].sort((a, b) =>
    String(a).localeCompare(String(b), undefined, { sensitivity: "base" })
  );
}

/** Adds the trimmed name unless it is empty or already there. */
export function addName(items, raw) {
  const name = raw.trim();
  return name && !items.includes(name) ? [...items, name] : items;
}

export function removeName(items, name) {
  return items.filter((item) => item !== name);
}

/**
 * Renames `from` to the trimmed `raw`, keeping its position. `to` is null when
 * nothing changes (empty, same name, or a name already in the list).
 */
export function renameName(items, from, raw) {
  const to = raw.trim();
  if (!to || to === from || items.includes(to)) return { items, to: null };
  return { items: items.map((item) => (item === from ? to : item)), to };
}

/** Drive capacities follow their drive when it is renamed or removed. */
export function moveCapacity(capacities, from, to) {
  if (!Object.prototype.hasOwnProperty.call(capacities, from)) return capacities;
  const next = { ...capacities, [to]: capacities[from] };
  delete next[from];
  return next;
}

export function dropCapacity(capacities, name) {
  if (!Object.prototype.hasOwnProperty.call(capacities, name)) return capacities;
  const next = { ...capacities };
  delete next[name];
  return next;
}

export function useListEditor({ items, onChange, onRename, onRemoved }) {
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState("");

  function stopEditing() {
    setEditing(null);
    setEditValue("");
  }

  return {
    newValue,
    setNewValue,
    add() {
      const next = addName(items, newValue);
      if (next !== items) onChange(next);
      setNewValue("");
    },
    remove(name) {
      onChange(removeName(items, name));
      onRemoved?.(name);
    },
    editing,
    editValue,
    setEditValue,
    startEdit(name) {
      setEditing(name);
      setEditValue(name);
    },
    confirmEdit() {
      const { items: next, to } = renameName(items, editing, editValue);
      if (to) {
        onChange(next);
        onRename?.(editing, to);
      }
      stopEditing();
    },
    cancelEdit: stopEditing,
  };
}
