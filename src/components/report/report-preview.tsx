"use client";

import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { InsightCard, InsightPriority } from "@/types";

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

interface ReportPreviewProps {
  commodities: CommodityEntry[];
  insights: InsightCard[];
  generatedAt: string | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatPrice(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPct(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function formatDayChange(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}`;
}

function pctColor(value: number): string {
  if (value > 0) return "text-green-500";
  if (value < 0) return "text-red-500";
  return "text-muted-foreground";
}

const priorityConfig: Record<
  InsightPriority,
  { badgeBg: string; badgeText: string; label: string }
> = {
  high: {
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-500",
    label: "HIGH PRIORITY",
  },
  watch: {
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-500",
    label: "WATCH",
  },
  opportunity: {
    badgeBg: "bg-green-500/15",
    badgeText: "text-green-500",
    label: "OPPORTUNITY",
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function ReportPreview({
  commodities,
  insights,
  generatedAt,
}: ReportPreviewProps) {
  const dateStr = generatedAt
    ? format(new Date(generatedAt), "EEEE, MMMM d, yyyy")
    : format(new Date(), "EEEE, MMMM d, yyyy");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-bold text-foreground">
          Highland Commodity Tracker
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Summary Report</p>
        <p className="text-xs text-muted-foreground mt-0.5">{dateStr}</p>
      </div>

      {/* Price Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary text-primary-foreground">
                <th className="text-left px-4 py-3 font-semibold">Commodity</th>
                <th className="text-right px-4 py-3 font-semibold">Price</th>
                <th className="text-right px-4 py-3 font-semibold">Day Chg</th>
                <th className="text-right px-4 py-3 font-semibold">Day %</th>
                <th className="text-right px-4 py-3 font-semibold">Weekly %</th>
                <th className="text-right px-4 py-3 font-semibold">Monthly %</th>
                <th className="text-right px-4 py-3 font-semibold">YTD %</th>
              </tr>
            </thead>
            <tbody>
              {commodities.map((c, idx) => {
                const p = c.latestPrice;
                return (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-t border-border",
                      idx % 2 === 0 ? "bg-card" : "bg-secondary/30",
                    )}
                  >
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {c.name}
                    </td>
                    <td className="px-4 py-2.5 text-right text-foreground">
                      {p ? formatPrice(p.price) : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right",
                        p ? pctColor(p.dayChange) : "text-muted-foreground",
                      )}
                    >
                      {p ? formatDayChange(p.dayChange) : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right",
                        p ? pctColor(p.dayChangePct) : "text-muted-foreground",
                      )}
                    >
                      {p ? formatPct(p.dayChangePct) : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right",
                        p ? pctColor(p.weeklyPct) : "text-muted-foreground",
                      )}
                    >
                      {p ? formatPct(p.weeklyPct) : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right",
                        p ? pctColor(p.monthlyPct) : "text-muted-foreground",
                      )}
                    >
                      {p ? formatPct(p.monthlyPct) : "--"}
                    </td>
                    <td
                      className={cn(
                        "px-4 py-2.5 text-right",
                        p ? pctColor(p.ytdPct) : "text-muted-foreground",
                      )}
                    >
                      {p ? formatPct(p.ytdPct) : "--"}
                    </td>
                  </tr>
                );
              })}
              {commodities.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-muted-foreground"
                  >
                    No commodities to display
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-foreground">
            Actionable Insights
          </h3>
          {insights.map((insight, idx) => {
            const config = priorityConfig[insight.priority];
            return (
              <div
                key={`${insight.commodity}-${idx}`}
                className="bg-card border border-border rounded-lg p-4"
              >
                {/* Priority badge */}
                <span
                  className={cn(
                    "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-2",
                    config.badgeBg,
                    config.badgeText,
                  )}
                >
                  {config.label}
                </span>

                {/* Commodity + Title */}
                <h4 className="text-sm font-bold text-foreground">
                  {insight.commodity}: {insight.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                  {insight.description}
                </p>

                {/* Recommendation */}
                <p className="text-xs text-foreground/80 italic leading-relaxed mt-2">
                  {insight.recommendation}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
