import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { eq, desc, like, or, and, sql } from "drizzle-orm";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const commodity = searchParams.get("commodity");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);

    const offset = (page - 1) * PAGE_SIZE;

    const conditions = [];

    if (category !== "all") {
      conditions.push(eq(newsArticles.category, category));
    }

    if (commodity) {
      conditions.push(
        sql`${newsArticles.commodityTags}::jsonb @> ${JSON.stringify([commodity])}::jsonb`
      );
    }

    if (search) {
      conditions.push(
        or(
          like(newsArticles.title, `%${search}%`),
          like(newsArticles.description, `%${search}%`)
        )!
      );
    }

    const whereClause =
      conditions.length > 0 ? and(...conditions) : undefined;

    const articles = await db
      .select()
      .from(newsArticles)
      .where(whereClause)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(PAGE_SIZE + 1)
      .offset(offset);

    const hasMore = articles.length > PAGE_SIZE;
    const trimmedArticles = hasMore ? articles.slice(0, PAGE_SIZE) : articles;

    return NextResponse.json({
      articles: trimmedArticles,
      page,
      pageSize: PAGE_SIZE,
      hasMore,
    });
  } catch (error) {
    console.error("Error fetching news:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}
