import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Database,
  Factory,
  FileText,
  HelpCircle,
  LineChart as LineChartIcon,
  RefreshCw,
  Scale,
  TrendingUp
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { TickItem } from "recharts/types/util/types";
import type { CategoryId } from "../shared/catalog";
import type { ApiError, CategorySnapshot, SnapshotResponse } from "../shared/types";

type LoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: SnapshotResponse; error: null }
  | { status: "error"; data: null; error: string };

const categoryOrder: CategoryId[] = ["dram", "mcp_hbm", "nand"];
type MainView = "dashboard" | "usage" | "financials" | "transmission" | "earnings";

export default function App() {
  const [state, setState] = useState<LoadState>({ status: "loading", data: null, error: null });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("dram");
  const [mainView, setMainView] = useState<MainView>("dashboard");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/snapshot")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as Partial<ApiError> | null;
          throw new Error(body?.detail || body?.error || `HTTP ${response.status}`);
        }
        return response.json() as Promise<SnapshotResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setState({ status: "ready", data, error: null });
          const firstWithData = categoryOrder.find((id) => data.categories.find((category) => category.id === id)?.latest);
          if (firstWithData) {
            setSelectedCategory(firstWithData);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setState({ status: "error", data: null, error: error instanceof Error ? error.message : String(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "loading") {
    return <Shell body={<Loading />} />;
  }

  if (state.status === "error") {
    return <Shell body={<ErrorState message={state.error} />} />;
  }

  const snapshot = state.data;
  const category = snapshot.categories.find((item) => item.id === selectedCategory) ?? snapshot.categories[0];
  const content =
    mainView === "dashboard" ? (
      <DashboardView
        snapshot={snapshot}
        category={category}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
    ) : mainView === "usage" ? (
      <UsageView />
    ) : mainView === "financials" ? (
      <FinancialsView snapshot={snapshot} />
    ) : mainView === "transmission" ? (
      <TransmissionView snapshot={snapshot} />
    ) : (
      <EarningsView snapshot={snapshot} />
    );

  return (
    <Shell
      latestMonth={snapshot.latestMonth}
      lastSuccessAt={snapshot.lastSuccessAt}
      refreshStatus={snapshot.refresh.status}
      body={
        <>
          <MainNav active={mainView} onChange={setMainView} />
          {snapshot.refresh.status === "failed" && (
            <div className="banner" role="status">
              <AlertTriangle size={18} />
              <span>{snapshot.refresh.message ?? "最近一次刷新失败，当前页面显示上次成功缓存。"}</span>
            </div>
          )}
          {content}

          <footer className="footnote">
            <p>指标为韩国出口单位价值 USD/kg，由 K-stat 网页端的出口金额与出口重量计算；不是 HBM 官方报价，也不是公司 ASP。</p>
            <p>数据源：K-stat/KITA（韩国关税厅口径）、Naver Finance。抓取失败时保留旧缓存并记录刷新状态。</p>
          </footer>
        </>
      }
    />
  );
}

function DashboardView({
  snapshot,
  category,
  selectedCategory,
  setSelectedCategory
}: {
  snapshot: SnapshotResponse;
  category: CategorySnapshot;
  selectedCategory: CategoryId;
  setSelectedCategory: (category: CategoryId) => void;
}) {
  return (
    <>
          <section className="kpi-grid" aria-label="category key metrics">
            {snapshot.categories.map((item) => (
              <KpiCard key={item.id} category={item} selected={item.id === selectedCategory} onSelect={() => setSelectedCategory(item.id)} />
            ))}
          </section>

          <section className="workspace">
            <div className="panel chart-panel">
              <div className="panel-head">
                <div>
                  <p className="eyebrow">{category.description}</p>
                  <h2>{category.label}</h2>
                </div>
                <div className="tabs" role="tablist" aria-label="category">
                  {snapshot.categories.map((item) => (
                    <button
                      key={item.id}
                      className={item.id === selectedCategory ? "tab active" : "tab"}
                      type="button"
                      onClick={() => setSelectedCategory(item.id)}
                    >
                      {item.shortLabel}
                    </button>
                  ))}
                </div>
              </div>
              <UnitValueChart category={category} />
            </div>

            <div className="panel">
              <div className="panel-head compact">
                <div>
                  <p className="eyebrow">出口重量</p>
                  <h2>Monthly kg</h2>
                </div>
                <Scale size={20} />
              </div>
              <WeightChart category={category} />
            </div>
          </section>

          <section className="workspace lower">
            <div className="panel chart-panel">
              <div className="panel-head compact">
                <div>
                  <p className="eyebrow">月度涨跌幅对比</p>
                  <h2>{category.shortLabel} MoM</h2>
                </div>
                <TrendingUp size={20} />
              </div>
              <CategoryIndexChart category={category} />
              <p className="chart-note">
                每条线都是相对上个月的涨跌幅：{category.shortLabel} 为出口单位价值 MoM，SK hynix / Samsung 为月末收盘价 MoM。
              </p>
            </div>

            <div className="panel">
              <div className="panel-head compact">
                <div>
                  <p className="eyebrow">目的地拆分</p>
                  <h2>MCP-HBM proxy</h2>
                </div>
                <Database size={20} />
              </div>
              <DestinationSplit category={snapshot.categories.find((item) => item.id === "mcp_hbm")} />
            </div>
          </section>
    </>
  );
}

function MainNav({ active, onChange }: { active: MainView; onChange: (view: MainView) => void }) {
  const items: Array<{ id: MainView; label: string; icon: React.ReactNode }> = [
    { id: "dashboard", label: "价格看板", icon: <LineChartIcon size={16} /> },
    { id: "usage", label: "使用说明", icon: <HelpCircle size={16} /> },
    { id: "financials", label: "公司财务关联", icon: <FileText size={16} /> },
    { id: "transmission", label: "下游价格传导", icon: <Factory size={16} /> },
    { id: "earnings", label: "价格→业绩", icon: <TrendingUp size={16} /> }
  ];

  return (
    <nav className="main-nav" aria-label="sections">
      {items.map((item) => (
        <button key={item.id} type="button" className={active === item.id ? "main-nav-item active" : "main-nav-item"} onClick={() => onChange(item.id)}>
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}

function Shell({
  body,
  latestMonth,
  lastSuccessAt,
  refreshStatus
}: {
  body: React.ReactNode;
  latestMonth?: string | null;
  lastSuccessAt?: string | null;
  refreshStatus?: string;
}) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Korea Customs Memory Monitor</p>
          <h1>韩国存储价格监控器</h1>
        </div>
        <div className="status-strip" aria-label="data status">
          <StatusPill icon={<CalendarDays size={16} />} label="最新月份" value={latestMonth ?? "--"} />
          <StatusPill icon={<RefreshCw size={16} />} label="刷新" value={formatStatus(refreshStatus, lastSuccessAt)} />
        </div>
      </header>
      {body}
    </main>
  );
}

function StatusPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="status-pill">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KpiCard({ category, selected, onSelect }: { category: CategorySnapshot; selected: boolean; onSelect: () => void }) {
  const latest = category.latest;
  return (
    <button className={selected ? "kpi-card selected" : "kpi-card"} type="button" onClick={onSelect}>
      <span className="card-label">
        {category.shortLabel} · HSK {category.hskCode}
      </span>
      <strong>{formatNumber(latest?.unitUsdPerKg, "usdKg")}</strong>
      <div className="kpi-meta">
        <span>
          <em>月份</em>
          {latest?.month ?? "--"}
        </span>
        <span>
          <em>官方出口额</em>
          {formatNumber(latest?.exportUsd, "money")}
        </span>
        <span>
          <em>官方净重</em>
          {formatWeight(latest?.exportWeight)}
        </span>
        <span>
          <em>强弱</em>
          {strengthLabel(latest?.momPct, latest?.yoyPct)}
        </span>
      </div>
      <div className="change-row">
        <ChangeBadge label="MoM" value={latest?.momPct ?? null} />
        <ChangeBadge label="YoY" value={latest?.yoyPct ?? null} />
      </div>
    </button>
  );
}

function ChangeBadge({ label, value }: { label: string; value: number | null }) {
  const positive = value != null && value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <span className={value == null ? "change neutral" : positive ? "change up" : "change down"}>
      {value != null && <Icon size={14} />}
      {label} {formatPct(value)}
    </span>
  );
}

function UnitValueChart({ category }: { category: CategorySnapshot }) {
  const data = useMemo(
    () => category.series.map((point) => ({ month: point.month, unit: round(point.unitUsdPerKg), exportUsd: point.exportUsd })),
    [category.series]
  );

  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" minTickGap={24} tickLine={false} />
          <YAxis tickFormatter={(value) => compactNumber(Number(value))} width={58} tickLine={false} />
          <Tooltip formatter={(value) => formatNumber(Number(value), "usdKg")} labelFormatter={(label) => `月份 ${label}`} />
          <Line type="monotone" dataKey="unit" name="USD/kg" stroke="#2563eb" strokeWidth={2.5} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function WeightChart({ category }: { category: CategorySnapshot }) {
  const data = useMemo(
    () => category.series.map((point) => ({ month: point.month, kg: point.exportWeight })),
    [category.series]
  );

  return (
    <div className="chart-box small">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" minTickGap={28} tickLine={false} />
          <YAxis tickFormatter={(value) => compactNumber(Number(value))} width={48} tickLine={false} />
          <Tooltip formatter={(value) => `${compactNumber(Number(value))} kg`} labelFormatter={(label) => `月份 ${label}`} />
          <Area type="monotone" dataKey="kg" name="出口重量" fill="#d97706" fillOpacity={0.18} stroke="#d97706" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function CategoryIndexChart({ category }: { category: CategorySnapshot }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={category.indexSeries} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" minTickGap={24} tickLine={false} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value))}%`} width={50} tickLine={false} />
          <Tooltip formatter={(value) => formatPct(Number(value))} labelFormatter={(label) => `月份 ${label}`} />
          <Legend verticalAlign="top" height={28} />
          <Line type="monotone" dataKey="priceMomPct" name={`${category.shortLabel} 单位价值 MoM`} stroke="#a16207" strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="hynixMomPct" name="SK hynix 收盘价 MoM" stroke="#16a34a" strokeWidth={2.5} dot={false} connectNulls />
          <Line type="monotone" dataKey="samsungMomPct" name="Samsung 收盘价 MoM" stroke="#7c3aed" strokeWidth={2.5} dot={false} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function DestinationSplit({ category }: { category?: CategorySnapshot }) {
  const destinations = category?.destinations ?? [];
  const data = destinations.slice(0, 8).map((row) => ({
    name: formatDestinationName(row.countryCode, row.countryName),
    share: round(row.exportSharePct),
    unit: round(row.unitUsdPerKg)
  }));

  if (destinations.length === 0) {
    return <div className="empty-state">暂无目的地缓存数据</div>;
  }

  return (
    <div className="destination-layout">
      <div className="chart-box small">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis dataKey="name" interval={0} tickLine={false} height={54} tick={<DestinationAxisTick />} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value))}%`} width={40} tickLine={false} />
            <Tooltip formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Bar dataKey="share" name="出口占比" fill="#0f766e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="destination-table">
        {destinations.slice(0, 6).map((row) => (
          <div className="destination-row" key={row.countryCode}>
            <span>{formatDestinationName(row.countryCode, row.countryName)}</span>
            <strong>{formatPct(row.exportSharePct)}</strong>
            <em>{formatNumber(row.unitUsdPerKg, "usdKg")}</em>
          </div>
        ))}
      </div>
    </div>
  );
}

function DestinationAxisTick({ x, y, payload }: { x?: number; y?: number; payload?: TickItem }) {
  const rawName = String(payload?.value ?? "");
  const match = rawName.match(/^(.*?)（(.*?)）$/);
  const koreanName = match?.[1] ?? rawName;
  const zhName = match?.[2] ?? "";

  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text textAnchor="middle" fill="#475569" fontSize={10} fontWeight={700}>
        <tspan x={0} dy={12}>
          {koreanName}
        </tspan>
        {zhName && (
          <tspan x={0} dy={13}>
            （{zhName}）
          </tspan>
        )}
      </text>
    </g>
  );
}

const destinationZhNames: Record<string, string> = {
  AT: "奥地利",
  BR: "巴西",
  CN: "中国大陆",
  DE: "德国",
  EG: "埃及",
  HK: "中国香港",
  HU: "匈牙利",
  ID: "印度尼西亚",
  IN: "印度",
  JP: "日本",
  MX: "墨西哥",
  MY: "马来西亚",
  NL: "荷兰",
  PH: "菲律宾",
  PL: "波兰",
  PT: "葡萄牙",
  TH: "泰国",
  TW: "中国台湾",
  US: "美国",
  VN: "越南"
};

function formatDestinationName(countryCode: string, countryName: string): string {
  const zhName = destinationZhNames[countryCode];
  return zhName ? `${countryName}（${zhName}）` : countryName;
}

function UsageView() {
  return (
    <section className="info-grid">
      <InfoPanel title="核心计算过程" eyebrow="formula">
        <div className="formula-row">
          <span>官方出口金额 USD</span>
          <b>÷</b>
          <span>官方出口净重 kg</span>
          <b>=</b>
          <strong>计算单价 USD/kg</strong>
        </div>
        <p>蓝绿色字段来自 K-stat/KITA 网页端，金色字段由本工具计算。所有历史图使用本次抓取区间内的完整月度数据。</p>
      </InfoPanel>
      <InfoPanel title="这些是什么价格" eyebrow="definitions">
        <DefinitionTable />
      </InfoPanel>
    </section>
  );
}

function FinancialsView({ snapshot }: { snapshot: SnapshotResponse }) {
  const rows = snapshot.categories.map((category) => ({
    category,
    latest: category.latest
  }));

  return (
    <section className="panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">公司财务关联</p>
          <h2>价格、数量、收入敏感项</h2>
        </div>
        <FileText size={20} />
      </div>
      <div className="analysis-table">
        <div className="analysis-row header">
          <span>指标</span>
          <span>最新单位价值 MoM</span>
          <span>出口金额</span>
          <span>财务含义</span>
        </div>
        {rows.map(({ category, latest }) => (
          <div className="analysis-row" key={category.id}>
            <strong>{category.shortLabel}</strong>
            <span>{formatPct(latest?.momPct)}</span>
            <span>{formatNumber(latest?.exportUsd, "money")}</span>
            <span>{financialMeaning(category.id)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TransmissionView({ snapshot }: { snapshot: SnapshotResponse }) {
  return (
    <section className="info-grid">
      {snapshot.categories.map((category) => (
        <InfoPanel key={category.id} title={category.label} eyebrow="下游价格传导">
          <p>{transmissionText(category.id)}</p>
          <div className="mini-metrics">
            <Metric label="最新 USD/kg" value={formatNumber(category.latest?.unitUsdPerKg, "usdKg")} />
            <Metric label="MoM" value={formatPct(category.latest?.momPct)} />
            <Metric label="YoY" value={formatPct(category.latest?.yoyPct)} />
          </div>
        </InfoPanel>
      ))}
    </section>
  );
}

function EarningsView({ snapshot }: { snapshot: SnapshotResponse }) {
  const mcp = snapshot.categories.find((category) => category.id === "mcp_hbm");
  const dram = snapshot.categories.find((category) => category.id === "dram");
  const nand = snapshot.categories.find((category) => category.id === "nand");

  return (
    <section className="workspace lower">
      <InfoPanel title="价格→业绩路径" eyebrow="operating leverage">
        <div className="path-list">
          <span>出口单位价值上行</span>
          <span>产品组合/ASP 改善</span>
          <span>毛利率与库存评价改善</span>
          <span>海力士/三星利润弹性</span>
        </div>
        <p>这是领先指标，不是公司披露 ASP。更适合观察方向、拐点和品类相对强弱。</p>
      </InfoPanel>
      <div className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">当前信号</p>
            <h2>品类强弱</h2>
          </div>
          <TrendingUp size={20} />
        </div>
        <div className="signal-list">
          <Signal label="HBM/高端封装" point={mcp?.latest?.priceIndex} />
          <Signal label="通用 DRAM" point={dram?.latest?.priceIndex} />
          <Signal label="NAND/SSD 成本" point={nand?.latest?.priceIndex} />
        </div>
      </div>
    </section>
  );
}

function InfoPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>
      {children}
    </div>
  );
}

function DefinitionTable() {
  const rows = [
    ["DRAM", "韩国 DRAM 出口金额 ÷ 出口净重", "通用 DRAM ASP 趋势", "不是 DDR5 合约价，也不是单颗 DRAM 报价"],
    ["NAND", "韩国 NAND 出口金额 ÷ 出口净重", "NAND / SSD 上游成本趋势", "不是 SSD 零售价，也不是 NAND wafer 报价"],
    ["MCP / HBM proxy", "韩国多芯片封装出口金额 ÷ 出口净重", "HBM、高端封装存储趋势代理", "不是 HBM3E 官方合约价"]
  ];
  return (
    <div className="definition-table">
      {rows.map((row) => (
        <div className="definition-row" key={row[0]}>
          {row.map((cell) => (
            <span key={cell}>{cell}</span>
          ))}
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Signal({ label, point }: { label: string; point: number | null | undefined }) {
  return (
    <div className="signal-row">
      <span>{label}</span>
      <strong>{formatIndex(point)}</strong>
      <em>{point == null ? "缺少基准" : point >= 130 ? "强" : point >= 100 ? "改善" : "偏弱"}</em>
    </div>
  );
}

function Loading() {
  return (
    <div className="center-state">
      <RefreshCw className="spin" size={26} />
      <span>读取缓存数据</span>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="center-state error">
      <AlertTriangle size={26} />
      <span>{message}</span>
    </div>
  );
}

function formatStatus(status?: string, lastSuccessAt?: string | null): string {
  if (status === "failed") {
    return "失败";
  }
  if (status === "running") {
    return "运行中";
  }
  if (!lastSuccessAt) {
    return status ?? "--";
  }
  return new Date(lastSuccessAt).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatNumber(value: number | null | undefined, mode: "usdKg" | "money" = "money"): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  if (mode === "usdKg") {
    return `$${compactNumber(value)}/kg`;
  }
  return compactNumber(value);
}

function formatWeight(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "-- kg";
  }
  return `${compactNumber(value)} kg`;
}

function formatIndex(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return value.toFixed(1);
}

function strengthLabel(mom: number | null | undefined, yoy: number | null | undefined): string {
  if (mom == null && yoy == null) return "--";
  const momScore = mom ?? 0;
  const yoyScore = yoy ?? 0;
  if (momScore > 5 && yoyScore > 15) return "强势";
  if (momScore > 0 || yoyScore > 0) return "改善";
  if (momScore < -5 && yoyScore < -10) return "走弱";
  return "中性";
}

function financialMeaning(category: CategoryId): string {
  if (category === "mcp_hbm") return "更偏高端封装/HBM 组合，对 SK hynix 盈利弹性更敏感。";
  if (category === "dram") return "反映通用内存周期，对海力士和三星半导体利润均有指示。";
  return "反映 NAND/SSD 上游成本与库存修复，对三星、海力士 NAND 业务有参考。";
}

function transmissionText(category: CategoryId): string {
  if (category === "mcp_hbm") return "高端封装出口单位价值上行，通常对应高带宽/多芯片存储组合改善，可作为 AI 服务器链条的代理指标。";
  if (category === "dram") return "DRAM 出口单位价值上行，通常领先或同步于 DDR、LPDDR、服务器内存 ASP 修复。";
  return "NAND 单位价值更适合观察 NAND/SSD 成本方向，不应直接等同于终端 SSD 价格。";
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: value >= 1000 ? 1 : 2
  }).format(value);
}

function round(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(value)) {
    return null;
  }
  return Math.round(value * 100) / 100;
}
