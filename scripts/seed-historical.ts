/**
 * One-time seed script: downloads ~1 year of daily commodity prices
 * from Yahoo Finance (v8 chart API) and inserts them into price_snapshots.
 *
 * Usage:
 *   npx tsx scripts/seed-historical.ts
 *
 * Requires DATABASE_URL in .env (copy from .env.local).
 */

import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { priceSnapshots, commodities } from "../src/lib/db/schema";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// ── Yahoo Finance ticker → our DB commodity slug mapping ──────────────
const TICKER_MAP: Record<string, string> = {
  "CL=F": "crude-oil",
  "BZ=F": "brent-crude-oil",
  "NG=F": "natural-gas",
  "RB=F": "gasoline",
  "HO=F": "heating-oil",
  "GC=F": "gold",
  "SI=F": "silver",
  "HG=F": "copper",
  "PL=F": "platinum",
  "PA=F": "palladium",
  "LBS=F": "lumber",
  "ZS=F": "soybeans",
  "ZW=F": "wheat",
  "ZC=F": "corn",
  "CT=F": "cotton",
  "KC=F": "coffee",
  "SB=F": "sugar",
  "CC=F": "cocoa",
  "OJ=F": "orange-juice",
  "ZO=F": "oat",
  "LE=F": "live-cattle",
  "GF=F": "feeder-cattle",
  "HE=F": "lean-hogs",
  "ALI=F": "aluminum",
};

// ── Yahoo Finance v8 chart API ────────────────────────────────────────
interface YFChartResult {
  timestamp: number[];
  indicators: {
    quote: Array<{
      close: (number | null)[];
    }>;
  };
}

async function fetchYahooChart(ticker: string): Promise<{ date: string; close: number }[]> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}` +
    `?range=1y&interval=1d`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Yahoo v8 returned ${res.status} for ${ticker}`);
  }

  const json = await res.json();
  const result: YFChartResult = json?.chart?.result?.[0];

  if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
    throw new Error(`No chart data for ${ticker}`);
  }

  const timestamps = result.timestamp;
  const closes = result.indicators.quote[0].close;
  const rows: { date: string; close: number }[] = [];

  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null || isNaN(close) || close <= 0) continue;

    const d = new Date(timestamps[i] * 1000);
    const dateStr =
      d.getUTCFullYear() +
      "-" +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getUTCDate()).padStart(2, "0");

    rows.push({ date: dateStr, close: Math.round(close * 100) / 100 });
  }

  return rows;
}

// ── Main ──────────────────────────────────────────────────────────────
async function main() {
  console.log("🌱 Seeding historical commodity data from Yahoo Finance (v8 chart API)...\n");

  // Load all commodities from DB to map slug → id
  const allCommodities = await db.select().from(commodities);
  const slugToId: Record<string, number> = {};
  for (const c of allCommodities) {
    if (!slugToId[c.slug]) slugToId[c.slug] = c.id; // first wins for dupes
  }

  let totalInserted = 0;
  let tickersProcessed = 0;
  const errors: string[] = [];

  for (const [ticker, slug] of Object.entries(TICKER_MAP)) {
    const commodityId = slugToId[slug];
    if (!commodityId) {
      console.log(`  ⚠ Skipping ${ticker} — no DB match for slug "${slug}"`);
      continue;
    }

    const commodityName =
      allCommodities.find((c) => c.id === commodityId)?.name ?? slug;

    process.stdout.write(`  📊 ${commodityName} (${ticker})... `);

    try {
      const rows = await fetchYahooChart(ticker);

      if (rows.length === 0) {
        console.log("no data returned");
        continue;
      }

      // Compute day-over-day changes
      const withChanges = rows.map((row, i) => {
        const prevPrice = i > 0 ? rows[i - 1].close : row.close;
        const dayChange = Math.round((row.close - prevPrice) * 100) / 100;
        const dayChangePct =
          prevPrice !== 0
            ? Math.round(((row.close - prevPrice) / prevPrice) * 10000) / 100
            : 0;
        return {
          commodityId,
          price: row.close,
          dayChange,
          dayChangePct,
          weeklyPct: 0,
          monthlyPct: 0,
          ytdPct: 0,
          date: row.date,
        };
      });

      // Batch insert — 50 at a time
      let inserted = 0;
      for (let i = 0; i < withChanges.length; i += 50) {
        const batch = withChanges.slice(i, i + 50);
        try {
          await db.insert(priceSnapshots).values(batch);
          inserted += batch.length;
        } catch {
          // Fallback: insert one-by-one to skip duplicates
          for (const v of batch) {
            try {
              await db.insert(priceSnapshots).values(v);
              inserted++;
            } catch {
              // skip duplicate
            }
          }
        }
      }

      console.log(`${inserted} rows (${rows.length} trading days)`);
      totalInserted += inserted;
      tickersProcessed++;

      // Small delay to be polite to Yahoo
      await new Promise((r) => setTimeout(r, 300));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`FAILED — ${msg}`);
      errors.push(`${ticker} (${commodityName}): ${msg}`);
    }
  }

  console.log("\n─────────────────────────────────────────");
  console.log(`✅ Done! ${tickersProcessed} commodities, ${totalInserted} price rows inserted.`);

  if (errors.length > 0) {
    console.log(`\n⚠ ${errors.length} ticker(s) failed:`);
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log("\n💡 Commodities not on Yahoo (Steel, HRC Steel, Iron Ore, Lithium, etc.)");
  console.log("   will accumulate daily data from the TradingEconomics scraper.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
