import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  real,
  timestamp,
  date,
  jsonb,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const commodities = pgTable(
  "commodities",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    unit: varchar("unit", { length: 50 }).notNull().default(""),
    sourceKey: varchar("source_key", { length: 255 }).notNull(),
  },
  (table) => [uniqueIndex("commodities_source_key_idx").on(table.sourceKey)]
);

export const priceSnapshots = pgTable(
  "price_snapshots",
  {
    id: serial("id").primaryKey(),
    commodityId: integer("commodity_id")
      .notNull()
      .references(() => commodities.id),
    price: real("price").notNull(),
    dayChange: real("day_change").notNull().default(0),
    dayChangePct: real("day_change_pct").notNull().default(0),
    weeklyPct: real("weekly_pct").notNull().default(0),
    monthlyPct: real("monthly_pct").notNull().default(0),
    ytdPct: real("ytd_pct").notNull().default(0),
    scrapedAt: timestamp("scraped_at").notNull().defaultNow(),
    date: date("date").notNull(),
  },
  (table) => [
    index("price_snapshots_commodity_date_idx").on(
      table.commodityId,
      table.date
    ),
  ]
);

export const newsArticles = pgTable(
  "news_articles",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sourceName: varchar("source_name", { length: 255 }).notNull(),
    sourceUrl: varchar("source_url", { length: 1024 }).notNull().default(""),
    url: varchar("url", { length: 1024 }).notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    commodityTags: jsonb("commodity_tags").$type<string[]>().notNull().default([]),
    publishedAt: timestamp("published_at").notNull(),
    fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("news_articles_url_idx").on(table.url)]
);

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  watchlistHash: varchar("watchlist_hash", { length: 64 }).notNull(),
  content: jsonb("content").$type<import("@/types").InsightCard[]>().notNull(),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
  type: varchar("type", { length: 20 }).notNull(),
});

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: serial("id").primaryKey(),
    browserId: varchar("browser_id", { length: 64 }).notNull(),
    watchlist: jsonb("watchlist").$type<number[]>().notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("user_preferences_browser_id_idx").on(table.browserId),
  ]
);
