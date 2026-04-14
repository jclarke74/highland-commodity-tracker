import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodities, priceSnapshots } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allCommodities = await db.select().from(commodities);

    const grouped: Record<
      string,
      Array<{
        id: number;
        name: string;
        slug: string;
        category: string;
        unit: string;
        sourceKey: string;
        latestPrice: {
          price: number;
          dayChange: number;
          dayChangePct: number;
          weeklyPct: number;
          monthlyPct: number;
          ytdPct: number;
          date: string;
        } | null;
      }>
    > = {};

    for (const commodity of allCommodities) {
      const [latestSnapshot] = await db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.commodityId, commodity.id))
        .orderBy(desc(priceSnapshots.date))
        .limit(1);

      const entry = {
        ...commodity,
        latestPrice: latestSnapshot
          ? {
              price: latestSnapshot.price,
              dayChange: latestSnapshot.dayChange,
              dayChangePct: latestSnapshot.dayChangePct,
              weeklyPct: latestSnapshot.weeklyPct,
              monthlyPct: latestSnapshot.monthlyPct,
              ytdPct: latestSnapshot.ytdPct,
              date: latestSnapshot.date,
              scrapedAt: latestSnapshot.scrapedAt,
            }
          : null,
      };

      if (!grouped[commodity.category]) {
        grouped[commodity.category] = [];
      }
      grouped[commodity.category].push(entry);
    }

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Error fetching commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities" },
      { status: 500 }
    );
  }
}
