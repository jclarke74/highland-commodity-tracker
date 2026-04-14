import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const browserId = searchParams.get("browser_id");

    if (!browserId) {
      return NextResponse.json(
        { error: "Missing required parameter: browser_id" },
        { status: 400 }
      );
    }

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.browserId, browserId))
      .limit(1);

    if (!prefs) {
      return NextResponse.json({
        watchlist: [],
        isDefault: true,
      });
    }

    return NextResponse.json({
      watchlist: prefs.watchlist,
      isDefault: false,
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { browserId, watchlist } = body as {
      browserId: string;
      watchlist: number[];
    };

    if (!browserId || !Array.isArray(watchlist)) {
      return NextResponse.json(
        { error: "Missing required fields: browserId and watchlist" },
        { status: 400 }
      );
    }

    // Upsert: insert or update on conflict
    await db
      .insert(userPreferences)
      .values({
        browserId,
        watchlist,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.browserId,
        set: {
          watchlist,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      watchlist,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
