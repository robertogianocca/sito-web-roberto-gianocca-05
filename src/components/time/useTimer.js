"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { apiFetch } from "@/components/studio/api";
import { liveElapsedSeconds } from "./timerLive";
import { notifyPomodoro, requestNotificationPermission } from "./pomodoroAlert";

const POLL_MS = 30_000;

/**
 * The running timer, kept in sync with the server.
 *
 * - `run(action, payload)`: start | pause | resume | stop | update. Throws an
 *   ApiError (with the server's message) when the action fails.
 * - While a timer exists it is checked every 30 s, also when the tab is
 *   hidden, so a Pomodoro completes in the background; when the Time tab is
 *   visible, the check also runs right when the Pomodoro is due. One check at
 *   a time; the server records the entry only once anyway.
 * - `onEntryRecorded()` runs after an entry is created (stop or Pomodoro).
 * - `draftRef.current.description`: text typed in the timer bar but not saved,
 *   sent with the Pomodoro check so it ends up in the entry.
 */
export function useTimer({ initialTimer = null, active = true, draftRef, onEntryRecorded }) {
  const [timer, setTimer] = useState(initialTimer);
  const notifiedRef = useRef(false);
  const checkingRef = useRef(false);
  const onEntryRecordedRef = useRef(onEntryRecorded);

  useEffect(() => {
    onEntryRecordedRef.current = onEntryRecorded;
  });

  const entryRecorded = useCallback(async ({ pomodoroCompleted, entry }) => {
    setTimer(null);
    if (pomodoroCompleted && !notifiedRef.current) {
      notifiedRef.current = true;
      notifyPomodoro((entry?.durationSeconds ?? 1500) / 60);
    }
    await onEntryRecordedRef.current?.();
  }, []);

  const refresh = useCallback(async () => {
    if (checkingRef.current) return;
    checkingRef.current = true;
    try {
      const data = await apiFetch("/api/time/timer", {
        method: "POST",
        body: { action: "checkPomodoro", description: draftRef?.current?.description },
      });
      if (data.pomodoroCompleted) {
        await entryRecorded(data);
        return;
      }
      setTimer(data.timer);
      if (data.timer) notifiedRef.current = false;
    } catch {
      // Network or server error: the next check retries.
    } finally {
      checkingRef.current = false;
    }
  }, [draftRef, entryRecorded]);

  const run = useCallback(
    async (action, payload = {}) => {
      if (action === "start") requestNotificationPermission();
      const data = await apiFetch("/api/time/timer", {
        method: "POST",
        body: { action, ...payload },
        fallbackMessage: "Timer action failed.",
      });
      if (action === "stop" || data.pomodoroCompleted) {
        await entryRecorded(data);
      } else {
        setTimer(data.timer);
      }
      return data;
    },
    [entryRecorded]
  );

  // Background check while a timer exists.
  useEffect(() => {
    if (!timer) return undefined;
    const id = setInterval(refresh, POLL_MS);
    return () => clearInterval(id);
  }, [timer, refresh]);

  // Check right when the Pomodoro is due. If the server's clock says "not
  // yet", the timer comes back and this re-arms, at most once per second.
  useEffect(() => {
    if (!active || !timer?.pomodoroEnabled || timer.status !== "running") return undefined;
    const remainingMs = (timer.pomodoroMinutes * 60 - liveElapsedSeconds(timer)) * 1000;
    const id = setTimeout(refresh, Math.max(1000, remainingMs));
    return () => clearTimeout(id);
  }, [active, timer, refresh]);

  return { timer, run, refresh };
}
