"use client";

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useWatchlist } from "@/hooks/use-watchlist";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types matching the /api/commodities grouped response               */
/* ------------------------------------------------------------------ */
interface CommodityEntry {
  id: number;
  name: string;
  slug: string;
  category: string;
  unit: string;
  sourceKey: string;
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

interface WatchlistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Category display order and labels                                  */
/* ------------------------------------------------------------------ */
const CATEGORY_ORDER = ["energy", "metals", "agriculture", "livestock", "softs"];

function categoryLabel(key: string): string {
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export function WatchlistModal({ open, onOpenChange }: WatchlistModalProps) {
  const { watchlist, addCommodity, removeCommodity } = useWatchlist();
  const [grouped, setGrouped] = useState<Record<string, CommodityEntry[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  /* Fetch all commodities when the modal opens */
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setIsLoading(true);

    async function load() {
      try {
        const res = await fetch("/api/commodities");
        if (!res.ok) throw new Error("Failed to fetch commodities");
        const data: Record<string, CommodityEntry[]> = await res.json();
        if (!cancelled) setGrouped(data);
      } catch (err) {
        console.error("WatchlistModal fetch error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [open]);

  /* Reset search when modal closes */
  useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  /* Filter commodities by search term */
  const filteredGrouped = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return grouped;

    const result: Record<string, CommodityEntry[]> = {};
    for (const [category, items] of Object.entries(grouped)) {
      const filtered = items.filter((c) =>
        c.name.toLowerCase().includes(term)
      );
      if (filtered.length > 0) {
        result[category] = filtered;
      }
    }
    return result;
  }, [grouped, search]);

  /* Sorted category keys */
  const sortedCategories = useMemo(() => {
    const keys = Object.keys(filteredGrouped);
    return keys.sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.toLowerCase());
      const bi = CATEGORY_ORDER.indexOf(b.toLowerCase());
      const aIdx = ai === -1 ? CATEGORY_ORDER.length : ai;
      const bIdx = bi === -1 ? CATEGORY_ORDER.length : bi;
      return aIdx - bIdx;
    });
  }, [filteredGrouped]);

  function toggleCommodity(id: number) {
    if (watchlist.includes(id)) {
      removeCommodity(id);
    } else {
      addCommodity(id);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle>Manage Watchlist</DialogTitle>
          <DialogDescription>
            Select commodities to track on your dashboard.
          </DialogDescription>
        </DialogHeader>

        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search commodities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Commodity list */}
        <ScrollArea className="h-[360px] -mx-4 px-4">
          {isLoading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : sortedCategories.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commodities found.
            </p>
          ) : (
            <div className="space-y-4 py-1">
              {sortedCategories.map((category, catIdx) => (
                <div key={category}>
                  {catIdx > 0 && <Separator className="mb-3" />}
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {categoryLabel(category)}
                  </h3>
                  <div className="space-y-0.5">
                    {filteredGrouped[category].map((commodity) => {
                      const isWatched = watchlist.includes(commodity.id);
                      return (
                        <button
                          key={commodity.id}
                          type="button"
                          onClick={() => toggleCommodity(commodity.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                            "hover:bg-secondary",
                            isWatched && "bg-secondary/60"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            {/* Checkbox indicator */}
                            <div
                              className={cn(
                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                isWatched
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-muted-foreground/40 bg-transparent"
                              )}
                            >
                              {isWatched && (
                                <svg
                                  width="10"
                                  height="10"
                                  viewBox="0 0 10 10"
                                  fill="none"
                                  className="text-current"
                                >
                                  <path
                                    d="M8.5 2.5L3.8 7.5L1.5 5"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              )}
                            </div>
                            <span className="text-foreground/90">
                              {commodity.name}
                            </span>
                          </div>
                          <span className="text-xs tabular-nums text-muted-foreground">
                            {commodity.latestPrice
                              ? `$${commodity.latestPrice.price.toLocaleString(
                                  undefined,
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}`
                              : "--"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
