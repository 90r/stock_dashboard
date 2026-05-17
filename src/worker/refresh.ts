import { CATEGORIES, STOCKS } from "../shared/catalog";
import type { Env } from "./env";
import { lastCompleteCalendarMonth, monthRangeEnding } from "./metrics";
import {
  ensureExchangeRateSchema,
  insertRefreshLog,
  upsertCustomsTotal,
  upsertDestination,
  upsertExchangeRateMonthly,
  upsertStockMonthly
} from "./db";
import { fetchMonthlyExchangeRateRows, type ExchangeRateMonthlyFetchRow } from "./scrapers/exchange-rate";
import {
  fetchKitaDestinationMonthly,
  fetchKitaLatestMonth,
  fetchKitaTotalMonthly,
  type CustomsTotalFetchResult,
  type DestinationFetchResult
} from "./scrapers/kita";
import { fetchNaverMonthlyRows, type NaverMonthlyRow } from "./scrapers/naver";

export interface RefreshOptions {
  months?: number;
  latestMonth?: string;
  fetcher?: typeof fetch;
  delayMs?: number;
}

export interface RefreshResult {
  startedAt: string;
  finishedAt: string;
  monthFrom: string;
  monthTo: string;
  customsRows: number;
  destinationRows: number;
  stockRows: number;
  exchangeRateRows: number;
}

export async function refreshSnapshot(env: Env, options: RefreshOptions = {}): Promise<RefreshResult> {
  const fetcher = options.fetcher ?? fetch;
  const startedAt = new Date().toISOString();
  let monthFrom: string | null = null;
  let monthTo: string | null = null;

  await insertRefreshLog(env, {
    kind: "snapshot",
    status: "running",
    startedAt,
    message: "Refresh started"
  });
  await ensureExchangeRateSchema(env);

  try {
    const latestMonth = options.latestMonth ?? (await detectLatestMonth(fetcher));
    const months = clampRefreshMonths(options.months ?? Number(env.HISTORY_MONTHS ?? "1"));
    const delayMs = options.delayMs ?? Number(env.SCRAPE_DELAY_MS ?? "250");
    const monthList = monthRangeEnding(latestMonth, months);
    monthFrom = monthList[0];
    monthTo = monthList[monthList.length - 1];

    const customsTotals: CustomsTotalFetchResult[] = [];
    const destinations: DestinationFetchResult[] = [];
    const stockRows: Array<{ symbol: string; row: NaverMonthlyRow }> = [];
    const exchangeRateRows: ExchangeRateMonthlyFetchRow[] = [];

    for (const month of monthList) {
      for (const category of CATEGORIES) {
        const total = await fetchKitaTotalMonthly(fetcher, category.id, category.hskCode, month, delayMs);
        customsTotals.push(total);

        if (category.id === "mcp_hbm") {
          const destinationRows = await fetchKitaDestinationMonthly(fetcher, category.id, category.hskCode, month, delayMs);
          destinations.push(...destinationRows);
        }
      }
    }

    for (const stock of STOCKS) {
      const rows = await fetchNaverMonthlyRows(fetcher, stock.naverCode, monthList, delayMs);
      for (const row of rows) {
        stockRows.push({ symbol: stock.symbol, row });
      }
    }

    let exchangeRateWarning: string | null = null;
    try {
      exchangeRateRows.push(...(await fetchMonthlyExchangeRateRows(fetcher, monthList, delayMs)));
    } catch (error) {
      exchangeRateWarning = `Exchange-rate refresh failed: ${error instanceof Error ? error.message : String(error)}`;
    }

    const updatedAt = new Date().toISOString();
    for (const row of customsTotals) {
      await upsertCustomsTotal(env, row, updatedAt);
    }
    for (const row of destinations) {
      await upsertDestination(env, row, updatedAt);
    }
    for (const stock of stockRows) {
      await upsertStockMonthly(env, stock.symbol as "000660" | "005930", stock.row, updatedAt);
    }
    for (const row of exchangeRateRows) {
      await upsertExchangeRateMonthly(env, row, updatedAt);
    }

    const finishedAt = new Date().toISOString();
    await insertRefreshLog(env, {
      kind: "snapshot",
      status: "success",
      startedAt,
      finishedAt,
      monthFrom,
      monthTo,
      message: `Stored ${customsTotals.length} customs totals, ${destinations.length} destinations, ${stockRows.length} stock rows, ${exchangeRateRows.length} exchange-rate rows${exchangeRateWarning ? `; ${exchangeRateWarning}` : ""}`
    });

    return {
      startedAt,
      finishedAt,
      monthFrom,
      monthTo,
      customsRows: customsTotals.length,
      destinationRows: destinations.length,
      stockRows: stockRows.length,
      exchangeRateRows: exchangeRateRows.length
    };
  } catch (error) {
    const finishedAt = new Date().toISOString();
    await insertRefreshLog(env, {
      kind: "snapshot",
      status: "failed",
      startedAt,
      finishedAt,
      monthFrom,
      monthTo,
      message: error instanceof Error ? error.message : String(error)
    });
    throw error;
  }
}

async function detectLatestMonth(fetcher: typeof fetch): Promise<string> {
  const calendarLatest = lastCompleteCalendarMonth();

  try {
    const pageLatest = await fetchKitaLatestMonth(fetcher);
    return pageLatest > calendarLatest ? pageLatest : calendarLatest;
  } catch {
    return calendarLatest;
  }
}

function clampRefreshMonths(months: number): number {
  if (!Number.isFinite(months)) {
    return 1;
  }
  return Math.min(36, Math.max(1, Math.floor(months)));
}
