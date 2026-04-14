"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { InsightPriority } from "@/types";

interface InsightCardProps {
  priority: InsightPriority;
  commodity: string;
  title: string;
  trendPct: number;
  trendDirection: "up" | "down";
  description: string;
  recommendation: string;
}

const priorityConfig: Record<
  InsightPriority,
  { borderColor: string; badgeBg: string; badgeText: string; label: string }
> = {
  high: {
    borderColor: "border-t-[#ef4444]",
    badgeBg: "bg-red-500/15",
    badgeText: "text-red-500",
    label: "HIGH PRIORITY",
  },
  watch: {
    borderColor: "border-t-[#f59e0b]",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-500",
    label: "WATCH",
  },
  opportunity: {
    borderColor: "border-t-[#22c55e]",
    badgeBg: "bg-green-500/15",
    badgeText: "text-green-500",
    label: "OPPORTUNITY",
  },
};

export function InsightCard({
  priority,
  commodity,
  title,
  trendPct,
  trendDirection,
  description,
  recommendation,
}: InsightCardProps) {
  const config = priorityConfig[priority];

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-5 border-t-[3px]",
        config.borderColor
      )}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span
            className={cn(
              "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
              config.badgeBg,
              config.badgeText
            )}
          >
            {config.label}
          </span>
        </div>

        {/* Trend indicator */}
        <span
          className={cn(
            "text-sm font-semibold whitespace-nowrap",
            trendDirection === "up" ? "text-green-500" : "text-red-500"
          )}
        >
          {trendDirection === "up" ? "\u25B2" : "\u25BC"}{" "}
          {Math.abs(trendPct).toFixed(1)}%
        </span>
      </div>

      {/* Commodity + Title */}
      <h3 className="text-sm font-bold text-foreground mb-1">{commodity}</h3>
      <p className="text-sm font-semibold text-foreground/90 mb-3">{title}</p>

      {/* Description */}
      <p className="text-xs text-muted-foreground leading-relaxed mb-3">
        {description}
      </p>

      {/* Recommendation */}
      <p className="text-xs text-foreground/80 font-medium leading-relaxed mb-4">
        {recommendation}
      </p>

      {/* View trend link */}
      <Link
        href="/trends"
        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        View trend &rarr;
      </Link>
    </div>
  );
}
