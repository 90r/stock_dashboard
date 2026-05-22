import { expect, test } from "@playwright/test";

const snapshot = {
  generatedAt: "2026-05-17T00:00:00.000Z",
  latestMonth: "2026-03",
  lastSuccessAt: "2026-05-17T00:00:00.000Z",
  refresh: { status: "success", startedAt: "2026-05-17T00:00:00.000Z", finishedAt: "2026-05-17T00:00:01.000Z", monthFrom: "2026-02", monthTo: "2026-03", message: null },
  sources: [],
  categories: [
    {
      id: "dram",
      label: "DRAM",
      shortLabel: "DRAM",
      hskCode: "8542321010",
      description: "HSK 8542321010",
      indexBaseMonth: "2026-02",
      latest: {
        month: "2026-03",
        category: "dram",
        hskCode: "8542321010",
        exportUsd: 8012443877,
        exportWeight: 145289,
        exportWeightUnit: "kg",
        importUsd: 1,
        importWeight: 1,
        unitUsdPerKg: 55147.62,
        unitCnyPerKg: 378400,
        momPct: 8,
        yoyPct: 40,
        priceIndex: 108.1
      },
      series: [
        {
          month: "2026-02",
          category: "dram",
          hskCode: "8542321010",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 51000,
          unitCnyPerKg: 350000,
          momPct: null,
          yoyPct: null,
          priceIndex: 100
        },
        {
          month: "2026-03",
          category: "dram",
          hskCode: "8542321010",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 55147.62,
          unitCnyPerKg: 378400,
          momPct: 8,
          yoyPct: 40,
          priceIndex: 108.1
        }
      ],
      indexSeries: [
        { month: "2026-02", priceIndex: 100, priceMomPct: null, hynixIndex: 100, samsungIndex: 100, hynixMomPct: null, samsungMomPct: null, priceCnyPerKg: 350000, hynixCloseCny: 714, samsungCloseCny: 333 },
        { month: "2026-03", priceIndex: 108.1, priceMomPct: 8, hynixIndex: 120, samsungIndex: 108, hynixMomPct: 20, samsungMomPct: 8, priceCnyPerKg: 378400, hynixCloseCny: 829, samsungCloseCny: 348 }
      ],
      destinations: []
    },
    {
      id: "mcp_hbm",
      label: "MCP / HBM proxy",
      shortLabel: "MCP-HBM",
      hskCode: "8542323000",
      description: "HSK 8542323000",
      indexBaseMonth: "2026-02",
      latest: {
        month: "2026-03",
        category: "mcp_hbm",
        hskCode: "8542323000",
        exportUsd: 1,
        exportWeight: 1,
        exportWeightUnit: "kg",
        importUsd: 1,
        importWeight: 1,
        unitUsdPerKg: 63749,
        unitCnyPerKg: 437500,
        momPct: 4,
        yoyPct: 22,
        priceIndex: 104.5
      },
      series: [
        {
          month: "2026-02",
          category: "mcp_hbm",
          hskCode: "8542323000",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 61000,
          unitCnyPerKg: 418000,
          momPct: null,
          yoyPct: null,
          priceIndex: 100
        },
        {
          month: "2026-03",
          category: "mcp_hbm",
          hskCode: "8542323000",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 63749,
          unitCnyPerKg: 437500,
          momPct: 4,
          yoyPct: 22,
          priceIndex: 104.5
        }
      ],
      indexSeries: [
        { month: "2026-02", priceIndex: 100, priceMomPct: null, hynixIndex: 100, samsungIndex: 100, hynixMomPct: null, samsungMomPct: null, priceCnyPerKg: 418000, hynixCloseCny: 714, samsungCloseCny: 333 },
        { month: "2026-03", priceIndex: 104.5, priceMomPct: 4, hynixIndex: 120, samsungIndex: 108, hynixMomPct: 20, samsungMomPct: 8, priceCnyPerKg: 437500, hynixCloseCny: 829, samsungCloseCny: 348 }
      ],
      destinations: [
        {
          month: "2026-03",
          category: "mcp_hbm",
          countryCode: "TW",
          countryName: "대만",
          exportUsd: 2000,
          exportWeight: 4,
          exportWeightUnit: "kg",
          unitUsdPerKg: 500,
          exportSharePct: 66.7
        },
        {
          month: "2026-03",
          category: "mcp_hbm",
          countryCode: "HK",
          countryName: "홍콩",
          exportUsd: 1000,
          exportWeight: 1,
          exportWeightUnit: "kg",
          unitUsdPerKg: 1000,
          exportSharePct: 33.3
        }
      ]
    },
    {
      id: "nand",
      label: "NAND / Flash",
      shortLabel: "NAND",
      hskCode: "8542321030",
      description: "HSK 8542321030",
      indexBaseMonth: "2026-02",
      latest: {
        month: "2026-03",
        category: "nand",
        hskCode: "8542321030",
        exportUsd: 1,
        exportWeight: 1,
        exportWeightUnit: "kg",
        importUsd: 1,
        importWeight: 1,
        unitUsdPerKg: 1500,
        unitCnyPerKg: 10300,
        momPct: -2,
        yoyPct: 5,
        priceIndex: 98
      },
      series: [
        {
          month: "2026-02",
          category: "nand",
          hskCode: "8542321030",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 1530,
          unitCnyPerKg: 10500,
          momPct: null,
          yoyPct: null,
          priceIndex: 100
        },
        {
          month: "2026-03",
          category: "nand",
          hskCode: "8542321030",
          exportUsd: 1,
          exportWeight: 1,
          exportWeightUnit: "kg",
          importUsd: 1,
          importWeight: 1,
          unitUsdPerKg: 1500,
          unitCnyPerKg: 10300,
          momPct: -2,
          yoyPct: 5,
          priceIndex: 98
        }
      ],
      indexSeries: [
        { month: "2026-02", priceIndex: 100, priceMomPct: null, hynixIndex: 100, samsungIndex: 100, hynixMomPct: null, samsungMomPct: null, priceCnyPerKg: 10500, hynixCloseCny: 714, samsungCloseCny: 333 },
        { month: "2026-03", priceIndex: 98, priceMomPct: -2, hynixIndex: 120, samsungIndex: 108, hynixMomPct: 20, samsungMomPct: 8, priceCnyPerKg: 10300, hynixCloseCny: 829, samsungCloseCny: 348 }
      ],
      destinations: []
    }
  ],
  stocks: {
    monthly: [],
    indexBaseMonths: { "000660": "2026-02", "005930": "2026-02" },
    indexSeries: [
      { month: "2026-02", hynixIndex: 100, samsungIndex: 100, hynixMomPct: null, samsungMomPct: null, hynixClose: 150000, samsungClose: 70000, hynixCloseCny: 714, samsungCloseCny: 333 },
      { month: "2026-03", hynixIndex: 120, samsungIndex: 108, hynixMomPct: 20, samsungMomPct: 8, hynixClose: 180000, samsungClose: 75600, hynixCloseCny: 829, samsungCloseCny: 348 }
    ]
  },
  exchangeRate: {
    monthly: [
      { month: "2026-02", rateDate: "2026-02-28", usdCny: 6.82, cnyKrw: 210 },
      { month: "2026-03", rateDate: "2026-03-31", usdCny: 6.8628, cnyKrw: 217.09 }
    ],
    source: "Frankfurter / currency-api",
    note: "无 Key 汇率源"
  }
};

