export type CommodityCategory =
  | "energy"
  | "metals"
  | "agriculture"
  | "livestock"
  | "industrials";

export type NewsCategory = "commodity" | "construction";

export type InsightPriority = "high" | "watch" | "opportunity";

export type InsightType = "scheduled" | "on_demand";

export type DateRange = "1w" | "1m" | "3m" | "6m" | "1y" | "all";

export interface CommodityRow {
  id: number;
  name: string;
  slug: string;
  category: CommodityCategory;
  unit: string;
  sourceKey: string;
}

export interface PriceSnapshotRow {
  id: number;
  commodityId: number;
  price: number;
  dayChange: number;
  dayChangePct: number;
  weeklyPct: number;
  monthlyPct: number;
  ytdPct: number;
  scrapedAt: Date;
  date: Date;
}

export interface NewsArticleRow {
  id: number;
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  category: NewsCategory;
  commodityTags: string[];
  publishedAt: Date;
  fetchedAt: Date;
}

export interface InsightCard {
  priority: InsightPriority;
  commodity: string;
  title: string;
  trendPct: number;
  trendDirection: "up" | "down";
  description: string;
  recommendation: string;
}

export interface InsightRow {
  id: number;
  watchlistHash: string;
  content: InsightCard[];
  generatedAt: Date;
  type: InsightType;
}

export interface UserPreferencesRow {
  id: number;
  browserId: string;
  watchlist: number[];
  createdAt: Date;
  updatedAt: Date;
}
