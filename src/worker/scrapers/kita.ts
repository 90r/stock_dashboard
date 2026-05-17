import type { CategoryId } from "../../shared/catalog";
import { unitUsdPerKg } from "../metrics";
import { delay, fetchTextWithRetry, type Fetcher } from "./http";

export type KitaField = "AMT" | "WGT";

const KITA_BASE_URL = "https://stat.kita.net";
const ITEM_WORKER_PATH = "/stat/kts/pum/ItemImpExpListWorker.screen";
const DESTINATION_WORKER_PATH = "/stat/kts/pum/PumCtrImpExpListWorker.screen";
const ITEM_PAGE_PATH = "/stat/kts/pum/ItemImpExpList.screen";
const DESTINATION_PAGE_PATH = "/stat/kts/pum/PumCtrImpExpList.screen";

const ITEM_COLUMNS = [
  "rn",
  "rowCode",
  "korName",
  "qtyUnit",
  "lastExp",
  "lastExpRate",
  "lastImp",
  "lastImpRate",
  "profit",
  "thisExp",
  "thisExpRate",
  "thisImp",
  "thisImpRate",
  "thisProfit",
  "condGb",
  "orderNm"
] as const;

const DESTINATION_COLUMNS = [
  "rn",
  "rowCode",
  "orderNm",
  "korName",
  "lastExp",
  "lastExpRate",
  "lastImp",
  "lastImpRate",
  "profit",
  "thisExp",
  "thisExpRate",
  "thisImp",
  "thisImpRate",
  "thisProfit"
] as const;

type ItemColumn = (typeof ITEM_COLUMNS)[number];
type DestinationColumn = (typeof DESTINATION_COLUMNS)[number];

export type KitaItemRow = Record<ItemColumn, string>;
export type KitaDestinationRow = Record<DestinationColumn, string>;

export interface RawTradeValues {
  exportValue: number | null;
  importValue: number | null;
}

export interface CustomsTotalFetchResult {
  category: CategoryId;
  hskCode: string;
  month: string;
  exportUsd: number | null;
  exportWeight: number | null;
  importUsd: number | null;
  importWeight: number | null;
  unitUsdPerKg: number | null;
}

export interface DestinationFetchResult {
  category: CategoryId;
  hskCode: string;
  month: string;
  countryCode: string;
  countryName: string;
  exportUsd: number | null;
  exportWeight: number | null;
  importUsd: number | null;
  importWeight: number | null;
  unitUsdPerKg: number | null;
}

export function parseKitaSheetXml<TColumn extends string>(xml: string, columns: readonly TColumn[]): Array<Record<TColumn, string>> {
  const rows: Array<Record<TColumn, string>> = [];
  const trMatches = xml.matchAll(/<TR>\s*([\s\S]*?)\s*<\/TR>/gi);

  for (const trMatch of trMatches) {
    const tdMatches = [...trMatch[1].matchAll(/<TD>([\s\S]*?)<\/TD>/gi)];
    const values = tdMatches.map((match) => decodeKitaCell(match[1]));
    if (values.length === 0) {
      continue;
    }

    const row = {} as Record<TColumn, string>;
    for (const [index, column] of columns.entries()) {
      row[column] = values[index] ?? "";
    }
    rows.push(row);
  }

  return rows;
}

export function decodeKitaCell(raw: string): string {
  const cdata = raw.match(/<!\[CDATA\[([\s\S]*?)\]\]>/i)?.[1] ?? raw;
  return decodeXmlEntities(cdata).trim();
}

export function decodeXmlEntities(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'");
}

