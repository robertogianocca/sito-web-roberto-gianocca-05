"use client";

import { useState, useEffect } from "react";

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-foreground placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus:ring-1 focus:ring-zinc-300";

const labelClass = "mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500";

function EditableList({ label, items, onChange }) {
  const [newValue, setNewValue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  function addItem() {
    const trimmed = newValue.trim();
    if (trimmed && !items.includes(trimmed)) {
      onChange([...items, trimmed]);
    }
    setNewValue("");
  }

  function removeItem(index) {
    onChange(items.filter((_, i) => i !== index));
  }

  function startEdit(index) {
    setEditingIndex(index);
    setEditValue(items[index]);
  }

  function confirmEdit() {
    const trimmed = editValue.trim();
    if (trimmed && (trimmed === items[editingIndex] || !items.includes(trimmed))) {
      const next = [...items];
      next[editingIndex] = trimmed;
      onChange(next);
    }
    setEditingIndex(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditValue("");
  }

  return (
    <section>
      <p className={labelClass}>{label}</p>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {items.length === 0 && (
          <span className="text-xs text-zinc-400 italic">No items yet</span>
        )}
        {items.map((item, index) =>
          editingIndex === index ? (
            <span
              key={index}
              className="flex items-center gap-1 rounded-full bg-zinc-200 px-2 py-0.5"
            >
              <input
                autoFocus
                className="w-28 rounded bg-white px-1.5 py-0.5 text-xs text-foreground outline-none ring-1 ring-zinc-300 focus:ring-zinc-400"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); confirmEdit(); }
                  if (e.key === "Escape") cancelEdit();
                }}
              />
              <button
                type="button"
                aria-label="Confirm rename"
                onClick={confirmEdit}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-emerald-600 transition hover:bg-emerald-100"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5" aria-hidden>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Cancel rename"
                onClick={cancelEdit}
                className="flex h-3.5 w-3.5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-300 hover:text-zinc-700"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          ) : (
            <span
              key={index}
              className="flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700"
            >
              <button
                type="button"
                aria-label={`Rename ${item}`}
                onClick={() => startEdit(index)}
                className="transition hover:text-zinc-900"
              >
                {item}
              </button>
              <button
                type="button"
                aria-label={`Remove ${item}`}
                onClick={() => removeItem(index)}
                className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-300 hover:text-zinc-700"
              >
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} className="h-2.5 w-2.5" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </span>
          )
        )}
      </div>
      <div className="flex gap-1.5">
        <input
          className={`${inputClass} flex-1`}
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder={`Add ${label.toLowerCase()}…`}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); addItem(); }
          }}
        />
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-zinc-900 px-3 text-xs font-medium text-zinc-50 transition hover:bg-zinc-700"
        >
          Add
        </button>
      </div>
    </section>
  );
}

export function SettingsDrawer({ open, settings, clients, onClose, onSaved }) {
  const [projectTypes, setProjectTypes] = useState([]);
  const [archiveDrives, setArchiveDrives] = useState([]);
  const [backupDrives, setBackupDrives] = useState([]);
  const [localClients, setLocalClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    if (open) {
      setProjectTypes(settings?.projectTypes ?? []);
      setArchiveDrives(settings?.archiveDrives ?? []);
      setBackupDrives(settings?.backupDrives ?? []);
      setLocalClients(clients ?? []);
      setSaveError(null);
    }
  }, [open, settings, clients]);

  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const settingsRes = await fetch("/api/archive/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectTypes, archiveDrives, backupDrives }),
      });
      if (!settingsRes.ok) throw new Error("Failed to save settings.");

      const currentClients = clients ?? [];
      const toAdd = localClients.filter((c) => !currentClients.includes(c));
      const toRemove = currentClients.filter((c) => !localClients.includes(c));

      for (const name of toAdd) {
        await fetch("/api/archive/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }
      for (const name of toRemove) {
        await fetch("/api/archive/clients", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
      }

      const newSettings = await settingsRes.json();
      onSaved(newSettings, localClients);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        role="dialog"
        aria-label="Settings"
        aria-modal="true"
        className={`fixed inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Close settings"
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <EditableList
            label="Project Types"
            items={projectTypes}
            onChange={setProjectTypes}
          />
          <EditableList
            label="Archive Drives"
            items={archiveDrives}
            onChange={setArchiveDrives}
          />
          <EditableList
            label="Backup Drives"
            items={backupDrives}
            onChange={setBackupDrives}
          />
          <EditableList
            label="Clients"
            items={localClients}
            onChange={setLocalClients}
          />
        </div>

        <footer className="border-t border-zinc-200 px-5 py-4 space-y-2">
          {saveError && (
            <p className="text-xs text-red-500">{saveError}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-200 py-2 text-sm text-zinc-500 transition hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
}
