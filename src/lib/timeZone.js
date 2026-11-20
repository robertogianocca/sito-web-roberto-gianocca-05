/**
 * Calendar day/week boundaries in the studio's time zone.
 *
 * The server runs in UTC (Vercel), so `Date#setHours(0)` there would give UTC
 * midnight, not Swiss midnight. These helpers compute boundaries in a named
 * IANA zone with `Intl`, so they behave the same on the server and in the
 * browser, DST changes included.
 */

export const STUDIO_TIME_ZONE = "Europe/Zurich";

const formatters = new Map();

function formatterFor(timeZone) {
  let fmt = formatters.get(timeZone);
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    formatters.set(timeZone, fmt);
  }
  return fmt;
}

/** Wall-clock parts of `date` in `timeZone` (month is 1-12). */
function zonedParts(date, timeZone) {
  const parts = {};
  for (const { type, value } of formatterFor(timeZone).formatToParts(date)) {
    if (type !== "literal") parts[type] = Number(value);
  }
  return parts;
}

/** Offset of `timeZone` from UTC at instant `ms`, in milliseconds. */
function offsetMs(ms, timeZone) {
  const wholeSecond = Math.floor(ms / 1000) * 1000;
  const p = zonedParts(new Date(wholeSecond), timeZone);
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return wallAsUtc - wholeSecond;
}

/**
 * The instant of 00:00 on the given calendar day in `timeZone`.
 * Day overflow is allowed (day 32 → next month), like `Date.UTC`.
 */
function zonedMidnight(year, month, day, timeZone) {
  const wallAsUtc = Date.UTC(year, month - 1, day);
  let ms = wallAsUtc - offsetMs(wallAsUtc, timeZone);
  // Re-check with the offset at the result, in case a DST change lies between.
  ms = wallAsUtc - offsetMs(ms, timeZone);
  return new Date(ms);
}

/** 00:00 of the day containing `date`, in `timeZone`. */
export function startOfZonedDay(date = new Date(), timeZone = STUDIO_TIME_ZONE) {
  const p = zonedParts(new Date(date), timeZone);
  return zonedMidnight(p.year, p.month, p.day, timeZone);
}

/** 00:00 of the day `days` calendar days after the day containing `date`. */
export function addZonedDays(date, days, timeZone = STUDIO_TIME_ZONE) {
  const p = zonedParts(new Date(date), timeZone);
  return zonedMidnight(p.year, p.month, p.day + days, timeZone);
}

/** `{ start, end }` of the day containing `date`; `end` is the next day's 00:00. */
export function zonedDayRange(date = new Date(), timeZone = STUDIO_TIME_ZONE) {
  return {
    start: startOfZonedDay(date, timeZone),
    end: addZonedDays(date, 1, timeZone),
  };
}

/** Monday 00:00 of the week containing `date`, in `timeZone`. */
export function startOfZonedWeek(date = new Date(), timeZone = STUDIO_TIME_ZONE) {
  const p = zonedParts(new Date(date), timeZone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay(); // 0 Sun … 6 Sat
  const sinceMonday = (weekday + 6) % 7;
  return zonedMidnight(p.year, p.month, p.day - sinceMonday, timeZone);
}

/** `YYYY-MM-DD` of the day containing `date`, in `timeZone`. */
export function toZonedDateKey(date, timeZone = STUDIO_TIME_ZONE) {
  const p = zonedParts(new Date(date), timeZone);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
