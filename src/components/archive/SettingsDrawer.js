"use client";

import { useState } from "react";
import { Drawer } from "@/components/studio/ui/Drawer";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";
import { apiFetch } from "@/components/studio/api";
import { EditableList } from "./settings/EditableList";
import { DrivesEditor } from "./settings/DrivesEditor";

const EMPTY_RENAMES = { projectTypes: [], archiveDrives: [], clients: [] };

export function SettingsDrawer({ open, settings, clients, onClose, onSaved }) {
  const [projectTypes, setProjectTypes] = useState([]);
  const [archiveDrives, setArchiveDrives] = useState([]);
  const [driveCapacities, setDriveCapacities] = useState({});
  const [localClients, setLocalClients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [renames, setRenames] = useState(EMPTY_RENAMES);

  function pushRename(key, from, to) {
    setRenames((prev) => ({ ...prev, [key]: [...prev[key], { from, to }] }));
  }

  // On opening (or when the saved data changes while open), start from the
  // saved values. Done during render, not in an effect.
  const [syncedFor, setSyncedFor] = useState({ open: false, settings: null, clients: null });
  if (
    syncedFor.open !== open ||
    syncedFor.settings !== settings ||
    syncedFor.clients !== clients
  ) {
    setSyncedFor({ open, settings, clients });
    if (open) {
      setProjectTypes(settings?.projectTypes ?? []);
      setArchiveDrives(settings?.archiveDrives ?? []);
      setDriveCapacities(settings?.driveCapacities ?? {});
      setLocalClients(clients ?? []);
      setSaveError(null);
      setRenames(EMPTY_RENAMES);
    }
  }


  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      // One request, one transaction: lists, renames (applied to every
      // project) and the client list. Either all of it is saved or nothing.
      const newSettings = await apiFetch("/api/archive/settings", {
        method: "PUT",
        body: {
          projectTypes,
          archiveDrives,
          driveCapacities,
          renames,
          clients: localClients,
        },
        fallbackMessage: "Failed to save settings.",
      });
      const updatedClients = await apiFetch("/api/archive/clients").catch(
        () => localClients
      );
      onSaved(newSettings, updatedClients);
      onClose();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Settings"
      closeLabel="Close settings"
      widthClass="max-w-sm"
    >
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <EditableList
            label="Project Types"
            items={projectTypes}
            onChange={setProjectTypes}
            onRename={(from, to) => pushRename("projectTypes", from, to)}
          />
          <DrivesEditor
            drives={archiveDrives}
            capacities={driveCapacities}
            onChangeDrives={setArchiveDrives}
            onChangeCapacities={setDriveCapacities}
            onRename={(from, to) => pushRename("archiveDrives", from, to)}
          />
          <EditableList
            label="Clients"
            items={localClients}
            onChange={setLocalClients}
            onRename={(from, to) => pushRename("clients", from, to)}
          />
        </div>

        <footer className="border-t border-zinc-200 px-5 py-4 space-y-2">
          <ErrorBanner>{saveError}</ErrorBanner>
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
    </Drawer>
  );
}
