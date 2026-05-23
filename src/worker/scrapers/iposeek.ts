import type { AShareIpoIssuanceItem, AShareIpoResponse } from "../../shared/types";
import { fetchTextWithRetry, type Fetcher } from "./http";

const IPOSEEK_BASE_URL = "https://www.iposeek.com";
const IPOSEEK_NEW_STOCK_PAGE_URL = `${IPOSEEK_BASE_URL}/ipo-review/new-stock`;
const IPOSEEK_NEW_STOCK_API_URL = `${IPOSEEK_BASE_URL}/aipo/api/v1/newShareIssuanceInfos`;
const IPOSEEK_REFRESH_TOKEN_URL = `${IPOSEEK_BASE_URL}/api/auth/refresh-token`;

const DEFAULT_QUERY = {
  board: "全部",
  issuanceStatus: "全部",
  keyword: "",
  page: "1",
  size: "20",
  sort: "issuanceStartDate",
  order: "desc"
};

interface IpoSeekAuth {
  cookie?: string;
  accessToken?: string;
  deviceFingerprint?: string;
}

interface RawIpoSeekListResponse {
  rows?: RawIpoSeekItem[];
  total?: number;
  message?: string;
  errorCode?: string;
}

interface RawIpoSeekRefreshResponse {
  access_token?: string;
  expires_in?: number;
}

interface RawIpoSeekItem {
  sequenceNo?: number | null;
  id?: number | null;
  projectId?: number | null;
  shareCode?: string | null;
  shareName?: string | null;
  place?: string | null;
  board?: string | null;
  companyChineseName?: string | null;
  issuanceStartDate?: string | null;
  pricingMechanism?: string | null;
  issuanceStatus?: string | null;
  listDate?: string | null;
  issuancePrice?: string | null;
  issuanceNumber?: string | null;
  strategicPlacementNumber?: string | null;
  peRatio?: string | null;
  totalProceeds?: string | null;
  issuanceCosts?: string | null;
  sponsorshipFee?: string | null;
  auditFee?: string | null;
  lawyerFee?: string | null;
  disclosureFee?: string | null;
  processingFee?: string | null;
  auditDays?: number | null;
  registrationValidDate?: string | null;
  issuanceCostsRatio?: string | null;
  sponsorshipFeeRatio?: string | null;
  auditFeeRatio?: string | null;
  lawyerFeeRatio?: string | null;
  disclosureFeeRatio?: string | null;
  processingFeeRatio?: string | null;
  sponsor?: string | null;
  accountingFirm?: string | null;
  lawFirm?: string | null;
}

export async function fetchIpoSeekNewStock(
  auth: IpoSeekAuth = {},
  fetcher: Fetcher = fetch
): Promise<AShareIpoResponse> {
  const generatedAt = new Date().toISOString();
  const query = new URLSearchParams(DEFAULT_QUERY);
  const refreshedAccessToken = auth.cookie ? await refreshIpoSeekAccessToken(fetcher, auth).catch(() => null) : null;
  const headers = buildIpoSeekHeaders({
    ...auth,
    accessToken: refreshedAccessToken ?? auth.accessToken
  });

  const [listText, boardCounts, statusCounts] = await Promise.all([
    fetchTextWithRetry(fetcher, `${IPOSEEK_NEW_STOCK_API_URL}?${query.toString()}`, { headers }, { timeoutMs: 15_000, retries: 1, retryDelayMs: 600 }),
    fetchIpoSeekCounts(fetcher, `${IPOSEEK_NEW_STOCK_API_URL}/boardCounts?keyword=`, headers),
    fetchIpoSeekCounts(fetcher, `${IPOSEEK_NEW_STOCK_API_URL}/issuanceStatusCounts?board=${encodeURIComponent(DEFAULT_QUERY.board)}&keyword=`, headers)
  ]);

  const parsed = parseIpoSeekListJson(listText);
  if (!Array.isArray(parsed.rows)) {
    throw new Error(parsed.message || "IpoSeek new stock response did not include rows");
  }

  const items = parsed.rows.map(normalizeIpoSeekItem);
  return {
    generatedAt,
    source: "投行之声",
    sourceUrl: IPOSEEK_NEW_STOCK_API_URL,
    sourcePageUrl: IPOSEEK_NEW_STOCK_PAGE_URL,
    timezone: "Asia/Shanghai",
    page: Number(DEFAULT_QUERY.page),
    size: Number(DEFAULT_QUERY.size),
    total: parsed.total ?? items.length,
    count: items.length,
    items,
    filters: {
      board: DEFAULT_QUERY.board,
      issuanceStatus: DEFAULT_QUERY.issuanceStatus,
      sort: DEFAULT_QUERY.sort,
      order: DEFAULT_QUERY.order
    },
    boardCounts,
    statusCounts,
    error: null
  };
}

export function emptyIpoSeekNewStock(error: string | null = null): AShareIpoResponse {
  return {
    generatedAt: new Date().toISOString(),
    source: "投行之声",
    sourceUrl: IPOSEEK_NEW_STOCK_API_URL,
    sourcePageUrl: IPOSEEK_NEW_STOCK_PAGE_URL,
    timezone: "Asia/Shanghai",
    page: Number(DEFAULT_QUERY.page),
    size: Number(DEFAULT_QUERY.size),
    total: 0,
    count: 0,
    items: [],
    filters: {
      board: DEFAULT_QUERY.board,
      issuanceStatus: DEFAULT_QUERY.issuanceStatus,
      sort: DEFAULT_QUERY.sort,
      order: DEFAULT_QUERY.order
    },
    boardCounts: {},
    statusCounts: {},
    error
  };
}

