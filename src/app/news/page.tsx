"use client";

import { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { NewsTabs } from "@/components/news/news-tabs";
import { CommodityFilters } from "@/components/news/commodity-filters";
import { NewsCard } from "@/components/news/news-card";

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  sourceName: string;
  url: string;
  category: string;
  commodityTags: string[];
  publishedAt: string;
}

export default function NewsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchArticles = useCallback(
    async (pageNum: number, append: boolean) => {
      if (pageNum === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));

        if (activeTab !== "all") {
          params.set("category", activeTab);
        }

        if (activeFilter !== "all" && activeTab !== "construction") {
          params.set("commodity", activeFilter);
        }

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        const res = await fetch(`/api/news?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch news");
        const json = await res.json();

        const fetched: NewsArticle[] = json.articles ?? [];
        setArticles((prev) => (append ? [...prev, ...fetched] : fetched));
        setHasMore(json.hasMore ?? false);
      } catch (err) {
        console.error("News fetch error:", err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [activeTab, activeFilter, searchQuery]
  );

  // Reset and fetch when filters change
  useEffect(() => {
    setPage(1);
    fetchArticles(1, false);
  }, [fetchArticles]);

  function handleLoadMore() {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchArticles(nextPage, true);
  }

  function handleTabChange(tab: string) {
    setActiveTab(tab);
    // Reset commodity filter when switching to construction tab
    if (tab === "construction") {
      setActiveFilter("all");
    }
  }

  const filtersVisible = activeTab === "all" || activeTab === "commodity";

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1200px]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">News</h1>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <NewsTabs activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Commodity Filters */}
      <CommodityFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        visible={filtersVisible}
      />

      {/* Articles feed */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[130px] w-full rounded-lg" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <p className="text-sm text-muted-foreground">
            No news articles yet. Check back soon.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <NewsCard
              key={article.id}
              title={article.title}
              description={article.description}
              sourceName={article.sourceName}
              category={article.category}
              commodityTags={article.commodityTags ?? []}
              url={article.url}
              publishedAt={article.publishedAt}
            />
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="rounded-lg bg-secondary px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoadingMore ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
