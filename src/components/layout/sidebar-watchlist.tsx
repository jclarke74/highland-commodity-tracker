"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useWatchlist } from "@/hooks/use-watchlist";
import { WatchlistModal } from "@/components/layout/watchlist-modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types matching the /api/commodities response                      */
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

export function SidebarWatchlist() {
  const { watchlist, isLoading: watchlistLoading } = useWatchlist();
  const [commodities, setCommodities] = useState<CommodityEntry[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);

  /* Fetch all commodity data to map IDs -> names + prices */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/commodities");
        if (!res.ok) throw new Error("Failed to fetch commodities");
        const grouped: Record<string, CommodityEntry[]> = await res.json();
        const flat = Object.values(grouped).flat();
        if (!cancelled) setCommodities(flat);
      } catch (err) {
        console.error("Sidebar watchlist fetch error:", err);
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const isLoading = watchlistLoading || isFetching;

  /* Resolve watchlist IDs to commodity entries */
  const watched = watchlist
    .map((id) => commodities.find((c) => c.id === id))
    .filter(Boolean) as CommodityEntry[];

  return (
    <div className="flex flex-col gap-2 px-3">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Watchlist
        </span>
        <button
          type="button"
          onClick={() => setShowWatchlistModal(true)}
          className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Edit watchlist"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-0.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-12" />
            </div>
          ))
        ) : watched.length === 0 ? (
          <p className="px-3 py-2 text-xs text-muted-foreground/60">
            No commodities tracked yet.
          </p>
        ) : (
          watched.map((c) => {
            const pct = c.latestPrice?.dayChangePct ?? 0;
            const isPositive = pct >= 0;

            return (
              <div
                key={c.id}
                className="group flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-secondary"
              >
                {/* Name */}
                <span className="truncate text-sm text-foreground/90">
                  {c.name}
                </span>

                {/* Price + change */}
                <div className="ml-2 flex shrink-0 items-center gap-1.5 text-xs tabular-nums">
                  {c.latestPrice ? (
                    <>
                      <span className="text-muted-foreground">
                        ${c.latestPrice.price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span
                        className={cn(
                          "font-medium",
                          isPositive ? "text-positive" : "text-negative",
                        )}
                      >
                        {isPositive ? "+" : ""}
                        {pct.toFixed(1)}%
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground/50">--</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Watchlist management modal */}
      <WatchlistModal
        open={showWatchlistModal}
        onOpenChange={setShowWatchlistModal}
      />
    </div>
  );
}
