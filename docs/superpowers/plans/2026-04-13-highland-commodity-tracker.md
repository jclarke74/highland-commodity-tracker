# Highland Commodity Tracker — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Use the `/frontend-design` skill when implementing frontend UI components (Tasks 8–13).

**Goal:** Build a commodity price tracking web app for construction professionals with scraping, news feeds, trend charts, and AI-powered actionable intelligence.

**Architecture:** Next.js 14 App Router with PostgreSQL (Neon) for data persistence, Cheerio for scraping TradingEconomics, GNews API + RSS for news, and Claude API for insight generation. Dark-themed UI using Tailwind CSS + shadcn/ui with Recharts for charts.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts, Drizzle ORM, Neon PostgreSQL, Cheerio, rss-parser, Anthropic SDK, Vitest, Playwright

---

## File Structure

```
highland-commodity-tracker/
├── src/
│   ├── app/
│   │   ├── layout.tsx                        # Root layout with sidebar shell
│   │   ├── page.tsx                          # Dashboard page
│   │   ├── globals.css                       # Tailwind + dark theme globals
│   │   ├── news/
│   │   │   └── page.tsx                      # News feed page
│   │   ├── trends/
│   │   │   └── page.tsx                      # Price trends page
│   │   ├── intelligence/
│   │   │   └── page.tsx                      # Actionable Intelligence page
│   │   └── api/
│   │       ├── commodities/
│   │       │   └── route.ts                  # GET available commodities
│   │       ├── prices/
│   │       │   └── route.ts                  # GET current + historical prices
│   │       ├── news/
│   │       │   └── route.ts                  # GET news articles
│   │       ├── insights/
│   │       │   ├── route.ts                  # GET latest insights
│   │       │   └── refresh/
│   │       │       └── route.ts              # POST on-demand insight refresh
│   │       ├── preferences/
│   │       │   └── route.ts                  # GET/PUT watchlist preferences
│   │       └── cron/
│   │           ├── scrape-prices/
│   │           │   └── route.ts              # POST cron: scrape prices
│   │           ├── fetch-news/
│   │           │   └── route.ts              # POST cron: fetch news
│   │           └── generate-insights/
│   │               └── route.ts              # POST cron: generate insights
│   ├── components/
│   │   ├── layout/
│   │   │   ├── sidebar.tsx                   # Full sidebar shell
│   │   │   ├── sidebar-nav.tsx               # Navigation links
│   │   │   ├── sidebar-watchlist.tsx          # Watchlist display in sidebar
│   │   │   └── mobile-nav.tsx                # Mobile hamburger menu
│   │   ├── dashboard/
│   │   │   ├── kpi-card.tsx                  # Commodity price KPI card
│   │   │   ├── insight-snippet.tsx           # Inline insight card
│   │   │   ├── trend-overview-chart.tsx      # Multi-line dashboard chart
│   │   │   └── news-strip.tsx                # 3-column news strip
│   │   ├── intelligence/
│   │   │   ├── insight-card.tsx              # Full insight card with priority
│   │   │   └── priority-filters.tsx          # Filter chip bar
│   │   ├── trends/
│   │   │   ├── chart-card.tsx                # Mini sparkline chart card
│   │   │   └── expanded-chart.tsx            # Full expanded chart modal/view
│   │   ├── news/
│   │   │   ├── news-card.tsx                 # Single news article card
│   │   │   ├── news-tabs.tsx                 # Tab bar (All/Commodity/Construction)
│   │   │   └── commodity-filters.tsx         # Commodity filter chips
│   │   └── ui/                               # shadcn/ui components (auto-generated)
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                      # Drizzle client + Neon connection
│   │   │   └── schema.ts                     # All table definitions
│   │   ├── scraper/
│   │   │   └── prices.ts                     # TradingEconomics scraper + parser
│   │   ├── news/
│   │   │   ├── gnews.ts                      # GNews API client
│   │   │   └── rss.ts                        # RSS feed parser
│   │   ├── insights/
│   │   │   └── generate.ts                   # Claude API insight generation
│   │   └── utils/
│   │       ├── watchlist-hash.ts             # Deterministic hash for watchlist
│   │       └── date-ranges.ts                # Date range calculation helpers
│   ├── hooks/
│   │   ├── use-watchlist.ts                  # Watchlist React context + hook
│   │   └── use-browser-id.ts                 # Browser UUID generation/storage
│   └── types/
│       └── index.ts                          # Shared TypeScript types
├── tests/
│   ├── unit/
│   │   ├── scraper.test.ts                   # Price scraper parsing tests
│   │   ├── gnews.test.ts                     # GNews client tests
│   │   ├── rss.test.ts                       # RSS parser tests
│   │   ├── insights.test.ts                  # Insight generation tests
│   │   ├── watchlist-hash.test.ts            # Hash utility tests
│   │   └── date-ranges.test.ts              # Date range helper tests
│   ├── fixtures/
│   │   └── tradingeconomics-sample.html      # Saved HTML for snapshot testing
│   └── e2e/
│       └── navigation.spec.ts                # Playwright E2E tests
├── drizzle/
│   └── migrations/                           # Generated SQL migrations
├── drizzle.config.ts                         # Drizzle Kit config
├── vercel.json                               # Cron jobs + Vercel config
├── next.config.ts                            # Next.js config
├── tailwind.config.ts                        # Tailwind config with dark theme
├── tsconfig.json                             # TypeScript config
├── vitest.config.ts                          # Vitest config
├── playwright.config.ts                      # Playwright config
├── .env.local                                # Local env vars (gitignored)
├── .env.example                              # Template for env vars
├── package.json
└── components.json                           # shadcn/ui config
```

---

## Task 1: Project Scaffold & Dependencies

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `vitest.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`, `src/app/page.tsx`, `.env.example`, `.env.local`, `components.json`, `vercel.json`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd "C:/Users/james/OneDrive/Desktop/Claude Projects/Commodity Tracker"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --no-turbopack
```

Expected: Next.js project scaffolded with `src/` directory structure, Tailwind configured.

- [ ] **Step 2: Install core dependencies**

```bash
npm install drizzle-orm @neondatabase/serverless cheerio rss-parser @anthropic-ai/sdk recharts date-fns
npm install -D drizzle-kit vitest @vitejs/plugin-react jsdom @types/jsdom
```

- [ ] **Step 3: Install shadcn/ui**

```bash
npx shadcn@latest init
```

When prompted:
- Style: Default
- Base color: Slate
- CSS variables: Yes

Then install the components we need:

```bash
npx shadcn@latest add button card badge tabs input dialog sheet scroll-area separator skeleton toast
```

- [ ] **Step 4: Configure dark theme in globals.css**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: #0a0a0f;
  --color-foreground: #e2e8f0;
  --color-card: #111118;
  --color-card-foreground: #e2e8f0;
  --color-popover: #111118;
  --color-popover-foreground: #e2e8f0;
  --color-primary: #3b82f6;
  --color-primary-foreground: #ffffff;
  --color-secondary: #1e1e2e;
  --color-secondary-foreground: #94a3b8;
  --color-muted: #1e1e2e;
  --color-muted-foreground: #64748b;
  --color-accent: #8b5cf6;
  --color-accent-foreground: #ffffff;
  --color-destructive: #ef4444;
  --color-destructive-foreground: #ffffff;
  --color-border: #1e1e2e;
  --color-input: #1e1e2e;
  --color-ring: #3b82f6;
  --color-positive: #22c55e;
  --color-negative: #ef4444;
  --color-warning: #f59e0b;
  --radius: 0.5rem;
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
}
```

Note: shadcn init may generate CSS that needs to be adjusted. Ensure the above custom theme colors are defined. The exact format depends on the shadcn version installed — adapt the syntax to match what shadcn generates (it may use `@layer base` with CSS variables on `:root` instead). The key requirement is that all theme colors from the design spec are available.

- [ ] **Step 5: Create .env.example and .env.local**

Create `.env.example`:
```
DATABASE_URL=postgresql://user:pass@host/dbname?sslmode=require
GNEWS_API_KEY=your_gnews_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key
CRON_SECRET=your_cron_secret
```

Create `.env.local` with the same keys (fill in real values).

- [ ] **Step 6: Configure vitest**

Create `vitest.config.ts`:
```typescript
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: Create vercel.json with cron definitions**

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-prices",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/fetch-news",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/generate-insights",
      "schedule": "30 12 * * *"
    }
  ]
}
```

Note: Vercel Cron uses UTC. 12:00 UTC = 7:00 AM ET (summer) / 8:00 AM ET (winter). Adjusted accordingly.

