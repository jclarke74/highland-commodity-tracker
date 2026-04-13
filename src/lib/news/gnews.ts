import type { NewsCategory } from "@/types";

export interface MappedNewsArticle {
  title: string;
  description: string;
  sourceName: string;
  sourceUrl: string;
  url: string;
  category: NewsCategory;
  commodityTags: string[];
  publishedAt: Date;
}

interface GNewsArticle {
  title: string;
  description?: string;
  content?: string;
  url: string;
  image?: string;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface GNewsResponse {
  totalArticles: number;
  articles: GNewsArticle[];
}

const COMMODITY_KEYWORDS = [
  "lumber",
  "steel",
  "copper",
  "oil",
  "gas",
  "diesel",
  "fuel",
  "gold",
  "silver",
  "aluminum",
  "zinc",
  "nickel",
  "cement",
  "concrete",
  "iron",
  "coal",
  "wheat",
  "corn",
] as const;

export const COMMODITY_QUERIES = [
  "commodity prices",
  "lumber prices construction",
  "steel market prices",
  "copper demand supply",
  "oil prices construction",
  "building materials costs",
];

/**
 * Scans text for commodity keywords and returns matching tags.
 * Case-insensitive, uses word-boundary matching, and deduplicates.
 */
export function extractCommodityTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags: string[] = [];

  for (const keyword of COMMODITY_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(lower) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  }

  return tags;
}

/**
 * Maps a GNews API article object to our MappedNewsArticle format.
 */
export function mapGNewsArticle(
  article: GNewsArticle | Record<string, unknown>
): MappedNewsArticle {
  const a = article as GNewsArticle;
  const title = a.title ?? "";
  const description = a.description ?? "";
  const source = a.source ?? { name: "", url: "" };

  const combinedText = `${title} ${description}`;
  const commodityTags = extractCommodityTags(combinedText);

  return {
    title,
    description,
    sourceName: source.name ?? "",
    sourceUrl: source.url ?? "",
    url: a.url ?? "",
    category: "commodity",
    commodityTags,
    publishedAt: new Date(a.publishedAt),
  };
}

/**
 * Fetches articles from the GNews API for a given search query.
 */
export async function fetchGNewsArticles(
  query: string
): Promise<MappedNewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    console.error("GNEWS_API_KEY is not set");
    return [];
  }

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error(
        `GNews API error: ${response.status} ${response.statusText}`
      );
      return [];
    }

    const data: GNewsResponse = await response.json();
    return data.articles.map(mapGNewsArticle);
  } catch (error) {
    console.error("Failed to fetch GNews articles:", error);
    return [];
  }
}
