import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import { parseCommodityTables } from "@/lib/scraper/prices";

const fixtureHtml = readFileSync(
  join(__dirname, "../fixtures/tradingeconomics-sample.html"),
  "utf-8"
);

describe("parseCommodityTables", () => {
  const results = parseCommodityTables(fixtureHtml);

  it("parses commodities from multiple tables (expect 4 results from 2 tables)", () => {
    expect(results).toHaveLength(4);
  });

  it("extracts commodity name correctly from the <a> tag", () => {
    const names = results.map((r) => r.name);
    expect(names).toContain("Crude oil");
    expect(names).toContain("Natural gas");
    expect(names).toContain("Gold");
    expect(names).toContain("Copper");
  });

  it("extracts slug correctly from the <a> href", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.slug).toBe("crude-oil");

    const gold = results.find((r) => r.name === "Gold");
    expect(gold?.slug).toBe("gold");
  });

  it("extracts category from table header", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.category).toBe("major");

    const gold = results.find((r) => r.name === "Gold");
    expect(gold?.category).toBe("metals");
  });

  it("parses price correctly including comma-formatted numbers", () => {
    const natGas = results.find((r) => r.name === "Natural gas");
    expect(natGas?.price).toBe(3244.66);

    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.price).toBe(61.5);

    const copper = results.find((r) => r.name === "Copper");
    expect(copper?.price).toBe(452.3);
  });

  it("parses day change and percentage", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.dayChange).toBe(-0.53);
    expect(crudeOil?.dayChangePct).toBe(-0.85);

    const natGas = results.find((r) => r.name === "Natural gas");
    expect(natGas?.dayChange).toBe(12.34);
    expect(natGas?.dayChangePct).toBe(0.38);
  });

  it("parses monthly and YTD percentages", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.monthlyPct).toBe(-4.56);
    expect(crudeOil?.ytdPct).toBe(-14.2);

    const gold = results.find((r) => r.name === "Gold");
    expect(gold?.monthlyPct).toBe(6.32);
    expect(gold?.ytdPct).toBe(23.45);
  });

  it("extracts sourceKey from data-symbol attribute", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.sourceKey).toBe("CL1:COM");

    const gold = results.find((r) => r.name === "Gold");
    expect(gold?.sourceKey).toBe("XAUUSD:CUR");
  });

  it("extracts date string", () => {
    const crudeOil = results.find((r) => r.name === "Crude oil");
    expect(crudeOil?.dateStr).toBe("4/11/2026");
  });

  it("parses weekly percentage", () => {
    const natGas = results.find((r) => r.name === "Natural gas");
    expect(natGas?.weeklyPct).toBe(2.1);

    const copper = results.find((r) => r.name === "Copper");
    expect(copper?.weeklyPct).toBe(-0.8);
  });
});
