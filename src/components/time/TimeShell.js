"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { liveElapsedSeconds } from "./timerLive";
import { useNow } from "@/components/studio/hooks/useNow";
import { TimerBar } from "./TimerBar";
import { TodayView } from "./TodayView";
import { WeekView } from "./WeekView";
import { ReportView } from "./ReportView";
import { ProjectsView } from "./ProjectsView";
import { EntryDrawer } from "./EntryDrawer";
import { useStudioData } from "@/components/studio/StudioDataProvider";
import { apiFetch } from "@/components/studio/api";
import { ErrorBanner } from "@/components/studio/ui/ErrorBanner";

const VIEWS = [
  { id: "today", label: "Today" },
  { id: "week", label: "Week" },
  { id: "projects", label: "Projects" },
  { id: "report", label: "Report" },
];

function playPomodoroBeep() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const pulses = [
      { at: 0, freq: 880, dur: 0.18 },
      { at: 0.28, freq: 880, dur: 0.18 },
      { at: 0.56, freq: 1175, dur: 0.35 },
    ];
    for (const p of pulses) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = p.freq;
      const t0 = ctx.currentTime + p.at;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + p.dur);
      osc.start(t0);
      osc.stop(t0 + p.dur + 0.02);
    }
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // ignore
  }
}

async function fetchToday() {
  return apiFetch("/api/time/entries?view=today", {
    fallbackMessage: "Failed to load today's entries.",
  });
}

