import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodities, priceSnapshots, newsArticles, insights } from "@/lib/db/schema";
import { eq, inArray, gte, desc, and } from "drizzle-orm";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";
import { generateInsights } from "@/lib/insights/generate";
import { subDays } from "date-fns";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { watchlist } = body as { watchlist: number[] };

    if (!watchlist || !Array.isArray(watchlist) || watchlist.length === 0) {
      return NextResponse.json(
        { error: "Missing or invalid watchlist parameter" },
        { status: 400 }
      );
    }

    const watchlistHash = computeWatchlistHash(watchlist);

    // Fetch commodity info
    const watchlistCommodities = await db
      .select()
      .from(commodities)
      .where(inArray(commodities.id, watchlist));

    // Fetch 30-day price data for each commodity
    const thirtyDaysAgo = subDays(new Date(), 30);
    const priceData = await Promise.all(
      watchlistCommodities.map(async (commodity) => {
        const prices = await db
          .select()
          .from(priceSnapshots)
          .where(
            and(
              eq(priceSnapshots.commodityId, commodity.id),
              gte(priceSnapshots.scrapedAt, thirtyDaysAgo)
            )
          )
          .orderBy(desc(priceSnapshots.date));

        const latest = prices[0];
        return {
          commodityName: commodity.name,
          currentPrice: latest?.price ?? 0,
          monthlyPct: latest?.monthlyPct ?? 0,
          weeklyPct: latest?.weeklyPct ?? 0,
          prices: prices.map((p) => ({
            date: p.date,
            price: p.price,
          })),
        };
      })
    );

    // Fetch 7-day news headlines
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentNews = await db
      .select()
      .from(newsArticles)
      .where(gte(newsArticles.publishedAt, sevenDaysAgo))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(50);

    const newsHeadlines = recentNews.map((article) => article.title);

    // Generate insights via AI
    const insightCards = await generateInsights(priceData, newsHeadlines);
    const generatedAt = new Date();

    // Store the result
    await db.insert(insights).values({
      watchlistHash,
      content: insightCards,
      generatedAt,
      type: "on_demand",
    });

    return NextResponse.json({
      insights: insightCards,
      generatedAt,
      type: "on_demand",
    });
  } catch (error) {
    console.error("Error refreshing insights:", error);
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
