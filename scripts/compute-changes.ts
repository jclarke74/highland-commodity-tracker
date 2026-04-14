/**
 * Computes weekly_pct, monthly_pct, and ytd_pct for all price_snapshots
 * by comparing against historical prices already in the database.
 *
 * Usage:
 *   npx tsx scripts/compute-changes.ts
 *
 * Requires DATABASE_URL in .env (copy from .env.local).
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { priceSnapshots, commodities } from "../src/lib/db/schema";
import { eq, asc } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 10000) / 100;
}

/**
 * Find the closest price on or before a target date within a sorted array.
 * Returns null if no price exists before the target.
 */
function findPriceOnOrBefore(
  prices: { date: string; price: number }[],
  targetDate: string
): number | null {
  let result: number | null = null;
  for (const p of prices) {
    if (p.date <= targetDate) {
      result = p.price;
    } else {
      break;
    }
  }
  return result;
}

function subtractDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function getYearStart(dateStr: string): string {
  return dateStr.slice(0, 4) + "-01-01";
}

async function main() {
  console.log("📊 Computing weekly, monthly, and YTD changes for all price snapshots...\n");

  // Load all commodities
  const allCommodities = await db.select().from(commodities);
  console.log(`  Found ${allCommodities.length} commodities in DB.\n`);

  let totalUpdated = 0;

  for (const commodity of allCommodities) {
    // Load all price snapshots for this commodity, sorted by date
    const prices = await db
      .select({
        id: priceSnapshots.id,
        date: priceSnapshots.date,
        price: priceSnapshots.price,
      })
      .from(priceSnapshots)
      .where(eq(priceSnapshots.commodityId, commodity.id))
      .orderBy(asc(priceSnapshots.date));

    if (prices.length < 2) continue;

    process.stdout.write(`  ${commodity.name} (${prices.length} rows)... `);

    // Build a sorted list for lookup
    const priceList = prices.map((p) => ({
      date: String(p.date),
      price: p.price,
    }));

    let updated = 0;

    // Process in batches to avoid too many individual queries
    for (const snapshot of prices) {
      const dateStr = String(snapshot.date);
      const currentPrice = snapshot.price;

      // Weekly: price ~7 days ago
      const weekAgoDate = subtractDays(dateStr, 7);
      const weekAgoPrice = findPriceOnOrBefore(priceList, weekAgoDate);
      const weeklyPct = weekAgoPrice != null ? pctChange(currentPrice, weekAgoPrice) : 0;

      // Monthly: price ~30 days ago
      const monthAgoDate = subtractDays(dateStr, 30);
      const monthAgoPrice = findPriceOnOrBefore(priceList, monthAgoDate);
      const monthlyPct = monthAgoPrice != null ? pctChange(currentPrice, monthAgoPrice) : 0;

      // YTD: price on Jan 1 of the same year (or first trading day)
      const yearStartDate = getYearStart(dateStr);
      const yearStartPrice = findPriceOnOrBefore(priceList, yearStartDate);
      // If no price on Jan 1, use first available price of that year
      let ytdPrice = yearStartPrice;
      if (ytdPrice == null) {
        const yearPrefix = dateStr.slice(0, 4);
        const firstOfYear = priceList.find((p) => p.date.startsWith(yearPrefix));
        ytdPrice = firstOfYear?.price ?? null;
      }
      const ytdPct = ytdPrice != null ? pctChange(currentPrice, ytdPrice) : 0;

      // Only update if any value changed from 0
      if (weeklyPct !== 0 || monthlyPct !== 0 || ytdPct !== 0) {
        await db
          .update(priceSnapshots)
          .set({ weeklyPct, monthlyPct, ytdPct })
          .where(eq(priceSnapshots.id, snapshot.id));
        updated++;
      }
    }

    console.log(`${updated} updated`);
    totalUpdated += updated;
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Done! ${totalUpdated} price snapshots updated with weekly/monthly/YTD changes.`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
