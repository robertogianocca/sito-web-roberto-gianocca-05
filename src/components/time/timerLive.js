import { formatDuration, formatDurationHMS } from "@/lib/timeFormat";

export function liveElapsedSeconds(timer) {
  if (!timer?.startedAt) return 0;
  const startMs = new Date(timer.startedAt).getTime();
  if (Number.isNaN(startMs)) return 0;
  const pauseSeconds = Number(timer.pauseSeconds ?? 0);
  if (timer.pausedAt || timer.status === "paused") {
    const pausedMs = new Date(timer.pausedAt).getTime();
    if (Number.isNaN(pausedMs)) return Number(timer.elapsedSeconds ?? 0);
    return Math.max(0, Math.floor((pausedMs - startMs) / 1000) - pauseSeconds);
  }
  return Math.max(0, Math.floor((Date.now() - startMs) / 1000) - pauseSeconds);
}

export function formatLiveDuration(timer) {
  return formatDuration(liveElapsedSeconds(timer));
}

export function formatLiveDurationHMS(timer) {
  return formatDurationHMS(timer ? liveElapsedSeconds(timer) : 0);
}
