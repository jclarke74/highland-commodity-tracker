"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  title: string;
  description: string;
  sourceName: string;
  category: string;
  commodityTags: string[];
  url: string;
  publishedAt: string;
}

const BORDER_COLORS: Record<string, string> = {
  commodity: "border-l-primary",
  construction: "border-l-[#f59e0b]",
};

const BADGE_STYLES: Record<string, string> = {
  commodity: "bg-primary/15 text-primary",
  construction: "bg-[#f59e0b]/15 text-[#f59e0b]",
};

const CATEGORY_LABELS: Record<string, string> = {
  commodity: "Commodity",
  construction: "Construction",
};

export function NewsCard({
  title,
  description,
  sourceName,
  category,
  url,
  publishedAt,
}: NewsCardProps) {
  const borderColor = BORDER_COLORS[category] || "border-l-muted-foreground";
  const badgeStyle = BADGE_STYLES[category] || "bg-secondary text-muted-foreground";
  const categoryLabel = CATEGORY_LABELS[category] || category;

  let relativeTime = "";
  try {
    relativeTime = formatDistanceToNow(new Date(publishedAt), {
      addSuffix: true,
    });
  } catch {
    relativeTime = "";
  }

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-lg p-4 border-l-4 transition-all duration-150",
        "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        borderColor
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            badgeStyle
          )}
        >
          {categoryLabel}
        </span>
      </div>

      <h3 className="text-sm font-semibold text-foreground leading-snug mb-1.5">
        {title}
      </h3>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
          {description}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sourceName}
          {relativeTime && <> &middot; {relativeTime}</>}
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Read &rarr;
        </a>
      </div>
    </div>
  );
}
