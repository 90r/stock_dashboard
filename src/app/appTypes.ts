import type { LucideIcon } from "lucide-react";
import type { IpoTrackerResponse, SnapshotResponse } from "../shared/types";

export type LoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: SnapshotResponse; error: null }
  | { status: "error"; data: null; error: string };

export type IpoLoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: IpoTrackerResponse; error: null }
  | { status: "error"; data: null; error: string };

export type ModuleId = "home" | "memory" | "ipo" | "watchlist";
export type MainView = "dashboard" | "usage" | "financials" | "transmission" | "earnings";

export interface AppRoute {
  module: ModuleId;
  memoryView: MainView;
}

export interface ModuleDefinition {
  id: ModuleId;
  path: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  status: string;
}
