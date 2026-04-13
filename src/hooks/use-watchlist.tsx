"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useBrowserId } from "./use-browser-id";

/* ------------------------------------------------------------------ */
/*  Client-side deterministic hash (no Node.js crypto needed)         */
/* ------------------------------------------------------------------ */
function clientHash(ids: number[]): string {
  const sorted = [...ids].sort((a, b) => a - b);
  const input = sorted.join(",");
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, "0");
}

/* ------------------------------------------------------------------ */
/*  Context shape                                                     */
/* ------------------------------------------------------------------ */
interface WatchlistContextValue {
  watchlist: number[];
  watchlistHash: string;
  isLoading: boolean;
  addCommodity: (id: number) => void;
  removeCommodity: (id: number) => void;
  setWatchlist: (ids: number[]) => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                          */
/* ------------------------------------------------------------------ */
export function WatchlistProvider({ children }: { children: ReactNode }) {
  const browserId = useBrowserId();
  const [watchlist, setWatchlistState] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  /* Fetch on mount once browserId is available */
  useEffect(() => {
    if (!browserId) return;

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(
          `/api/preferences?browser_id=${encodeURIComponent(browserId!)}`,
        );
        if (!res.ok) throw new Error("Failed to load preferences");
        const data = await res.json();
        if (!cancelled) {
          setWatchlistState(data.watchlist ?? []);
        }
      } catch (err) {
        console.error("Watchlist load error:", err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [browserId]);

  /* Persist helper */
  const persist = useCallback(
    async (ids: number[]) => {
      if (!browserId) return;
      try {
        await fetch("/api/preferences", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ browserId, watchlist: ids }),
        });
      } catch (err) {
        console.error("Watchlist persist error:", err);
      }
    },
    [browserId],
  );

  /* Mutations */
  const addCommodity = useCallback(
    (id: number) => {
      setWatchlistState((prev) => {
        if (prev.includes(id)) return prev;
        const next = [...prev, id];
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const removeCommodity = useCallback(
    (id: number) => {
      setWatchlistState((prev) => {
        const next = prev.filter((x) => x !== id);
        persist(next);
        return next;
      });
    },
    [persist],
  );

  const setWatchlist = useCallback(
    (ids: number[]) => {
      setWatchlistState(ids);
      persist(ids);
    },
    [persist],
  );

  const value: WatchlistContextValue = {
    watchlist,
    watchlistHash: clientHash(watchlist),
    isLoading,
    addCommodity,
    removeCommodity,
    setWatchlist,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
    </WatchlistContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */
export function useWatchlist(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error("useWatchlist must be used within a WatchlistProvider");
  }
  return ctx;
}
