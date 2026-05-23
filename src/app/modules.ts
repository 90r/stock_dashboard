import { Briefcase, Layers, LayoutDashboard, LineChart as LineChartIcon } from "lucide-react";
import type { CategoryId } from "../shared/catalog";
import type { MainView, ModuleDefinition, ModuleId } from "./appTypes";

export const categoryOrder: CategoryId[] = ["dram", "mcp_hbm", "nand"];

export const memoryViewPaths: Record<MainView, string> = {
  dashboard: "/memory",
  usage: "/memory/usage",
  financials: "/memory/financials",
  transmission: "/memory/transmission",
  earnings: "/memory/earnings"
};

export const moduleDefinitions: ModuleDefinition[] = [
  {
    id: "home",
    path: "/",
    label: "总览",
    shortLabel: "总览",
    eyebrow: "Console",
    description: "全部监控模块的统一入口。",
    icon: LayoutDashboard,
    status: "Overview"
  },
  {
    id: "memory",
    path: "/memory",
    label: "韩国存储价格",
    shortLabel: "存储价格",
    eyebrow: "Live",
    description: "K-stat 单位价值、股价 MoM 与目的地结构。",
    icon: LineChartIcon,
    status: "Live"
  },
  {
    id: "ipo",
    path: "/ipo",
    label: "IPO 监控",
    shortLabel: "IPO",
    eyebrow: "Live IPO",
    description: "港股新股日历、A 股发行动态、募资费用与上市节奏。",
    icon: Briefcase,
    status: "Live"
  },
  {
    id: "watchlist",
    path: "/watchlist",
    label: "更多监控",
    shortLabel: "观察池",
    eyebrow: "Sandbox",
    description: "行业价格、汇率、利率与自定义指标的预留工作台。",
    icon: Layers,
    status: "Queued"
  }
];

export function getModule(moduleId: ModuleId): ModuleDefinition {
  return moduleDefinitions.find((module) => module.id === moduleId) ?? moduleDefinitions[0];
}
