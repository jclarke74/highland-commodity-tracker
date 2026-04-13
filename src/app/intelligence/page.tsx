"use client";

import { useState, useEffect, useCallback } from "react";
import { Sparkles, Lightbulb, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityFilters } from "@/components/intelligence/priority-filters";
import { InsightCard } from "@/components/intelligence/insight-card";
import type { InsightCard as InsightCardType } from "@/types";

export default function IntelligencePage() {
  const { watchlist, watchlistHash, isLoading: watchlistLoading } = useWatchlist();
  const [insights, setInsights] = useState<InsightCardType[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* Fetch existing insights */
  const fetchInsights = useCallback(async () => {
    if (!watchlistHash) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/insights?watchlist_hash=${encodeURIComponent(watchlistHash)}`
      );
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();

      if (data.insights) {
        setInsights(data.insights);
        setGeneratedAt(data.generatedAt ?? null);
      } else {
        setInsights([]);
        setGeneratedAt(null);
      }
    } catch (err) {
      console.error("Insights fetch error:", err);
      setError("Failed to load insights.");
    } finally {
      setIsLoading(false);
    }
  }, [watchlistHash]);

  useEffect(() => {
    if (watchlistLoading) return;
    fetchInsights();
  }, [fetchInsights, watchlistLoading]);

  /* Refresh insights on demand */
  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/insights/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watchlist }),
      });

      if (!res.ok) throw new Error("Refresh failed");
      const data = await res.json();

      setInsights(data.insights ?? []);
      setGeneratedAt(data.generatedAt ?? null);
    } catch (err) {
      console.error("Insights refresh error:", err);
      toast.error("Refresh failed \u2014 showing last briefing");
    } finally {
      setIsRefreshing(false);
    }
  }

  /* Client-side filter */
  const filteredInsights =
    activeFilter === "all"
      ? insights
      : insights.filter((i) => i.priority === activeFilter);

  const loading = watchlistLoading || isLoading;

  /* Format generated-at timestamp */
  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleString();
    } catch {
      return iso;
    }
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Actionable Intelligence
          </h1>
          {generatedAt && insights.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Generated at: {formatTime(generatedAt)}
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          Refresh Insights
        </button>
      </div>

      {/* Priority filters */}
      <PriorityFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Content */}
      {error ? (
        <div className="bg-card border border-destructive/30 rounded-lg p-10 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchInsights()}>
            <RefreshCw className="h-3.5 w-3.5" data-icon="inline-start" />
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[220px] w-full rounded-lg" />
          ))}
        </div>
      ) : insights.length === 0 ? (
        /* Empty state */
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <Lightbulb className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No insights yet. Click Refresh to generate your first briefing.
          </p>
        </div>
      ) : filteredInsights.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No insights match this filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInsights.map((insight, idx) => (
            <InsightCard
              key={`${insight.commodity}-${idx}`}
              priority={insight.priority}
              commodity={insight.commodity}
              title={insight.title}
              trendPct={insight.trendPct}
              trendDirection={insight.trendDirection}
              description={insight.description}
              recommendation={insight.recommendation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
