"use client";

import { cn } from "@/lib/utils";

const tabs = [
  { key: "all", label: "All News" },
  { key: "commodity", label: "Commodity" },
  { key: "construction", label: "Construction" },
] as const;

interface NewsTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function NewsTabs({ activeTab, onTabChange }: NewsTabsProps) {
  return (
    <div className="flex flex-row gap-6 border-b border-border">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "relative pb-3 text-sm font-medium transition-colors duration-150 cursor-pointer",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
