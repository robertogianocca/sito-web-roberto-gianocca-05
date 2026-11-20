"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { liveElapsedSeconds } from "./timerLive";
import { useStudioTimer } from "./TimerProvider";
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

async function fetchToday() {
  return apiFetch("/api/time/entries?view=today", {
    fallbackMessage: "Failed to load today's entries.",
  });
}

export function TimeShell({ active = true }) {
  const { projects } = useStudioData();

  const [view, setView] = useState("today");
  const [todayEntries, setTodayEntries] = useState([]);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loadingToday, setLoadingToday] = useState(true);
  const [error, setError] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [listVersion, setListVersion] = useState(0);

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

  const {
    timer,
    run: runTimer,
    refresh: refreshTimer,
    draftRef,
    onEntryRecorded,
  } = useStudioTimer();

  // When the timer records an entry (stop, Pomodoro), refresh today's list.
  useEffect(
    () =>
      onEntryRecorded(async () => {
        await refreshToday();
        bumpLists();
      }),
    [onEntryRecorded, refreshToday, bumpLists]
  );

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

  async function timerAction(action, payload = {}) {
    setError(null);
    try {
      await runTimer(action, payload);
    } catch (err) {
      setError(err.message);
    }
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

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-zinc-200 px-4 py-2 sm:px-6">
        <nav className="-mx-1 flex min-w-0 items-center gap-1 overflow-x-auto px-1" aria-label="Time views">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-current={view === v.id ? "page" : undefined}
              className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                view === v.id
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
              }`}
            >
              {v.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {view === "today" && (
            <button
              type="button"
              onClick={openNewEntry}
              className="flex h-8 items-center gap-1.5 whitespace-nowrap rounded-lg bg-zinc-900 px-3 text-sm font-medium text-zinc-50 transition hover:bg-zinc-700"
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

      <ErrorBanner className="mx-4 mt-3 sm:mx-6">{error}</ErrorBanner>

      <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
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
          <WeekView projectMap={projectMap} />
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
