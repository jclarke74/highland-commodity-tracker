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
  ReferenceLine,
} from "recharts";
import { format } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "@/types";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4", "#ec4899", "#f97316", "#14b8a6"];

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

/**
 * Normalizes all commodities to % change from the start of the period.
 * This allows Gold ($3,600), Copper ($4), and Crude Oil ($60) to be
 * compared on the same chart.
 */
function buildNormalizedChartData(
  data: CommodityPriceData[]
): { chartData: ChartDataPoint[]; baselinePrices: Record<string, number> } {
  // Get baseline (first available price) for each commodity
  const baselinePrices: Record<string, number> = {};
  for (const commodity of data) {
    if (commodity.prices.length > 0) {
      baselinePrices[commodity.name] = commodity.prices[0].price;
    }
  }

  const dateMap = new Map<string, ChartDataPoint>();

  for (const commodity of data) {
    const baseline = baselinePrices[commodity.name];
    if (!baseline || baseline === 0) continue;

    for (const entry of commodity.prices) {
      const dateKey = entry.date;
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, {
          date: dateKey,
          dateLabel: format(new Date(dateKey), "MMM d"),
        });
      }
      const point = dateMap.get(dateKey)!;
      // Store as % change from baseline
      point[commodity.name] =
        Math.round(((entry.price - baseline) / baseline) * 10000) / 100;
    }
  }

  const chartData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return { chartData, baselinePrices };
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

  // Only include commodities that have price data
  const validData = useMemo(
    () => data.filter((d) => d.prices.length > 0),
    [data]
  );

  const { chartData, baselinePrices } = useMemo(
    () => buildNormalizedChartData(validData),
    [validData]
  );

  const commodityNames = useMemo(
    () => validData.map((d) => d.name),
    [validData]
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
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Price Trends
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            % change from start of period
          </p>
        </div>
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
                      stopOpacity={0.2}
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
                width={50}
                tickFormatter={(v: number) => `${v > 0 ? "+" : ""}${v}%`}
              />
              {/* Zero baseline reference line */}
              <ReferenceLine y={0} stroke="#334155" strokeDasharray="3 3" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111118",
                  border: "1px solid #1e1e2e",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "#e2e8f0",
                }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => {
                  const pct = typeof value === "number" ? value : Number(value);
                  if (isNaN(pct)) return ["0%", name];
                  const baseline = baselinePrices[String(name)] ?? 0;
                  const currentPrice = baseline * (1 + pct / 100);
                  return [
                    `${pct > 0 ? "+" : ""}${pct.toFixed(1)}% ($${currentPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`,
                    name,
                  ];
                }) as never}
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

          {/* Legend with current prices */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mt-4">
            {commodityNames.map((name, i) => {
              const commodity = validData.find((d) => d.name === name);
              const latest = commodity?.prices[commodity.prices.length - 1];
              return (
                <div key={name} className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {name}
                    {latest && (
                      <span className="text-foreground ml-1">
                        ${latest.price.toLocaleString("en-US", { maximumFractionDigits: 2 })}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
