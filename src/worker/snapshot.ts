import { CATEGORIES, STOCKS, type CategoryId, type StockSymbol } from "../shared/catalog";
import type {
  CategoryIndexPoint,
  CategorySnapshot,
  CustomsMonthlyPoint,
  DestinationPoint,
  ExchangeRateMonthlyPoint,
  SnapshotResponse,
  StockIndexPoint,
  StockMonthlyPoint
} from "../shared/types";
import {
  latestRefreshLog,
  latestSuccessfulRefreshAt,
  listCustomsRows,
  listExchangeRateRows,
  listStockRows,
  type CustomsDbRow,
  type ExchangeRateDbRow
} from "./db";
import type { Env } from "./env";
import { normalizeIndex, pctChange, stockIndexBaseMonth, unitIndexBaseMonth, withUnitChanges } from "./metrics";

export async function buildSnapshot(env: Env): Promise<SnapshotResponse> {
  const [customsRows, stockRows, refresh, lastSuccessAt] = await Promise.all([
    listCustomsRows(env, 48),
    listStockRows(env, 48),
    latestRefreshLog(env),
    latestSuccessfulRefreshAt(env)
  ]);
  const exchangeRateMonthly = buildExchangeRateMonthly(await listExchangeRateRows(env, 48));
  const exchangeRateByMonth = new Map(exchangeRateMonthly.map((row) => [row.month, row]));

  const totalRows = customsRows.filter((row) => row.scope === "total");
  const latestMonth = totalRows.reduce<string | null>((latest, row) => (!latest || row.month > latest ? row.month : latest), null);

  const stockMonthly = buildStockMonthly(stockRows, exchangeRateByMonth);
  const stockIndexSeries = buildStockIndexSeries(stockMonthly);
  const stockIndexBaseMonths = buildStockIndexBaseMonths(stockRows);

  const categories: CategorySnapshot[] = CATEGORIES.map((category) => {
    const categoryRows = totalRows
      .filter((row) => row.category === category.id)
      .sort((a, b) => a.month.localeCompare(b.month));
    const series = withUnitChanges(categoryRows.map((row) => toCustomsPoint(row, exchangeRateByMonth.get(row.month))));
    const indexBaseMonth = unitIndexBaseMonth(series);
    const latest = latestMonth ? series.find((point) => point.month === latestMonth) ?? series.at(-1) ?? null : series.at(-1) ?? null;

    return {
      id: category.id,
      label: category.label,
      shortLabel: category.shortLabel,
      hskCode: category.hskCode,
      description: category.description,
      indexBaseMonth,
      latest,
      series,
      indexSeries: buildCategoryIndexSeries({ series }, stockIndexSeries),
      destinations: buildDestinationRows(customsRows, category.id, latest?.month ?? latestMonth)
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    latestMonth,
    lastSuccessAt,
    categories,
    stocks: {
      monthly: stockMonthly,
      indexSeries: stockIndexSeries,
      indexBaseMonths: stockIndexBaseMonths
    },
    exchangeRate: {
      monthly: exchangeRateMonthly,
      source: "Frankfurter / currency-api",
      note: "无 Key 汇率源；USD/CNY 为 1 美元兑人民币，CNY/KRW 为 1 人民币兑韩元，月度值取当月最后一个可用日期。"
    },
    refresh: refresh
      ? {
          status: refresh.status,
          startedAt: refresh.started_at,
          finishedAt: refresh.finished_at,
          monthFrom: refresh.month_from,
          monthTo: refresh.month_to,
          message: refresh.message
        }
      : {
          status: "none",
          startedAt: null,
          finishedAt: null,
          monthFrom: null,
          monthTo: null,
          message: null
        },
    sources: [
      {
        name: "K-stat / KITA",
        url: "https://stat.kita.net/stat/kts/pum/ItemImpExpList.screen",
        note: "网页端 IBSheet 数据；页面标注提供机构为韩国关税厅。"
      },
      {
        name: "Naver Finance",
        url: "https://finance.naver.com/item/sise_day.naver?code=000660&page=1",
        note: "日线 HTML 表格；月度值取每月最后一个可用交易日收盘价。"
      },
      {
        name: "Frankfurter / currency-api",
        url: "https://api.frankfurter.dev/",
        note: "无 Key 汇率接口；Frankfurter 不可用时回退到 jsDelivr currency-api 历史文件。"
      }
    ]
  };
}

function toCustomsPoint(row: CustomsDbRow, exchangeRate?: ExchangeRateMonthlyPoint): CustomsMonthlyPoint {
  return {
    month: row.month,
    category: row.category,
    hskCode: row.hsk_code,
    exportUsd: row.export_usd,
    exportWeight: row.export_kg,
    exportWeightUnit: "kg",
    importUsd: row.import_usd,
    importWeight: row.import_kg,
    unitUsdPerKg: row.unit_usd_per_kg,
    unitCnyPerKg: row.unit_usd_per_kg != null && exchangeRate ? row.unit_usd_per_kg * exchangeRate.usdCny : null,
    momPct: null,
    yoyPct: null,
    priceIndex: null
  };
}

function buildDestinationRows(rows: CustomsDbRow[], category: CategoryId, month: string | null): DestinationPoint[] {
  if (!month) {
    return [];
  }

  const destinationRows = rows
    .filter((row) => row.category === category && row.scope === "destination" && row.month === month)
    .sort((a, b) => (b.export_usd ?? 0) - (a.export_usd ?? 0));

  const totalExport = destinationRows.reduce((sum, row) => sum + (row.export_usd ?? 0), 0);

  return destinationRows.slice(0, 20).map((row) => ({
    month: row.month,
    category: row.category,
    countryCode: row.destination_code,
    countryName: row.destination_name ?? row.destination_code,
    exportUsd: row.export_usd,
    exportWeight: row.export_kg,
    exportWeightUnit: "kg",
    unitUsdPerKg: row.unit_usd_per_kg,
    exportSharePct: totalExport > 0 && row.export_usd != null ? (row.export_usd / totalExport) * 100 : null
  }));
}

function buildStockMonthly(
  rows: Array<{
    symbol: StockSymbol;
    month: string;
    trade_date: string;
    close_krw: number;
    volume: number | null;
  }>,
  exchangeRateByMonth: Map<string, ExchangeRateMonthlyPoint>
): StockMonthlyPoint[] {
  const bySymbol = new Map<StockSymbol, typeof rows>();
  for (const row of rows) {
    bySymbol.set(row.symbol, [...(bySymbol.get(row.symbol) ?? []), row]);
  }

  const result: StockMonthlyPoint[] = [];
  for (const stock of STOCKS) {
    const sourceRows = (bySymbol.get(stock.symbol) ?? []).map((row) => ({
      symbol: row.symbol,
      month: row.month,
      tradeDate: row.trade_date,
      closeKrw: row.close_krw,
      volume: row.volume
    }));
    const normalized = normalizeIndex(sourceRows);
    result.push(
      ...normalized.map((row, index) => ({
        month: row.month,
        symbol: row.symbol,
        company: stock.company,
        tradeDate: row.tradeDate,
        closeKrw: row.closeKrw,
        volume: row.volume,
        indexValue: row.indexValue,
        momPct: pctChange(row.closeKrw, normalized[index - 1]?.closeKrw),
        closeCny: krwToCny(row.closeKrw, exchangeRateByMonth.get(row.month))
      }))
    );
  }

  return result.sort((a, b) => a.month.localeCompare(b.month) || a.symbol.localeCompare(b.symbol));
}

function buildStockIndexSeries(rows: StockMonthlyPoint[]): StockIndexPoint[] {
  const byMonth = new Map<string, StockIndexPoint>();

  for (const row of rows) {
    const point =
      byMonth.get(row.month) ??
      ({
        month: row.month,
        hynixIndex: null,
        samsungIndex: null,
        hynixMomPct: null,
        samsungMomPct: null,
        hynixClose: null,
        samsungClose: null,
        hynixCloseCny: null,
        samsungCloseCny: null
      } satisfies StockIndexPoint);

    if (row.symbol === "000660") {
      point.hynixIndex = row.indexValue;
      point.hynixMomPct = row.momPct;
      point.hynixClose = row.closeKrw;
      point.hynixCloseCny = row.closeCny;
    }
    if (row.symbol === "005930") {
      point.samsungIndex = row.indexValue;
      point.samsungMomPct = row.momPct;
      point.samsungClose = row.closeKrw;
      point.samsungCloseCny = row.closeCny;
    }
    byMonth.set(row.month, point);
  }

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function buildStockIndexBaseMonths(
  rows: Array<{
    symbol: StockSymbol;
    month: string;
    close_krw: number;
  }>
): Partial<Record<StockSymbol, string | null>> {
  const result: Partial<Record<StockSymbol, string | null>> = {};
  for (const stock of STOCKS) {
    const sourceRows = rows.filter((row) => row.symbol === stock.symbol).map((row) => ({ month: row.month, closeKrw: row.close_krw }));
    result[stock.symbol] = stockIndexBaseMonth(sourceRows);
  }
  return result;
}

export function buildCategoryIndexSeries(
  category: Pick<CategorySnapshot, "series">,
  stockIndexSeries: StockIndexPoint[]
): CategoryIndexPoint[] {
  const stockByMonth = new Map(stockIndexSeries.map((point) => [point.month, point]));
  return category.series.map((point) => {
    const stock = stockByMonth.get(point.month);
    return {
      month: point.month,
      priceIndex: point.priceIndex,
      priceMomPct: point.momPct,
      hynixIndex: stock?.hynixIndex ?? null,
      samsungIndex: stock?.samsungIndex ?? null,
      hynixMomPct: stock?.hynixMomPct ?? null,
      samsungMomPct: stock?.samsungMomPct ?? null,
      priceCnyPerKg: point.unitCnyPerKg,
      hynixCloseCny: stock?.hynixCloseCny ?? null,
      samsungCloseCny: stock?.samsungCloseCny ?? null
    };
  });
}

function buildExchangeRateMonthly(rows: ExchangeRateDbRow[]): ExchangeRateMonthlyPoint[] {
  return rows.map((row) => ({
    month: row.month,
    rateDate: row.rate_date,
    usdCny: row.usd_cny,
    cnyKrw: row.cny_krw
  }));
}

function krwToCny(value: number | null | undefined, exchangeRate: ExchangeRateMonthlyPoint | undefined): number | null {
  if (value == null || !exchangeRate || exchangeRate.cnyKrw <= 0) {
    return null;
  }
  return value / exchangeRate.cnyKrw;
}