function notifyPomodoro() {
  playPomodoroBeep();
  if (
    typeof Notification !== "undefined" &&
    Notification.permission === "granted"
  ) {
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
  active = true,
  initialTimer,
  initialTodayTotalSeconds,
}) {
  const { projects } = useStudioData();

  const [view, setView] = useState("today");
  const [timer, setTimer] = useState(initialTimer ?? null);
  const [todayTotalSeconds, setTodayTotalSeconds] = useState(
    initialTodayTotalSeconds ?? 0
  );
  const [todayEntries, setTodayEntries] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [listVersion, setListVersion] = useState(0);
  const pomodoroNotifiedRef = useRef(false);
  const timerCheckInFlightRef = useRef(false);
  const draftRef = useRef(null);

  const projectMap = useMemo(() => {
    const map = new Map();
    for (const p of projects) map.set(p.id, p);
    return map;
  }, [projects]);

  const bumpLists = useCallback(() => {
    setListVersion((v) => v + 1);
  }, []);

  const applyToday = useCallback((data) => {
    setTodayEntries(data.entries ?? []);
    setTodayTotalSeconds(data.todayTotalSeconds ?? 0);
    setRecentTasks(data.recentTasks ?? []);
  }, []);

  const refreshToday = useCallback(async () => {
    setLoadingToday(true);
    setError(null);
    try {
      applyToday(await fetchToday());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingToday(false);
    }
  }, [applyToday]);

  // Syncs the timer with the server and lets the server complete a due
  // Pomodoro. One request at a time: the server records the entry only once
  // anyway, but there is no point in piling up requests every second.
  const refreshTimer = useCallback(async () => {
    if (timerCheckInFlightRef.current) return;
    timerCheckInFlightRef.current = true;
    try {
      const data = await apiFetch("/api/time/timer", {
        method: "POST",
        body: {
          action: "checkPomodoro",
          // Unsaved text in the timer bar goes into the entry if it completes.
          description: draftRef.current?.description,
        },
      });
      if (data.pomodoroCompleted) {
        setTimer(null);
        if (!pomodoroNotifiedRef.current) {
          pomodoroNotifiedRef.current = true;
          notifyPomodoro();
        }
        await refreshToday();
        bumpLists();
        return;
      }
      setTimer(data.timer);
      if (data.timer) pomodoroNotifiedRef.current = false;
    } catch {
      // Network or server error: the next check retries.
    } finally {
      timerCheckInFlightRef.current = false;
    }
  }, [refreshToday, bumpLists]);

  // First load. State is set only when the response arrives.
  useEffect(() => {
    let ignore = false;
    fetchToday()
      .then((data) => {
        if (!ignore) applyToday(data);
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoadingToday(false);
      });
    return () => {
      ignore = true;
    };
  }, [applyToday]);

  // Live clock while the timer runs and this tab is visible.
  const now = useNow(active && timer?.status === "running");

  useEffect(() => {
    // Still poll while hidden so Pomodoro can complete in background
    if (!timer) return undefined;
    const id = setInterval(() => {
      refreshTimer();
    }, 30000);
    return () => clearInterval(id);
  }, [timer, refreshTimer]);

  useEffect(() => {
    // Ask the server to complete the Pomodoro when it is due. If the server's
    // clock says "not yet", the timer state comes back and this re-arms, at
    // most once per second.
    if (!active) return undefined;
    if (!timer || !timer.pomodoroEnabled || timer.status !== "running") {
      return undefined;
    }
    const remainingMs =
      (timer.pomodoroMinutes * 60 - liveElapsedSeconds(timer)) * 1000;
    const id = setTimeout(() => {
      refreshTimer();
    }, Math.max(1000, remainingMs));
    return () => clearTimeout(id);
  }, [active, timer, refreshTimer]);

  async function timerAction(action, payload = {}) {
    setError(null);
    if (action === "start" && typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
    let data;
    try {
      data = await apiFetch("/api/time/timer", {
        method: "POST",
        body: { action, ...payload },
        fallbackMessage: "Timer action failed.",
      });
    } catch (err) {
      setError(err.message);
      return;
    }
    if (action === "stop" || data.pomodoroCompleted) {
      if (data.pomodoroCompleted && !pomodoroNotifiedRef.current) {
        pomodoroNotifiedRef.current = true;
        notifyPomodoro();
      }
      setTimer(null);
      await refreshToday();
      bumpLists();
      return;
    }
    setTimer(data.timer);
  }

  async function handleRestart(entry) {
    if (timer) {
      setError("Stop the current timer before starting a new one.");
      return;
    }
    const pomodoro = Boolean(draftRef.current?.pomodoro);
    draftRef.current?.applyDraft?.({
      projectId: entry.projectId ?? "",
      description: entry.description ?? "",
    });
    await timerAction("start", {
      projectId: entry.projectId ?? "",
      description: entry.description ?? "",
      pomodoroEnabled: pomodoro,
    });
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
    // Errors are shown inside the drawer (EntryDrawer catches them).
    if (editingEntry) {
      await apiFetch(`/api/time/entries/${editingEntry.id}`, {
        method: "PUT",
        body: payload,
        fallbackMessage: "Failed to update entry.",
      });
    } else {
      await apiFetch("/api/time/entries", {
        method: "POST",
        body: payload,
        fallbackMessage: "Failed to create entry.",
      });
    }
    setDrawerOpen(false);
    setEditingEntry(null);
    await refreshToday();
    bumpLists();
  }

  async function handleDeleteEntry(id) {
    setError(null);
    try {
      await apiFetch(`/api/time/entries/${id}`, {
        method: "DELETE",
        fallbackMessage: "Failed to delete entry.",
      });
    } catch (err) {
      setError(err.message);
      return;
    }
    await refreshToday();
    bumpLists();
  }

  const entriesTotalSeconds = useMemo(
    () => todayEntries.reduce((s, e) => s + (e.durationSeconds || 0), 0),
    [todayEntries]
  );
  const displayTodayTotal =
    entriesTotalSeconds + (timer ? liveElapsedSeconds(timer, now) : 0);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TimerBar
        timer={timer}
        now={now}
        projects={projects}
        recentTasks={recentTasks}
        todayTotalSeconds={displayTodayTotal}
        onAction={timerAction}
        draftRef={draftRef}
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
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download from an API route, not a page */}
          <a
            href="/api/time/export?format=xlsx"
            className="flex h-8 items-center rounded-lg border border-zinc-200 px-3 text-sm text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            Export
          </a>
        </div>
      </div>

      <ErrorBanner className="mx-6 mt-3">{error}</ErrorBanner>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        {view === "today" && (
          <TodayView
            entries={todayEntries}
            recentTasks={recentTasks}
            loading={loadingToday}
            projectMap={projectMap}
            todayTotalSeconds={displayTodayTotal}
            timerActive={Boolean(timer)}
            onEdit={openEditEntry}
            onDelete={handleDeleteEntry}
            onRestart={handleRestart}
          />
        )}
        {view === "week" && (
          <WeekView projectMap={projectMap} locale={locale} />
        )}
        {view === "projects" && (
          <ProjectsView
            key={listVersion}
            projectMap={projectMap}
            timerActive={Boolean(timer)}
            onRestart={handleRestart}
            onEdit={openEditEntry}
            onDelete={handleDeleteEntry}
            onChanged={() => {
              refreshToday();
              refreshTimer();
            }}
          />
        )}
        {view === "report" && <ReportView />}
      </div>

      {drawerOpen && (
        <EntryDrawer
          entry={editingEntry}
          projects={projects}
          recentTasks={recentTasks}
          onClose={() => {
            setDrawerOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSaveEntry}
        />
      )}
    </div>
  );
}
