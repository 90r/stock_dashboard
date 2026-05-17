import { addMonths, formatMonth } from "../metrics";
import { delay, fetchDecodedTextWithRetry, type Fetcher } from "./http";

const NAVER_DAILY_URL = "https://finance.naver.com/item/sise_day.naver";

export interface NaverDailyRow {
  date: string;
  closeKrw: number;
  volume: number | null;
}

export interface NaverMonthlyRow extends NaverDailyRow {
  month: string;
}

export function parseNaverDailyHtml(html: string): NaverDailyRow[] {
  const rows: NaverDailyRow[] = [];
  const trMatches = html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi);

  for (const trMatch of trMatches) {
    const cells = [...trMatch[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((match) => normalizeHtmlText(match[1]));
    if (cells.length < 7 || !/^\d{4}\.\d{2}\.\d{2}$/.test(cells[0])) {
      continue;
    }

    const closeKrw = parseMarketNumber(cells[1]);
    if (closeKrw == null) {
      continue;
    }

    rows.push({
      date: cells[0].replaceAll(".", "-"),
      closeKrw,
      volume: parseMarketNumber(cells[6])
    });
  }

  return rows;
}

export function selectMonthEndCloses(rows: NaverDailyRow[]): NaverMonthlyRow[] {
  const latestByMonth = new Map<string, NaverDailyRow>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const previous = latestByMonth.get(month);
    if (!previous || row.date > previous.date) {
      latestByMonth.set(month, row);
    }
  }

  return [...latestByMonth.entries()]
    .map(([month, row]) => ({ ...row, month }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export async function fetchNaverMonthlyRows(
  fetcher: Fetcher,
  code: string,
  wantedMonths: string[],
  delayMs = 0
): Promise<NaverMonthlyRow[]> {
  const wanted = new Set(wantedMonths);
  const endMonth = wantedMonths[wantedMonths.length - 1];
  const monthsBehindToday = Math.max(0, monthDistance(endMonth, formatMonth(new Date())));
  const maxPages = Math.min(120, Math.max(8, Math.ceil((wantedMonths.length + monthsBehindToday + 2) * 2.8)));
  const dailyRows: NaverDailyRow[] = [];
  let emptyPages = 0;

  for (let page = 1; page <= maxPages; page += 1) {
    const html = await fetchNaverDailyHtml(fetcher, code, page);
    const parsed = parseNaverDailyHtml(html);
    if (parsed.length === 0) {
      emptyPages += 1;
      if (emptyPages >= 2) {
        break;
      }
    } else {
      dailyRows.push(...parsed);
      emptyPages = 0;
    }

    const monthRows = selectMonthEndCloses(dailyRows);
    const covered = new Set(monthRows.map((row) => row.month));
    if (wantedMonths.every((month) => covered.has(month))) {
      break;
    }

    await delay(delayMs);
  }

  return selectMonthEndCloses(dailyRows).filter((row) => wanted.has(row.month));
}

export async function fetchNaverDailyHtml(fetcher: Fetcher, code: string, page: number): Promise<string> {
  const url = new URL(NAVER_DAILY_URL);
  url.searchParams.set("code", code);
  url.searchParams.set("page", String(page));

  return fetchDecodedTextWithRetry(
    fetcher,
    url,
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        "user-agent":
          "Mozilla/5.0 (compatible; korea-memory-price-monitor/0.1; +https://workers.cloudflare.com/)"
      }
    },
    { encoding: "euc-kr", retries: 2, retryDelayMs: 750, timeoutMs: 12_000 }
  );
}

export function normalizeHtmlText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseMarketNumber(value: string): number | null {
  const parsed = Number(value.replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function monthDistance(olderMonth: string, newerMonth: string): number {
  let cursor = olderMonth;
  let distance = 0;
  while (cursor < newerMonth && distance < 240) {
    cursor = addMonths(cursor, 1);
    distance += 1;
  }
  return distance;
}
