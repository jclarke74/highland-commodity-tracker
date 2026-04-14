import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Accept either watchlist IDs (preferred) or a precomputed hash
    const watchlistParam = searchParams.get("watchlist");
    const hashParam = searchParams.get("watchlist_hash");

    let watchlistHash: string;
    if (watchlistParam) {
      const ids = watchlistParam.split(",").map(Number).filter(Boolean);
      if (ids.length === 0) {
        return NextResponse.json(
          { error: "Invalid watchlist parameter" },
          { status: 400 }
        );
      }
      watchlistHash = computeWatchlistHash(ids);
    } else if (hashParam) {
      watchlistHash = hashParam;
    } else {
      return NextResponse.json(
        { error: "Missing required parameter: watchlist or watchlist_hash" },
        { status: 400 }
      );
    }

    const [latestInsight] = await db
      .select()
      .from(insights)
      .where(eq(insights.watchlistHash, watchlistHash))
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    if (!latestInsight) {
      return NextResponse.json({
        insights: null,
        message:
          "No insights generated yet. Click refresh to generate insights for your watchlist.",
      });
    }

    return NextResponse.json({
      insights: latestInsight.content,
      generatedAt: latestInsight.generatedAt,
      type: latestInsight.type,
    });
  } catch (error) {
    console.error("Error fetching insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
