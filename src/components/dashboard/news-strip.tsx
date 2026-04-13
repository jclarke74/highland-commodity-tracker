"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface NewsArticle {
  id: number;
  title: string;
  description: string;
  sourceName: string;
  url: string;
  category: string;
  publishedAt: string;
}

const BORDER_COLORS: Record<string, string> = {
  commodity: "border-l-blue-500",
  construction: "border-l-amber-500",
};

const CATEGORY_LABELS: Record<string, string> = {
  commodity: "Commodity",
  construction: "Construction",
};

function NewsCard({ article }: { article: NewsArticle }) {
  const borderColor =
    BORDER_COLORS[article.category] || "border-l-muted-foreground";
  const categoryLabel =
    CATEGORY_LABELS[article.category] || article.category;

  let relativeTime = "";
  try {
    relativeTime = formatDistanceToNow(new Date(article.publishedAt), {
      addSuffix: true,
    });
  } catch {
    relativeTime = "";
  }

  return (
    <a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block bg-card border border-border rounded-lg p-4 border-l-[3px] ${borderColor} transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5`}
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-2">
        {categoryLabel}
      </p>
      <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2 mb-3">
        {article.title}
      </h3>
      <p className="text-xs text-muted-foreground">
        {article.sourceName}
        {relativeTime && <> &middot; {relativeTime}</>}
      </p>
    </a>
  );
}

export function NewsStrip() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function fetchNews() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/news?page=1");
        if (!res.ok) throw new Error("Failed to fetch news");
        const json = await res.json();
        if (!cancelled) setArticles(json.articles ?? []);
      } catch (err) {
        console.error("News strip fetch error:", err);
        if (!cancelled) setError("Failed to load news.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchNews();
    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (error) {
    return (
      <div className="bg-card border border-destructive/30 rounded-lg p-6 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
        <p className="text-sm text-muted-foreground flex-1">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setRetryCount((c) => c + 1)}
        >
          <RefreshCw className="h-3.5 w-3.5" data-icon="inline-start" />
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <p className="text-sm text-muted-foreground text-center">
          No news articles yet. News will appear once the feed is fetched.
        </p>
      </div>
    );
  }

  // Pick: first commodity article, first construction article, then any other
  const commodityArticle = articles.find((a) => a.category === "commodity");
  const constructionArticle = articles.find(
    (a) => a.category === "construction"
  );
  const otherArticle = articles.find(
    (a) => a.id !== commodityArticle?.id && a.id !== constructionArticle?.id
  );

  const displayArticles = [
    commodityArticle,
    constructionArticle,
    otherArticle,
  ].filter(Boolean) as NewsArticle[];

  return (
    <div>
      <h2 className="text-base font-semibold text-foreground mb-4">
        Latest News
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayArticles.map((article) => (
          <NewsCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
