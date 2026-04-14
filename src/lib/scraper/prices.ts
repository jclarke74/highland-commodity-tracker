import * as cheerio from "cheerio";

export interface ParsedCommodity {
  name: string;
  slug: string;
  category: string;
  sourceKey: string;
  price: number;
  dayChange: number;
  dayChangePct: number;
  weeklyPct: number;
  monthlyPct: number;
  ytdPct: number;
  dateStr: string;
}

function parseNumber(text: string): number {
  const cleaned = text.replace(/,/g, "").replace(/%/g, "").trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

function slugFromHref(href: string): string {
  const parts = href.split("/");
  return parts[parts.length - 1] || "";
}

export function parseCommodityTables(html: string): ParsedCommodity[] {
  const $ = cheerio.load(html);
  const results: ParsedCommodity[] = [];

  $("table.table").each((_tableIdx, table) => {
    const categoryHeader = $(table)
      .find("thead th")
      .first()
      .text()
      .trim()
      .toLowerCase();

    $(table)
      .find("tbody tr[data-symbol]")
      .each((_rowIdx, row) => {
        const $row = $(row);
        const sourceKey = $row.attr("data-symbol") || "";
        const linkEl = $row.find("td:first-child a");
        const name = linkEl.text().trim();
        const href = linkEl.attr("href") || "";
        const slug = slugFromHref(href);

        const cells = $row.find("td");
        const cellTexts: string[] = [];
        cells.each((_i, cell) => {
          cellTexts.push($(cell).text().trim());
        });

        // Use id-based selectors scoped to current row
        const priceText = $row.find("td#p").text().trim();
        const dayChangeText = $row.find("td#nch").text().trim();
        const dayChangePctText = $row.find("td#pch").text().trim();
        const dateStr = $row.find("td#date").text().trim();

        // Positional columns: [0]=name, [1]=price, [2]=dayChange, [3]=dayChangePct,
        // [4]=weekly, [5]=monthly, [6]=ytd, [7]=date
        const weeklyPct = cellTexts.length > 4 ? parseNumber(cellTexts[4]) : 0;
        const monthlyPct = cellTexts.length > 5 ? parseNumber(cellTexts[5]) : 0;
        const ytdPct = cellTexts.length > 6 ? parseNumber(cellTexts[6]) : 0;

        if (name && priceText) {
          results.push({
            name,
            slug,
            category: categoryHeader,
            sourceKey,
            price: parseNumber(priceText),
            dayChange: parseNumber(dayChangeText),
            dayChangePct: parseNumber(dayChangePctText),
            weeklyPct,
            monthlyPct,
            ytdPct,
            dateStr,
          });
        }
      });
  });

  return results;
}

export async function scrapeCommodityPrices(): Promise<ParsedCommodity[]> {
  const response = await fetch("https://tradingeconomics.com/commodities", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TradingEconomics: ${response.status}`);
  }

  const html = await response.text();
  return parseCommodityTables(html);
}
