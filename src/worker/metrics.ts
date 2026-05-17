import type { CustomsMonthlyPoint } from "../shared/types";

export const DEFAULT_INDEX_BASE_MONTH = "2024-01";

export function pctChange(current: number | null | undefined, base: number | null | undefined): number | null {
  if (current == null || base == null || base === 0 || !Number.isFinite(current) || !Number.isFinite(base)) {
    return null;
  }
  return ((current - base) / Math.abs(base)) * 100;
}

export function unitUsdPerKg(exportUsd: number | null | undefined, exportWeight: number | null | undefined): number | null {
  if (exportUsd == null || exportWeight == null || exportWeight <= 0) {
    return null;
  }
  return exportUsd / exportWeight;
}

export function previousMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return formatMonth(date);
}

export function addMonths(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 1 + delta, 1));
  return formatMonth(date);
}

export function monthRangeEnding(endMonth: string, count: number): string[] {
  const safeCount = Math.max(1, Math.floor(count));
  const start = addMonths(endMonth, -(safeCount - 1));
  const months: string[] = [];
  let cursor = start;
  while (cursor <= endMonth) {
    months.push(cursor);
    cursor = addMonths(cursor, 1);
  }
  return months;
}

export function formatMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthStartDate(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }
  return `${month}-01`;
}

export function monthEndDate(month: string): string {
  const match = month.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid month: ${month}`);
  }
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  return formatDate(new Date(Date.UTC(year, monthNumber, 0)));
}

export function formatDate(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function lastCompleteCalendarMonth(now = new Date()): string {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  return formatMonth(date);
}

export function withUnitChanges<T extends Pick<CustomsMonthlyPoint, "month" | "unitUsdPerKg">>(
  points: T[]
): Array<T & { momPct: number | null; yoyPct: number | null; priceIndex: number | null }> {
  const byMonth = new Map(points.map((point) => [point.month, point]));
  const ordered = [...points].sort((a, b) => a.month.localeCompare(b.month));
  const baseMonth = unitIndexBaseMonth(points);
  const base = baseMonth ? (byMonth.get(baseMonth)?.unitUsdPerKg ?? null) : null;

  return points.map((point) => {
    const previous = byMonth.get(previousMonth(point.month));
    const lastYear = byMonth.get(addMonths(point.month, -12));
    return {
      ...point,
      momPct: pctChange(point.unitUsdPerKg, previous?.unitUsdPerKg),
      yoyPct: pctChange(point.unitUsdPerKg, lastYear?.unitUsdPerKg),
      priceIndex: base && point.unitUsdPerKg != null ? (point.unitUsdPerKg / base) * 100 : null
    };
  });
}

export function normalizeIndex<T extends { month: string; closeKrw: number }>(rows: T[]): Array<T & { indexValue: number | null }> {
  const ordered = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const baseMonth = stockIndexBaseMonth(rows);
  const base = baseMonth ? (ordered.find((row) => row.month === baseMonth)?.closeKrw ?? null) : null;
  return ordered.map((row) => ({
    ...row,
    indexValue: base ? (row.closeKrw / base) * 100 : null
  }));
}

export function unitIndexBaseMonth<T extends Pick<CustomsMonthlyPoint, "month" | "unitUsdPerKg">>(points: T[]): string | null {
  const ordered = [...points].sort((a, b) => a.month.localeCompare(b.month));
  const preferred = ordered.find((point) => point.month === DEFAULT_INDEX_BASE_MONTH && (point.unitUsdPerKg ?? 0) > 0);
  return preferred?.month ?? ordered.find((point) => (point.unitUsdPerKg ?? 0) > 0)?.month ?? null;
}

export function stockIndexBaseMonth<T extends { month: string; closeKrw: number }>(rows: T[]): string | null {
  const ordered = [...rows].sort((a, b) => a.month.localeCompare(b.month));
  const preferred = ordered.find((row) => row.month === DEFAULT_INDEX_BASE_MONTH && row.closeKrw > 0);
  return preferred?.month ?? ordered.find((row) => row.closeKrw > 0)?.month ?? null;
}
