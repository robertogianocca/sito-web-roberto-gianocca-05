/**
 * The studio is English-only by choice (it is a private tool). Dates and
 * times use one locale everywhere: en-GB, i.e. 24-hour times and day before
 * month ("20 Nov", "15:05").
 */
export const STUDIO_LOCALE = "en-GB";

/** "1 entry", "3 entries": the count with the right form of the word. */
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

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

/** Local date range of the last `days` days, as `{ from, to }` YYYY-MM-DD. */
export function lastDaysRange(days = 30) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return { from: toLocalDateInput(from), to: toLocalDateInput(to) };
}

/**
 * Query params `from` / `to` (ISO) for a local date range; `to` is inclusive,
 * so it becomes the start of the following day. Empty or invalid dates are
 * left out.
 */
export function localDateRangeParams(from, to, extra = {}) {
  const params = new URLSearchParams(extra);
  const start = from ? new Date(`${from}T00:00:00`) : null;
  if (start && !Number.isNaN(start.getTime())) {
    params.set("from", start.toISOString());
  }
  const end = to ? new Date(`${to}T00:00:00`) : null;
  if (end && !Number.isNaN(end.getTime())) {
    end.setDate(end.getDate() + 1);
    params.set("to", end.toISOString());
  }
  return params;
}
