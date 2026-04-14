"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartCard } from "@/components/trends/chart-card";
import { ExpandedChart } from "@/components/trends/expanded-chart";
import type { DateRange } from "@/types";

interface PriceEntry {
  price: number;
  dayChangePct: number;
  monthlyPct: number;
  date: string;
}

interface CommodityPriceData {
  commodityId: number;
  name: string;
  slug: string;
  prices: PriceEntry[];
}

const RANGES: { label: string; value: DateRange }[] = [
  { label: "1W", value: "1w" },
  { label: "1M", value: "1m" },
  { label: "3M", value: "3m" },
  { label: "6M", value: "6m" },
  { label: "1Y", value: "1y" },
  { label: "ALL", value: "all" },
];

export default function TrendsPage() {
  const { watchlist, isLoading: watchlistLoading } = useWatchlist();
  const [selectedRange, setSelectedRange] = useState<DateRange>("1m");
  const [priceData, setPriceData] = useState<CommodityPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCommodity, setExpandedCommodity] =
    useState<CommodityPriceData | null>(null);

  const fetchPrices = useCallback(async () => {
    if (watchlist.length === 0) {
      setPriceData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        commodities: watchlist.join(","),
        range: selectedRange,
      });
      const res = await fetch(`/api/prices?${params}`);
      if (!res.ok) throw new Error("Failed to fetch prices");
      const json: CommodityPriceData[] = await res.json();
      setPriceData(json);
    } catch (err) {
      console.error("Trends fetch error:", err);
      setError("Failed to load price data.");
    } finally {
      setIsLoading(false);
    }
  }, [watchlist, selectedRange]);

  useEffect(() => {
    if (watchlistLoading) return;
    fetchPrices();
  }, [fetchPrices, watchlistLoading]);

  const loading = watchlistLoading || isLoading;

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Price Trends</h1>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelectedRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                selectedRange === r.value
                  ? "bg-primary text-white"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="bg-card border border-destructive/30 rounded-lg p-10 text-center space-y-3">
          <AlertCircle className="mx-auto h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchPrices()}>
            <RefreshCw className="h-3.5 w-3.5" data-icon="inline-start" />
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[170px] w-full rounded-lg" />
          ))}
        </div>
      ) : watchlist.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Add commodities to your watchlist to see price trends.
          </p>
        </div>
      ) : priceData.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No price data available for this period.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {priceData.map((commodity) => {
            const latestPrice =
              commodity.prices.length > 0 ? commodity.prices[0] : null;

            return (
              <ChartCard
                key={commodity.commodityId}
                commodityId={commodity.commodityId}
                name={commodity.name}
                price={latestPrice?.price ?? 0}
                changePct={latestPrice?.dayChangePct ?? 0}
                prices={commodity.prices.map((p) => ({
                  date: p.date,
                  price: p.price,
                }))}
                onClick={() => setExpandedCommodity(commodity)}
              />
            );
          })}
        </div>
      )}

      {/* Expanded chart dialog */}
      {expandedCommodity && (
        <ExpandedChart
          open={!!expandedCommodity}
          onClose={() => setExpandedCommodity(null)}
          commodityName={expandedCommodity.name}
          prices={expandedCommodity.prices.map((p) => ({
            date: p.date,
            price: p.price,
          }))}
        />
      )}
    </div>
  );
}
