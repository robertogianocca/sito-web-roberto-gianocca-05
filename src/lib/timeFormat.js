export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

/** Always H:MM:SS — stable width for hero timer display */
export function formatDurationHMS(totalSeconds) {
  const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function formatDurationHours(totalSeconds) {
  const s = Math.max(0, Number(totalSeconds) || 0);
  return (s / 3600).toFixed(2);
}

/** Local YYYY-MM-DD */
export function toLocalDateInput(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local HH:MM */
export function toLocalTimeInput(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Combine local date + time inputs into ISO UTC string */
export function localDateTimeToIso(dateStr, timeStr) {
  if (!dateStr) return null;
  const time = timeStr || "00:00";
  const d = new Date(`${dateStr}T${time}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
