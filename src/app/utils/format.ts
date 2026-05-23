export function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatNumber(value: number | null | undefined, mode: "usdKg" | "money" = "money"): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  if (mode === "usdKg") {
    return `$${compactNumber(value)}/kg`;
  }
  return compactNumber(value);
}

export function formatWeight(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "-- kg";
  }
  return `${compactNumber(value)} kg`;
}

export function formatIndex(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(1);
}

export function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 2
  }).format(value);
}

export function round(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return Math.round(value * 100) / 100;
}
