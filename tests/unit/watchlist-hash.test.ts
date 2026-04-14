import { describe, it, expect } from "vitest";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";

describe("computeWatchlistHash", () => {
  it("returns same hash for same IDs regardless of order", () => {
    const hash1 = computeWatchlistHash([3, 1, 2]);
    const hash2 = computeWatchlistHash([1, 2, 3]);
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different IDs", () => {
    const hash1 = computeWatchlistHash([1, 2, 3]);
    const hash2 = computeWatchlistHash([1, 2, 4]);
    expect(hash1).not.toBe(hash2);
  });

  it("returns consistent hash for same input", () => {
    const hash1 = computeWatchlistHash([5, 10, 15]);
    const hash2 = computeWatchlistHash([5, 10, 15]);
    expect(hash1).toBe(hash2);
  });

  it("handles empty array", () => {
    const hash = computeWatchlistHash([]);
    expect(hash).toBe(computeWatchlistHash([]));
  });
});
