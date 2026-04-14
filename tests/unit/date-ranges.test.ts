import { describe, it, expect, vi } from "vitest";
import { getStartDate } from "@/lib/utils/date-ranges";
import type { DateRange } from "@/types";

describe("getStartDate", () => {
  it("returns 7 days ago for 1w", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("1w");
    expect(start!.toISOString().slice(0, 10)).toBe("2026-04-06");
    vi.useRealTimers();
  });

  it("returns 1 month ago for 1m", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("1m");
    expect(start!.toISOString().slice(0, 10)).toBe("2026-03-13");
    vi.useRealTimers();
  });

  it("returns 3 months ago for 3m", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("3m");
    expect(start!.toISOString().slice(0, 10)).toBe("2026-01-13");
    vi.useRealTimers();
  });

  it("returns null for all (no start bound)", () => {
    const start = getStartDate("all");
    expect(start).toBeNull();
  });
});
