# Highland Commodity Tracker — Design Spec

## Overview

A web application for construction industry professionals to track commodity prices, read industry news, monitor price trends over time, and receive AI-powered actionable intelligence connecting commodity movements to construction project decisions.

**Target audience:** Construction industry professionals tracking material costs for project budgeting.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** PostgreSQL via Neon (managed, serverless-compatible)
- **UI:** Tailwind CSS + shadcn/ui component library
- **Charts:** Recharts
- **Scraping:** Cheerio (HTML parsing)
- **News:** GNews API (commodity news) + RSS parsing for Construction Dive and ENR
- **AI:** Anthropic Claude API (insight generation)
- **Deployment:** Vercel (frontend + API routes + cron) + Neon PostgreSQL

## Architecture

### Four Layers

**1. Data Collection Layer (Scheduled Jobs via Vercel Cron)**

- Price Scraper — daily at 7:00 AM ET. Scrapes TradingEconomics `/commodities` tables using Cheerio. Parses all commodity categories (energy, metals, agriculture, etc.) and upserts into `price_snapshots`.
- News Fetcher — every 4 hours. Pulls commodity news from GNews API with commodity-related search queries. Pulls construction news from Construction Dive and ENR RSS feeds. Deduplicates by URL before inserting.
- Intelligence Generator — daily at 7:30 AM ET (after prices and news are fresh). For each unique watchlist configuration, queries relevant price trends and recent news, sends to Claude API with a structured prompt, stores the generated briefing.

**2. Database (PostgreSQL via Neon)**

Tables:

- `commodities` — master list of tracked commodities
  - id, name, slug, category, unit, source_key
- `price_snapshots` — daily price records
  - id, commodity_id (FK), price, day_change, day_change_pct, weekly_pct, monthly_pct, ytd_pct, scraped_at, date
- `news_articles` — stored articles from all sources
  - id, title, description, source_name, source_url, url, category (commodity | construction), commodity_tags (array), published_at, fetched_at
- `insights` — AI-generated briefings
  - id, watchlist_hash (hash of commodity IDs to scope insights to specific watchlists), content (JSON with structured insight cards), generated_at, type (scheduled | on_demand)
- `user_preferences` — watchlist selections
  - id, browser_id (client-generated UUID stored in localStorage), watchlist (array of commodity IDs), created_at, updated_at

**3. API Layer (Next.js API Routes)**

- `GET /api/commodities` — list all available commodities, grouped by category
- `GET /api/prices?commodities=<ids>&range=<1w|1m|3m|6m|1y|all>` — current + historical prices with date range filtering
- `GET /api/news?category=<all|commodity|construction>&commodity=<slug>&page=<n>` — paginated news feed with filtering
- `GET /api/insights?watchlist_hash=<hash>` — latest briefing for the user's watchlist
- `POST /api/insights/refresh` — on-demand insight generation for the user's current watchlist
- `GET /api/preferences?browser_id=<id>` — get user's watchlist
- `PUT /api/preferences` — update user's watchlist
- `POST /api/cron/scrape-prices` — cron-triggered price scraping (protected with CRON_SECRET)
- `POST /api/cron/fetch-news` — cron-triggered news fetching (protected with CRON_SECRET)
- `POST /api/cron/generate-insights` — cron-triggered insight generation (protected with CRON_SECRET)

**4. Frontend (React + shadcn/ui + Tailwind)**

Four main views accessible via sidebar navigation, plus the persistent sidebar watchlist.

## UI Design

### Theme

Dark theme throughout. Color palette:
- Background: `#0a0a0f` (page), `#111118` (cards/surfaces)
- Borders: `#1e1e2e`
- Text: `#e2e8f0` (primary), `#94a3b8` (secondary), `#64748b` (muted)
- Accent: `#3b82f6` (blue), `#8b5cf6` (purple)
- Semantic: `#22c55e` (positive/up), `#ef4444` (negative/down/high priority), `#f59e0b` (warning/watch/construction)

