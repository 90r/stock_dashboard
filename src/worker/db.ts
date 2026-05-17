import type { CategoryId, StockSymbol } from "../shared/catalog";
import type { Env } from "./env";
import type { ExchangeRateMonthlyFetchRow } from "./scrapers/exchange-rate";
import type { CustomsTotalFetchResult, DestinationFetchResult } from "./scrapers/kita";
import type { NaverMonthlyRow } from "./scrapers/naver";

export interface CustomsDbRow {
  category: CategoryId;
  month: string;
  scope: "total" | "destination";
  destination_code: string;
  destination_name: string | null;
  hsk_code: string;
  export_usd: number | null;
  export_kg: number | null;
  import_usd: number | null;
  import_kg: number | null;
  unit_usd_per_kg: number | null;
  updated_at: string;
}

export interface StockDbRow {
  symbol: StockSymbol;
  month: string;
  trade_date: string;
  close_krw: number;
  volume: number | null;
  updated_at: string;
}

export interface ExchangeRateDbRow {
  month: string;
  rate_date: string;
  usd_cny: number;
  cny_krw: number;
  source: string;
  updated_at: string;
}

export interface RefreshLogRow {
  status: "success" | "failed" | "running";
  started_at: string;
  finished_at: string | null;
  month_from: string | null;
  month_to: string | null;
  message: string | null;
}

export async function ensureExchangeRateSchema(env: Env): Promise<void> {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS exchange_rate_monthly (
      month TEXT PRIMARY KEY,
      rate_date TEXT NOT NULL,
      usd_cny REAL NOT NULL,
      cny_krw REAL NOT NULL,
      source TEXT NOT NULL DEFAULT 'Frankfurter',
      updated_at TEXT NOT NULL
    )`
  ).run();

  await env.DB.prepare(
    `CREATE INDEX IF NOT EXISTS idx_exchange_rate_monthly_date
      ON exchange_rate_monthly (rate_date)`
  ).run();
}

export async function insertRefreshLog(
  env: Env,
  input: {
    kind: string;
    status: "success" | "failed" | "running";
    startedAt: string;
    finishedAt?: string | null;
    monthFrom?: string | null;
    monthTo?: string | null;
    message?: string | null;
  }
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO refresh_log (kind, status, started_at, finished_at, month_from, month_to, message)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(
      input.kind,
      input.status,
      input.startedAt,
      input.finishedAt ?? null,
      input.monthFrom ?? null,
      input.monthTo ?? null,
      input.message ?? null
    )
    .run();
}

export async function upsertCustomsTotal(env: Env, row: CustomsTotalFetchResult, updatedAt: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO customs_monthly
      (category, month, scope, destination_code, destination_name, hsk_code, export_usd, export_kg, import_usd, import_kg, unit_usd_per_kg, updated_at)
     VALUES (?, ?, 'total', '', NULL, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(category, month, scope, destination_code) DO UPDATE SET
       hsk_code = excluded.hsk_code,
       export_usd = excluded.export_usd,
       export_kg = excluded.export_kg,
       import_usd = excluded.import_usd,
       import_kg = excluded.import_kg,
       unit_usd_per_kg = excluded.unit_usd_per_kg,
       updated_at = excluded.updated_at`
  )
    .bind(
      row.category,
      row.month,
      row.hskCode,
      row.exportUsd,
      row.exportWeight,
      row.importUsd,
      row.importWeight,
      row.unitUsdPerKg,
      updatedAt
    )
    .run();
}

