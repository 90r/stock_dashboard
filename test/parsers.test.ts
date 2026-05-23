import { describe, expect, it } from "vitest";
import { normalizeIndex, pctChange, unitUsdPerKg, withUnitChanges } from "../src/worker/metrics";
import { parseFrankfurterExchangeRateRows, selectMonthlyExchangeRateRows } from "../src/worker/scrapers/exchange-rate";
import {
  combineDestinationValues,
  combineTotalValues,
  extractDestinationTradeValues,
  extractItemTradeValues,
  parseNumericValue
} from "../src/worker/scrapers/kita";
import { parseNaverDailyHtml, selectMonthEndCloses } from "../src/worker/scrapers/naver";
import { parseTradesmartIpoHtml } from "../src/worker/scrapers/tradesmart-ipo";
import { parseIpoSeekListJson } from "../src/worker/scrapers/iposeek";
import {
  FRANKFURTER_EXCHANGE_RATE_JSON,
  IPOSEEK_NEW_STOCK_JSON,
  KITA_DEST_AMT_XML,
  KITA_DEST_WGT_XML,
  KITA_ITEM_AMT_XML,
  KITA_ITEM_WGT_XML,
  NAVER_HTML,
  TRADESMART_IPO_HTML
} from "./fixtures";

describe("K-stat parser", () => {
  it("extracts item export amount and weight, then computes USD/kg", () => {
    const amount = extractItemTradeValues(KITA_ITEM_AMT_XML, "8542321010");
    const weight = extractItemTradeValues(KITA_ITEM_WGT_XML, "8542321010");
    const combined = combineTotalValues("dram", "8542321010", "2026-03", amount, weight);

    expect(amount.exportValue).toBe(8_012_443_877);
    expect(weight.exportValue).toBe(145_289);
    expect(combined.unitUsdPerKg).toBeCloseTo(55_148.32, 2);
  });

  it("combines destination amount and weight rows by country", () => {
    const amountRows = extractDestinationTradeValues(KITA_DEST_AMT_XML);
    const weightRows = extractDestinationTradeValues(KITA_DEST_WGT_XML);
    const combined = combineDestinationValues("mcp_hbm", "8542323000", "2026-03", amountRows, weightRows);

    expect(combined).toHaveLength(2);
    expect(combined[0]).toMatchObject({
      countryCode: "TW",
      countryName: "대만",
      exportUsd: 2000,
      exportWeight: 4,
      unitUsdPerKg: 500
    });
  });

  it("parses formatted numeric values and blanks", () => {
    expect(parseNumericValue("1,234.5")).toBe(1234.5);
    expect(parseNumericValue("")).toBeNull();
    expect(parseNumericValue("not-a-number")).toBeNull();
  });
});

describe("metrics", () => {
  it("computes unit value and percentage changes", () => {
    expect(unitUsdPerKg(300, 6)).toBe(50);
    expect(pctChange(120, 100)).toBe(20);
    expect(pctChange(120, 0)).toBeNull();
  });

  it("adds MoM and YoY changes by month", () => {
    const points = withUnitChanges([
      { month: "2025-03", unitUsdPerKg: 100 },
      { month: "2026-02", unitUsdPerKg: 160 },
      { month: "2026-03", unitUsdPerKg: 200 }
    ]);

    expect(points[2].momPct).toBe(25);
    expect(points[2].yoyPct).toBe(100);
    expect(points[2].priceIndex).toBe(200);
  });

  it("prefers 2024-01 as the index base when present", () => {
    const rows = normalizeIndex([
      { month: "2023-12", closeKrw: 80 },
      { month: "2024-01", closeKrw: 100 },
      { month: "2024-02", closeKrw: 120 }
    ]);

    expect(rows[0].indexValue).toBe(80);
    expect(rows[1].indexValue).toBe(100);
    expect(rows[2].indexValue).toBe(120);
  });
});

describe("Naver parser", () => {
  it("parses daily rows and selects each month-end trading day", () => {
    const rows = parseNaverDailyHtml(NAVER_HTML);
    const monthly = selectMonthEndCloses(rows);

    expect(rows[0]).toMatchObject({ date: "2026-03-29", closeKrw: 180000, volume: 1100 });
    expect(monthly).toEqual([
      { month: "2026-02", date: "2026-02-28", closeKrw: 150000, volume: 800 },
      { month: "2026-03", date: "2026-03-29", closeKrw: 180000, volume: 1100 }
    ]);
  });
});

describe("exchange-rate parser", () => {
  it("parses Frankfurter rows and selects each month end rate", () => {
    const rows = parseFrankfurterExchangeRateRows(FRANKFURTER_EXCHANGE_RATE_JSON);
    const monthly = selectMonthlyExchangeRateRows(rows, ["2026-02", "2026-03"]);

    expect(rows.at(-1)).toEqual({ date: "2026-03-31", usdCny: 6.8628, usdKrw: 1489.845252 });
    expect(monthly).toEqual([
      { month: "2026-02", rateDate: "2026-02-28", usdCny: 6.82, cnyKrw: 210, source: "Frankfurter" },
      { month: "2026-03", rateDate: "2026-03-31", usdCny: 6.8628, cnyKrw: 217.09, source: "Frankfurter" }
    ]);
  });
});

describe("TradeSmart IPO parser", () => {
  it("extracts IPO calendar and margin records from Next.js flight chunks", () => {
    const tracker = parseTradesmartIpoHtml(TRADESMART_IPO_HTML);

    expect(tracker.generatedAt).toBe("2026-05-22T16:25:03.821Z");
    expect(tracker.ipos).toHaveLength(1);
    expect(tracker.ipos[0]).toMatchObject({
      symbol: "03310",
      symbolHk: "03310.HK",
      name: "雲英谷科技",
      subscriptionOpen: "2026-05-18",
      listingDate: "2026-05-27",
      entryFeeHkd: 4203.98
    });
    expect(tracker.margin.records[0]).toMatchObject({
      symbol: "03310",
      marginTotalHkdYi: 4563.21765,
      oversubscriptionRatio: 4146.81,
      brokerTopText: "辉立证券: 401亿"
    });
  });
});

describe("IpoSeek new stock parser", () => {
  it("extracts A-share issuance rows from the API response", () => {
    const tracker = parseIpoSeekListJson(IPOSEEK_NEW_STOCK_JSON);

    expect(tracker.total).toBe(1644);
    expect(tracker.rows).toHaveLength(2);
    expect(tracker.rows?.[0]).toMatchObject({
      shareCode: "301669",
      shareName: "高特电子",
      issuanceStatus: "启动发行",
      issuanceStartDate: "2026-05-21"
    });
  });
});