### Layout — Expanded Sidebar with Watchlist

- Left sidebar (approx 200px wide) containing:
  - App logo and name ("Highland") at top
  - Navigation links with icons: Dashboard, News, Trends, Intelligence
  - Active page highlighted with blue accent background
  - Divider line
  - "WATCHLIST" section below navigation showing the user's selected commodities with current prices
  - Watchlist items are clickable to see commodity detail
- Main content area fills remaining width
- Responsive: sidebar collapses to icon-only on tablet, hidden on mobile with hamburger menu

### Dashboard — Everything-at-a-Glance

Top to bottom:
1. **Header row** — page title "Dashboard" + date + "Customize" button
2. **KPI cards row** — one card per watchlist commodity showing name, current price, and % change. Plus an inline insight card (gradient blue/purple background) showing the top AI insight snippet with "View all insights" link.
3. **Trend chart** — compact multi-line chart showing watchlist commodity trends with time range toggle (1M/3M default). Legend with color-coded commodity names.
4. **News strip** — three-column row at bottom with latest Commodity News, Construction News, and Market Alert cards. Each shows headline, source, and time.

### Intelligence Page — Filterable Card Grid

- Header with "Actionable Intelligence" title + "Refresh Insights" button (gradient blue/purple)
- Filter chips row: All, High Priority (red), Watch (amber), Opportunity (green)
- 2-column card grid of insight cards, each containing:
  - Priority badge (HIGH PRIORITY / WATCH / OPPORTUNITY) with color coding
  - Title describing the insight (e.g., "Lumber — Lock In Pricing")
  - Percentage trend indicator
  - Description paragraph explaining the situation and recommendation
  - "Details" link to expand or navigate to related trend
- Insights are scoped to the user's current watchlist — only commodities they're tracking generate insights
- Changing the watchlist causes the next refresh to produce new insights

### Trends Page — Multi-Chart Grid

- Header with "Price Trends" title + time range selector (1W / 1M / 3M / 6M / 1Y / ALL)
- Responsive grid of chart cards (2 columns on desktop, 1 on mobile), one per watchlist commodity
- Each card shows:
  - Commodity name and % change
  - Current price (large text)
  - Sparkline/area chart colored green (up) or red (down)
- Click any card to expand into a full detailed view with:
  - Large interactive chart with hover tooltips (date, exact price, % change from start)
  - Y-axis price labels, X-axis date labels
  - Area fill under the line
  - Ability to overlay multiple commodities for comparison

### News Page — Unified Feed with Tabs & Filters

- Header with "News" title + search bar
- Tab bar: All News | Commodity | Construction (underline-style active indicator)
- Filter chips below tabs: All, Lumber, Steel, Copper, Fuel (commodity-specific, shown when on "All" or "Commodity" tab)
- Single chronological feed of news cards, each containing:
  - Color-coded left border (blue = commodity, amber = construction)
  - Category badge + source and time
  - Headline (bold)
  - Description snippet
- "Read" link opens the original article in a new tab
- Infinite scroll with progressive loading (load 20 articles at a time)

## Data Collection Details

### Price Scraping (TradingEconomics)

- Target URL: `https://tradingeconomics.com/commodities`
- Parse HTML tables using Cheerio — tables contain commodity name, price, day change, % change, weekly %, monthly %, YTD %, date
- Commodity categories on the page: Energy, Metals, Agriculture, Livestock, Industrials
- Store all commodities (not just watchlisted ones) so users can expand their watchlist at any time
- Scraping runs server-side via Vercel Cron calling a protected API route
- Include appropriate User-Agent header and rate limiting (one request per scrape cycle)

### News Fetching

