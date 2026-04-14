"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportPreview } from "@/components/report/report-preview";
import { ReportActions } from "@/components/report/report-actions";
import type { InsightCard } from "@/types";

interface CommodityEntry {
  id: number;
  name: string;
  slug: string;
  category: string;
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

export default function ReportPage() {
  const { watchlist, isLoading: watchlistLoading } = useWatchlist();

  const [commodities, setCommodities] = useState<CommodityEntry[]>([]);
  const [commoditiesLoading, setCommoditiesLoading] = useState(true);
  const [commoditiesError, setCommoditiesError] = useState<string | null>(null);

  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const [retryCount, setRetryCount] = useState(0);

  /* Fetch commodities */
  useEffect(() => {
    let cancelled = false;

    async function fetchCommodities() {
      setCommoditiesLoading(true);
      setCommoditiesError(null);
      try {
        const res = await fetch("/api/commodities");
        if (!res.ok) throw new Error("Failed to fetch commodities");
        const grouped = await res.json();

        const flat: CommodityEntry[] = [];
        for (const category of Object.values(grouped)) {
          for (const item of category as CommodityEntry[]) {
            flat.push(item);
          }
        }
        if (!cancelled) setCommodities(flat);
      } catch (err) {
        console.error("Report commodities fetch error:", err);
        if (!cancelled) setCommoditiesError("Failed to load commodity data.");
      } finally {
        if (!cancelled) setCommoditiesLoading(false);
      }
    }

    fetchCommodities();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  /* Fetch insights */
  const fetchInsights = useCallback(async () => {
    if (watchlist.length === 0) {
      setInsightsLoading(false);
      return;
    }

    setInsightsLoading(true);
    try {
      const res = await fetch(
        `/api/insights?watchlist=${watchlist.join(",")}`,
      );
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();

      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt ?? null);
      } else {
        setInsights([]);
        setGeneratedAt(null);
      }
    } catch (err) {
      console.error("Report insights fetch error:", err);
    } finally {
      setInsightsLoading(false);
    }
  }, [watchlist]);

  useEffect(() => {
    if (watchlistLoading) return;
    fetchInsights();
  }, [fetchInsights, watchlistLoading]);

  /* Filter commodities to watchlist */
  const watchlistCommodities = commodities.filter((c) =>
    watchlist.includes(c.id),
  );

  const loading = watchlistLoading || commoditiesLoading || insightsLoading;
  const hasData = watchlistCommodities.length > 0;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Summary Report</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Preview and download a PDF summary of your tracked commodities
          </p>
        </div>
        {!loading && hasData && (
          <ReportActions
            commodities={watchlistCommodities}
            insights={insights}
            generatedAt={generatedAt}
            disabled={!hasData}
          />
        )}
      </div>

      {/* Content */}
      {commoditiesError ? (
        <div className="bg-card border border-destructive/30 rounded-lg p-10 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{commoditiesError}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryCount((r) => r + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" data-icon="inline-start" />
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[100px] w-full rounded-lg" />
          <Skeleton className="h-[300px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      ) : !hasData ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Add commodities to your watchlist to generate a report.
          </p>
        </div>
      ) : (
        <ReportPreview
          commodities={watchlistCommodities}
          insights={insights}
          generatedAt={generatedAt}
        />
      )}
    </div>
  );
}
