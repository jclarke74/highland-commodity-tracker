"use client";

import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  commodityId: number;
  name: string;
  price: number;
  changePct: number;
  prices: { date: string; price: number }[];
  onClick: () => void;
}

export function ChartCard({
  commodityId,
  name,
  price,
  changePct,
  prices,
  onClick,
}: ChartCardProps) {
  const isPositive = changePct >= 0;
  const gradientId = `sparkline-gradient-${commodityId}`;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";

  const sortedPrices = useMemo(
    () =>
      [...prices].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      ),
    [prices]
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "bg-card border border-border rounded-lg p-4 cursor-pointer text-left w-full",
        "transition-all duration-200 hover:scale-[1.02] hover:border-primary/40 hover:shadow-[0_0_12px_rgba(59,130,246,0.15)]"
      )}
    >
      {/* Header: name + change badge */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-foreground truncate mr-2">
          {name}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold shrink-0",
            isPositive
              ? "bg-green-500/15 text-green-400"
              : "bg-red-500/15 text-red-400"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {isPositive ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>

      {/* Large price */}
      <p className="text-xl font-bold text-foreground mb-3">
        ${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </p>

      {/* Sparkline */}
      <div className="h-[60px] w-full">
        {sortedPrices.length < 5 ? (
          <div className="h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground">
              Insufficient history for trend
            </span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sortedPrices}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={1.5}
                fill={`url(#${gradientId})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </button>
  );
}