**Commodity News (GNews API):**
- Search queries: "commodity prices", "lumber prices", "steel market", "copper demand", "oil prices construction", "building materials costs"
- Rotate queries across fetch cycles to get variety
- GNews free tier: 100 requests/day — sufficient for 6 fetch cycles with multiple queries each

**Construction News (RSS):**
- Construction Dive RSS feed
- ENR (Engineering News-Record) RSS feed
- Parse with a lightweight RSS parser (e.g., rss-parser npm package)
- Extract: title, description, link, published date, source name

**Deduplication:**
- Before inserting, check if URL already exists in `news_articles`
- Keep articles for 30 days, then archive/delete older ones

### Intelligence Generation (Claude API)

**Scheduled (daily at 7:30 AM ET):**
1. Query all unique watchlist configurations from `user_preferences`
2. For each unique watchlist, gather:
   - Price trend data for the past 30 days for each commodity in the watchlist
   - Recent news articles tagged with those commodities (past 7 days)
3. Send to Claude API with a structured prompt requesting:
   - Priority classification (High Priority / Watch / Opportunity) for each relevant insight
   - Commodity name and actionable title
   - Explanation connecting the price trend to construction impact
   - Specific recommendation (e.g., "lock in pricing", "delay purchase", "negotiate contracts")
4. Parse Claude's response into structured JSON insight cards
5. Store in `insights` table keyed by `watchlist_hash`

**On-demand (user clicks "Refresh Insights"):**
- Same pipeline as scheduled, but triggered by `POST /api/insights/refresh`
- Uses the requesting user's current watchlist
- Returns fresh insights directly and caches them

**Prompt structure (high-level):**
- System: "You are a commodity market analyst advising construction industry professionals."
- Context: price data tables, recent news summaries
- Instruction: "Analyze these commodity trends and their impact on construction projects. For each actionable insight, provide: priority level, title, trend data, explanation, and specific recommendation for a construction project manager."

## Error Handling

- **Scraping failures:** Logged but non-fatal. Dashboard shows "Last updated: [timestamp]" so users see data freshness. If scraping fails for 24+ hours, show a warning banner.
- **News API rate limits:** Exponential backoff with jitter. If GNews quota exhausted, skip that cycle and retry next scheduled run.
- **Claude API failures:** Fall back to most recent cached briefing with notice: "Showing last briefing — refresh failed." On-demand refresh shows an error toast.
- **HTML structure changes:** If TradingEconomics changes their table format, Cheerio parsing will fail gracefully, log the structural mismatch, and retain the last successful scrape data.
- **Database connection issues:** Next.js API routes return appropriate HTTP error codes. Frontend shows error states with retry buttons.

## Watchlist / Preferences

- No authentication — preferences tied to a client-generated UUID stored in `localStorage`
- UUID is sent as a query parameter or header with API requests
- Default watchlist for new users: Lumber, Steel HRC, Copper, Diesel (construction essentials)
- Users can add/remove commodities from a full categorized list accessible via a modal or settings page
- Watchlist changes are reflected immediately in the sidebar, dashboard, and next intelligence refresh

## Vercel Configuration

- `vercel.json` with cron job definitions:
  - `scrape-prices`: `0 7 * * *` (daily 7 AM ET)
  - `fetch-news`: `0 */4 * * *` (every 4 hours)
  - `generate-insights`: `30 7 * * *` (daily 7:30 AM ET)
- Environment variables: `DATABASE_URL`, `GNEWS_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`
- Next.js config compatible with Vercel's serverless functions (no custom server)
- API routes use `maxDuration` config for longer-running scrape/generation tasks

## Testing Strategy

- **Unit tests:** Cheerio parsing logic (given sample HTML, verify correct price extraction), insight prompt construction, news deduplication logic
- **Integration tests:** API route handlers with mocked database and external services
- **E2E:** Playwright tests for critical user flows — loading dashboard, changing watchlist, navigating between views
- **Scraping resilience:** Snapshot tests with saved HTML to detect parsing regressions if source structure changes