- [ ] **Step 8: Set up placeholder root layout and page**

Replace `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Highland Commodity Tracker",
  description: "Commodity price tracking for construction professionals",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

Replace `src/app/page.tsx`:
```tsx
export default function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Highland Commodity Tracker</h1>
      <p className="text-muted-foreground mt-2">Dashboard coming soon</p>
    </div>
  );
}
```

- [ ] **Step 9: Verify the app runs**

```bash
npm run dev
```

Expected: App runs at `http://localhost:3000` showing "Highland Commodity Tracker" heading on dark background.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js project with Tailwind, shadcn/ui, and dependencies"
```

---

## Task 2: TypeScript Types & Database Schema

**Files:**
- Create: `src/types/index.ts`, `src/lib/db/schema.ts`, `src/lib/db/index.ts`, `drizzle.config.ts`

- [ ] **Step 1: Define shared TypeScript types**

Create `src/types/index.ts`:
```typescript
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
```

- [ ] **Step 2: Define Drizzle database schema**

Create `src/lib/db/schema.ts`:
```typescript
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
  (table) => [uniqueIndex("commodities_slug_idx").on(table.slug)]
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
```

- [ ] **Step 3: Create database client**

Create `src/lib/db/index.ts`:
```typescript
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Configure Drizzle Kit**

Create `drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio"
  }
}
```

- [ ] **Step 5: Generate and push initial migration**

```bash
npm run db:generate
npm run db:push
```

Expected: Migration SQL files created in `drizzle/migrations/`. Tables created in Neon database.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add database schema with Drizzle ORM and Neon PostgreSQL"
```

---

## Task 3: Utility Functions

**Files:**
- Create: `src/lib/utils/watchlist-hash.ts`, `src/lib/utils/date-ranges.ts`, `tests/unit/watchlist-hash.test.ts`, `tests/unit/date-ranges.test.ts`

- [ ] **Step 1: Write watchlist hash tests**

Create `tests/unit/watchlist-hash.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";