export async function upsertDestination(env: Env, row: DestinationFetchResult, updatedAt: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO customs_monthly
      (category, month, scope, destination_code, destination_name, hsk_code, export_usd, export_kg, import_usd, import_kg, unit_usd_per_kg, updated_at)
     VALUES (?, ?, 'destination', ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(category, month, scope, destination_code) DO UPDATE SET
       destination_name = excluded.destination_name,
       hsk_code = excluded.hsk_code,
       export_usd = excluded.export_usd,
       export_kg = excluded.export_kg,
       import_usd = excluded.import_usd,
       import_kg = excluded.import_kg,
       unit_usd_per_kg = excluded.unit_usd_per_kg,
       updated_at = excluded.updated_at`
  )
    .bind(
      row.category,
      row.month,
      row.countryCode,
      row.countryName,
      row.hskCode,
      row.exportUsd,
      row.exportWeight,
      row.importUsd,
      row.importWeight,
      row.unitUsdPerKg,
      updatedAt
    )
    .run();
}

export async function upsertStockMonthly(
  env: Env,
  symbol: StockSymbol,
  row: NaverMonthlyRow,
  updatedAt: string
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO stock_monthly
      (symbol, month, trade_date, close_krw, volume, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(symbol, month) DO UPDATE SET
       trade_date = excluded.trade_date,
       close_krw = excluded.close_krw,
       volume = excluded.volume,
       updated_at = excluded.updated_at`
  )
    .bind(symbol, row.month, row.date, row.closeKrw, row.volume, updatedAt)
    .run();
}

export async function upsertExchangeRateMonthly(env: Env, row: ExchangeRateMonthlyFetchRow, updatedAt: string): Promise<void> {
  await ensureExchangeRateSchema(env);
  await env.DB.prepare(
    `INSERT INTO exchange_rate_monthly
      (month, rate_date, usd_cny, cny_krw, source, updated_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(month) DO UPDATE SET
       rate_date = excluded.rate_date,
       usd_cny = excluded.usd_cny,
       cny_krw = excluded.cny_krw,
       source = excluded.source,
       updated_at = excluded.updated_at`
  )
    .bind(row.month, row.rateDate, row.usdCny, row.cnyKrw, row.source, updatedAt)
    .run();
}

export async function listCustomsRows(env: Env, monthsBack = 36): Promise<CustomsDbRow[]> {
  const result = await env.DB.prepare(
    `SELECT category, month, scope, destination_code, destination_name, hsk_code,
            export_usd, export_kg, import_usd, import_kg, unit_usd_per_kg, updated_at
     FROM customs_monthly
     WHERE month >= strftime('%Y-%m', date('now', ?))
     ORDER BY month ASC, category ASC, scope ASC, export_usd DESC`
  )
    .bind(`-${monthsBack} months`)
    .all<CustomsDbRow>();

  return result.results ?? [];
}

export async function listStockRows(env: Env, monthsBack = 36): Promise<StockDbRow[]> {
  const result = await env.DB.prepare(
    `SELECT symbol, month, trade_date, close_krw, volume, updated_at
     FROM stock_monthly
     WHERE month >= strftime('%Y-%m', date('now', ?))
     ORDER BY month ASC, symbol ASC`
  )
    .bind(`-${monthsBack} months`)
    .all<StockDbRow>();

  return result.results ?? [];
}

export async function listExchangeRateRows(env: Env, monthsBack = 36): Promise<ExchangeRateDbRow[]> {
  await ensureExchangeRateSchema(env);
  const result = await env.DB.prepare(
    `SELECT month, rate_date, usd_cny, cny_krw, source, updated_at
     FROM exchange_rate_monthly
     WHERE month >= strftime('%Y-%m', date('now', ?))
     ORDER BY month ASC`
  )
    .bind(`-${monthsBack} months`)
    .all<ExchangeRateDbRow>();

  return result.results ?? [];
}

export async function latestRefreshLog(env: Env): Promise<RefreshLogRow | null> {
  const result = await env.DB.prepare(
    `SELECT status, started_at, finished_at, month_from, month_to, message
     FROM refresh_log
     WHERE kind = 'snapshot'
     ORDER BY id DESC
     LIMIT 1`
  ).first<RefreshLogRow>();

  return result ?? null;
}

export async function latestSuccessfulRefreshAt(env: Env): Promise<string | null> {
  const result = await env.DB.prepare(
    `SELECT finished_at
     FROM refresh_log
     WHERE kind = 'snapshot' AND status = 'success'
     ORDER BY id DESC
     LIMIT 1`
  ).first<{ finished_at: string | null }>();

  return result?.finished_at ?? null;
}
