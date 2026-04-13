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
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRange } from "@/types";

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#06b6d4"];

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

  useEffect(() => {
    if (commodityIds.length === 0) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchPrices() {
      setIsLoading(true);
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
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchPrices();
    return () => {
      cancelled = true;
    };
  }, [commodityIds, range]);

  const chartData = useMemo(() => buildChartData(data), [data]);

  const commodityNames = useMemo(
    () => data.map((d) => d.name),
    [data]
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

      {isLoading ? (
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
        </>
      )}
    </div>
  );
}