export function parseNumericValue(value: string | null | undefined): number | null {
  if (value == null) {
    return null;
  }
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized) {
    return null;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function extractItemTradeValues(xml: string, hskCode: string): RawTradeValues {
  const rows = parseKitaSheetXml(xml, ITEM_COLUMNS);
  const row = rows.find((candidate) => candidate.rowCode === hskCode) ?? rows.find((candidate) => candidate.orderNm === "2");

  if (!row) {
    throw new Error(`K-stat item response did not include HSK ${hskCode}`);
  }

  return {
    exportValue: parseNumericValue(row.thisExp),
    importValue: parseNumericValue(row.thisImp)
  };
}

export function extractDestinationTradeValues(xml: string): Array<KitaDestinationRow & RawTradeValues> {
  return parseKitaSheetXml(xml, DESTINATION_COLUMNS)
    .filter((row) => row.orderNm === "2" && row.rowCode)
    .map((row) => ({
      ...row,
      exportValue: parseNumericValue(row.thisExp),
      importValue: parseNumericValue(row.thisImp)
    }));
}

export function combineTotalValues(
  category: CategoryId,
  hskCode: string,
  month: string,
  amountValues: RawTradeValues,
  weightValues: RawTradeValues
): CustomsTotalFetchResult {
  return {
    category,
    hskCode,
    month,
    exportUsd: amountValues.exportValue,
    exportWeight: weightValues.exportValue,
    importUsd: amountValues.importValue,
    importWeight: weightValues.importValue,
    unitUsdPerKg: unitUsdPerKg(amountValues.exportValue, weightValues.exportValue)
  };
}

export function combineDestinationValues(
  category: CategoryId,
  hskCode: string,
  month: string,
  amountRows: Array<KitaDestinationRow & RawTradeValues>,
  weightRows: Array<KitaDestinationRow & RawTradeValues>
): DestinationFetchResult[] {
  const weightsByCountry = new Map(weightRows.map((row) => [row.rowCode, row]));

  return amountRows.map((amountRow) => {
    const weightRow = weightsByCountry.get(amountRow.rowCode);
    const exportWeight = weightRow?.exportValue ?? null;
    const importWeight = weightRow?.importValue ?? null;

    return {
      category,
      hskCode,
      month,
      countryCode: amountRow.rowCode,
      countryName: amountRow.korName,
      exportUsd: amountRow.exportValue,
      exportWeight,
      importUsd: amountRow.importValue,
      importWeight,
      unitUsdPerKg: unitUsdPerKg(amountRow.exportValue, exportWeight)
    };
  });
}

export async function fetchKitaLatestMonth(fetcher: Fetcher = fetch): Promise<string> {
  const html = await fetchTextWithRetry(
    fetcher,
    `${KITA_BASE_URL}${ITEM_PAGE_PATH}`,
    {
      headers: baseHeaders(`${KITA_BASE_URL}${ITEM_PAGE_PATH}`)
    },
    { retries: 1, timeoutMs: 12_000 }
  );

  const year = html.match(/setSelect\(f\.s_year\s*,\s*['"](\d{4})['"]\)/)?.[1];
  const month = html.match(/setSelect\(f\.s_month\s*,\s*['"](\d{2})['"]\)/)?.[1];

  if (!year || !month) {
    throw new Error("Could not detect latest K-stat month from page source");
  }

  return `${year}-${month}`;
}

export async function fetchKitaTotalMonthly(
  fetcher: Fetcher,
  category: CategoryId,
  hskCode: string,
  month: string,
  delayMs = 0
): Promise<CustomsTotalFetchResult> {
  const [amountXml, weightXml] = await Promise.all([
    fetchKitaItemXml(fetcher, hskCode, month, "AMT"),
    fetchKitaItemXml(fetcher, hskCode, month, "WGT")
  ]);
  await delay(delayMs);

  return combineTotalValues(
    category,
    hskCode,
    month,
    extractItemTradeValues(amountXml, hskCode),
    extractItemTradeValues(weightXml, hskCode)
  );
}

export async function fetchKitaDestinationMonthly(
  fetcher: Fetcher,
  category: CategoryId,
  hskCode: string,
  month: string,
  delayMs = 0
): Promise<DestinationFetchResult[]> {
  const [amountXml, weightXml] = await Promise.all([
    fetchKitaDestinationXml(fetcher, hskCode, month, "AMT"),
    fetchKitaDestinationXml(fetcher, hskCode, month, "WGT")
  ]);
  await delay(delayMs);

  return combineDestinationValues(
    category,
    hskCode,
    month,
    extractDestinationTradeValues(amountXml),
    extractDestinationTradeValues(weightXml)
  );
}

export async function fetchKitaItemXml(fetcher: Fetcher, hskCode: string, month: string, field: KitaField): Promise<string> {
  const [year, monthNumber] = splitMonth(month);
  const body = new URLSearchParams({
    event_udap: "Search",
    searchType: "SHEET",
    pageNum: "1",
    listCount: "30",
    s_cond_gb: "HS",
    s_cond_unit: "10",
    s_cond_unit_num: hskCode,
    s_trade_gb: "s_suji",
    s_year: year,
    s_month: monthNumber,
    s_field: field,
    s_monthsum_gb: "1",
    // This worker returns the displayed WGT value for Korea trade statistics.
    // For the current KITA endpoint and memory HS codes, s_measure=1 gives kg-scale net weight.
    s_measure: "1",
    s_sort: "THIS_EXP_AMT",
    s_sort_val: "DESC",
    s_language: "kor_name",
    p_cond_unit: "10",
    s_url: "/stat/kts/pum/ItemImpExpList"
  });

  return postKitaWorker(fetcher, ITEM_WORKER_PATH, ITEM_PAGE_PATH, body);
}

export async function fetchKitaDestinationXml(fetcher: Fetcher, hskCode: string, month: string, field: KitaField): Promise<string> {
  const [year, monthNumber] = splitMonth(month);
  const body = new URLSearchParams({
    event_udap: "Search",
    searchType: "SHEET",
    pageNum: "1",
    listCount: "100",
    s_item_type: "HS",
    s_item_value: hskCode,
    s_item_name: "",
    s_trade_gb: "s_suji",
    s_year: year,
    s_month: monthNumber,
    s_field: field,
    s_monthsum_gb: "1",
    // See fetchKitaItemXml for WGT unit handling.
    s_measure: "1",
    s_sort: "THIS_EXP_AMT",
    s_sort_val: "DESC, KOR_NAME DESC",
    s_language: "kor_name",
    p_cond_gb: "HS",
    p_item_code: hskCode,
    p_item_name: "",
    p_measure: "1",
    p_field: field === "AMT" ? "금액" : "중량",
    s_url: "/stat/kts/pum/PumCtrImpExpList"
  });

  return postKitaWorker(fetcher, DESTINATION_WORKER_PATH, DESTINATION_PAGE_PATH, body);
}

async function postKitaWorker(fetcher: Fetcher, workerPath: string, refererPath: string, body: URLSearchParams): Promise<string> {
  return fetchTextWithRetry(
    fetcher,
    `${KITA_BASE_URL}${workerPath}`,
    {
      method: "POST",
      headers: {
        ...baseHeaders(`${KITA_BASE_URL}${refererPath}`),
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest"
      },
      body
    },
    { retries: 2, retryDelayMs: 750, timeoutMs: 15_000 }
  );
}

function splitMonth(month: string): [string, string] {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }
  return [match[1], match[2]];
}

function baseHeaders(referer: string): HeadersInit {
  return {
    accept: "text/xml,application/xml,text/html;q=0.9,*/*;q=0.8",
    "accept-language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    referer,
    "user-agent":
      "Mozilla/5.0 (compatible; korea-memory-price-monitor/0.1; +https://workers.cloudflare.com/)"
  };
}
