import type { CategoryId, StockSymbol } from "./catalog";

export interface CustomsMonthlyPoint {
  month: string;
  category: CategoryId;
  hskCode: string;
  exportUsd: number | null;
  exportWeight: number | null;
  exportWeightUnit: "g" | "kg";
  importUsd: number | null;
  importWeight: number | null;
  unitUsdPerKg: number | null;
  unitCnyPerKg: number | null;
  momPct: number | null;
  yoyPct: number | null;
  priceIndex: number | null;
}

export interface DestinationPoint {
  month: string;
  category: CategoryId;
  countryCode: string;
  countryName: string;
  exportUsd: number | null;
  exportWeight: number | null;
  exportWeightUnit: "g" | "kg";
  unitUsdPerKg: number | null;
  exportSharePct: number | null;
}

export interface ExchangeRateMonthlyPoint {
  month: string;
  rateDate: string;
  usdCny: number;
  cnyKrw: number;
}

export interface CategorySnapshot {
  id: CategoryId;
  label: string;
  shortLabel: string;
  hskCode: string;
  description: string;
  indexBaseMonth: string | null;
  latest: CustomsMonthlyPoint | null;
  series: CustomsMonthlyPoint[];
  indexSeries: CategoryIndexPoint[];
  destinations: DestinationPoint[];
}

export interface StockMonthlyPoint {
  month: string;
  symbol: StockSymbol;
  company: string;
  tradeDate: string;
  closeKrw: number;
  volume: number | null;
  indexValue: number | null;
  momPct: number | null;
  closeCny: number | null;
}

export interface StockIndexPoint {
  month: string;
  hynixIndex: number | null;
  samsungIndex: number | null;
  hynixMomPct: number | null;
  samsungMomPct: number | null;
  hynixClose: number | null;
  samsungClose: number | null;
  hynixCloseCny: number | null;
  samsungCloseCny: number | null;
}

export interface CategoryIndexPoint {
  month: string;
  priceIndex: number | null;
  priceMomPct: number | null;
  hynixIndex: number | null;
  samsungIndex: number | null;
  hynixMomPct: number | null;
  samsungMomPct: number | null;
  priceCnyPerKg: number | null;
  hynixCloseCny: number | null;
  samsungCloseCny: number | null;
}

export interface RefreshStatus {
  status: "success" | "failed" | "running" | "none";
  startedAt: string | null;
  finishedAt: string | null;
  monthFrom: string | null;
  monthTo: string | null;
  message: string | null;
}

export interface SnapshotResponse {
  generatedAt: string;
  latestMonth: string | null;
  lastSuccessAt: string | null;
  categories: CategorySnapshot[];
  stocks: {
    monthly: StockMonthlyPoint[];
    indexSeries: StockIndexPoint[];
    indexBaseMonths: Partial<Record<StockSymbol, string | null>>;
  };
  exchangeRate: {
    monthly: ExchangeRateMonthlyPoint[];
    source: string;
    note: string;
  };
  refresh: RefreshStatus;
  sources: Array<{
    name: string;
    url: string;
    note: string;
  }>;
}

export interface ApiError {
  error: string;
  detail?: string;
}

export interface IpoCalendarEvent {
  date: string;
  code: string;
  label: string;
}

export interface IpoCalendarItem {
  symbol: string;
  symbolHk: string;
  name: string;
  subscriptionOpen: string | null;
  subscriptionClose: string | null;
  priceFixedDate: string | null;
  allotmentDate: string | null;
  listingDate: string | null;
  listingLabel: string | null;
  aastocksUrl: string | null;
  offerPriceHkd: number | null;
  offerPriceRange: string | null;
  lotSize: number | null;
  entryFeeHkd: number | null;
  events: IpoCalendarEvent[];
}

export interface IpoMarginRecord {
  symbol: string;
  symbolHk: string;
  name: string;
  marginTotalHkdYi: number | null;
  oversubscriptionRatio: number | null;
  brokerTopText: string | null;
  observedAt: string | null;
  scrapedAt: string | null;
  sourceUrl: string | null;
}

export interface AShareIpoIssuanceItem {
  id: number | null;
  projectId: number | null;
  sequenceNo: number | null;
  shareCode: string;
  shareName: string;
  companyChineseName: string;
  place: string;
  board: string;
  issuanceStatus: string;
  pricingMechanism: string;
  issuanceStartDate: string | null;
  listDate: string | null;
  issuancePrice: string | null;
  issuanceNumber: string | null;
  strategicPlacementNumber: string | null;
  peRatio: string | null;
  totalProceeds: string | null;
  issuanceCosts: string | null;
  sponsorshipFee: string | null;
  auditFee: string | null;
  lawyerFee: string | null;
  disclosureFee: string | null;
  processingFee: string | null;
  auditDays: number | null;
  registrationValidDate: string | null;
  issuanceCostsRatio: string | null;
  sponsorshipFeeRatio: string | null;
  auditFeeRatio: string | null;
  lawyerFeeRatio: string | null;
  disclosureFeeRatio: string | null;
  processingFeeRatio: string | null;
  sponsor: string | null;
  accountingFirm: string | null;
  lawFirm: string | null;
  detailUrl: string | null;
}

export interface AShareIpoResponse {
  generatedAt: string;
  source: string;
  sourceUrl: string;
  sourcePageUrl: string;
  timezone: string;
  page: number;
  size: number;
  total: number;
  count: number;
  items: AShareIpoIssuanceItem[];
  filters: {
    board: string;
    issuanceStatus: string;
    sort: string;
    order: string;
  };
  boardCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  error: string | null;
}

export interface IpoTrackerResponse {
  generatedAt: string;
  generatedAtUtc: string | null;
  source: string;
  sourceUrl: string;
  sourcePageUrl: string;
  timezone: string;
  grid: {
    startDate: string | null;
    endDate: string | null;
    dates: string[];
  };
  eventLegend: Record<string, { en?: string; zh?: string; "zh-hk"?: string }>;
  ipos: IpoCalendarItem[];
  count: number;
  margin: {
    generatedAt: string | null;
    source: string;
    sourceUrl: string;
    count: number;
    records: IpoMarginRecord[];
  };
  aShare?: AShareIpoResponse | null;
}
