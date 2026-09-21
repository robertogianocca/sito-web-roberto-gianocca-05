"use client";

import { useState } from "react";
import {
  localDateTimeToIso,
  toLocalDateInput,
  toLocalTimeInput,
} from "@/lib/timeFormat";
import { ProjectCombobox } from "./ProjectCombobox";

export function EntryDrawer({ entry, projects, activityTypes, onClose, onSave }) {
  const isEdit = Boolean(entry);
  const initialStart = entry?.startedAt ? new Date(entry.startedAt) : new Date();
  const initialEnd = entry?.endedAt
    ? new Date(entry.endedAt)
    : new Date(Date.now() + 60 * 60 * 1000);

  const [projectId, setProjectId] = useState(entry?.projectId ?? "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [activityType, setActivityType] = useState(entry?.activityType ?? "");
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
        activityType,
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

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-background shadow-xl">
        <header className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold">
            {isEdit ? "Edit entry" : "Add hours"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
          >
            Close
          </button>
        </header>

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

            <label className="block space-y-1">
              <span className="text-sm font-medium">Description</span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium">Activity</span>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              >
                <option value="">—</option>
                {activityTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>

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
                    step="0.25"
                    required
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                  />
                </label>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
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
      </aside>
    </div>
  );
}
