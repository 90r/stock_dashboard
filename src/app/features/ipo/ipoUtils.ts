import type { AShareIpoResponse, IpoCalendarItem, IpoMarginRecord, IpoTrackerResponse } from "../../../shared/types";
import type { IpoFilter, IpoStage } from "./ipoTypes";

export function currentHongKongDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

export function getIpoReferenceDate(tracker: IpoTrackerResponse): string {
  const sourceDate = tracker.generatedAtUtc ?? tracker.generatedAt;
  const match = sourceDate.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? currentHongKongDate();
}

export function getIpoStage(ipo: IpoCalendarItem, today: string): IpoStage {
  if (isDateInRange(today, ipo.subscriptionOpen, ipo.subscriptionClose)) {
    return { label: "招股中", tone: "live" };
  }
  if (ipo.subscriptionOpen && today < ipo.subscriptionOpen) {
    return { label: "未招股", tone: "queued" };
  }
  if (ipo.allotmentDate && today <= ipo.allotmentDate) {
    return { label: "等中签", tone: "design" };
  }
  if (ipo.listingDate && today <= ipo.listingDate) {
    return { label: "待上市", tone: "design" };
  }
  return { label: "已挂牌", tone: "done" };
}

export function filterIpos(ipos: IpoCalendarItem[], filter: IpoFilter, stageBySymbol: Map<string, IpoStage>): IpoCalendarItem[] {
  if (filter === "all") {
    return ipos;
  }
  return ipos.filter((ipo) => {
    const stage = stageBySymbol.get(ipo.symbol)?.label;
    if (filter === "open") {
      return stage === "招股中";
    }
    if (filter === "upcoming") {
      return stage === "待上市" || stage === "等中签" || stage === "已公布";
    }
    return stage === "已挂牌";
  });
}

export function isDateInRange(date: string, start: string | null, end: string | null): boolean {
  return !!start && !!end && date >= start && date <= end;
}

export function buildAllocationEstimates(record: IpoMarginRecord, ipo?: IpoCalendarItem) {
  const aTailLots = ipo?.entryFeeHkd != null ? Math.max(1, Math.floor(5_000_000 / ipo.entryFeeHkd)) : 1000;
  const bHeadLots = aTailLots + 1;
  const candidates = [
    { label: "1手", lots: 1 },
    { label: "甲尾", lots: aTailLots },
    { label: "乙头", lots: bHeadLots },
    { label: "乙1", lots: bHeadLots * 2 },
    { label: "乙2", lots: bHeadLots * 3 },
    { label: "乙3", lots: bHeadLots * 4 },
    { label: "乙4", lots: bHeadLots * 5 }
  ];

  return candidates.map((candidate) => ({
    ...candidate,
    result: estimateAllocation(candidate.lots, record.oversubscriptionRatio).result
  }));
}

export function estimateAllocation(lots: number, oversubscriptionRatio: number | null | undefined) {
  if (!Number.isFinite(lots) || lots <= 0 || oversubscriptionRatio == null || !Number.isFinite(oversubscriptionRatio) || oversubscriptionRatio <= 0) {
    return { raw: null, result: "--" };
  }

  const raw = lots / oversubscriptionRatio;
  const adjusted = adjustAllocationEstimate(raw, lots);
  if (adjusted >= 1) {
    return { raw: adjusted, result: `${adjusted.toFixed(adjusted >= 10 ? 1 : 2)} 手` };
  }
  return { raw: adjusted, result: `${Math.max(adjusted * 100, 0.01).toFixed(adjusted * 100 >= 10 ? 1 : 2)}%` };
}

export function adjustAllocationEstimate(raw: number, lots: number): number {
  if (lots === 1) {
    return raw * 2.35;
  }
  if (raw >= 1) {
    return raw;
  }
  if (raw >= 0.7) {
    return raw * 0.685;
  }
  if (raw >= 0.25) {
    return raw * 0.87;
  }
  return raw * 0.93;
}

export function getCashBackDate(ipo: IpoCalendarItem): string | null {
  return addDays(ipo.allotmentDate, -1);
}

export function getDarkMarketDate(ipo: IpoCalendarItem): string | null {
  return addDays(ipo.listingDate, -1);
}

export function addDays(date: string | null | undefined, days: number): string | null {
  if (!date) {
    return null;
  }
  const value = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function buildDateWindow(center: string, days: number): string[] {
  const start = addDays(center, -Math.floor(days / 2)) ?? center;
  return Array.from({ length: days }, (_, index) => addDays(start, index) ?? center);
}

export function formatTimelineDate(value: string): string {
  const match = value.match(/^\d{4}-(\d{2})-(\d{2})$/);
  return match ? `${Number(match[1])}/${Number(match[2])}` : value;
}

export function formatWeekday(value: string): string {
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return new Intl.DateTimeFormat("zh-CN", { weekday: "short", timeZone: "UTC" }).format(date).replace("周", "");
}

export function clampNumber(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${Math.round(value).toLocaleString("zh-CN")}x`;
}

export function formatHkd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `HK$${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

export function formatHkdYi(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: value >= 100 ? 0 : 2 })} 亿`;
}

export function formatLotSize(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN")} 股`;
}

export function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "--";
  }
  return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[3]}`;
  }
  return value;
}

export function formatHongKongDateTime(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function formatShanghaiDateTime(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

export function formatEventLabel(code: string, legend: IpoTrackerResponse["eventLegend"]): string {
  return code
    .split(",")
    .map((part) => legend[part]?.zh ?? legend[part]?.en ?? part)
    .join(" / ");
}

export function getAShareStage(status: string): IpoStage {
  if (status === "发行中" || status === "启动发行") {
    return { label: "发行中", tone: "live" };
  }
  if (status === "发行成功") {
    return { label: "发行成功", tone: "done" };
  }
  if (status === "发行失败") {
    return { label: "发行失败", tone: "queued" };
  }
  return { label: status || "--", tone: "design" };
}

export function getAShareStatusCount(aShare: AShareIpoResponse | null | undefined, status: string): number {
  return aShare?.statusCounts[status] ?? 0;
}

export function formatCount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return value.toLocaleString("zh-CN");
}

export function parseWanText(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const numeric = Number(value.replace(/,/g, "").replace(/%$/, ""));
  return Number.isFinite(numeric) ? numeric : null;
}

export function sumWanAmount(values: Array<string | null | undefined>): number | null {
  const numbers = values.map(parseWanText).filter((value): value is number => value != null);
  if (numbers.length === 0) {
    return null;
  }
  return numbers.reduce((sum, value) => sum + value, 0);
}

export function averageNumber(values: Array<number | null | undefined>): number | null {
  const numbers = values.filter((value): value is number => value != null && Number.isFinite(value));
  if (numbers.length === 0) {
    return null;
  }
  return Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10;
}

export function maxPctTextValue(values: Array<string | null | undefined>): number | null {
  const numbers = values.map(parseWanText).filter((value): value is number => value != null);
  if (numbers.length === 0) {
    return null;
  }
  return Math.max(...numbers);
}

export function formatWanAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  if (value >= 10_000) {
    return `${(value / 10_000).toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 亿`;
  }
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 0 })} 万`;
}

export function formatWanText(value: string | null | undefined): string {
  return formatWanAmount(parseWanText(value));
}

export function formatPercentPoint(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}%`;
}

export function formatDays(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: 1 })} 天`;
}
