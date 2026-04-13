import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodities, priceSnapshots } from "@/lib/db/schema";
import { scrapeCommodityPrices } from "@/lib/scraper/prices";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const parsed = await scrapeCommodityPrices();
    const today = new Date().toISOString().slice(0, 10);
    let upsertedCount = 0;

    for (const item of parsed) {
      const existing = await db
        .select()
        .from(commodities)
        .where(eq(commodities.sourceKey, item.sourceKey))
        .limit(1);

      let commodityId: number;
      if (existing.length > 0) {
        commodityId = existing[0].id;
      } else {
        const inserted = await db
          .insert(commodities)
          .values({
            name: item.name,
            slug: item.slug,
            category: item.category,
            unit: "",
            sourceKey: item.sourceKey,
          })
          .returning({ id: commodities.id });
        commodityId = inserted[0].id;
      }

      await db.insert(priceSnapshots).values({
        commodityId,
        price: item.price,
        dayChange: item.dayChange,
        dayChangePct: item.dayChangePct,
        weeklyPct: item.weeklyPct,
        monthlyPct: item.monthlyPct,
        ytdPct: item.ytdPct,
        date: today,
      });
      upsertedCount++;
    }

    return NextResponse.json({
      success: true,
      count: upsertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Price scraping failed:", error);
    return NextResponse.json(
      {
        error: "Scraping failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
