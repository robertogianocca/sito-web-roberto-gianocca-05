"use client";

import { Drawer } from "@/components/studio/ui/Drawer";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";
import { useState } from "react";
import {
  localDateTimeToIso,
  toLocalDateInput,
  toLocalTimeInput,
} from "@/lib/timeFormat";
import { ProjectCombobox } from "./ProjectCombobox";
import {
  DescriptionCombobox,
  descriptionsForProject,
} from "./DescriptionCombobox";

export function EntryDrawer({
  entry,
  projects,
  recentTasks = [],
  onClose,
  onSave,
}) {
  const isEdit = Boolean(entry);
  const initialStart = entry?.startedAt ? new Date(entry.startedAt) : new Date();
  const initialEnd = entry?.endedAt
    ? new Date(entry.endedAt)
    : new Date(initialStart.getTime() + 60 * 60 * 1000);

  const [projectId, setProjectId] = useState(entry?.projectId ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [date, setDate] = useState(toLocalDateInput(initialStart));
  const [startTime, setStartTime] = useState(toLocalTimeInput(initialStart));
  const [endTime, setEndTime] = useState(toLocalTimeInput(initialEnd));
  const [mode, setMode] = useState("range");
  const [durationHours, setDurationHours] = useState(
    entry ? (entry.durationSeconds / 3600).toFixed(2) : "1"
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      let startedAt;
      let endedAt;
      let durationSeconds;

      if (mode === "duration") {
        startedAt = localDateTimeToIso(date, startTime);
        const hours = Number(durationHours);
        if (!startedAt || !Number.isFinite(hours) || hours <= 0) {
          throw new Error("Enter a valid start time and duration.");
        }
        durationSeconds = Math.round(hours * 3600);
        endedAt = new Date(
          new Date(startedAt).getTime() + durationSeconds * 1000
        ).toISOString();
      } else {
        startedAt = localDateTimeToIso(date, startTime);
        endedAt = localDateTimeToIso(date, endTime);
        if (!startedAt || !endedAt) {
          throw new Error("Enter valid start and end times.");
        }
        if (new Date(endedAt) <= new Date(startedAt)) {
          throw new Error("End time must be after start time.");
        }
        durationSeconds = Math.floor(
          (new Date(endedAt) - new Date(startedAt)) / 1000
        );
      }

      await onSave({
        projectId,
        description,
        startedAt,
        endedAt,
        durationSeconds,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Mounted only while open (see TimeShell), so `open` is always true here.
  return (
    <Drawer
      open
      onClose={onClose}
      title={isEdit ? "Edit entry" : "Add hours"}
      widthClass="max-w-md"
    >

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-4 overflow-auto px-5 py-4">
            <div className="block space-y-1">
              <label htmlFor="entry-project" className="text-sm font-medium">
                Project
              </label>
              <ProjectCombobox
                id="entry-project"
                projects={projects}
                value={projectId}
                onChange={setProjectId}
              />
            </div>

            <div className="block space-y-1">
              <label htmlFor="entry-description" className="text-sm font-medium">
                Description
              </label>
              <DescriptionCombobox
                id="entry-description"
                value={description}
                onChange={setDescription}
                suggestions={descriptionsForProject(recentTasks, projectId)}
                inputClassName="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </div>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Date</span>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </label>

            <div className="flex gap-2">
              <button
                type="button"
                aria-pressed={mode === "range"}
                onClick={() => setMode("range")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "range"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                Start / end
              </button>
              <button
                type="button"
                aria-pressed={mode === "duration"}
                onClick={() => setMode("duration")}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  mode === "duration"
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600"
                }`}
              >
                Duration
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-sm font-medium">Start</span>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </label>
              {mode === "range" ? (
                <label className="block space-y-1">
                  <span className="text-sm font-medium">End</span>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
              ) : (
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Hours</span>
                  <input
                    type="number"
                    min="0.01"
                    // "any": with min 0.01 and step 0.25 only 0.01, 0.26, …
                    // were valid, so "1" or "2" blocked the form.
                    step="any"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
              )}
            </div>

            <ErrorBanner>{error}</ErrorBanner>
          </div>

          <footer className="border-t border-zinc-200 px-5 py-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-zinc-900 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Add entry"}
            </button>
          </footer>
        </form>
    </Drawer>
  );
}
