"use client";

import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All" },
  { key: "high", label: "\uD83D\uDD34 High Priority" },
  { key: "watch", label: "\uD83D\uDFE1 Watch" },
  { key: "opportunity", label: "\uD83D\uDFE2 Opportunity" },
] as const;

interface PriorityFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function PriorityFilters({
  activeFilter,
  onFilterChange,
}: PriorityFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = activeFilter === filter.key;
        return (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer",
              isActive
                ? "bg-primary text-white"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