const ipoTracker = {
  generatedAt: "2026-05-22T16:25:03.821Z",
  generatedAtUtc: "2026-05-22T16:25:03.821Z",
  source: "AAStocks HK IPO Calendar",
  sourceUrl: "http://www.aastocks.com/tc/stocks/market/ipo/ipocalendar.aspx",
  sourcePageUrl: "https://www.lowrisktradesmart.org/zh/tools/ipo-tracker",
  timezone: "Asia/Hong_Kong",
  grid: {
    startDate: "2026-05-16",
    endDate: "2026-05-30",
    dates: ["2026-05-16", "2026-05-17"]
  },
  eventLegend: {
    O: { zh: "招股开始" },
    A: { zh: "公布中签" },
    L: { zh: "上市日" }
  },
  count: 1,
  ipos: [
    {
      symbol: "03310",
      symbolHk: "03310.HK",
      name: "雲英谷科技",
      subscriptionOpen: "2026-05-18",
      subscriptionClose: "2026-05-21",
      priceFixedDate: "2026-05-18",
      allotmentDate: "2026-05-26",
      listingDate: "2026-05-27",
      listingLabel: "4日後上市",
      aastocksUrl: "http://www.aastocks.com/tc/stocks/market/ipo/upcomingipo/company-summary?symbol=03310",
      offerPriceHkd: 20.81,
      offerPriceRange: null,
      lotSize: 200,
      entryFeeHkd: 4203.98,
      events: [
        { date: "2026-05-18", code: "O", label: "Subscription opens" },
        { date: "2026-05-26", code: "A", label: "Allotment results" },
        { date: "2026-05-27", code: "L", label: "Listing day" }
      ]
    }
  ],
  margin: {
    generatedAt: "2026-05-22T16:24:58.634Z",
    source: "AiPO (myiqdii.com)",
    sourceUrl: "https://aipo.myiqdii.com/trasaction/index",
    count: 1,
    records: [
      {
        symbol: "03310",
        symbolHk: "03310.HK",
        name: "云英谷科技",
        marginTotalHkdYi: 4563.21765,
        oversubscriptionRatio: 4146.81,
        brokerTopText: "辉立证券: 401亿",
        observedAt: "2026-05-21T03:48:15.000Z",
        scrapedAt: "2026-05-21T04:05:39.469Z",
        sourceUrl: "https://aipo.myiqdii.com/Trasaction/MarginDetails?symbol=03310"
      }
    ]
  }
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/snapshot", (route) => route.fulfill({ json: snapshot }));
  await page.route("**/api/ipo", (route) => route.fulfill({ json: ipoTracker }));
});

test("renders charts, category switch, and destination split", async ({ page }) => {
  await page.goto("/memory");

  await expect(page.getByRole("heading", { name: "韩国存储价格监控器" })).toBeVisible();
  const categoryTabs = page.getByRole("tablist", { name: "category" });
  await expect(categoryTabs.getByRole("button", { name: "MCP-HBM" })).toBeVisible();
  await expect(page.getByText("每条线都是相对上个月的涨跌幅")).toBeVisible();
  await categoryTabs.getByRole("button", { name: "MCP-HBM" }).click();
  await expect(page.getByRole("heading", { name: "MCP-HBM MoM" })).toBeVisible();
  await expect(page.locator(".destination-table").getByText("대만（中国台湾）")).toBeVisible();
  await expect(page.locator(".recharts-wrapper").first()).toBeVisible();
});

test("renders IPO calendar and margin pulse from API data", async ({ page }) => {
  await page.goto("/ipo");

  await expect(page.getByRole("heading", { name: "港股 IPO 监控雷达" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "孖展实时脉搏" })).toBeVisible();
  await expect(page.getByText("03310.HK").first()).toBeVisible();
  await expect(page.locator(".ipo-calendar-table").getByText("雲英谷科技", { exact: true })).toBeVisible();
  await expect(page.getByText("4,147x").first()).toBeVisible();
  await expect(page.getByText("AAStocks HK IPO Calendar")).toBeVisible();
});
