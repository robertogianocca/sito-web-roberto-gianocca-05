"use client";

import { createContext, useCallback, useContext, useMemo, useRef } from "react";
import { useTimer } from "./useTimer";

const TimerContext = createContext(null);

/**
 * The running timer for the whole studio (both tabs), so the Time tab can
 * show it while Archive is open, and a Pomodoro completes on time wherever
 * you are. The Time view registers what to refresh when an entry is
 * recorded with `onEntryRecorded(fn)` (returns an unsubscribe function).
 */
export function TimerProvider({ initialTimer = null, children }) {
  const draftRef = useRef(null);
  const listenersRef = useRef(new Set());

  const { timer, run, refresh } = useTimer({
    initialTimer,
    // Check the Pomodoro when due even if the Time tab is not showing.
    active: true,
    draftRef,
    onEntryRecorded: async () => {
      await Promise.all([...listenersRef.current].map((listener) => listener()));
    },
  });

  const onEntryRecorded = useCallback((listener) => {
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const value = useMemo(
    () => ({ timer, run, refresh, draftRef, onEntryRecorded }),
    [timer, run, refresh, onEntryRecorded]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useStudioTimer() {
  const value = useContext(TimerContext);
  if (!value) throw new Error("useStudioTimer must be used inside TimerProvider");
  return value;
}
