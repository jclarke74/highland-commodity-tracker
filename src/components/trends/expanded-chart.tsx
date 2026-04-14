"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ExpandedChartProps {
  open: boolean;
  onClose: () => void;
  commodityName: string;
  prices: { date: string; price: number }[];
}

interface ChartPoint {
  date: string;
  dateLabel: string;
  price: number;
  changePct: number;
}

function buildChartPoints(
  prices: { date: string; price: number }[]
): ChartPoint[] {
  const sorted = [...prices].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  if (sorted.length === 0) return [];

  const firstPrice = sorted[0].price;

  return sorted.map((p) => ({
    date: p.date,
    dateLabel: format(new Date(p.date), "MMM d"),
    price: p.price,
    changePct:
      firstPrice !== 0
        ? ((p.price - firstPrice) / firstPrice) * 100
        : 0,
  }));
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload: ChartPoint }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload;
  const isPositive = point.changePct >= 0;

  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">
        {format(new Date(point.date), "MMM d, yyyy")}
      </p>
      <p className="text-sm font-semibold text-foreground">
        $
        {point.price.toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </p>
      <p
        className={`text-xs font-medium ${
          isPositive ? "text-green-400" : "text-red-400"
        }`}
      >
        {isPositive ? "+" : ""}
        {point.changePct.toFixed(2)}% from start
      </p>
    </div>
  );
}

export function ExpandedChart({
  open,
  onClose,
  commodityName,
  prices,
}: ExpandedChartProps) {
  const chartData = useMemo(() => buildChartPoints(prices), [prices]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <DialogContent className="sm:max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-lg">{commodityName}</DialogTitle>
        </DialogHeader>

        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            No price data available.
          </p>
        ) : (
          <div className="h-[350px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="expanded-gradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#3b82f6"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="#3b82f6"
                      stopOpacity={0}
                    />
                  </linearGradient>
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
                  width={65}
                  tickFormatter={(v: number) =>
                    `$${v.toLocaleString()}`
                  }
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#expanded-gradient)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: "#3b82f6",
                    strokeWidth: 2,
                    fill: "#111118",
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
