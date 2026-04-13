import Anthropic from "@anthropic-ai/sdk";
import type { InsightCard } from "@/types";

interface PriceDataInput {
  commodityName: string;
  currentPrice: number;
  monthlyPct: number;
  weeklyPct: number;
  prices: { date: string; price: number }[];
}

export function buildInsightPrompt(
  priceData: PriceDataInput[],
  newsHeadlines: string[]
): string {
  const commoditySection = priceData
    .map(
      (c) =>
        `- ${c.commodityName}: Current Price $${c.currentPrice}, ` +
        `Weekly Change ${c.weeklyPct}%, Monthly Change ${c.monthlyPct}%\n` +
        `  Recent prices: ${c.prices.map((p) => `${p.date}: $${p.price}`).join(", ")}`
    )
    .join("\n");

  const newsSection =
    newsHeadlines.length > 0
      ? newsHeadlines.map((h) => `- ${h}`).join("\n")
      : "No recent news headlines available.";

  return (
    `Analyze the following commodity price data and news for construction industry professionals.\n\n` +
    `COMMODITY DATA:\n${commoditySection}\n\n` +
    `RECENT NEWS HEADLINES:\n${newsSection}\n\n` +
    `Generate insight cards based on this data. For each significant trend or event, create an insight card with:\n` +
    `- priority: "high" | "watch" | "opportunity"\n` +
    `- commodity: the commodity name\n` +
    `- title: short headline for the insight\n` +
    `- trendPct: the relevant percentage change (positive number)\n` +
    `- trendDirection: "up" | "down"\n` +
    `- description: 1-2 sentence explanation\n` +
    `- recommendation: actionable advice for construction professionals\n\n` +
    `Respond ONLY with a JSON array of insight objects.`
  );
}

export function parseInsightResponse(responseText: string): InsightCard[] {
  if (!responseText || responseText.trim().length === 0) {
    return [];
  }

  let jsonStr = responseText.trim();

  // Handle markdown-wrapped JSON (```json ... ``` or ``` ... ```)
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.map((item: Record<string, unknown>) => ({
      priority: item.priority as InsightCard["priority"],
      commodity: item.commodity as string,
      title: item.title as string,
      trendPct: item.trendPct as number,
      trendDirection: item.trendDirection as InsightCard["trendDirection"],
      description: item.description as string,
      recommendation: item.recommendation as string,
    }));
  } catch {
    return [];
  }
}

export async function generateInsights(
  priceData: PriceDataInput[],
  newsHeadlines: string[]
): Promise<InsightCard[]> {
  const client = new Anthropic();
  const userPrompt = buildInsightPrompt(priceData, newsHeadlines);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system:
      "You are a commodity market analyst advising construction industry professionals. " +
      "Analyze price trends and news to provide actionable insights. " +
      "Respond ONLY with a JSON array of insight objects, no additional text.",
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return parseInsightResponse(responseText);
}
