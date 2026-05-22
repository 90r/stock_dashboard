import type { IpoCalendarItem, IpoMarginRecord, IpoTrackerResponse } from "../../shared/types";
import { fetchTextWithRetry, type Fetcher } from "./http";

const TRADESMART_IPO_URL = "https://www.lowrisktradesmart.org/zh/tools/ipo-tracker";

interface RawIpoData {
  generated_at?: string;
  generated_at_utc?: string;
  source?: string;
  source_url?: string;
  timezone?: string;
  grid?: {
    start_date?: string;
    end_date?: string;
    dates?: string[];
  };
  event_legend?: Record<string, { en?: string; zh?: string; "zh-hk"?: string }>;
  ipos?: RawIpo[];
  count?: number;
  margin?: RawMarginData;
}

interface RawIpoProps {
  data?: RawIpoData;
  margin?: RawMarginData;
}

interface RawMarginData {
  generated_at?: string;
  source?: string;
  source_url?: string;
  count?: number;
  records?: RawMarginRecord[];
}

interface RawIpo {
  symbol?: string;
  symbol_hk?: string;
  name?: string;
  subscription_open?: string | null;
  subscription_close?: string | null;
  price_fixed_date?: string | null;
  allotment_date?: string | null;
  listing_date?: string | null;
  listing_label?: string | null;
  aastocks_url?: string | null;
  offer_price_hkd?: number | null;
  offer_price_range?: string | null;
  lot_size?: number | null;
  entry_fee_hkd?: number | null;
  events?: Array<{
    date?: string;
    code?: string;
    label?: string;
  }>;
}

interface RawMarginRecord {
  symbol?: string;
  symbol_hk?: string;
  name?: string;
  margin_total_hkd_yi?: number | null;
  oversubscription_ratio?: number | null;
  broker_top_text?: string | null;
  observed_at?: string | null;
  scraped_at?: string | null;
  source_url?: string | null;
}

export async function fetchTradesmartIpoTracker(fetcher: Fetcher = fetch): Promise<IpoTrackerResponse> {
  const html = await fetchTextWithRetry(
    fetcher,
    TRADESMART_IPO_URL,
    {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
        "user-agent":
          "Mozilla/5.0 (compatible; stock-dashboard/0.1; +https://stock.789567.xyz) AppleWebKit/537.36 Chrome/126 Safari/537.36"
      }
    },
    { timeoutMs: 15_000, retries: 1, retryDelayMs: 600 }
  );

  return parseTradesmartIpoHtml(html);
}

export function parseTradesmartIpoHtml(html: string): IpoTrackerResponse {
  const rawData = extractNextFlightData(html);
  return normalizeIpoData(rawData);
}

function extractNextFlightData(html: string): RawIpoData {
  const stream = extractNextFlightStream(html);
  const dataMarker = '"data":';
  const dataStart = stream.indexOf(dataMarker);
  if (dataStart < 0) {
    throw new Error("TradeSmart IPO page did not include embedded data");
  }

  const props = extractComponentProps(stream, dataStart);
  if (props?.data && Array.isArray(props.data.ipos)) {
    return { ...props.data, margin: props.data.margin ?? props.margin };
  }

  const objectStart = stream.indexOf("{", dataStart + dataMarker.length);
  if (objectStart < 0) {
    throw new Error("TradeSmart IPO data block is malformed");
  }

  const objectEnd = findJsonObjectEnd(stream, objectStart);
  if (objectEnd < 0) {
    throw new Error("TradeSmart IPO data block is incomplete");
  }

  const parsed = JSON.parse(stream.slice(objectStart, objectEnd + 1)) as RawIpoData;
  if (!Array.isArray(parsed.ipos)) {
    throw new Error("TradeSmart IPO data did not include an IPO list");
  }
  return parsed;
}

