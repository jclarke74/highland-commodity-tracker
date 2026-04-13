import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodities, priceSnapshots } from "@/lib/db/schema";
import { eq, inArray, gte, desc, and } from "drizzle-orm";
import { getStartDate } from "@/lib/utils/date-ranges";
import type { DateRange } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commodityIds = searchParams.get("commodities");
    const range = (searchParams.get("range") || "1m") as DateRange;

    if (!commodityIds) {
      return NextResponse.json(
        { error: "Missing required parameter: commodities" },
        { status: 400 }
      );
    }

    const ids = commodityIds.split(",").map((id) => parseInt(id.trim(), 10));
    const startDate = getStartDate(range);

    const matchingCommodities = await db
      .select()
      .from(commodities)
      .where(inArray(commodities.id, ids));

    const results = await Promise.all(
      matchingCommodities.map(async (commodity) => {
        const whereCondition = startDate
          ? and(
              eq(priceSnapshots.commodityId, commodity.id),
              gte(priceSnapshots.scrapedAt, startDate)
            )
          : eq(priceSnapshots.commodityId, commodity.id);

        const prices = await db
          .select()
          .from(priceSnapshots)
          .where(whereCondition)
          .orderBy(desc(priceSnapshots.date));

        return {
          commodityId: commodity.id,
          name: commodity.name,
          slug: commodity.slug,
          prices: prices.map((p) => ({
            price: p.price,
            dayChange: p.dayChange,
            dayChangePct: p.dayChangePct,
            weeklyPct: p.weeklyPct,
            monthlyPct: p.monthlyPct,
            ytdPct: p.ytdPct,
            date: p.date,
          })),
        };
      })
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}
