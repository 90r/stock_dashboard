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
