import { describe, it, expect } from "vitest";
import { mapRssItem } from "@/lib/news/rss";

describe("mapRssItem", () => {
  const sampleItem = {
    title: "New highway project breaks ground in Texas",
    link: "https://constructiondive.com/news/highway-texas",
    pubDate: "Wed, 09 Apr 2026 12:00:00 GMT",
    content: "Full article text here.",
    contentSnippet: "Snippet of the article.",
  };

  it("maps title correctly", () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.title).toBe("New highway project breaks ground in Texas");
  });

  it("maps description from contentSnippet", () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.description).toBe("Snippet of the article.");
  });

  it("maps sourceName from parameter", () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.sourceName).toBe("Construction Dive");
  });

  it("maps url from link", () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.url).toBe(
      "https://constructiondive.com/news/highway-texas"
    );
  });

  it('sets category to "construction"', () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.category).toBe("construction");
  });

  it("parses publishedAt as a Date", () => {
    const mapped = mapRssItem(sampleItem, "Construction Dive");
    expect(mapped.publishedAt).toBeInstanceOf(Date);
  });

  it("extracts commodity tags from title and description", () => {
    const item = {
      ...sampleItem,
      title: "Steel shortage impacts bridge construction",
      contentSnippet: "Copper wiring costs also rising.",
    };
    const mapped = mapRssItem(item, "ENR");
    expect(mapped.commodityTags).toContain("steel");
    expect(mapped.commodityTags).toContain("copper");
  });

  it("handles missing description gracefully (returns empty string)", () => {
    const item = {
      title: "Construction update",
      link: "https://example.com/news",
      pubDate: "Wed, 09 Apr 2026 12:00:00 GMT",
    };
    const mapped = mapRssItem(item, "Construction Dive");
    expect(mapped.description).toBe("");
  });

  it("handles missing pubDate gracefully", () => {
    const item = {
      title: "Construction update",
      link: "https://example.com/news",
    };
    const mapped = mapRssItem(item, "Construction Dive");
    expect(mapped.publishedAt).toBeInstanceOf(Date);
  });
});
