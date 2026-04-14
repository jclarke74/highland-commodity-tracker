"use client";

import { useState, useEffect, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "@/types";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4"];

const PRICE_MIN = 1;
const PRICE_MAX = 5000;

interface PriceEntry {
  price: number;
  date: string;
}

interface CommodityPriceData {
  commodityId: number;
  name: string;
  slug: string;
  prices: PriceEntry[];
}

interface TrendOverviewChartProps {
  commodityIds: number[];
  range?: DateRange;
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  [key: string]: string | number;
}

interface OutlierCommodity {
  name: string;
  latestPrice: number;
}

/**
 * Determines if a commodity's prices fall within the chartable range ($1–$5,000).
 * Uses the latest price as the reference.
 */
function isChartable(commodity: CommodityPriceData): boolean {
  if (commodity.prices.length === 0) return false;
  const latest = commodity.prices[commodity.prices.length - 1].price;
  return latest >= PRICE_MIN && latest <= PRICE_MAX;
}

function buildChartData(data: CommodityPriceData[]): ChartDataPoint[] {
  const dateMap = new Map<string, ChartDataPoint>();

  for (const commodity of data) {
    for (const entry of commodity.prices) {
      const dateKey = entry.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          dateLabel: format(new Date(dateKey), "MMM d"),
        });
      }
      const point = dateMap.get(dateKey)!;
      point[commodity.name] = entry.price;
    }
  }

  return Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function TrendOverviewChart({
  commodityIds,
  range: initialRange = "1m",
}: TrendOverviewChartProps) {
  const [range, setRange] = useState<DateRange>(initialRange);
  const [data, setData] = useState<CommodityPriceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (commodityIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPrices() {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          commodities: commodityIds.join(","),
          range,
        });
        const res = await fetch(`/api/prices?${params}`);
        if (!res.ok) throw new Error("Failed to fetch prices");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (err) {
        console.error("Trend chart fetch error:", err);
        if (!cancelled) setError("Failed to load chart data.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, [commodityIds, range, retryCount]);

  // Split into chartable ($1–$5K) and outlier commodities
  const { chartable, outliers } = useMemo(() => {
    const chartable: CommodityPriceData[] = [];
    const outliers: OutlierCommodity[] = [];
    for (const d of data) {
      if (isChartable(d)) {
        chartable.push(d);
      } else if (d.prices.length > 0) {
        outliers.push({
          name: d.name,
          latestPrice: d.prices[d.prices.length - 1].price,
        });
      }
    }
    return { chartable, outliers };
  }, [data]);

  const chartData = useMemo(() => buildChartData(chartable), [chartable]);

  const commodityNames = useMemo(
    () => chartable.map((d) => d.name),
    [chartable]
  );

  const ranges: { label: string; value: DateRange }[] = [
    { label: "1M", value: "1m" },
    { label: "3M", value: "3m" },
  ];

  if (commodityIds.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">
            Price Trends
          </h2>
        </div>
        <p className="text-sm text-muted-foreground py-12 text-center">
          Add commodities to your watchlist to see price trends.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-foreground">
          Price Trends
        </h2>
        <div className="flex gap-1">
          {ranges.map((r) => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                range === r.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRetryCount((c) => c + 1)}
          >
            <RefreshCw className="h-3.5 w-3.5" data-icon="inline-start" />
            Retry
          </Button>
        </div>
      ) : isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[300px] w-full" />
        </div>
      ) : chartData.length === 0 ? (
        <p className="text-sm text-muted-foreground py-12 text-center">
          No price data available for this period.
        </p>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                {commodityNames.map((name, i) => (
                  <linearGradient
                    key={name}
                    id={`gradient-${i}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={COLORS[i % COLORS.length]}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor={COLORS[i % COLORS.length]}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#1e1e2e"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                width={60}
                tickFormatter={(v: number) => `$${v.toLocaleString()}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111118",
                  border: "1px solid #1e1e2e",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                formatter={(
                  value: number | string | ReadonlyArray<number | string> | undefined,
                ) => {
                  if (value == null) return ["$0.00"];
                  const num = typeof value === "number" ? value : Number(value);
                  return [
                    `$${num.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`,
                  ];
                }}
              />
              {commodityNames.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={2}
                  fill={`url(#gradient-${i})`}
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: COLORS[i % COLORS.length],
                    strokeWidth: 2,
                    fill: "#111118",
                  }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mt-4">
            {commodityNames.map((name, i) => (
              <div key={name} className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="text-xs text-muted-foreground">{name}</span>
              </div>
            ))}
          </div>

          {/* Outlier commodities — outside $1–$5K chart range */}
          {outliers.length > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Not shown on chart:{" "}
              {outliers.map((o, i) => (
                <span key={o.name}>
                  {o.name}{" "}
                  <span className="text-foreground">
                    (${o.latestPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })})
                  </span>
                  {i < outliers.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          )}
        </>
      )}
    </div>
  );
}
