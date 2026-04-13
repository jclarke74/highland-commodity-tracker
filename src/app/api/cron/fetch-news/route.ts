import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { COMMODITY_QUERIES, fetchGNewsArticles } from "@/lib/news/gnews";
import { fetchRssArticles } from "@/lib/news/rss";
import type { MappedNewsArticle } from "@/lib/news/gnews";

export const maxDuration = 60;

/**
 * Pick 2 queries from COMMODITY_QUERIES based on the current hour,
 * rotating through the list across cron cycles.
 */
function pickQueries(): string[] {
  const hour = new Date().getHours();
  const totalQueries = COMMODITY_QUERIES.length;
  const startIndex = (hour * 2) % totalQueries;
  const indices = [
    startIndex % totalQueries,
    (startIndex + 1) % totalQueries,
  ];
  return indices.map((i) => COMMODITY_QUERIES[i]);
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const selectedQueries = pickQueries();
    const allArticles: MappedNewsArticle[] = [];

    // Fetch GNews articles for 2 rotated queries
    for (const query of selectedQueries) {
      const articles = await fetchGNewsArticles(query);
      allArticles.push(...articles);
    }

    // Fetch RSS articles from Construction Dive and ENR
    const rssArticles = await fetchRssArticles();
    allArticles.push(...rssArticles);

    let insertedCount = 0;

    for (const article of allArticles) {
      try {
        await db.insert(newsArticles).values({
          title: article.title,
          description: article.description,
          sourceName: article.sourceName,
          sourceUrl: article.sourceUrl,
          url: article.url,
          category: article.category,
          commodityTags: article.commodityTags,
          publishedAt: article.publishedAt,
        });
        insertedCount++;
      } catch (error) {
        // Skip duplicates (unique URL constraint violation)
        if (
          error instanceof Error &&
          error.message.includes("unique")
        ) {
          continue;
        }
        // Also handle postgres duplicate key errors
        const errMsg = error instanceof Error ? error.message : String(error);
        if (
          errMsg.includes("duplicate key") ||
          errMsg.includes("news_articles_url_idx")
        ) {
          continue;
        }
        console.error("Failed to insert article:", errMsg);
      }
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("News fetch cron failed:", error);
    return NextResponse.json(
      {
        error: "News fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
