"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDuration } from "@/lib/timeFormat";
import { liveElapsedSeconds } from "./timerLive";
import { TimerBar } from "./TimerBar";
import { TodayView } from "./TodayView";
import { WeekView } from "./WeekView";
import { ReportView } from "./ReportView";
import { EntryDrawer } from "./EntryDrawer";
import { ActivitySettings } from "./ActivitySettings";

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "report", label: "Report" },
];

function playPomodoroBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 400);
  } catch {
    // ignore
  }
}

function notifyPomodoro() {
  playPomodoroBeep();
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      new Notification("Pomodoro complete", {
        body: "25 minutes done. Timer stopped.",
      });
    } catch {
      // ignore
    }
  }
}

export function TimeShell({
  locale,
  initialProjects,
  initialActivityTypes,
  initialTimer,
  initialTodayTotalSeconds,
}) {
  const [view, setView] = useState("today");
  const [projects] = useState(initialProjects ?? []);
  const [activityTypes, setActivityTypes] = useState(
    initialActivityTypes ?? []
  );
  const [timer, setTimer] = useState(initialTimer ?? null);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(
    initialTodayTotalSeconds ?? 0
  );
  const [todayEntries, setTodayEntries] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [tick, setTick] = useState(0);
  const pomodoroNotifiedRef = useRef(false);

  const projectMap = useMemo(() => {
    const map = new Map();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const refreshToday = useCallback(async () => {
    setLoadingToday(true);
    setError(null);
    try {
      const res = await fetch("/api/time/entries?view=today");
      if (!res.ok) throw new Error("Failed to load today's entries.");
      const data = await res.json();
      setTodayEntries(data.entries ?? []);
      setTodayTotalSeconds(data.todayTotalSeconds ?? 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingToday(false);
    }
  }, []);

  const refreshTimer = useCallback(async () => {
    try {
      const res = await fetch("/api/time/timer");
      if (!res.ok) return;
      const data = await res.json();
      if (data.pomodoroCompleted) {
        setTimer(null);
        if (!pomodoroNotifiedRef.current) {
          pomodoroNotifiedRef.current = true;
          notifyPomodoro();
        }
        await refreshToday();
        return;
      }
      setTimer(data.timer);
      if (data.timer) pomodoroNotifiedRef.current = false;
    } catch {
      // ignore
    }
  }, [refreshToday]);

  useEffect(() => {
    refreshToday();
  }, [refreshToday]);

  // Live tick while timer is running
  useEffect(() => {
    if (!timer || timer.status !== "running") return undefined;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [timer?.status, timer?.startedAt]);

  // Poll server every 30s for pomodoro / multi-device sync
  useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(() => {
      refreshTimer();
    }, 30000);
    return () => clearInterval(id);
  }, [timer, refreshTimer]);

  // Client-side pomodoro check
  useEffect(() => {
    if (!timer || !timer.pomodoroEnabled || timer.status !== "running") return;
    const elapsed = liveElapsedSeconds(timer);
    if (elapsed >= timer.pomodoroMinutes * 60) {
      (async () => {
        const res = await fetch("/api/time/timer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkPomodoro" }),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data.pomodoroCompleted) {
          setTimer(null);
          if (!pomodoroNotifiedRef.current) {
            pomodoroNotifiedRef.current = true;
            notifyPomodoro();
          }
          await refreshToday();
        }
      })();
    }
  }, [timer, tick, refreshToday]);

  async function timerAction(action, payload = {}) {
    setError(null);
    if (action === "start" && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
    const res = await fetch("/api/time/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Timer action failed.");
      return;
    }
    if (action === "stop" || data.pomodoroCompleted) {
      setTimer(null);
      await refreshToday();
      return;
    }
    setTimer(data.timer);
  }

  function openNewEntry() {
    setEditingEntry(null);
    setDrawerOpen(true);
  }

  function openEditEntry(entry) {
    setEditingEntry(entry);
    setDrawerOpen(true);
  }

  async function handleSaveEntry(payload) {
    if (editingEntry) {
      const res = await fetch(`/api/time/entries/${editingEntry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update entry.");
      }
    } else {
      const res = await fetch("/api/time/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create entry.");
      }
    }
    setDrawerOpen(false);
    setEditingEntry(null);
    await refreshToday();
  }

  async function handleDeleteEntry(id) {
    const res = await fetch(`/api/time/entries/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Failed to delete entry.");
      return;
    }
    await refreshToday();
  }

  async function saveActivityTypes(next) {
    const res = await fetch("/api/time/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityTypes: next }),
    });
    if (!res.ok) throw new Error("Failed to save activity types.");
    const data = await res.json();
    setActivityTypes(data.activityTypes);
  }

  const displayTodayTotal = useMemo(() => {
    let total = todayTotalSeconds;
    // todayTotalSeconds from API already includes running timer when refreshed;
    // for live display, recompute: entries sum + live timer
    const entriesSum = todayEntries.reduce(
      (s, e) => s + (e.durationSeconds || 0),
      0
    );
    const running = timer ? liveElapsedSeconds(timer) : 0;
    total = entriesSum + running;
    return total;
  }, [todayEntries, timer, tick, todayTotalSeconds]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TimerBar
        timer={timer}
        tick={tick}
        projects={projects}
        activityTypes={activityTypes}
        todayTotalSeconds={displayTodayTotal}
        onAction={timerAction}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 px-6 py-2">
        <nav className="flex items-center gap-1" aria-label="Time views">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === v.id
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          {view === "today" && (
            <button
              type="button"
              onClick={openNewEntry}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700"
            >
              Add hours
            </button>
          )}
          <a
            href="/api/time/export?format=xlsx"
            className="flex h-8 items-center rounded-lg border border-zinc-200 px-3 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            Export
          </a>
        </div>
      </div>

      {error ? (
        <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {view === "today" && (
          <TodayView
            entries={todayEntries}
            loading={loadingToday}
            projectMap={projectMap}
            todayTotalSeconds={displayTodayTotal}
            onEdit={openEditEntry}
            onDelete={handleDeleteEntry}
          />
        )}
        {view === "week" && (
          <WeekView projectMap={projectMap} locale={locale} />
        )}
        {view === "report" && <ReportView />}
      </div>

      {drawerOpen && (
        <EntryDrawer
          entry={editingEntry}
          projects={projects}
          activityTypes={activityTypes}
          onClose={() => {
            setDrawerOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
        />
      )}

      {settingsOpen && (
        <ActivitySettings
          activityTypes={activityTypes}
          onClose={() => setSettingsOpen(false)}
          onSave={saveActivityTypes}
        />
      )}
    </div>
  );
}