describe("computeWatchlistHash", () => {
  it("returns same hash for same IDs regardless of order", () => {
    const hash1 = computeWatchlistHash([3, 1, 2]);
    const hash2 = computeWatchlistHash([1, 2, 3]);
    expect(hash1).toBe(hash2);
  });

  it("returns different hash for different IDs", () => {
    const hash1 = computeWatchlistHash([1, 2, 3]);
    const hash2 = computeWatchlistHash([1, 2, 4]);
    expect(hash1).not.toBe(hash2);
  });

  it("returns consistent hash for same input", () => {
    const hash1 = computeWatchlistHash([5, 10, 15]);
    const hash2 = computeWatchlistHash([5, 10, 15]);
    expect(hash1).toBe(hash2);
  });

  it("handles empty array", () => {
    const hash = computeWatchlistHash([]);
    expect(hash).toBe(computeWatchlistHash([]));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run tests/unit/watchlist-hash.test.ts
```

Expected: FAIL — module `@/lib/utils/watchlist-hash` not found.

- [ ] **Step 3: Implement watchlist hash**

Create `src/lib/utils/watchlist-hash.ts`:
```typescript
import { createHash } from "crypto";

export function computeWatchlistHash(commodityIds: number[]): string {
  const sorted = [...commodityIds].sort((a, b) => a - b);
  const input = sorted.join(",");
  return createHash("sha256").update(input).digest("hex").slice(0, 16);
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run tests/unit/watchlist-hash.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 5: Write date range tests**

Create `tests/unit/date-ranges.test.ts`:
```typescript
import { describe, it, expect, vi } from "vitest";
import { getStartDate } from "@/lib/utils/date-ranges";
import type { DateRange } from "@/types";

describe("getStartDate", () => {
  it("returns 7 days ago for 1w", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("1w");
    expect(start.toISOString().slice(0, 10)).toBe("2026-04-06");
    vi.useRealTimers();
  });

  it("returns 1 month ago for 1m", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("1m");
    expect(start.toISOString().slice(0, 10)).toBe("2026-03-13");
    vi.useRealTimers();
  });

  it("returns 3 months ago for 3m", () => {
    const now = new Date("2026-04-13T12:00:00Z");
    vi.setSystemTime(now);
    const start = getStartDate("3m");
    expect(start.toISOString().slice(0, 10)).toBe("2026-01-13");
    vi.useRealTimers();
  });

  it("returns null for all (no start bound)", () => {
    const start = getStartDate("all");
    expect(start).toBeNull();
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

```bash
npx vitest run tests/unit/date-ranges.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement date range helper**

Create `src/lib/utils/date-ranges.ts`:
```typescript
import { subDays, subMonths, subYears } from "date-fns";
import type { DateRange } from "@/types";

export function getStartDate(range: DateRange): Date | null {
  const now = new Date();
  switch (range) {
    case "1w":
      return subDays(now, 7);
    case "1m":
      return subMonths(now, 1);
    case "3m":
      return subMonths(now, 3);
    case "6m":
      return subMonths(now, 6);
    case "1y":
      return subYears(now, 1);
    case "all":
      return null;
  }
}
```

- [ ] **Step 8: Run test to verify it passes**

```bash
npx vitest run tests/unit/date-ranges.test.ts
```

Expected: All 4 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add watchlist hash and date range utility functions with tests"
```

---

## Task 4: Price Scraper

**Files:**
- Create: `src/lib/scraper/prices.ts`, `tests/unit/scraper.test.ts`, `tests/fixtures/tradingeconomics-sample.html`, `src/app/api/cron/scrape-prices/route.ts`

- [ ] **Step 1: Save a sample HTML fixture**

Fetch the TradingEconomics commodities page and save a representative HTML snippet for testing. Create `tests/fixtures/tradingeconomics-sample.html`:

```html
<!DOCTYPE html>
<html>
<body>
<div id="defined-content">
<table class="table table-hover table-heatmap">
<thead><tr>
<th>Major</th><th>Price</th><th>Day</th><th>%</th><th>Weekly</th><th>Monthly</th><th>YTD</th><th>Date</th>
</tr></thead>
<tbody>
<tr data-symbol="CL1:COM">
<td><a href="/commodity/crude-oil">Crude oil</a></td>
<td id="p">61.50</td>
<td id="nch">-0.53</td>
<td id="pch">-0.85%</td>
<td></td>
<td>-2.23%</td>
<td>-14.30%</td>
<td>-14.30%</td>
<td id="date">Apr/11</td>
</tr>
<tr data-symbol="CO1:COM">
<td><a href="/commodity/brent-crude-oil">Brent crude oil</a></td>
<td id="p">64.76</td>
<td id="nch">-0.62</td>
<td id="pch">-0.95%</td>
<td></td>
<td>-2.50%</td>
<td>-13.80%</td>
<td>-13.80%</td>
<td id="date">Apr/11</td>
</tr>
</tbody>
</table>
<table class="table table-hover table-heatmap">
<thead><tr>
<th>Metals</th><th>Price</th><th>Day</th><th>%</th><th>Weekly</th><th>Monthly</th><th>YTD</th><th>Date</th>
</tr></thead>
<tbody>
<tr data-symbol="XAUUSD:CUR">
<td><a href="/commodity/gold">Gold</a></td>
<td id="p">3,244.66</td>
<td id="nch">108.89</td>
<td id="pch">3.47%</td>
<td></td>
<td>6.50%</td>
<td>23.50%</td>
<td>23.50%</td>
<td id="date">Apr/11</td>
</tr>
<tr data-symbol="HG1:COM">
<td><a href="/commodity/copper">Copper</a></td>
<td id="p">4.43</td>
<td id="nch">-0.09</td>
<td id="pch">-1.91%</td>
<td></td>
<td>-3.10%</td>
<td>-1.60%</td>
<td>-1.60%</td>
<td id="date">Apr/11</td>
</tr>
</tbody>
</table>
</div>
</body>
</html>
```

- [ ] **Step 2: Write scraper parsing tests**

Create `tests/unit/scraper.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCommodityTables } from "@/lib/scraper/prices";

const sampleHtml = readFileSync(
  join(__dirname, "../fixtures/tradingeconomics-sample.html"),
  "utf-8"
);

describe("parseCommodityTables", () => {
  it("parses commodities from multiple tables", () => {
    const results = parseCommodityTables(sampleHtml);
    expect(results.length).toBe(4);
  });

  it("extracts commodity name and slug correctly", () => {
    const results = parseCommodityTables(sampleHtml);
    const crude = results.find((r) => r.sourceKey === "CL1:COM");
    expect(crude).toBeDefined();
    expect(crude!.name).toBe("Crude oil");
    expect(crude!.slug).toBe("crude-oil");
  });

  it("extracts category from table header", () => {
    const results = parseCommodityTables(sampleHtml);
    const crude = results.find((r) => r.sourceKey === "CL1:COM");
    const gold = results.find((r) => r.sourceKey === "XAUUSD:CUR");
    expect(crude!.category).toBe("major");
    expect(gold!.category).toBe("metals");
  });

  it("parses price correctly including comma-formatted numbers", () => {
    const results = parseCommodityTables(sampleHtml);
    const gold = results.find((r) => r.sourceKey === "XAUUSD:CUR");
    expect(gold!.price).toBe(3244.66);
  });

  it("parses day change and percentage", () => {
    const results = parseCommodityTables(sampleHtml);
    const crude = results.find((r) => r.sourceKey === "CL1:COM");
    expect(crude!.dayChange).toBe(-0.53);
    expect(crude!.dayChangePct).toBe(-0.85);
  });

  it("parses monthly and YTD percentages", () => {
    const results = parseCommodityTables(sampleHtml);
    const gold = results.find((r) => r.sourceKey === "XAUUSD:CUR");
    expect(gold!.monthlyPct).toBe(6.5);
    expect(gold!.ytdPct).toBe(23.5);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npx vitest run tests/unit/scraper.test.ts
```

Expected: FAIL — module `@/lib/scraper/prices` not found.

- [ ] **Step 4: Implement the scraper parser**

Create `src/lib/scraper/prices.ts`:
```typescript
import * as cheerio from "cheerio";

export interface ParsedCommodity {
  name: string;
  slug: string;
  category: string;
  sourceKey: string;
  price: number;
  dayChange: number;
  dayChangePct: number;
  weeklyPct: number;
  monthlyPct: number;
  ytdPct: number;
  dateStr: string;
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/,/g, "").replace(/%/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function slugFromHref(href: string): string {
  // e.g. "/commodity/crude-oil" -> "crude-oil"
  const parts = href.split("/");
  return parts[parts.length - 1] || "";
}

export function parseCommodityTables(html: string): ParsedCommodity[] {
  const $ = cheerio.load(html);
  const results: ParsedCommodity[] = [];

  $("table.table").each((_tableIdx, table) => {
    // Extract category from the first th in thead
    const categoryHeader = $(table).find("thead th").first().text().trim().toLowerCase();

    $(table)
      .find("tbody tr[data-symbol]")
      .each((_rowIdx, row) => {
        const $row = $(row);
        const sourceKey = $row.attr("data-symbol") || "";
        const linkEl = $row.find("td:first-child a");
        const name = linkEl.text().trim();
        const href = linkEl.attr("href") || "";
        const slug = slugFromHref(href);

        const cells = $row.find("td");
        const cellTexts: string[] = [];
        cells.each((_i, cell) => {
          cellTexts.push($(cell).text().trim());
        });

        // Column layout: Name | Price | Day Change | Day % | (spacer) | Monthly | YTD | YTD | Date
        // The exact column positions can vary. We use id selectors for reliability.
        const priceText = $row.find("td#p").text().trim();
        const dayChangeText = $row.find("td#nch").text().trim();
        const dayChangePctText = $row.find("td#pch").text().trim();
        const dateStr = $row.find("td#date").text().trim();

        // Monthly and YTD are positional — they are the columns after the weekly spacer
        // Typically cells[5] = monthly, cells[6] = YTD (0-indexed from all td elements)
        const monthlyPct = cellTexts.length > 5 ? parseNumber(cellTexts[5]) : 0;
        const ytdPct = cellTexts.length > 6 ? parseNumber(cellTexts[6]) : 0;

        if (name && priceText) {
          results.push({
            name,
            slug,
            category: categoryHeader,
            sourceKey,
            price: parseNumber(priceText),
            dayChange: parseNumber(dayChangeText),
            dayChangePct: parseNumber(dayChangePctText),
            weeklyPct: cellTexts.length > 4 ? parseNumber(cellTexts[4]) : 0,
            monthlyPct,
            ytdPct,
            dateStr,
          });
        }
      });
  });

  return results;
}

export async function scrapeCommodityPrices(): Promise<ParsedCommodity[]> {
  const response = await fetch("https://tradingeconomics.com/commodities", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch TradingEconomics: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  return parseCommodityTables(html);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npx vitest run tests/unit/scraper.test.ts
```

Expected: All 6 tests PASS. If column indexing is off due to the HTML fixture structure, adjust the fixture or parser column indices to match — the key is that the parser correctly handles the `id="p"`, `id="nch"`, `id="pch"`, `id="date"` selectors and positional columns for monthly/YTD.

- [ ] **Step 6: Create the cron API route for price scraping**

Create `src/app/api/cron/scrape-prices/route.ts`:
```typescript
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
      // Upsert commodity
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

      // Insert price snapshot (skip if already exists for today)
      const existingSnapshot = await db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.commodityId, commodityId))
        .limit(1);

      // Simple check: insert new snapshot for today
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
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add TradingEconomics price scraper with Cheerio parsing and cron route"
```

---

## Task 5: News Fetcher

**Files:**
- Create: `src/lib/news/gnews.ts`, `src/lib/news/rss.ts`, `tests/unit/gnews.test.ts`, `tests/unit/rss.test.ts`, `src/app/api/cron/fetch-news/route.ts`

- [ ] **Step 1: Write GNews client tests**

Create `tests/unit/gnews.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { mapGNewsArticle, COMMODITY_QUERIES } from "@/lib/news/gnews";

describe("mapGNewsArticle", () => {
  it("maps GNews API response to NewsArticle format", () => {
    const gnewsArticle = {
      title: "Steel prices surge amid tariff talks",
      description: "Global steel markets react to new trade policies.",
      url: "https://example.com/steel-article",
      source: { name: "Reuters", url: "https://reuters.com" },
      publishedAt: "2026-04-13T10:00:00Z",
    };

    const result = mapGNewsArticle(gnewsArticle);
    expect(result.title).toBe("Steel prices surge amid tariff talks");
    expect(result.sourceName).toBe("Reuters");
    expect(result.category).toBe("commodity");
    expect(result.url).toBe("https://example.com/steel-article");
  });

  it("tags articles with matching commodity names", () => {
    const gnewsArticle = {
      title: "Lumber and copper prices rise sharply",
      description: "Building materials costs increase.",
      url: "https://example.com/article",
      source: { name: "Bloomberg", url: "https://bloomberg.com" },
      publishedAt: "2026-04-13T10:00:00Z",
    };

    const result = mapGNewsArticle(gnewsArticle);
    expect(result.commodityTags).toContain("lumber");
    expect(result.commodityTags).toContain("copper");
  });
});

describe("COMMODITY_QUERIES", () => {
  it("contains search queries for rotation", () => {
    expect(COMMODITY_QUERIES.length).toBeGreaterThanOrEqual(4);
    expect(COMMODITY_QUERIES).toContain("commodity prices");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/unit/gnews.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement GNews client**

Create `src/lib/news/gnews.ts`:
```typescript
export const COMMODITY_QUERIES = [
  "commodity prices",
  "lumber prices construction",
  "steel market prices",
  "copper demand supply",
  "oil prices construction",
  "building materials costs",
];

const COMMODITY_KEYWORDS = [
  "lumber",
  "steel",
  "copper",
  "oil",
  "gas",
  "diesel",
  "fuel",
  "gold",
  "silver",
  "aluminum",
  "zinc",
  "nickel",
  "cement",
  "concrete",
  "iron",
  "coal",
  "wheat",
  "corn",
];

interface GNewsApiArticle {
  title: string;
  description: string;
  url: string;
  source: { name: string; url: string };
  publishedAt: string;
}

interface GNewsApiResponse {
  totalArticles: number;
  articles: GNewsApiArticle[];
}

export interface MappedNewsArticle {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  category: "commodity" | "construction";
  commodityTags: string[];
  publishedAt: Date;
}

function extractCommodityTags(text: string): string[] {
  const lower = text.toLowerCase();
  return COMMODITY_KEYWORDS.filter((keyword) => lower.includes(keyword));
}

export function mapGNewsArticle(article: GNewsApiArticle): MappedNewsArticle {
  const fullText = `${article.title} ${article.description}`;
  return {
    title: article.title,
    description: article.description,
    sourceName: article.source.name,
    sourceUrl: article.source.url,
    url: article.url,
    category: "commodity",
    commodityTags: extractCommodityTags(fullText),
    publishedAt: new Date(article.publishedAt),
  };
}

export async function fetchGNewsArticles(
  query: string
): Promise<MappedNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) throw new Error("GNEWS_API_KEY not configured");

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${apiKey}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`GNews API error: ${response.status}`);
  }

  const data: GNewsApiResponse = await response.json();
  return data.articles.map(mapGNewsArticle);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/unit/gnews.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Write RSS parser tests**

Create `tests/unit/rss.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { mapRssItem } from "@/lib/news/rss";

describe("mapRssItem", () => {
  it("maps RSS item to NewsArticle format", () => {
    const item = {
      title: "Housing starts jump 12% year-over-year",
      contentSnippet: "New residential construction activity surged in March.",
      link: "https://constructiondive.com/article/123",
      pubDate: "Mon, 13 Apr 2026 10:00:00 GMT",
    };

    const result = mapRssItem(item, "Construction Dive");
    expect(result.title).toBe("Housing starts jump 12% year-over-year");
    expect(result.category).toBe("construction");
    expect(result.sourceName).toBe("Construction Dive");
  });

  it("handles missing description gracefully", () => {
    const item = {
      title: "Some article",
      link: "https://example.com/article",
      pubDate: "Mon, 13 Apr 2026 10:00:00 GMT",
    };

    const result = mapRssItem(item, "ENR");
    expect(result.description).toBe("");
  });
});
```

- [ ] **Step 6: Run tests to verify they fail**

```bash
npx vitest run tests/unit/rss.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 7: Implement RSS parser**

Create `src/lib/news/rss.ts`:
```typescript
import Parser from "rss-parser";
import type { MappedNewsArticle } from "./gnews";

const parser = new Parser();

const RSS_FEEDS = [
  {
    url: "https://www.constructiondive.com/feeds/news/",
    sourceName: "Construction Dive",
  },
  {
    url: "https://www.enr.com/rss/all",
    sourceName: "ENR",
  },
];

interface RssItem {
  title?: string;
  contentSnippet?: string;
  link?: string;
  pubDate?: string;
}

export function mapRssItem(
  item: RssItem,
  sourceName: string
): MappedNewsArticle {
  return {
    title: item.title || "Untitled",
    description: item.contentSnippet || "",
    sourceName,
    sourceUrl: "",
    url: item.link || "",
    category: "construction",
    commodityTags: [],
    publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
  };
}

export async function fetchRssArticles(): Promise<MappedNewsArticle[]> {
  const allArticles: MappedNewsArticle[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const articles = (parsed.items || [])
        .slice(0, 10)
        .map((item) => mapRssItem(item, feed.sourceName));
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Failed to fetch RSS from ${feed.sourceName}:`, error);
      // Non-fatal: continue with other feeds
    }
  }

  return allArticles;
}
```

- [ ] **Step 8: Run tests to verify they pass**

```bash
npx vitest run tests/unit/rss.test.ts
```

Expected: All tests PASS.

- [ ] **Step 9: Create the cron API route for news fetching**

Create `src/app/api/cron/fetch-news/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { fetchGNewsArticles, COMMODITY_QUERIES } from "@/lib/news/gnews";
import { fetchRssArticles } from "@/lib/news/rss";
import { eq } from "drizzle-orm";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let insertedCount = 0;

    // Rotate through commodity queries (pick 2 per cycle to stay within rate limits)
    const cycleIndex = Math.floor(Date.now() / (4 * 60 * 60 * 1000)) % COMMODITY_QUERIES.length;
    const queriesToRun = [
      COMMODITY_QUERIES[cycleIndex % COMMODITY_QUERIES.length],
      COMMODITY_QUERIES[(cycleIndex + 1) % COMMODITY_QUERIES.length],
    ];

    // Fetch commodity news from GNews
    for (const query of queriesToRun) {
      try {
        const articles = await fetchGNewsArticles(query);
        for (const article of articles) {
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
          } catch {
            // Duplicate URL — skip (unique constraint on url)
          }
        }
      } catch (error) {
        console.error(`GNews query "${query}" failed:`, error);
      }
    }

    // Fetch construction news from RSS
    try {
      const rssArticles = await fetchRssArticles();
      for (const article of rssArticles) {
        if (!article.url) continue;
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
        } catch {
          // Duplicate URL — skip
        }
      }
    } catch (error) {
      console.error("RSS fetch failed:", error);
    }

    return NextResponse.json({
      success: true,
      inserted: insertedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("News fetching failed:", error);
    return NextResponse.json(
      { error: "News fetch failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add GNews API client, RSS parser, and news fetch cron route"
```

---

## Task 6: Intelligence Generator

**Files:**
- Create: `src/lib/insights/generate.ts`, `tests/unit/insights.test.ts`, `src/app/api/cron/generate-insights/route.ts`

- [ ] **Step 1: Write insight generation tests**

Create `tests/unit/insights.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { buildInsightPrompt, parseInsightResponse } from "@/lib/insights/generate";

describe("buildInsightPrompt", () => {
  it("includes commodity names and price data in the prompt", () => {
    const priceData = [
      {
        commodityName: "Lumber",
        currentPrice: 485.5,
        monthlyPct: 8.2,
        weeklyPct: 2.1,
        prices: [{ date: "2026-04-01", price: 450 }, { date: "2026-04-13", price: 485.5 }],
      },
    ];
    const newsHeadlines = ["Lumber futures rally as housing demand surges"];

    const prompt = buildInsightPrompt(priceData, newsHeadlines);
    expect(prompt).toContain("Lumber");
    expect(prompt).toContain("485.5");
    expect(prompt).toContain("8.2");
    expect(prompt).toContain("Lumber futures rally");
  });
});

describe("parseInsightResponse", () => {
  it("parses valid JSON insight cards from Claude response", () => {
    const response = JSON.stringify([
      {
        priority: "high",
        commodity: "Lumber",
        title: "Lock In Framing Costs",
        trendPct: 8.2,
        trendDirection: "up",
        description: "Lumber up 8.2% this month.",
        recommendation: "Lock in Q3 pricing now.",
      },
    ]);

    const cards = parseInsightResponse(response);
    expect(cards).toHaveLength(1);
    expect(cards[0].priority).toBe("high");
    expect(cards[0].commodity).toBe("Lumber");
  });

  it("returns empty array for invalid JSON", () => {
    const cards = parseInsightResponse("not json");
    expect(cards).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/unit/insights.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement insight generation**

Create `src/lib/insights/generate.ts`:
```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { InsightCard } from "@/types";

interface CommodityPriceData {
  commodityName: string;
  currentPrice: number;
  monthlyPct: number;
  weeklyPct: number;
  prices: { date: string; price: number }[];
}

const SYSTEM_PROMPT = `You are a commodity market analyst advising construction industry professionals. You analyze commodity price trends and their impact on construction project costs. Always provide actionable, specific recommendations.

Respond ONLY with a JSON array of insight objects. No markdown, no explanation outside the JSON. Each object must have exactly these fields:
- priority: "high" | "watch" | "opportunity"
- commodity: string (the commodity name)
- title: string (short actionable title, e.g. "Lock In Framing Costs")
- trendPct: number (the key percentage trend)
- trendDirection: "up" | "down"
- description: string (2-3 sentences explaining the situation and construction impact)
- recommendation: string (1-2 sentences with specific action to take)`;

export function buildInsightPrompt(
  priceData: CommodityPriceData[],
  newsHeadlines: string[]
): string {
  const priceSection = priceData
    .map(
      (c) =>
        `${c.commodityName}: Current $${c.currentPrice}, Weekly ${c.weeklyPct >= 0 ? "+" : ""}${c.weeklyPct}%, Monthly ${c.monthlyPct >= 0 ? "+" : ""}${c.monthlyPct}%`
    )
    .join("\n");

  const newsSection =
    newsHeadlines.length > 0
      ? newsHeadlines.map((h) => `- ${h}`).join("\n")
      : "No recent news available.";

  return `Analyze these commodity trends and their impact on construction projects. For each commodity with a notable trend, provide an actionable insight.

COMMODITY PRICES:
${priceSection}

RECENT NEWS:
${newsSection}

Provide insights as a JSON array. Include at least one insight per commodity if the trend is notable (>1% monthly change). Classify as:
- "high" priority: >5% monthly change or urgent action needed
- "watch": 2-5% monthly change, monitoring recommended
- "opportunity": price dips or favorable windows for procurement`;
}

export function parseInsightResponse(responseText: string): InsightCard[] {
  try {
    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonStr = responseText.trim();
    const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) return [];

    return parsed.map((item: Record<string, unknown>) => ({
      priority: item.priority as InsightCard["priority"],
      commodity: String(item.commodity || ""),
      title: String(item.title || ""),
      trendPct: Number(item.trendPct) || 0,
      trendDirection: item.trendDirection as "up" | "down",
      description: String(item.description || ""),
      recommendation: String(item.recommendation || ""),
    }));
  } catch {
    console.error("Failed to parse insight response:", responseText.slice(0, 200));
    return [];
  }
}

export async function generateInsights(
  priceData: CommodityPriceData[],
  newsHeadlines: string[]
): Promise<InsightCard[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const userPrompt = buildInsightPrompt(priceData, newsHeadlines);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseInsightResponse(responseText);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/unit/insights.test.ts
```

Expected: All tests PASS.

- [ ] **Step 5: Create the cron API route for insight generation**

Create `src/app/api/cron/generate-insights/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  userPreferences,
  priceSnapshots,
  commodities,
  newsArticles,
  insights,
} from "@/lib/db/schema";
import { generateInsights } from "@/lib/insights/generate";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";
import { eq, inArray, gte, desc } from "drizzle-orm";
import { subDays } from "date-fns";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all unique watchlists
    const allPrefs = await db.select().from(userPreferences);
    const uniqueHashes = new Map<string, number[]>();

    for (const pref of allPrefs) {
      const hash = computeWatchlistHash(pref.watchlist);
      if (!uniqueHashes.has(hash)) {
        uniqueHashes.set(hash, pref.watchlist);
      }
    }

    // Also generate for the default watchlist if no users exist yet
    if (uniqueHashes.size === 0) {
      // Find default commodity IDs (lumber, steel, copper, diesel)
      const defaults = await db
        .select()
        .from(commodities)
        .where(
          inArray(commodities.slug, [
            "lumber",
            "steel",
            "copper",
            "crude-oil",
          ])
        );
      if (defaults.length > 0) {
        const ids = defaults.map((d) => d.id);
        uniqueHashes.set(computeWatchlistHash(ids), ids);
      }
    }

    let generatedCount = 0;

    for (const [hash, watchlistIds] of uniqueHashes) {
      // Get commodity info
      const commodityRows = await db
        .select()
        .from(commodities)
        .where(inArray(commodities.id, watchlistIds));

      // Get recent price data for each commodity
      const thirtyDaysAgo = subDays(new Date(), 30).toISOString().slice(0, 10);
      const priceData = [];

      for (const commodity of commodityRows) {
        const prices = await db
          .select()
          .from(priceSnapshots)
          .where(eq(priceSnapshots.commodityId, commodity.id))
          .orderBy(desc(priceSnapshots.date))
          .limit(30);

        const latest = prices[0];
        priceData.push({
          commodityName: commodity.name,
          currentPrice: latest?.price ?? 0,
          monthlyPct: latest?.monthlyPct ?? 0,
          weeklyPct: latest?.weeklyPct ?? 0,
          prices: prices.map((p) => ({
            date: String(p.date),
            price: p.price,
          })),
        });
      }

      // Get recent news headlines
      const sevenDaysAgo = subDays(new Date(), 7);
      const recentNews = await db
        .select({ title: newsArticles.title })
        .from(newsArticles)
        .where(gte(newsArticles.publishedAt, sevenDaysAgo))
        .orderBy(desc(newsArticles.publishedAt))
        .limit(20);

      const headlines = recentNews.map((n) => n.title);

      // Generate insights
      const insightCards = await generateInsights(priceData, headlines);

      if (insightCards.length > 0) {
        await db.insert(insights).values({
          watchlistHash: hash,
          content: insightCards,
          type: "scheduled",
        });
        generatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      generated: generatedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Insight generation failed:", error);
    return NextResponse.json(
      { error: "Insight generation failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Claude API insight generation with cron route"
```

---

## Task 7: API Routes (Commodities, Prices, News, Insights, Preferences)

**Files:**
- Create: `src/app/api/commodities/route.ts`, `src/app/api/prices/route.ts`, `src/app/api/news/route.ts`, `src/app/api/insights/route.ts`, `src/app/api/insights/refresh/route.ts`, `src/app/api/preferences/route.ts`

- [ ] **Step 1: Create commodities API**

Create `src/app/api/commodities/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { commodities, priceSnapshots } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  try {
    const allCommodities = await db
      .select()
      .from(commodities)
      .orderBy(commodities.category, commodities.name);

    // Get latest price for each commodity
    const withPrices = await Promise.all(
      allCommodities.map(async (commodity) => {
        const latestPrice = await db
          .select()
          .from(priceSnapshots)
          .where(eq(priceSnapshots.commodityId, commodity.id))
          .orderBy(desc(priceSnapshots.scrapedAt))
          .limit(1);

        return {
          ...commodity,
          latestPrice: latestPrice[0] || null,
        };
      })
    );

    // Group by category
    const grouped = withPrices.reduce(
      (acc, commodity) => {
        const cat = commodity.category;
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(commodity);
        return acc;
      },
      {} as Record<string, typeof withPrices>
    );

    return NextResponse.json(grouped);
  } catch (error) {
    console.error("Failed to fetch commodities:", error);
    return NextResponse.json(
      { error: "Failed to fetch commodities" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create prices API**

Create `src/app/api/prices/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { priceSnapshots, commodities } from "@/lib/db/schema";
import { eq, inArray, gte, desc } from "drizzle-orm";
import { getStartDate } from "@/lib/utils/date-ranges";
import type { DateRange } from "@/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const commodityIds = searchParams.get("commodities")?.split(",").map(Number).filter(Boolean) || [];
  const range = (searchParams.get("range") || "1m") as DateRange;

  if (commodityIds.length === 0) {
    return NextResponse.json({ error: "commodities parameter required" }, { status: 400 });
  }

  try {
    const startDate = getStartDate(range);

    const query = db
      .select({
        id: priceSnapshots.id,
        commodityId: priceSnapshots.commodityId,
        price: priceSnapshots.price,
        dayChange: priceSnapshots.dayChange,
        dayChangePct: priceSnapshots.dayChangePct,
        weeklyPct: priceSnapshots.weeklyPct,
        monthlyPct: priceSnapshots.monthlyPct,
        ytdPct: priceSnapshots.ytdPct,
        date: priceSnapshots.date,
        commodityName: commodities.name,
        commoditySlug: commodities.slug,
      })
      .from(priceSnapshots)
      .innerJoin(commodities, eq(priceSnapshots.commodityId, commodities.id))
      .where(inArray(priceSnapshots.commodityId, commodityIds))
      .orderBy(priceSnapshots.date);

    let results;
    if (startDate) {
      const startStr = startDate.toISOString().slice(0, 10);
      results = await db
        .select({
          id: priceSnapshots.id,
          commodityId: priceSnapshots.commodityId,
          price: priceSnapshots.price,
          dayChange: priceSnapshots.dayChange,
          dayChangePct: priceSnapshots.dayChangePct,
          weeklyPct: priceSnapshots.weeklyPct,
          monthlyPct: priceSnapshots.monthlyPct,
          ytdPct: priceSnapshots.ytdPct,
          date: priceSnapshots.date,
          commodityName: commodities.name,
          commoditySlug: commodities.slug,
        })
        .from(priceSnapshots)
        .innerJoin(commodities, eq(priceSnapshots.commodityId, commodities.id))
        .where(inArray(priceSnapshots.commodityId, commodityIds))
        .orderBy(priceSnapshots.date);

      // Filter by date in JS since Drizzle date comparison with string can be tricky
      results = results.filter((r) => String(r.date) >= startStr);
    } else {
      results = await query;
    }

    // Group by commodity
    const grouped = results.reduce(
      (acc, row) => {
        if (!acc[row.commodityId]) {
          acc[row.commodityId] = {
            commodityId: row.commodityId,
            name: row.commodityName,
            slug: row.commoditySlug,
            prices: [],
          };
        }
        acc[row.commodityId].prices.push({
          price: row.price,
          dayChange: row.dayChange,
          dayChangePct: row.dayChangePct,
          weeklyPct: row.weeklyPct,
          monthlyPct: row.monthlyPct,
          ytdPct: row.ytdPct,
          date: row.date,
        });
        return acc;
      },
      {} as Record<number, { commodityId: number; name: string; slug: string; prices: unknown[] }>
    );

    return NextResponse.json(Object.values(grouped));
  } catch (error) {
    console.error("Failed to fetch prices:", error);
    return NextResponse.json({ error: "Failed to fetch prices" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create news API**

Create `src/app/api/news/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { newsArticles } from "@/lib/db/schema";
import { eq, desc, like, or, sql } from "drizzle-orm";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get("category") || "all";
  const commodity = searchParams.get("commodity");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const offset = (page - 1) * PAGE_SIZE;

  try {
    let query = db
      .select()
      .from(newsArticles)
      .orderBy(desc(newsArticles.publishedAt))
      .limit(PAGE_SIZE)
      .offset(offset);

    // Build conditions array
    const conditions = [];

    if (category !== "all") {
      conditions.push(eq(newsArticles.category, category));
    }

    if (search) {
      conditions.push(
        or(
          like(newsArticles.title, `%${search}%`),
          like(newsArticles.description, `%${search}%`)
        )!
      );
    }

    // For commodity filtering, we filter by commodityTags JSON array
    // Using a simple SQL contains check
    if (commodity) {
      conditions.push(
        sql`${newsArticles.commodityTags}::text LIKE ${"%" + commodity + "%"}`
      );
    }

    let results;
    if (conditions.length > 0) {
      // Apply all conditions with AND
      const where = conditions.length === 1
        ? conditions[0]
        : sql`${conditions.map((c, i) => i === 0 ? c : sql` AND ${c}`)}`;

      results = await db
        .select()
        .from(newsArticles)
        .where(conditions.length === 1 ? conditions[0] : sql`TRUE`)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(PAGE_SIZE)
        .offset(offset);

      // Apply additional filters in JS for simplicity
      if (category !== "all") {
        results = results.filter((r) => r.category === category);
      }
      if (commodity) {
        results = results.filter((r) =>
          r.commodityTags.some((tag: string) =>
            tag.toLowerCase().includes(commodity.toLowerCase())
          )
        );
      }
      if (search) {
        const lower = search.toLowerCase();
        results = results.filter(
          (r) =>
            r.title.toLowerCase().includes(lower) ||
            r.description.toLowerCase().includes(lower)
        );
      }
    } else {
      results = await db
        .select()
        .from(newsArticles)
        .orderBy(desc(newsArticles.publishedAt))
        .limit(PAGE_SIZE)
        .offset(offset);
    }

    return NextResponse.json({
      articles: results,
      page,
      pageSize: PAGE_SIZE,
      hasMore: results.length === PAGE_SIZE,
    });
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create insights API**

Create `src/app/api/insights/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { insights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const watchlistHash = request.nextUrl.searchParams.get("watchlist_hash");

  if (!watchlistHash) {
    return NextResponse.json(
      { error: "watchlist_hash parameter required" },
      { status: 400 }
    );
  }

  try {
    const latest = await db
      .select()
      .from(insights)
      .where(eq(insights.watchlistHash, watchlistHash))
      .orderBy(desc(insights.generatedAt))
      .limit(1);

    if (latest.length === 0) {
      return NextResponse.json({
        insights: null,
        message: "No insights generated yet. Click Refresh to generate.",
      });
    }

    return NextResponse.json({
      insights: latest[0].content,
      generatedAt: latest[0].generatedAt,
      type: latest[0].type,
    });
  } catch (error) {
    console.error("Failed to fetch insights:", error);
    return NextResponse.json(
      { error: "Failed to fetch insights" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 5: Create insights refresh API**

Create `src/app/api/insights/refresh/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  commodities,
  priceSnapshots,
  newsArticles,
  insights,
} from "@/lib/db/schema";
import { generateInsights } from "@/lib/insights/generate";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";
import { eq, inArray, gte, desc } from "drizzle-orm";
import { subDays } from "date-fns";

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const watchlistIds: number[] = body.watchlist || [];

    if (watchlistIds.length === 0) {
      return NextResponse.json(
        { error: "watchlist array required in body" },
        { status: 400 }
      );
    }

    const hash = computeWatchlistHash(watchlistIds);

    // Get commodity info
    const commodityRows = await db
      .select()
      .from(commodities)
      .where(inArray(commodities.id, watchlistIds));

    // Get price data
    const priceData = [];
    for (const commodity of commodityRows) {
      const prices = await db
        .select()
        .from(priceSnapshots)
        .where(eq(priceSnapshots.commodityId, commodity.id))
        .orderBy(desc(priceSnapshots.date))
        .limit(30);

      const latest = prices[0];
      priceData.push({
        commodityName: commodity.name,
        currentPrice: latest?.price ?? 0,
        monthlyPct: latest?.monthlyPct ?? 0,
        weeklyPct: latest?.weeklyPct ?? 0,
        prices: prices.map((p) => ({
          date: String(p.date),
          price: p.price,
        })),
      });
    }

    // Get recent news
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentNews = await db
      .select({ title: newsArticles.title })
      .from(newsArticles)
      .where(gte(newsArticles.publishedAt, sevenDaysAgo))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(20);

    const headlines = recentNews.map((n) => n.title);

    // Generate insights
    const insightCards = await generateInsights(priceData, headlines);

    // Store
    if (insightCards.length > 0) {
      await db.insert(insights).values({
        watchlistHash: hash,
        content: insightCards,
        type: "on_demand",
      });
    }

    return NextResponse.json({
      insights: insightCards,
      generatedAt: new Date().toISOString(),
      type: "on_demand",
    });
  } catch (error) {
    console.error("Insight refresh failed:", error);
    return NextResponse.json(
      { error: "Insight refresh failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 6: Create preferences API**

Create `src/app/api/preferences/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { userPreferences } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const browserId = request.nextUrl.searchParams.get("browser_id");

  if (!browserId) {
    return NextResponse.json(
      { error: "browser_id parameter required" },
      { status: 400 }
    );
  }

  try {
    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.browserId, browserId))
      .limit(1);

    if (prefs.length === 0) {
      return NextResponse.json({ watchlist: [], isDefault: true });
    }

    return NextResponse.json({
      watchlist: prefs[0].watchlist,
      isDefault: false,
    });
  } catch (error) {
    console.error("Failed to fetch preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { browserId, watchlist } = body;

    if (!browserId || !Array.isArray(watchlist)) {
      return NextResponse.json(
        { error: "browserId and watchlist array required" },
        { status: 400 }
      );
    }

    // Upsert preferences
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.browserId, browserId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userPreferences)
        .set({ watchlist, updatedAt: new Date() })
        .where(eq(userPreferences.browserId, browserId));
    } else {
      await db.insert(userPreferences).values({
        browserId,
        watchlist,
      });
    }

    return NextResponse.json({ success: true, watchlist });
  } catch (error) {
    console.error("Failed to update preferences:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add all REST API routes (commodities, prices, news, insights, preferences)"
```

---

## Task 8: Frontend — Client Hooks & Layout Shell

> **Use the `/frontend-design` skill for all frontend UI tasks (Tasks 8–13).**

**Files:**
- Create: `src/hooks/use-browser-id.ts`, `src/hooks/use-watchlist.ts`, `src/components/layout/sidebar.tsx`, `src/components/layout/sidebar-nav.tsx`, `src/components/layout/sidebar-watchlist.tsx`, `src/components/layout/mobile-nav.tsx`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Create browser ID hook**

Create `src/hooks/use-browser-id.ts`:
```typescript
"use client";

import { useState, useEffect } from "react";

function generateUUID(): string {
  return crypto.randomUUID();
}

export function useBrowserId(): string | null {
  const [browserId, setBrowserId] = useState<string | null>(null);

  useEffect(() => {
    let id = localStorage.getItem("highland_browser_id");
    if (!id) {
      id = generateUUID();
      localStorage.setItem("highland_browser_id", id);
    }
    setBrowserId(id);
  }, []);

  return browserId;
}
```

- [ ] **Step 2: Create watchlist context and hook**

Create `src/hooks/use-watchlist.ts`:
```typescript
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useBrowserId } from "./use-browser-id";
import { computeWatchlistHash } from "@/lib/utils/watchlist-hash";

interface WatchlistContextType {
  watchlist: number[];
  watchlistHash: string;
  isLoading: boolean;
  addCommodity: (id: number) => void;
  removeCommodity: (id: number) => void;
  setWatchlist: (ids: number[]) => void;
}

const WatchlistContext = createContext<WatchlistContextType | null>(null);

export function WatchlistProvider({ children }: { children: ReactNode }) {
  const browserId = useBrowserId();
  const [watchlist, setWatchlistState] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load watchlist from API on mount
  useEffect(() => {
    if (!browserId) return;

    async function loadWatchlist() {
      try {
        const res = await fetch(`/api/preferences?browser_id=${browserId}`);
        const data = await res.json();
        if (data.watchlist && data.watchlist.length > 0) {
          setWatchlistState(data.watchlist);
        }
        // If empty/default, we'll set defaults after commodities load
      } catch (error) {
        console.error("Failed to load watchlist:", error);
      } finally {
        setIsLoading(false);
      }
    }

    loadWatchlist();
  }, [browserId]);

  // Persist watchlist changes to API
  const persistWatchlist = useCallback(
    async (ids: number[]) => {
      if (!browserId) return;
      try {
        await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ browserId, watchlist: ids }),
        });
      } catch (error) {
        console.error("Failed to persist watchlist:", error);
      }
    },
    [browserId]
  );

  const setWatchlist = useCallback(
    (ids: number[]) => {
      setWatchlistState(ids);
      persistWatchlist(ids);
    },
    [persistWatchlist]
  );

  const addCommodity = useCallback(
    (id: number) => {
      setWatchlistState((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persistWatchlist(next);
        return next;
      });
    },
    [persistWatchlist]
  );

  const removeCommodity = useCallback(
    (id: number) => {
      setWatchlistState((prev) => {
        const next = prev.filter((x) => x !== id);
        persistWatchlist(next);
        return next;
      });
    },
    [persistWatchlist]
  );

  const watchlistHash = computeWatchlistHash(watchlist);

  return (
    <WatchlistContext.Provider
      value={{
        watchlist,
        watchlistHash,
        isLoading,
        addCommodity,
        removeCommodity,
        setWatchlist,
      }}
    >
      {children}
    </WatchlistContext.Provider>
  );
}

export function useWatchlist() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return context;
}
```

Note: This imports `computeWatchlistHash` which uses Node's `crypto` module. Since this hook runs client-side, we need a browser-compatible hash. Replace the import with an inline browser-compatible version:

Replace the import line and add at the top of the file:
```typescript
function computeWatchlistHash(ids: number[]): string {
  const sorted = [...ids].sort((a, b) => a - b);
  const input = sorted.join(",");
  // Simple hash for client-side use
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}
```

Alternatively, keep the server-side `computeWatchlistHash` in `@/lib/utils/watchlist-hash` for API routes, and use the simple client-side version in the hook. The hash just needs to be consistent within each context (server or client) — the preferences API stores the watchlist array directly, so the hash is only used for insight caching.

- [ ] **Step 3: Build sidebar components and root layout**

Use the `/frontend-design` skill to implement:
- `src/components/layout/sidebar.tsx` — full sidebar shell (200px wide, dark `#111118` background, border-right)
- `src/components/layout/sidebar-nav.tsx` — navigation links (Dashboard, News, Trends, Intelligence) with icons, active state highlighted with blue accent
- `src/components/layout/sidebar-watchlist.tsx` — watchlist section showing commodity names + current prices, fetched from `/api/commodities`
- `src/components/layout/mobile-nav.tsx` — sheet/drawer hamburger menu for mobile
- Update `src/app/layout.tsx` to wrap children in `WatchlistProvider` and render the sidebar layout

Design spec reference (from the approved design):
- Left sidebar approx 200px wide
- App logo "Highland" at top with gradient blue/purple icon
- Nav links with icons: 📊 Dashboard, 📰 News, 📈 Trends, 💡 Intelligence
- Active page: `rgba(59,130,246,0.15)` background, blue text
- Divider line, then "WATCHLIST" section with commodity names and prices
- Responsive: collapse to icon-only on tablet (< 1024px), hidden on mobile (< 768px) with hamburger sheet

- [ ] **Step 4: Verify layout renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000`. Expected: dark sidebar on left with Highland logo, navigation links, and main content area on the right.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add sidebar layout shell with navigation and watchlist provider"
```

---

## Task 9: Frontend — Dashboard Page

> **Use the `/frontend-design` skill.**

**Files:**
- Create: `src/components/dashboard/kpi-card.tsx`, `src/components/dashboard/insight-snippet.tsx`, `src/components/dashboard/trend-overview-chart.tsx`, `src/components/dashboard/news-strip.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Build dashboard components and page**

Use the `/frontend-design` skill to implement the Dashboard page with these components:

**`src/components/dashboard/kpi-card.tsx`** — Commodity price KPI card:
- Shows commodity name (muted small text), price (large bold), and % change (green up / red down)
- Background: `#111118`, border: `1px solid #1e1e2e`, rounded-lg
- One card per watchlist commodity

**`src/components/dashboard/insight-snippet.tsx`** — Inline insight card:
- Gradient background: `linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))`
- Blue border, 💡 icon, "INSIGHT" label, short text, "View all insights →" link to `/intelligence`
- Displays the top (highest priority) insight from the latest briefing

**`src/components/dashboard/trend-overview-chart.tsx`** — Multi-line Recharts chart:
- Compact `AreaChart` with one line per watchlist commodity
- Color-coded by commodity (use array of colors: blue, purple, green, amber, etc.)
- Time range toggle buttons (1M / 3M) — fetch from `/api/prices`
- Legend showing commodity names with color dots

**`src/components/dashboard/news-strip.tsx`** — Three-column news row:
- Three cards side by side: latest Commodity News, Construction News, and a Market Alert
- Each shows headline, source name, relative time ("2h ago")
- Fetches from `/api/news`

**`src/app/page.tsx`** — Dashboard page composition:
- Header row: "Dashboard" title + today's date + "Customize" button (opens watchlist modal later)
- Row of KPI cards (flex wrap) + insight snippet card
- Trend chart below
- News strip at bottom
- All data fetched client-side with loading skeletons

- [ ] **Step 2: Verify dashboard renders with mock/empty data**

```bash
npm run dev
```

Expected: Dashboard page shows layout structure with loading skeletons or empty states. Once data is seeded (after running the scraper), real data populates.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Dashboard page with KPI cards, insight snippet, trend chart, and news strip"
```

---

## Task 10: Frontend — News Page

> **Use the `/frontend-design` skill.**

**Files:**
- Create: `src/components/news/news-card.tsx`, `src/components/news/news-tabs.tsx`, `src/components/news/commodity-filters.tsx`
- Create: `src/app/news/page.tsx`

- [ ] **Step 1: Build news page components**

Use the `/frontend-design` skill to implement:

**`src/components/news/news-tabs.tsx`** — Tab bar:
- Three tabs: "All News", "Commodity", "Construction"
- Underline-style active indicator (blue bottom border on active tab)
- Controlled component, takes `activeTab` and `onTabChange` props

**`src/components/news/commodity-filters.tsx`** — Filter chip bar:
- Pill-shaped chips: All, Lumber, Steel, Copper, Fuel
- Active chip: blue background, white text
- Inactive: `#1e1e2e` background, muted text
- Shown when on "All" or "Commodity" tab, hidden on "Construction" tab

**`src/components/news/news-card.tsx`** — News article card:
- Left border: blue for commodity, amber for construction (4px wide)
- Category badge (colored), source name + relative time
- Bold headline, description snippet below
- "Read →" link opens original article in new tab
- Background: `#111118`, border, rounded-lg

**`src/app/news/page.tsx`** — News page:
- Header with "News" title + search input
- Tab bar
- Filter chips (conditional)
- Infinite scroll feed of news cards, fetching from `/api/news` with page parameter
- Client-side state for tab, filter, search, and page
- Loading skeletons while fetching

- [ ] **Step 2: Verify news page renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/news`. Expected: empty state or news feed with tabs and filters.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add News page with unified feed, tabs, and commodity filters"
```

---

## Task 11: Frontend — Trends Page

> **Use the `/frontend-design` skill.**

**Files:**
- Create: `src/components/trends/chart-card.tsx`, `src/components/trends/expanded-chart.tsx`
- Create: `src/app/trends/page.tsx`

- [ ] **Step 1: Build trends page components**

Use the `/frontend-design` skill to implement:

**`src/components/trends/chart-card.tsx`** — Mini chart card:
- Header: commodity name + % change badge (green/red)
- Large price text
- Recharts `AreaChart` sparkline: green fill if positive trend, red if negative
- Clickable — triggers expand
- Background: `#111118`, border, rounded-lg

**`src/components/trends/expanded-chart.tsx`** — Full expanded chart view:
- Opens as a modal/dialog or replaces the grid (dialog recommended)
- Large `AreaChart` with:
  - Hover tooltip showing date, exact price, % change from start
  - Y-axis price labels, X-axis date labels
  - Area fill under the line (gradient from line color to transparent)
  - Optional: toggle to overlay additional commodities for comparison
- Close button to return to grid

**`src/app/trends/page.tsx`** — Trends page:
- Header with "Price Trends" title + time range selector buttons (1W / 1M / 3M / 6M / 1Y / ALL)
- Responsive grid: `grid-cols-2` on desktop, `grid-cols-1` on mobile
- One `chart-card` per watchlist commodity
- Fetches price data from `/api/prices` for all watchlist commodities
- State for selected time range and expanded commodity
- Loading skeletons

- [ ] **Step 2: Verify trends page renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/trends`. Expected: grid of chart cards (empty or with data).

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Trends page with multi-chart grid and expandable detail view"
```

---

## Task 12: Frontend — Intelligence Page

> **Use the `/frontend-design` skill.**

**Files:**
- Create: `src/components/intelligence/insight-card.tsx`, `src/components/intelligence/priority-filters.tsx`
- Create: `src/app/intelligence/page.tsx`

- [ ] **Step 1: Build intelligence page components**

Use the `/frontend-design` skill to implement:

**`src/components/intelligence/priority-filters.tsx`** — Filter chip bar:
- Chips: All, 🔴 High Priority, 🟡 Watch, 🟢 Opportunity
- Active chip: blue background
- Controlled component, filters the displayed insight cards

**`src/components/intelligence/insight-card.tsx`** — Full insight card:
- Top border colored by priority: red (`#ef4444`) for high, amber (`#f59e0b`) for watch, green (`#22c55e`) for opportunity
- Priority badge with matching color and background
- Commodity name + actionable title (bold)
- Trend percentage indicator (green up / red down)
- Description paragraph (secondary text)
- "Details →" link to trends page for that commodity
- Background: `#111118`, border, rounded-lg

**`src/app/intelligence/page.tsx`** — Intelligence page:
- Header: "Actionable Intelligence" title + "Refresh Insights" button (gradient blue/purple background, white text)
- Filter chips row
- 2-column card grid (`grid-cols-2` desktop, `grid-cols-1` mobile)
- Fetches from `/api/insights?watchlist_hash=<hash>` using the watchlist context
- "Refresh Insights" button calls `POST /api/insights/refresh` with current watchlist, shows loading spinner, updates cards on completion
- Empty state when no insights exist: "No insights yet. Click Refresh to generate your first briefing."
- Shows "Generated at: [time]" below the header
- Error toast if refresh fails, shows last cached briefing

- [ ] **Step 2: Verify intelligence page renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/intelligence`. Expected: empty state with Refresh button.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add Intelligence page with filterable insight card grid and on-demand refresh"
```

---

## Task 13: Watchlist Management Modal

> **Use the `/frontend-design` skill.**

**Files:**
- Create: `src/components/layout/watchlist-modal.tsx`
- Modify: `src/app/page.tsx` (wire up "Customize" button)

- [ ] **Step 1: Build watchlist management modal**

Use the `/frontend-design` skill to implement:

**`src/components/layout/watchlist-modal.tsx`** — Dialog for managing watchlist:
- Triggered by "Customize" button on Dashboard or "+ Add" in sidebar watchlist
- Fetches all commodities from `/api/commodities`
- Groups commodities by category (Energy, Metals, Agriculture, etc.)
- Each commodity row shows: name, current price, and a toggle (checkbox or switch)
- Checked items are in the watchlist
- Changes update the watchlist context immediately (optimistic update)
- Search/filter input at the top to find commodities by name
- Uses shadcn `Dialog`, `ScrollArea`, `Input`, `Checkbox` components

- [ ] **Step 2: Wire up the modal triggers**

- Dashboard "Customize" button opens the modal
- Sidebar watchlist section gets a small "+" button that opens the modal

- [ ] **Step 3: Verify modal works**

```bash
npm run dev
```

Click "Customize" on dashboard. Expected: dialog opens with categorized commodity list and checkboxes.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add watchlist management modal with commodity selection"
```

---

## Task 14: Error States, Loading States & Polish

**Files:**
- Modify: all page and component files as needed

- [ ] **Step 1: Add loading skeletons to all pages**

Ensure each page has proper loading states using shadcn `Skeleton` component:
- Dashboard: skeleton cards for KPIs, skeleton rectangle for chart, skeleton rows for news
- News: skeleton cards in feed
- Trends: skeleton chart cards in grid
- Intelligence: skeleton insight cards

- [ ] **Step 2: Add error states**

Add error handling to each page:
- If API fetch fails, show an error message with a "Retry" button
- If price data is stale (no `scrapedAt` within 24 hours), show a yellow warning banner: "Price data may be outdated. Last updated: [time]"

- [ ] **Step 3: Add empty states**

- News: "No news articles yet. Check back soon." with newspaper icon
- Trends: "Add commodities to your watchlist to see price trends." with link to customize
- Intelligence: "No insights yet. Click Refresh to generate your first briefing."

- [ ] **Step 4: Verify all states render correctly**

```bash
npm run dev
```

Check each page in loading, empty, and error states.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add loading skeletons, error states, and empty states across all pages"
```

---

## Task 15: Vercel Deployment Configuration

**Files:**
- Modify: `vercel.json`, `next.config.ts`, `package.json`
- Create: `src/app/api/cron/scrape-prices/route.ts` (update auth check for Vercel Cron)

- [ ] **Step 1: Update next.config.ts for Vercel**

Update `next.config.ts`:
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {},
};

export default nextConfig;
```

- [ ] **Step 2: Update cron routes to use Vercel's authorization header**

Vercel Cron sends the `CRON_SECRET` in the `Authorization` header as `Bearer <secret>`. Our routes already handle this. Verify each cron route (`scrape-prices`, `fetch-news`, `generate-insights`) checks:

```typescript
const authHeader = request.headers.get("authorization");
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

- [ ] **Step 3: Verify vercel.json is correct**

Confirm `vercel.json` contains:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-prices",
      "schedule": "0 12 * * *"
    },
    {
      "path": "/api/cron/fetch-news",
      "schedule": "0 */4 * * *"
    },
    {
      "path": "/api/cron/generate-insights",
      "schedule": "30 12 * * *"
    }
  ]
}
```

- [ ] **Step 4: Build and verify no errors**

```bash
npm run build
```

Expected: Build succeeds with no errors. All pages statically analyzable or properly marked as dynamic.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: finalize Vercel deployment configuration with cron jobs"
```

---

## Task 16: E2E Tests

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Install Playwright**

```bash
npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Configure Playwright**

Create `playwright.config.ts`:
```typescript
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

Add to `package.json` scripts:
```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 3: Write navigation E2E tests**

Create `tests/e2e/navigation.spec.ts`:
```typescript
import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("loads the dashboard page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Highland")).toBeVisible();
  });

  test("navigates to News page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/news"]');
    await expect(page).toHaveURL("/news");
    await expect(page.locator("text=News")).toBeVisible();
  });

  test("navigates to Trends page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/trends"]');
    await expect(page).toHaveURL("/trends");
    await expect(page.locator("text=Price Trends")).toBeVisible();
  });

  test("navigates to Intelligence page", async ({ page }) => {
    await page.goto("/");
    await page.click('a[href="/intelligence"]');
    await expect(page).toHaveURL("/intelligence");
    await expect(page.locator("text=Actionable Intelligence")).toBeVisible();
  });

  test("sidebar shows Highland branding", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Highland")).toBeVisible();
  });
});
```

- [ ] **Step 4: Run E2E tests**

```bash
npx playwright test
```

Expected: All 5 navigation tests pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Playwright E2E tests for navigation"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Project scaffold & deps | package.json, next.config, tailwind, shadcn |
| 2 | Types & database schema | types/index.ts, lib/db/schema.ts |
| 3 | Utility functions | watchlist-hash.ts, date-ranges.ts |
| 4 | Price scraper | lib/scraper/prices.ts, cron route |
| 5 | News fetcher | lib/news/gnews.ts, rss.ts, cron route |
| 6 | Intelligence generator | lib/insights/generate.ts, cron route |
| 7 | API routes | commodities, prices, news, insights, preferences |
| 8 | Frontend layout shell | sidebar, nav, watchlist, hooks |
| 9 | Dashboard page | KPI cards, insight snippet, chart, news strip |
| 10 | News page | tabs, filters, news cards, infinite scroll |
| 11 | Trends page | chart grid, expanded view |
| 12 | Intelligence page | insight cards, priority filters, refresh |
| 13 | Watchlist modal | commodity selection dialog |
| 14 | Polish | loading, error, empty states |
| 15 | Vercel config | cron, build, deployment |
| 16 | E2E tests | Playwright navigation tests |