function extractComponentProps(stream: string, dataStart: number): RawIpoProps | null {
  const minStart = Math.max(0, dataStart - 500);

  for (let start = dataStart; start >= minStart; start -= 1) {
    if (stream[start] !== "{") {
      continue;
    }

    const end = findJsonObjectEnd(stream, start);
    if (end < 0) {
      continue;
    }

    try {
      const parsed = JSON.parse(stream.slice(start, end + 1)) as RawIpoProps;
      if (parsed.data && Array.isArray(parsed.data.ipos)) {
        return parsed;
      }
    } catch {
      // Keep scanning; most braces near the marker belong to nested JSON.
    }
  }

  return null;
}

function extractNextFlightStream(html: string): string {
  const regex = /self\.__next_f\.push\(\[1,"((?:\\.|[^"\\])*)"\]\)<\/script>/g;
  let stream = "";
  for (const match of html.matchAll(regex)) {
    stream += JSON.parse(`"${match[1]}"`) as string;
  }

  if (stream.length === 0) {
    throw new Error("TradeSmart IPO page did not include Next.js flight chunks");
  }

  return stream;
}

function findJsonObjectEnd(text: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

function normalizeIpoData(raw: RawIpoData): IpoTrackerResponse {
  const ipos = (raw.ipos ?? []).map(normalizeIpo);
  const marginRecords = (raw.margin?.records ?? []).map(normalizeMarginRecord);

  return {
    generatedAt: raw.generated_at ?? new Date().toISOString(),
    generatedAtUtc: raw.generated_at_utc ?? raw.generated_at ?? null,
    source: raw.source ?? "AAStocks HK IPO Calendar",
    sourceUrl: raw.source_url ?? "http://www.aastocks.com/tc/stocks/market/ipo/ipocalendar.aspx",
    sourcePageUrl: TRADESMART_IPO_URL,
    timezone: raw.timezone ?? "Asia/Hong_Kong",
    grid: {
      startDate: raw.grid?.start_date ?? null,
      endDate: raw.grid?.end_date ?? null,
      dates: raw.grid?.dates ?? []
    },
    eventLegend: raw.event_legend ?? {},
    ipos,
    count: raw.count ?? ipos.length,
    margin: {
      generatedAt: raw.margin?.generated_at ?? null,
      source: raw.margin?.source ?? "AiPO (myiqdii.com)",
      sourceUrl: raw.margin?.source_url ?? "https://aipo.myiqdii.com/trasaction/index",
      count: raw.margin?.count ?? marginRecords.length,
      records: marginRecords
    }
  };
}

function normalizeIpo(raw: RawIpo): IpoCalendarItem {
  const symbol = raw.symbol ?? "";
  return {
    symbol,
    symbolHk: raw.symbol_hk ?? (symbol ? `${symbol}.HK` : ""),
    name: raw.name ?? symbol,
    subscriptionOpen: raw.subscription_open ?? null,
    subscriptionClose: raw.subscription_close ?? null,
    priceFixedDate: raw.price_fixed_date ?? null,
    allotmentDate: raw.allotment_date ?? null,
    listingDate: raw.listing_date ?? null,
    listingLabel: raw.listing_label ?? null,
    aastocksUrl: raw.aastocks_url ?? null,
    offerPriceHkd: raw.offer_price_hkd ?? null,
    offerPriceRange: raw.offer_price_range ?? null,
    lotSize: raw.lot_size ?? null,
    entryFeeHkd: raw.entry_fee_hkd ?? null,
    events: (raw.events ?? []).map((event) => ({
      date: event.date ?? "",
      code: event.code ?? "",
      label: event.label ?? ""
    }))
  };
}

function normalizeMarginRecord(raw: RawMarginRecord): IpoMarginRecord {
  const symbol = raw.symbol ?? "";
  return {
    symbol,
    symbolHk: raw.symbol_hk ?? (symbol ? `${symbol}.HK` : ""),
    name: raw.name ?? symbol,
    marginTotalHkdYi: raw.margin_total_hkd_yi ?? null,
    oversubscriptionRatio: raw.oversubscription_ratio ?? null,
    brokerTopText: raw.broker_top_text ?? null,
    observedAt: raw.observed_at ?? null,
    scrapedAt: raw.scraped_at ?? null,
    sourceUrl: raw.source_url ?? null
  };
}
