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

/**
 * The item that has the same name ignoring case ("anna" vs "Anna"), other
 * than `except`; null when there is none.
 */
export function findSameName(items, name, except = null) {
  const key = name.toLowerCase();
  return items.find((item) => item !== except && item.toLowerCase() === key) ?? null;
}

/** Adds the trimmed name unless it is empty or already there (any case). */
export function addName(items, raw) {
  const name = raw.trim();
  return name && !findSameName(items, name) ? [...items, name] : items;
}

export function removeName(items, name) {
  return items.filter((item) => item !== name);
}

/**
 * Renames `from` to the trimmed `raw`, keeping its position. `to` is null when
 * nothing changes (empty, same name, or a name already in the list in any
 * case). Changing only the case of the same item ("anna" → "Anna") is allowed.
 */
export function renameName(items, from, raw) {
  const to = raw.trim();
  if (!to || to === from || findSameName(items, to, from)) return { items, to: null };
  return { items: items.map((item) => (item === from ? to : item)), to };
}

function duplicateNotice(items, raw, except = null) {
  const name = raw.trim();
  const existing = name ? findSameName(items, name, except) : null;
  if (!existing) return null;
  return existing === name
    ? `“${name}” is already in the list.`
    : `“${name}” is already in the list as “${existing}”.`;
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

/**
 * State for one settings list. `usageOf(name)` (projects using it) makes
 * removing a used value ask first: `pendingRemoval` is that name until
 * `confirmRemoval({ fromProjects })` or `cancelRemoval()`.
 */
export function useListEditor({ items, onChange, onRename, onRemoved, usageOf = () => 0 }) {
  const [newValue, setNewValueState] = useState("");
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValueState] = useState("");
  const [notice, setNotice] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);

  function stopEditing() {
    setEditing(null);
    setEditValueState("");
  }

  function removeNow(name, fromProjects) {
    onChange(removeName(items, name));
    onRemoved?.(name, { fromProjects });
  }

  return {
    newValue,
    setNewValue(value) {
      setNewValueState(value);
      setNotice(null);
    },
    notice,
    add() {
      const message = duplicateNotice(items, newValue);
      if (message) {
        setNotice(message);
        return;
      }
      const next = addName(items, newValue);
      if (next !== items) onChange(next);
      setNewValueState("");
    },
    remove(name) {
      if (usageOf(name) > 0) setPendingRemoval(name);
      else removeNow(name, false);
    },
    pendingRemoval,
    confirmRemoval({ fromProjects }) {
      if (pendingRemoval) removeNow(pendingRemoval, fromProjects);
      setPendingRemoval(null);
    },
    cancelRemoval() {
      setPendingRemoval(null);
    },
    editing,
    editValue,
    setEditValue(value) {
      setEditValueState(value);
      setNotice(null);
    },
    startEdit(name) {
      setEditing(name);
      setEditValueState(name);
      setNotice(null);
    },
    confirmEdit() {
      const message = duplicateNotice(items, editValue, editing);
      if (message) {
        setNotice(message);
        return;
      }
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
