/**
 * Elapsed running seconds of a timer at `now` (ms), pauses excluded.
 * Pass `now` from useNow() when rendering, so the value updates every second.
 * With `now === null` (server render and hydration) a running timer shows the
 * `elapsedSeconds` the server computed, so server and browser HTML match.
 */
export function liveElapsedSeconds(timer, now = Date.now()) {
  if (!timer?.startedAt) return 0;
  const startMs = new Date(timer.startedAt).getTime();
  if (Number.isNaN(startMs)) return 0;
  const pauseSeconds = Number(timer.pauseSeconds ?? 0);
  if (timer.pausedAt || timer.status === "paused") {
    const pausedMs = new Date(timer.pausedAt).getTime();
    if (Number.isNaN(pausedMs)) return Number(timer.elapsedSeconds ?? 0);
    return Math.max(0, Math.floor((pausedMs - startMs) / 1000) - pauseSeconds);
  }
  if (now === null) return Number(timer.elapsedSeconds ?? 0);
  return Math.max(0, Math.floor((now - startMs) / 1000) - pauseSeconds);
}
