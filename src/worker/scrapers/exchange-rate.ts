import { monthEndDate, monthStartDate } from "../metrics";
import { delay, fetchTextWithRetry, type Fetcher } from "./http";

const FRANKFURTER_RANGE_URL = "https://api.frankfurter.dev/v2/rates";
const JSDELIVR_CURRENCY_URL = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api";

export interface ExchangeRateDailyRow {
  date: string;
  usdCny: number;
  usdKrw: number;
}

export interface ExchangeRateMonthlyFetchRow {
  month: string;
  rateDate: string;
  usdCny: number;
  cnyKrw: number;
  source: string;
}

interface FrankfurterRow {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

interface CurrencyApiResponse {
  date?: string;
  usd?: {
    cny?: number;
    krw?: number;
  };
}

export function parseFrankfurterExchangeRateRows(payload: string | FrankfurterRow[]): ExchangeRateDailyRow[] {
  const rows = typeof payload === "string" ? (JSON.parse(payload) as FrankfurterRow[]) : payload;
  const byDate = new Map<string, Partial<ExchangeRateDailyRow>>();

  for (const row of rows) {
    const point = byDate.get(row.date) ?? { date: row.date };
    if (row.base === "USD" && row.quote === "CNY") {
      point.usdCny = row.rate;
    }
    if (row.base === "USD" && row.quote === "KRW") {
      point.usdKrw = row.rate;
    }
    byDate.set(row.date, point);
  }

  return [...byDate.values()]
    .filter((row): row is ExchangeRateDailyRow => row.date != null && row.usdCny != null && row.usdKrw != null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function parseCurrencyApiExchangeRateRow(payload: string | CurrencyApiResponse): ExchangeRateDailyRow | null {
  const body = typeof payload === "string" ? (JSON.parse(payload) as CurrencyApiResponse) : payload;
  if (!body.date || body.usd?.cny == null || body.usd.krw == null) {
    return null;
  }
  return {
    date: body.date,
    usdCny: body.usd.cny,
    usdKrw: body.usd.krw
  };
}

export function selectMonthlyExchangeRateRows(
  rows: ExchangeRateDailyRow[],
  months: string[],
  source = "Frankfurter"
): ExchangeRateMonthlyFetchRow[] {
  const wanted = new Set(months);
  const latestByMonth = new Map<string, ExchangeRateDailyRow>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    if (!wanted.has(month)) {
      continue;
    }
    const previous = latestByMonth.get(month);
    if (!previous || row.date > previous.date) {
      latestByMonth.set(month, row);
    }
  }

  return months
    .map((month) => {
      const row = latestByMonth.get(month);
      return row ? toMonthlyRow(month, row, source) : null;
    })
    .filter((row): row is ExchangeRateMonthlyFetchRow => row != null);
}

export async function fetchMonthlyExchangeRateRows(
  fetcher: Fetcher,
  months: string[],
  delayMs = 0
): Promise<ExchangeRateMonthlyFetchRow[]> {
  const orderedMonths = [...new Set(months)].sort();
  if (orderedMonths.length === 0) {
    return [];
  }

  try {
    const frankfurterRows = await fetchFrankfurterExchangeRateRows(fetcher, orderedMonths);
    const monthly = selectMonthlyExchangeRateRows(frankfurterRows, orderedMonths, "Frankfurter");
    if (monthly.length === orderedMonths.length) {
      return monthly;
    }
  } catch {
    // Fall through to CDN historical files.
  }

  const fallbackRows: ExchangeRateMonthlyFetchRow[] = [];
  for (const month of orderedMonths) {
    const row = await fetchCurrencyApiMonthEnd(fetcher, month);
    if (row) {
      fallbackRows.push(toMonthlyRow(month, row, "currency-api/jsDelivr"));
    }
    await delay(delayMs);
  }

  if (fallbackRows.length === 0) {
    throw new Error("Exchange-rate response did not include USD/CNY and USD/KRW");
  }
  return fallbackRows;
}

async function fetchFrankfurterExchangeRateRows(fetcher: Fetcher, months: string[]): Promise<ExchangeRateDailyRow[]> {
  const url = new URL(FRANKFURTER_RANGE_URL);
  url.searchParams.set("from", monthStartDate(months[0]));
  url.searchParams.set("to", monthEndDate(months[months.length - 1]));
  url.searchParams.set("base", "USD");
  url.searchParams.set("quotes", "CNY,KRW");

  return parseFrankfurterExchangeRateRows(
    await fetchTextWithRetry(
      fetcher,
      url,
      {
        headers: {
          accept: "application/json,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.8,zh-CN;q=0.7",
          "user-agent":
            "Mozilla/5.0 (compatible; korea-memory-price-monitor/0.1; +https://workers.cloudflare.com/)"
        }
      },
      { retries: 2, retryDelayMs: 750, timeoutMs: 12_000 }
    )
  );
}

async function fetchCurrencyApiMonthEnd(fetcher: Fetcher, month: string): Promise<ExchangeRateDailyRow | null> {
  const endDate = monthEndDate(month);
  const url = `${JSDELIVR_CURRENCY_URL}@${endDate}/v1/currencies/usd.json`;

  return parseCurrencyApiExchangeRateRow(
    await fetchTextWithRetry(
      fetcher,
      url,
      {
        headers: {
          accept: "application/json,*/*;q=0.8",
          "accept-language": "en-US,en;q=0.8,zh-CN;q=0.7",
          "user-agent":
            "Mozilla/5.0 (compatible; korea-memory-price-monitor/0.1; +https://workers.cloudflare.com/)"
        }
      },
      { retries: 2, retryDelayMs: 750, timeoutMs: 12_000 }
    )
  );
}

function toMonthlyRow(month: string, row: ExchangeRateDailyRow, source: string): ExchangeRateMonthlyFetchRow {
  return {
    month,
    rateDate: row.date,
    usdCny: row.usdCny,
    cnyKrw: row.usdKrw / row.usdCny,
    source
  };
}
