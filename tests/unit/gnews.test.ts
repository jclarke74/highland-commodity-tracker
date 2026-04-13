import { describe, it, expect } from "vitest";
import {
  COMMODITY_QUERIES,
  mapGNewsArticle,
  extractCommodityTags,
} from "@/lib/news/gnews";

describe("COMMODITY_QUERIES", () => {
  it("has at least 4 entries", () => {
    expect(COMMODITY_QUERIES.length).toBeGreaterThanOrEqual(4);
  });

  it('contains "commodity prices"', () => {
    expect(COMMODITY_QUERIES).toContain("commodity prices");
  });
});

describe("extractCommodityTags", () => {
  it("extracts known commodity keywords from text", () => {
    const tags = extractCommodityTags(
      "Lumber prices surge as steel demand rises"
    );
    expect(tags).toContain("lumber");
    expect(tags).toContain("steel");
  });

  it("is case-insensitive", () => {
    const tags = extractCommodityTags("COPPER and OIL markets shift");
    expect(tags).toContain("copper");
    expect(tags).toContain("oil");
  });

  it("returns empty array when no commodities found", () => {
    const tags = extractCommodityTags("Breaking news about the weather");
    expect(tags).toEqual([]);
  });

  it("does not return duplicates", () => {
    const tags = extractCommodityTags("oil prices and oil demand both rising");
    const unique = [...new Set(tags)];
    expect(tags).toEqual(unique);
  });
});

describe("mapGNewsArticle", () => {
  const sampleArticle = {
    title: "Steel prices hit record high amid construction boom",
    description: "Global steel and copper markets see unprecedented demand.",
    content: "Full article content here.",
    url: "https://example.com/steel-prices",
    image: "https://example.com/image.jpg",
    publishedAt: "2026-04-10T14:30:00Z",
    source: {
      name: "Reuters",
      url: "https://reuters.com",
    },
  };

  it("maps title correctly", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.title).toBe(
      "Steel prices hit record high amid construction boom"
    );
  });

  it("maps description correctly", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.description).toBe(
      "Global steel and copper markets see unprecedented demand."
    );
  });

  it("maps sourceName from source.name", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.sourceName).toBe("Reuters");
  });

  it("maps sourceUrl from source.url", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.sourceUrl).toBe("https://reuters.com");
  });

  it("maps url correctly", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.url).toBe("https://example.com/steel-prices");
  });

  it('sets category to "commodity"', () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.category).toBe("commodity");
  });

  it("tags articles with matching commodity names from title/description", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.commodityTags).toContain("steel");
    expect(mapped.commodityTags).toContain("copper");
  });

  it("parses publishedAt as a Date", () => {
    const mapped = mapGNewsArticle(sampleArticle);
    expect(mapped.publishedAt).toBeInstanceOf(Date);
    expect(mapped.publishedAt.toISOString()).toBe("2026-04-10T14:30:00.000Z");
  });

  it("handles missing description gracefully", () => {
    const article = { ...sampleArticle, description: undefined };
    const mapped = mapGNewsArticle(article);
    expect(mapped.description).toBe("");
  });
});
