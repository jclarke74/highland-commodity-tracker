import { describe, it, expect } from "vitest";
import {
  buildInsightPrompt,
  parseInsightResponse,
} from "@/lib/insights/generate";
import type { InsightCard } from "@/types";

const samplePriceData = [
  {
    commodityName: "Lumber",
    currentPrice: 550.25,
    monthlyPct: 12.5,
    weeklyPct: 3.2,
    prices: [
      { date: "2026-04-01", price: 520 },
      { date: "2026-04-02", price: 535 },
      { date: "2026-04-03", price: 550.25 },
    ],
  },
  {
    commodityName: "Steel",
    currentPrice: 780.0,
    monthlyPct: -5.3,
    weeklyPct: -1.1,
    prices: [
      { date: "2026-04-01", price: 800 },
      { date: "2026-04-02", price: 790 },
      { date: "2026-04-03", price: 780 },
    ],
  },
];

const sampleHeadlines = [
  "Lumber prices surge amid housing boom",
  "Steel imports face new tariffs",
];

describe("buildInsightPrompt", () => {
  it("includes commodity names in the prompt", () => {
    const prompt = buildInsightPrompt(samplePriceData, sampleHeadlines);
    expect(prompt).toContain("Lumber");
    expect(prompt).toContain("Steel");
  });

  it("includes current prices in the prompt", () => {
    const prompt = buildInsightPrompt(samplePriceData, sampleHeadlines);
    expect(prompt).toContain("550.25");
    expect(prompt).toContain("780");
  });

  it("includes percentage changes in the prompt", () => {
    const prompt = buildInsightPrompt(samplePriceData, sampleHeadlines);
    expect(prompt).toContain("12.5");
    expect(prompt).toContain("-5.3");
    expect(prompt).toContain("3.2");
    expect(prompt).toContain("-1.1");
  });

  it("includes news headlines in the prompt", () => {
    const prompt = buildInsightPrompt(samplePriceData, sampleHeadlines);
    expect(prompt).toContain("Lumber prices surge amid housing boom");
    expect(prompt).toContain("Steel imports face new tariffs");
  });
});

describe("parseInsightResponse", () => {
  const validInsights: InsightCard[] = [
    {
      priority: "high",
      commodity: "Lumber",
      title: "Lumber prices surging",
      trendPct: 12.5,
      trendDirection: "up",
      description: "Lumber prices have increased significantly.",
      recommendation: "Consider locking in prices now.",
    },
    {
      priority: "watch",
      commodity: "Steel",
      title: "Steel declining",
      trendPct: 5.3,
      trendDirection: "down",
      description: "Steel prices are trending downward.",
      recommendation: "Monitor for further drops before purchasing.",
    },
  ];

  it("parses valid JSON array into InsightCard[]", () => {
    const responseText = JSON.stringify(validInsights);
    const result = parseInsightResponse(responseText);
    expect(result).toEqual(validInsights);
    expect(result).toHaveLength(2);
    expect(result[0].priority).toBe("high");
    expect(result[0].commodity).toBe("Lumber");
    expect(result[1].trendDirection).toBe("down");
  });

  it("parses markdown-wrapped JSON (```json blocks)", () => {
    const responseText = "```json\n" + JSON.stringify(validInsights) + "\n```";
    const result = parseInsightResponse(responseText);
    expect(result).toEqual(validInsights);
    expect(result).toHaveLength(2);
  });

  it("parses markdown-wrapped JSON without language tag", () => {
    const responseText = "```\n" + JSON.stringify(validInsights) + "\n```";
    const result = parseInsightResponse(responseText);
    expect(result).toEqual(validInsights);
    expect(result).toHaveLength(2);
  });

  it("returns empty array on invalid JSON", () => {
    const result = parseInsightResponse("this is not json at all");
    expect(result).toEqual([]);
  });

  it("returns empty array on empty string", () => {
    const result = parseInsightResponse("");
    expect(result).toEqual([]);
  });

  it("returns empty array on non-array JSON", () => {
    const result = parseInsightResponse('{"key": "value"}');
    expect(result).toEqual([]);
  });

  it("maps each item to the correct InsightCard fields", () => {
    const responseText = JSON.stringify(validInsights);
    const result = parseInsightResponse(responseText);
    for (const card of result) {
      expect(card).toHaveProperty("priority");
      expect(card).toHaveProperty("commodity");
      expect(card).toHaveProperty("title");
      expect(card).toHaveProperty("trendPct");
      expect(card).toHaveProperty("trendDirection");
      expect(card).toHaveProperty("description");
      expect(card).toHaveProperty("recommendation");
    }
  });
});
