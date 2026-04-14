import Parser from "rss-parser";
import type { MappedNewsArticle } from "./gnews";
import { extractCommodityTags } from "./gnews";

interface RssItem {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  contentSnippet?: string;
  [key: string]: unknown;
}

const RSS_FEEDS = [
  {
    url: "https://www.constructiondive.com/feeds/news/",
    name: "Construction Dive",
  },
  {
    url: "https://www.enr.com/rss/all",
    name: "ENR",
  },
];

/**
 * Maps an RSS feed item to our MappedNewsArticle format.
 */
export function mapRssItem(
  item: RssItem,
  sourceName: string
): MappedNewsArticle {
  const title = item.title ?? "";
  const description = item.contentSnippet ?? "";
  const url = item.link ?? "";

  const combinedText = `${title} ${description}`;
  const commodityTags = extractCommodityTags(combinedText);

  let publishedAt: Date;
  if (item.pubDate) {
    publishedAt = new Date(item.pubDate);
    if (isNaN(publishedAt.getTime())) {
      publishedAt = new Date();
    }
  } else {
    publishedAt = new Date();
  }

  return {
    title,
    description,
    sourceName,
    sourceUrl: url,
    url,
    category: "construction",
    commodityTags,
    publishedAt,
  };
}

/**
 * Fetches and parses articles from Construction Dive and ENR RSS feeds.
 * Non-fatal: if a feed fails, log and continue with others.
 */
export async function fetchRssArticles(): Promise<MappedNewsArticle[]> {
  const parser = new Parser();
  const allArticles: MappedNewsArticle[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const articles = (parsed.items ?? []).map((item) =>
        mapRssItem(item as RssItem, feed.name)
      );
      allArticles.push(...articles);
    } catch (error) {
      console.error(`Failed to fetch RSS feed from ${feed.name}:`, error);
      // Non-fatal: continue with other feeds
    }
  }

  return allArticles;
}
