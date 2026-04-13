import { createHash } from "crypto";

export function computeWatchlistHash(commodityIds: number[]): string {
  const sorted = [...commodityIds].sort((a, b) => a - b);
  const input = sorted.join(",");
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
