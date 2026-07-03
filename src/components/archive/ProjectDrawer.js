"use client";

import { useState, useEffect, useCallback } from "react";

const EMPTY_FORM = {
  projectId: "",
  invoiceNumber: "",
  title: "",
  client: "",
  type: "",
  date: "",
  location: "",
  archiveDrive: "",
  backupDrive: "",
  cleaned: false,
  backupCompleted: false,
  notes: "",
  tags: [],
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-background px-3 py-1.5 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50";
const labelClass = "block text-xs font-medium text-zinc-600";
const sectionTitle = "text-2xs font-semibold uppercase tracking-wider text-zinc-400 mb-3";

function ToggleCheckbox({ id, label, checked, onChange }) {
  return (
    <label
      htmlFor={id}
      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition select-none ${
        checked
          ? "border-emerald-300 bg-emerald-50/80 text-emerald-800"
          : "border-zinc-200 bg-zinc-50/80 text-zinc-500"
      }`}
    >
      <div
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
          checked ? "border-emerald-500 bg-emerald-500" : "border-zinc-300"
        }`}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
            aria-hidden
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium">{label}</span>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
    </label>
  );
}

const NEW_CLIENT_VALUE = "__new__";

function ClientCombobox({ clients, value, onChange }) {
  const [addingNew, setAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [localExtra, setLocalExtra] = useState([]);

  const allClients = [...clients, ...localExtra.filter((n) => !clients.includes(n))];

  function handleSelectChange(e) {
    if (e.target.value === NEW_CLIENT_VALUE) {
      setAddingNew(true);
      setNewName("");
    } else {
      onChange(e.target.value);
    }
  }

  function confirmNew() {
    const name = newName.trim();
    if (name) {
      setLocalExtra((prev) => (prev.includes(name) ? prev : [...prev, name]));
      onChange(name);
    }
    setAddingNew(false);
    setNewName("");
  }

  function cancelNew() {
    setAddingNew(false);
    setNewName("");
  }

  if (addingNew) {
    return (
      <div className="flex gap-1.5">
        <input
          autoFocus
          className={`${inputClass} flex-1`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New client name"
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); confirmNew(); }
            if (e.key === "Escape") cancelNew();
          }}
        />
        <button
          type="button"
          onClick={confirmNew}
          className="rounded-lg bg-zinc-900 px-2.5 text-xs font-medium text-zinc-50 transition hover:bg-zinc-700"
        >
          Add
        </button>
        <button
          type="button"
          onClick={cancelNew}
          className="rounded-lg border border-zinc-200 px-2.5 text-xs text-zinc-500 transition hover:bg-zinc-100"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        id="f-client"
        className={`${inputClass} appearance-none pr-7`}
        value={value}
        onChange={handleSelectChange}
      >
        <option value="">— Select —</option>
        {allClients.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
        <option value={NEW_CLIENT_VALUE}>＋ New client…</option>
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function TagInput({ tags, onChange }) {
  const [input, setInput] = useState("");

  function addTag(raw) {
    const tag = raw.trim();
    if (tag && !tags.includes(tag)) {
      onChange([...tags, tag]);
    }
    setInput("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(tag) {
    onChange(tags.filter((t) => t !== tag));
  }

  return (
    <div className="min-h-10 rounded-lg border border-zinc-300 bg-background px-2 py-1.5 focus-within:ring-2 focus-within:ring-zinc-400">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-md bg-zinc-200 px-2 py-0.5 text-xs text-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-0.5 text-zinc-400 transition hover:text-zinc-700"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={tags.length === 0 ? "Add tags…" : ""}
          className="min-w-24 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-zinc-400"
        />
      </div>
    </div>
  );
}

export function ProjectDrawer({
  open,
  project,
  archiveDrives,
  backupDrives,
  projectTypes,
  clients,
  onClose,
  onSave,
  onDelete,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setForm(project ? { ...EMPTY_FORM, ...project } : { ...EMPTY_FORM });
      setConfirmDelete(false);
      setError(null);
    }
  }, [open, project]);

  const set = useCallback((key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (err) {
      setError(err.message ?? "Failed to delete.");
    } finally {
      setSaving(false);
    }
  }

  const isEditing = Boolean(project);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col bg-background shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-label="Project drawer"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">
            {isEditing ? "Edit project" : "New project"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-100 hover:text-foreground"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-y-auto"
        >
          <div className="flex-1 space-y-6 px-6 py-5">
            <section>
              <p className={sectionTitle}>Identification</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="f-projectId">
                    Project ID
                  </label>
                  <input
                    id="f-projectId"
                    className={inputClass}
                    value={form.projectId}
                    onChange={(e) => set("projectId", e.target.value)}
                    placeholder="2024-001"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-invoiceNumber">
                    Invoice #
                  </label>
                  <input
                    id="f-invoiceNumber"
                    className={inputClass}
                    value={form.invoiceNumber}
                    onChange={(e) => set("invoiceNumber", e.target.value)}
                    placeholder="INV-042"
                  />
                </div>
              </div>
            </section>

            <section>
              <p className={sectionTitle}>Details</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="f-title">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="f-title"
                    className={inputClass}
                    value={form.title}
                    onChange={(e) => set("title", e.target.value)}
                    placeholder="Project title"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="f-client">
                      Client
                    </label>
                    <ClientCombobox
                      clients={clients}
                      value={form.client}
                      onChange={(v) => set("client", v)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="f-type">
                      Type
                    </label>
                    <div className="relative">
                      <select
                        id="f-type"
                        className={`${inputClass} appearance-none pr-7`}
                        value={form.type}
                        onChange={(e) => set("type", e.target.value)}
                      >
                        <option value="">— Select —</option>
                        {projectTypes.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <svg
                        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden
                      >
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass} htmlFor="f-date">
                      Date
                    </label>
                    <input
                      id="f-date"
                      type="text"
                      className={inputClass}
                      value={form.date}
                      onChange={(e) => set("date", e.target.value)}
                      placeholder="2024-06-15 or Maggio 2026"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="f-location">
                      Location
                    </label>
                    <input
                      id="f-location"
                      className={inputClass}
                      value={form.location}
                      onChange={(e) => set("location", e.target.value)}
                      placeholder="City, country…"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className={sectionTitle}>Storage</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass} htmlFor="f-archiveDrive">
                    Archive drive
                  </label>
                  <div className="relative">
                    <select
                      id="f-archiveDrive"
                      className={`${inputClass} appearance-none pr-7`}
                      value={form.archiveDrive}
                      onChange={(e) => set("archiveDrive", e.target.value)}
                    >
                      <option value="">— None —</option>
                      {archiveDrives.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-backupDrive">
                    Backup drive
                  </label>
                  <div className="relative">
                    <select
                      id="f-backupDrive"
                      className={`${inputClass} appearance-none pr-7`}
                      value={form.backupDrive}
                      onChange={(e) => set("backupDrive", e.target.value)}
                    >
                      <option value="">— None —</option>
                      {backupDrives.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <p className={sectionTitle}>Status</p>
              <div className="space-y-2">
                <ToggleCheckbox
                  id="f-cleaned"
                  label="Cleaned (duplicates removed, folders organised)"
                  checked={form.cleaned}
                  onChange={(v) => set("cleaned", v)}
                />
                <ToggleCheckbox
                  id="f-backupCompleted"
                  label="Backup completed"
                  checked={form.backupCompleted}
                  onChange={(v) => set("backupCompleted", v)}
                />
              </div>
            </section>

            <section>
              <p className={sectionTitle}>Notes & Tags</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="f-notes">
                    Notes
                  </label>
                  <textarea
                    id="f-notes"
                    rows={3}
                    className={`${inputClass} resize-none`}
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    placeholder="Any additional notes…"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="tag-input">
                    Tags
                    <span className="ml-1 font-normal text-zinc-400">
                      (Enter or comma to add)
                    </span>
                  </label>
                  <TagInput
                    tags={form.tags}
                    onChange={(v) => set("tags", v)}
                  />
                </div>
              </div>
            </section>
          </div>

          <div className="border-t border-zinc-200 px-6 py-4">
            {error && (
              <p className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                    confirmDelete
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "border border-zinc-200 text-zinc-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {confirmDelete ? "Confirm delete" : "Delete"}
                </button>
              )}
              {confirmDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="text-sm text-zinc-400 transition hover:text-zinc-600"
                >
                  Cancel
                </button>
              )}
              <div className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-200 px-4 py-2 text-sm text-zinc-600 transition hover:bg-zinc-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : isEditing ? "Save changes" : "Add project"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}