export function parseIpoSeekListJson(json: string): RawIpoSeekListResponse {
  const parsed = JSON.parse(json) as RawIpoSeekListResponse;
  if (parsed.errorCode || parsed.message) {
    throw new Error(parsed.message || `IpoSeek API error ${parsed.errorCode}`);
  }
  return parsed;
}

function buildIpoSeekHeaders(auth: IpoSeekAuth): HeadersInit {
  const cookieAccessToken = extractCookieValue(auth.cookie, "access_token");
  const accessToken = auth.accessToken || cookieAccessToken;
  const headers: Record<string, string> = {
    accept: "application/json, text/plain, */*",
    "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
    referer: IPOSEEK_NEW_STOCK_PAGE_URL,
    "user-agent":
      "Mozilla/5.0 (compatible; stock-dashboard/0.1; +https://stock.789567.xyz) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "x-device-fingerprint": auth.deviceFingerprint || "stock-dashboard-worker"
  };

  if (auth.cookie) {
    headers.cookie = auth.cookie;
  }
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function refreshIpoSeekAccessToken(fetcher: Fetcher, auth: IpoSeekAuth): Promise<string | null> {
  if (!auth.cookie?.includes("refresh_token=")) {
    return null;
  }

  const response = await fetcher(IPOSEEK_REFRESH_TOKEN_URL, {
    method: "POST",
    headers: {
      accept: "application/json, text/plain, */*",
      "accept-language": "zh-CN,zh;q=0.9,en;q=0.8",
      "content-type": "application/json",
      cookie: auth.cookie,
      referer: IPOSEEK_NEW_STOCK_PAGE_URL,
      "user-agent":
        "Mozilla/5.0 (compatible; stock-dashboard/0.1; +https://stock.789567.xyz) AppleWebKit/537.36 Chrome/126 Safari/537.36",
      "x-device-fingerprint": auth.deviceFingerprint || "stock-dashboard-worker"
    },
    body: "{}"
  });

  if (!response.ok) {
    return null;
  }

  const parsed = (await response.json()) as RawIpoSeekRefreshResponse;
  return parsed.access_token ?? null;
}

async function fetchIpoSeekCounts(fetcher: Fetcher, url: string, headers: HeadersInit): Promise<Record<string, number>> {
  try {
    const text = await fetchTextWithRetry(fetcher, url, { headers }, { timeoutMs: 10_000, retries: 1, retryDelayMs: 400 });
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, value]) => [key, Number(value)])
        .filter(([, value]) => Number.isFinite(value))
    );
  } catch {
    return {};
  }
}

function normalizeIpoSeekItem(raw: RawIpoSeekItem): AShareIpoIssuanceItem {
  const id = raw.id ?? null;
  const place = cleanText(raw.place) ?? "";
  const board = cleanText(raw.board) ?? "";
  const status = cleanText(raw.issuanceStatus) ?? "";

  return {
    id,
    projectId: raw.projectId ?? null,
    sequenceNo: raw.sequenceNo ?? null,
    shareCode: cleanText(raw.shareCode) ?? "",
    shareName: cleanText(raw.shareName) ?? "",
    companyChineseName: cleanText(raw.companyChineseName) ?? "",
    place,
    board,
    issuanceStatus: status === "启动发行" ? "发行中" : status,
    pricingMechanism: cleanText(raw.pricingMechanism) ?? "",
    issuanceStartDate: cleanText(raw.issuanceStartDate),
    listDate: cleanText(raw.listDate),
    issuancePrice: cleanDash(raw.issuancePrice),
    issuanceNumber: cleanDash(raw.issuanceNumber),
    strategicPlacementNumber: cleanDash(raw.strategicPlacementNumber),
    peRatio: cleanDash(raw.peRatio),
    totalProceeds: cleanDash(raw.totalProceeds),
    issuanceCosts: cleanDash(raw.issuanceCosts),
    sponsorshipFee: cleanDash(raw.sponsorshipFee),
    auditFee: cleanDash(raw.auditFee),
    lawyerFee: cleanDash(raw.lawyerFee),
    disclosureFee: cleanDash(raw.disclosureFee),
    processingFee: cleanDash(raw.processingFee),
    auditDays: raw.auditDays ?? null,
    registrationValidDate: cleanText(raw.registrationValidDate),
    issuanceCostsRatio: cleanDash(raw.issuanceCostsRatio),
    sponsorshipFeeRatio: cleanDash(raw.sponsorshipFeeRatio),
    auditFeeRatio: cleanDash(raw.auditFeeRatio),
    lawyerFeeRatio: cleanDash(raw.lawyerFeeRatio),
    disclosureFeeRatio: cleanDash(raw.disclosureFeeRatio),
    processingFeeRatio: cleanDash(raw.processingFeeRatio),
    sponsor: cleanText(raw.sponsor),
    accountingFirm: cleanText(raw.accountingFirm),
    lawFirm: cleanText(raw.lawFirm),
    detailUrl: id == null ? null : `${IPOSEEK_NEW_STOCK_PAGE_URL}/${id}?tag1=${encodeURIComponent(place)}&tag2=${encodeURIComponent(board)}${status ? `&tag3=${encodeURIComponent(status)}` : ""}`
  };
}

function cleanText(value: string | null | undefined): string | null {
  const text = value?.trim();
  return text ? text : null;
}

function cleanDash(value: string | null | undefined): string | null {
  const text = cleanText(value);
  return !text || text === "-" ? null : text;
}

function extractCookieValue(cookie: string | undefined, key: string): string | null {
  if (!cookie) {
    return null;
  }

  for (const segment of cookie.split(";")) {
    const [rawName, ...rawValue] = segment.trim().split("=");
    if (rawName === key) {
      return rawValue.join("=") || null;
    }
  }
  return null;
}
