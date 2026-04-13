import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  commodities,
  userPreferences,
  priceSnapshots,
  newsArticles,
  insights,
} from "@/lib/db/schema";
import { generateInsights } from "@/lib/insights/generate";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";
import { and, inArray, gte, desc } from "drizzle-orm";
import { subDays } from "date-fns";

export const maxDuration = 120;

const DEFAULT_COMMODITY_SLUGS = ["lumber", "steel", "copper", "crude-oil"];

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all user preferences to find unique watchlists
    const allPrefs = await db.select().from(userPreferences);

    // Build a map of unique watchlist hashes to their commodity IDs
    const watchlistMap = new Map<string, number[]>();

    if (allPrefs.length > 0) {
      for (const pref of allPrefs) {
        if (pref.watchlist && pref.watchlist.length > 0) {
          const hash = computeWatchlistHash(pref.watchlist);
          if (!watchlistMap.has(hash)) {
            watchlistMap.set(hash, pref.watchlist);
          }
        }
      }
    }

    // If no users or no valid watchlists, use default commodities
    if (watchlistMap.size === 0) {
      const defaultCommodities = await db
        .select()
        .from(commodities)
        .where(inArray(commodities.slug, DEFAULT_COMMODITY_SLUGS));

      if (defaultCommodities.length > 0) {
        const defaultIds = defaultCommodities.map((c) => c.id);
        const hash = computeWatchlistHash(defaultIds);
        watchlistMap.set(hash, defaultIds);
      }
    }

    let generatedCount = 0;
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);

    for (const [watchlistHash, commodityIds] of watchlistMap) {
      // Get commodity info
      const commodityRows = await db
        .select()
        .from(commodities)
        .where(inArray(commodities.id, commodityIds));

      // Get last 30 days of price data for these commodities
      const priceRows = await db
        .select()
        .from(priceSnapshots)
        .where(
          and(
            inArray(priceSnapshots.commodityId, commodityIds),
            gte(priceSnapshots.date, thirtyDaysAgo.toISOString().slice(0, 10))
          )
        )
        .orderBy(desc(priceSnapshots.date));

      // Build price data for each commodity
      type PriceRow = typeof priceRows[number];

      const priceData = commodityRows.map((commodity) => {
        const commodityPrices = priceRows
          .filter((p: PriceRow) => p.commodityId === commodity.id)
          .map((p: PriceRow) => ({
            date: typeof p.date === "string" ? p.date : String(p.date),
            price: p.price,
          }));

        const latestPrice = commodityPrices.length > 0 ? commodityPrices[0] : null;
        const latestSnapshot = priceRows.find(
          (p: PriceRow) => p.commodityId === commodity.id
        );

        return {
          commodityName: commodity.name,
          currentPrice: latestPrice?.price ?? 0,
          monthlyPct: latestSnapshot?.monthlyPct ?? 0,
          weeklyPct: latestSnapshot?.weeklyPct ?? 0,
          prices: commodityPrices,
        };
      });

      // Get recent news headlines (last 7 days)
      const recentNews = await db
        .select()
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, sevenDaysAgo))
        .orderBy(desc(newsArticles.publishedAt));

      const newsHeadlines = recentNews.map((n) => n.title);

      // Generate insights using Claude API
      const insightCards = await generateInsights(priceData, newsHeadlines);

      // Store in insights table
      await db.insert(insights).values({
        watchlistHash,
        content: insightCards,
        type: "scheduled",
      });

      generatedCount++;
    }

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Insight generation cron failed:", error);
    return NextResponse.json(
      {
        error: "Insight generation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
