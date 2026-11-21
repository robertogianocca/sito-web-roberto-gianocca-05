import { describe, expect, it } from "vitest";
import { plural, STUDIO_LOCALE } from "@/lib/timeFormat";
import { liveElapsedSeconds } from "@/components/time/timerLive";

describe("plural", () => {
  it("picks the singular only for one", () => {
    expect(plural(1, "entry", "entries")).toBe("1 entry");
    expect(plural(0, "entry", "entries")).toBe("0 entries");
    expect(plural(3, "task")).toBe("3 tasks");
  });
});

describe("STUDIO_LOCALE", () => {
  it("formats 24-hour times with the day before the month", () => {
    const date = new Date("2026-11-20T14:05:00Z");
    expect(date.toLocaleTimeString(STUDIO_LOCALE, { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })).toBe("14:05");
    expect(date.toLocaleDateString(STUDIO_LOCALE, { day: "numeric", month: "short", timeZone: "UTC" })).toBe("20 Nov");
  });
});

describe("liveElapsedSeconds", () => {
  const running = {
    startedAt: "2026-11-20T10:00:00.000Z",
    pauseSeconds: 60,
    status: "running",
    elapsedSeconds: 540,
  };

  it("counts from start to now, minus pauses", () => {
    expect(liveElapsedSeconds(running, Date.parse("2026-11-20T10:10:00.000Z"))).toBe(540);
  });

  it("uses the server's value while rendering on the server or hydrating", () => {
    expect(liveElapsedSeconds({ ...running, elapsedSeconds: 123 }, null)).toBe(123);
  });

  it("freezes at the pause time for a paused timer", () => {
    const paused = { ...running, status: "paused", pausedAt: "2026-11-20T10:05:00.000Z" };
    expect(liveElapsedSeconds(paused, Date.parse("2026-11-20T11:00:00.000Z"))).toBe(240);
    expect(liveElapsedSeconds(paused, null)).toBe(240);
  });
});
