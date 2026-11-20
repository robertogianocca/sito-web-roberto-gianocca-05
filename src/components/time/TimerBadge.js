"use client";

import { formatDurationHMS } from "@/lib/timeFormat";
import { useNow } from "@/components/studio/hooks/useNow";
import { liveElapsedSeconds } from "./timerLive";
import { useStudioTimer } from "./TimerProvider";

/** "● 0:12:34" next to the Time tab while a timer runs (amber when paused). */
export function TimerBadge() {
  const { timer } = useStudioTimer();
  const running = timer?.status === "running";
  const now = useNow(running);
  if (!timer) return null;

  return (
    <span className="ml-2 inline-flex items-center gap-1 font-mono text-xs tabular-nums">
      <span
        className={`h-1.5 w-1.5 rounded-full ${running ? "bg-emerald-500" : "bg-amber-500"}`}
        aria-hidden
      />
      <span className="sr-only">{running ? "Timer running:" : "Timer paused:"}</span>
      {formatDurationHMS(liveElapsedSeconds(timer, now))}
    </span>
  );
}
