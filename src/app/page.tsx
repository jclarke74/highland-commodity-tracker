"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Settings2 } from "lucide-react";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { InsightSnippet } from "@/components/dashboard/insight-snippet";
import { TrendOverviewChart } from "@/components/dashboard/trend-overview-chart";
import { NewsStrip } from "@/components/dashboard/news-strip";
import { WatchlistModal } from "@/components/layout/watchlist-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { InsightCard } from "@/types";

interface CommodityEntry {
  id: number;
  name: string;
  slug: string;
  category: string;
  unit: string;
  latestPrice: {
    price: number;
    dayChange: number;
    dayChangePct: number;
    weeklyPct: number;
    monthlyPct: number;
    ytdPct: number;
    date: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { watchlist, watchlistHash, isLoading: watchlistLoading } = useWatchlist();

  const [commodities, setCommodities] = useState<CommodityEntry[]>([]);
  const [commoditiesLoading, setCommoditiesLoading] = useState(true);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(true);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  // Fetch all commodities
  useEffect(() => {
    let cancelled = false;

    async function fetchCommodities() {
      try {
        const res = await fetch("/api/commodities");
        if (!res.ok) throw new Error("Failed to fetch commodities");
        const grouped = await res.json();

        // Flatten the grouped response into a flat array
        const flat: CommodityEntry[] = [];
        for (const category of Object.values(grouped)) {
          for (const item of category as CommodityEntry[]) {
            flat.push(item);
          }
        }
        if (!cancelled) setCommodities(flat);
      } catch (err) {
        console.error("Dashboard commodities fetch error:", err);
      } finally {
        if (!cancelled) setCommoditiesLoading(false);
      }
    }

    fetchCommodities();
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch latest insight for watchlist
  useEffect(() => {
    if (watchlistLoading || watchlist.length === 0) {
      setInsightLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchInsight() {
      setInsightLoading(true);
      try {
        const res = await fetch(
          `/api/insights?watchlist_hash=${encodeURIComponent(watchlistHash)}`
        );
        if (!res.ok) throw new Error("Failed to fetch insights");
        const json = await res.json();

        if (!cancelled) {
          if (json.insights && Array.isArray(json.insights) && json.insights.length > 0) {
            // Pick the first insight's title + description as the snippet
            const first = json.insights[0] as InsightCard;
            setInsightText(
              `${first.commodity}: ${first.title}. ${first.description}`
            );
          } else if (json.insights && typeof json.insights === "string") {
            setInsightText(json.insights);
          } else {
            setInsightText(null);
          }
        }
      } catch (err) {
        console.error("Dashboard insight fetch error:", err);
      } finally {
        if (!cancelled) setInsightLoading(false);
      }
    }

    fetchInsight();
    return () => {
      cancelled = true;
    };
  }, [watchlist, watchlistHash, watchlistLoading]);

  // Filter commodities to watchlist items
  const watchlistCommodities = commodities.filter((c) =>
    watchlist.includes(c.id)
  );

  const today = format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{today}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWatchlistModal(true)}
        >
          <Settings2 className="h-3.5 w-3.5" data-icon="inline-start" />
          Customize
        </Button>
      </div>

      {/* Watchlist management modal */}
      <WatchlistModal
        open={showWatchlistModal}
        onOpenChange={setShowWatchlistModal}
      />

      {/* KPI Cards Row + Insight Snippet */}
      <div className="flex flex-wrap gap-4">
        {commoditiesLoading || watchlistLoading ? (
          <>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[110px] w-[180px] rounded-lg" />
            ))}
          </>
        ) : watchlistCommodities.length > 0 ? (
          <>
            {watchlistCommodities.map((c) => (
              <KpiCard
                key={c.id}
                name={c.name}
                price={c.latestPrice?.price ?? 0}
                dayChangePct={c.latestPrice?.dayChangePct ?? 0}
              />
            ))}
          </>
        ) : (
          <div className="bg-card border border-border rounded-lg p-4 flex-1">
            <p className="text-sm text-muted-foreground">
              No commodities in your watchlist. Add some from the{" "}
              <button
                onClick={() => router.push("/commodities")}
                className="text-primary hover:underline cursor-pointer"
              >
                Commodities page
              </button>
              .
            </p>
          </div>
        )}

        {/* Insight snippet */}
        {insightLoading ? (
          <Skeleton className="h-[110px] min-w-[240px] flex-1 rounded-lg" />
        ) : insightText ? (
          <InsightSnippet
            text={insightText}
            onViewAll={() => router.push("/intelligence")}
          />
        ) : null}
      </div>

      {/* Trend Overview Chart */}
      <TrendOverviewChart commodityIds={watchlist} />

      {/* News Strip */}
      <NewsStrip />
    </div>
  );
}
