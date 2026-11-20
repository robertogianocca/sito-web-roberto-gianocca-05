import { describe, expect, it } from "vitest";
import {
  addZonedDays,
  startOfZonedDay,
  startOfZonedWeek,
  toZonedDateKey,
  zonedDayRange,
} from "@/lib/timeZone";

// The process runs in UTC (vitest.config.mjs), like the server on Vercel.
const iso = (date) => date.toISOString();
const hours = (from, to) => (to - from) / 36e5;

describe("startOfZonedDay / toZonedDateKey (Europe/Zurich)", () => {
  it("uses Swiss midnight in winter (UTC+1)", () => {
    const afterMidnight = new Date("2026-11-24T23:30:00Z"); // Wed 25 Nov, 00:30
    expect(iso(startOfZonedDay(afterMidnight))).toBe("2026-11-24T23:00:00.000Z");
    expect(toZonedDateKey(afterMidnight)).toBe("2026-11-25");
  });

  it("uses Swiss midnight in summer (UTC+2)", () => {
    expect(iso(startOfZonedDay(new Date("2026-07-14T22:30:00Z")))).toBe(
      "2026-07-14T22:00:00.000Z"
    );
    expect(toZonedDateKey(new Date("2026-07-14T21:59:00Z"))).toBe("2026-07-14");
  });

  it("gives a normal day 24 hours", () => {
    const { start, end } = zonedDayRange(new Date("2026-11-20T10:00:00Z"));
    expect(hours(start, end)).toBe(24);
  });

  it("rolls over months and years", () => {
    expect(toZonedDateKey(addZonedDays(new Date("2026-12-31T12:00:00Z"), 1))).toBe(
      "2027-01-01"
    );
  });
});

describe("startOfZonedWeek", () => {
  it("starts weeks on Monday 00:00 local time", () => {
    // Sunday 23:30 local still belongs to the week of Monday 16 Nov
    expect(toZonedDateKey(startOfZonedWeek(new Date("2026-11-22T22:30:00Z")))).toBe(
      "2026-11-16"
    );
    // Monday 00:10 local starts the next week
    expect(toZonedDateKey(startOfZonedWeek(new Date("2026-11-22T23:10:00Z")))).toBe(
      "2026-11-23"
    );
  });

  it("handles the spring DST change (a 23-hour Sunday)", () => {
    const monday = startOfZonedWeek(new Date("2026-03-29T12:00:00Z"));
    expect(iso(monday)).toBe("2026-03-22T23:00:00.000Z");
    expect(hours(addZonedDays(monday, 6), addZonedDays(monday, 7))).toBe(23);
    expect(iso(addZonedDays(monday, 7))).toBe("2026-03-29T22:00:00.000Z");
  });

  it("handles the autumn DST change (a 25-hour Sunday)", () => {
    const monday = startOfZonedWeek(new Date("2026-10-25T12:00:00Z"));
    expect(hours(addZonedDays(monday, 6), addZonedDays(monday, 7))).toBe(25);
    const keys = [0, 1, 2, 3, 4, 5, 6].map((i) =>
      toZonedDateKey(addZonedDays(monday, i))
    );
    expect(keys).toEqual([
      "2026-10-19",
      "2026-10-20",
      "2026-10-21",
      "2026-10-22",
      "2026-10-23",
      "2026-10-24",
      "2026-10-25",
    ]);
  });
});
