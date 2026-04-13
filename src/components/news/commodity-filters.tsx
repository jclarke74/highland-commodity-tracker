"use client";

import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "All" },
  { key: "lumber", label: "Lumber" },
  { key: "steel", label: "Steel" },
  { key: "copper", label: "Copper" },
  { key: "fuel", label: "Fuel" },
] as const;

interface CommodityFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  visible: boolean;
}

export function CommodityFilters({
  activeFilter,
  onFilterChange,
  visible,
}: CommodityFiltersProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-2 overflow-hidden transition-all duration-200 ease-in-out",
        visible ? "max-h-20 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
      )}
    >
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
