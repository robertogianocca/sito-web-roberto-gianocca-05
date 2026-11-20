"use client";

import { useState, useCallback } from "react";
import { Drawer } from "@/components/studio/ui/Drawer";
import { MultiCombobox } from "@/components/studio/ui/MultiCombobox";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";
import { formatProjectId } from "./archiveStatus";
import { BackupTypeSelect, TagInput, ToggleCheckbox } from "./ProjectFields";

const EMPTY_FORM = {
  projectId: "",
  invoiceNumber: "",
  title: "",
  client: [],
  type: [],
  date: "",
  location: "",
  archiveDrive: [],
  backupDrive: [],
  size: "",
  cleaned: false,
  paid: true,
  backupType: "",
  contact: "",
  notes: "",
  tags: [],
};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-background px-3 py-1.5 text-sm text-foreground outline-none ring-zinc-400 focus:ring-2 disabled:opacity-50";
const labelClass = "block text-xs font-medium text-zinc-600";
const sectionTitle = "text-2xs font-semibold uppercase tracking-wider text-zinc-400 mb-3";

function formFromProject(project) {
  if (!project) return { ...EMPTY_FORM };
  return {
    ...EMPTY_FORM,
    ...project,
    backupType: project.backupType ?? "",
    paid: project.paid !== false,
    contact: project.contact ?? "",
    size: project.size ?? "",
    notes: project.notes ?? "",
  };
}

export function ProjectDrawer({
  open,
  project,
  archiveDrives,
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

  // On opening (or when another project is passed while open), load its
  // values into the form. Done during render, not in an effect.
  const [syncedFor, setSyncedFor] = useState({ open: false, project: null });
  if (syncedFor.open !== open || syncedFor.project !== project) {
    setSyncedFor({ open, project });
    if (open) {
      setForm(formFromProject(project));
      setConfirmDelete(false);
      setError(null);
    }
  }

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
      await onSave({ ...form, projectId: formatProjectId(form.projectId) });
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
    <Drawer
      open={open}
      onClose={onClose}
      title={isEditing ? "Edit project" : "New project"}
      closeLabel="Close project"
    >
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
                    onBlur={() => set("projectId", formatProjectId(form.projectId))}
                    placeholder="011"
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
                    <label className={labelClass} htmlFor="f-client">Client</label>
                    <MultiCombobox
                      id="f-client"
                      options={clients}
                      selected={form.client}
                      onChange={(v) => set("client", v)}
                      creatable
                      placeholder="Search or add…"
                      addLabel="Add client"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="f-type">Type</label>
                    <MultiCombobox
                      id="f-type"
                      options={projectTypes}
                      selected={form.type}
                      onChange={(v) => set("type", v)}
                      creatable
                      placeholder="Search or add…"
                      addLabel="Add type"
                    />
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
                  <label className={labelClass} htmlFor="f-archiveDrive">Archive drive</label>
                  <MultiCombobox
                    id="f-archiveDrive"
                    options={archiveDrives}
                    selected={form.archiveDrive}
                    onChange={(v) => set("archiveDrive", v)}
                    creatable
                    placeholder="— None —"
                    addLabel="Add drive"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="f-backupDrive">Backup drive</label>
                  <MultiCombobox
                    id="f-backupDrive"
                    options={archiveDrives}
                    selected={form.backupDrive}
                    onChange={(v) => set("backupDrive", v)}
                    placeholder="— None —"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className={labelClass} htmlFor="f-size">
                  Size
                </label>
                <input
                  id="f-size"
                  type="text"
                  className={inputClass}
                  value={form.size}
                  onChange={(e) => set("size", e.target.value)}
                  placeholder="3 GB"
                />
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
                  id="f-paid"
                  label="Paid"
                  checked={form.paid}
                  onChange={(v) => set("paid", v)}
                />
                <BackupTypeSelect
                  value={form.backupType}
                  onChange={(v) => set("backupType", v)}
                />
              </div>
            </section>

            <section>
              <p className={sectionTitle}>Notes & Tags</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass} htmlFor="f-contact">
                    Contact
                  </label>
                  <input
                    id="f-contact"
                    type="text"
                    className={inputClass}
                    value={form.contact ?? ""}
                    onChange={(e) => set("contact", e.target.value)}
                    placeholder="Name, email, phone…"
                  />
                </div>
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
<ErrorBanner className="mb-3">
                {error}
              </ErrorBanner>
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
    </Drawer>
  );
}
