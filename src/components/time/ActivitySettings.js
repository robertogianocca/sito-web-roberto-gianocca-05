"use client";

import { useState } from "react";

export function ActivitySettings({ activityTypes, onClose, onSave }) {
  const [types, setTypes] = useState([...activityTypes]);
  const [newType, setNewType] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function addType() {
    const name = newType.trim();
    if (!name) return;
    if (types.some((t) => t.toLowerCase() === name.toLowerCase())) {
      setError("That activity type already exists.");
      return;
    }
    setTypes([...types, name]);
    setNewType("");
    setError(null);
  }

  function removeType(index) {
    setTypes(types.filter((_, i) => i !== index));
  }

  function startEdit(index) {
    setEditingIndex(index);
    setEditValue(types[index]);
  }

  function commitEdit() {
    if (editingIndex === null) return;
    const name = editValue.trim();
    if (!name) {
      setEditingIndex(null);
      return;
    }
    const next = [...types];
    next[editingIndex] = name;
    setTypes(next);
    setEditingIndex(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await onSave(types);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-sm flex-col bg-background shadow-xl">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">Activity types</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Close
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-auto px-5 py-4">
          <div className="flex flex-wrap gap-2">
            {types.map((t, i) =>
              editingIndex === i ? (
                <input
                  key={`edit-${i}`}
                  autoFocus
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditingIndex(null);
                  }}
                  className="rounded-full border border-zinc-400 px-3 py-1 text-sm outline-none"
                />
              ) : (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700"
                >
                  <button
                    type="button"
                    onClick={() => startEdit(i)}
                    className="hover:underline"
                  >
                    {t}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeType(i)}
                    className="ml-1 text-zinc-400 hover:text-red-500"
                    aria-label={`Remove ${t}`}
                  >
                    ×
                  </button>
                </span>
              )
            )}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addType();
                }
              }}
              placeholder="New activity type"
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
            />
            <button
              type="button"
              onClick={addType}
              className="rounded-lg border border-zinc-200 px-3 text-sm hover:bg-zinc-100"
            >
              Add
            </button>
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>

        <footer className="border-t border-zinc-200 px-5 py-4">
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </footer>
      </aside>
    </div>
  );
}
