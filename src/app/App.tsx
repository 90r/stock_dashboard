import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  Briefcase,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Compass,
  Database,
  Factory,
  FileText,
  Gauge,
  HelpCircle,
  Landmark,
  Layers,
  LayoutDashboard,
  LineChart as LineChartIcon,
  ListChecks,
  Newspaper,
  Radio,
  RefreshCw,
  Scale,
  Search,
  Sparkles,
  TrendingUp,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
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
import type { ApiError, CategorySnapshot, IpoCalendarItem, IpoMarginRecord, IpoTrackerResponse, SnapshotResponse } from "../shared/types";

type LoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: SnapshotResponse; error: null }
  | { status: "error"; data: null; error: string };

type IpoLoadState =
  | { status: "loading"; data: null; error: null }
  | { status: "ready"; data: IpoTrackerResponse; error: null }
  | { status: "error"; data: null; error: string };
type IpoStage = { label: string; tone: "live" | "design" | "queued" | "done" };

type ModuleId = "home" | "memory" | "ipo" | "watchlist";
type MainView = "dashboard" | "usage" | "financials" | "transmission" | "earnings";

interface AppRoute {
  module: ModuleId;
  memoryView: MainView;
}

interface ModuleDefinition {
  id: ModuleId;
  path: string;
  label: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
  icon: LucideIcon;
  status: string;
}

const categoryOrder: CategoryId[] = ["dram", "mcp_hbm", "nand"];
const memoryViewPaths: Record<MainView, string> = {
  dashboard: "/memory",
  usage: "/memory/usage",
  financials: "/memory/financials",
  transmission: "/memory/transmission",
  earnings: "/memory/earnings"
};

const moduleDefinitions: ModuleDefinition[] = [
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
    eyebrow: "Live HK",
    description: "港股新股日历、孖展脉搏、超额认购与上市节奏。",
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

const chartTick = { fill: "#50617a", fontSize: 11 };
const chartTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #d8d6df",
  borderRadius: 6,
  boxShadow: "rgba(50, 50, 93, 0.12) 0px 16px 32px 0px",
  color: "#061b31",
  fontSize: 12
};

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromLocation());
  const [memoryState, setMemoryState] = useState<LoadState>({ status: "loading", data: null, error: null });
  const [ipoState, setIpoState] = useState<IpoLoadState>({ status: "loading", data: null, error: null });
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>("dram");

  useEffect(() => {
    const onPopState = () => setRoute(routeFromLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    if (route.module !== "memory" || memoryState.status !== "loading") {
      return;
    }

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
          setMemoryState({ status: "ready", data, error: null });
          const firstWithData = categoryOrder.find((id) => data.categories.find((category) => category.id === id)?.latest);
          if (firstWithData) {
            setSelectedCategory(firstWithData);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setMemoryState({ status: "error", data: null, error: error instanceof Error ? error.message : String(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [memoryState.status, route.module]);

  useEffect(() => {
    if (route.module !== "ipo" || ipoState.status !== "loading") {
      return;
    }

    let cancelled = false;

    fetch("/api/ipo")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as Partial<ApiError> | null;
          throw new Error(body?.detail || body?.error || `HTTP ${response.status}`);
        }
        return response.json() as Promise<IpoTrackerResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setIpoState({ status: "ready", data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIpoState({ status: "error", data: null, error: error instanceof Error ? error.message : String(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ipoState.status, route.module]);

  const activeModule = getModule(route.module);
  const latestMonth = route.module === "memory" && memoryState.status === "ready" ? memoryState.data.latestMonth : null;
  const lastSuccessAt = route.module === "memory" && memoryState.status === "ready" ? memoryState.data.lastSuccessAt : null;
  const refreshStatus = route.module === "memory" && memoryState.status === "ready" ? memoryState.data.refresh.status : undefined;

  return (
    <Shell
      activeModule={activeModule}
      latestMonth={latestMonth}
      lastSuccessAt={lastSuccessAt}
      refreshStatus={refreshStatus}
      onModuleChange={(moduleId) => navigateToModule(moduleId, setRoute)}
      body={renderRoute({
        route,
        memoryState,
        ipoState,
        selectedCategory,
        setSelectedCategory,
        onModuleChange: (moduleId) => navigateToModule(moduleId, setRoute),
        onMemoryViewChange: (view) => navigateToMemoryView(view, setRoute)
      })}
    />
  );
}

function renderRoute({
  route,
  memoryState,
  ipoState,
  selectedCategory,
  setSelectedCategory,
  onModuleChange,
  onMemoryViewChange
}: {
  route: AppRoute;
  memoryState: LoadState;
  ipoState: IpoLoadState;
  selectedCategory: CategoryId;
  setSelectedCategory: (category: CategoryId) => void;
  onModuleChange: (moduleId: ModuleId) => void;
  onMemoryViewChange: (view: MainView) => void;
}) {
  if (route.module === "home") {
    return <HomePage onNavigate={onModuleChange} />;
  }

  if (route.module === "ipo") {
    return <IpoMonitorPage state={ipoState} />;
  }

  if (route.module === "watchlist") {
    return <WatchlistPage onNavigate={onModuleChange} />;
  }

  if (memoryState.status === "loading") {
    return (
      <>
        <MemoryModuleHeader />
        <Loading />
      </>
    );
  }

  if (memoryState.status === "error") {
    return (
      <>
        <MemoryModuleHeader />
        <ErrorState message={memoryState.error} />
      </>
    );
  }

  return (
    <MemoryMonitorPage
      snapshot={memoryState.data}
      selectedCategory={selectedCategory}
      setSelectedCategory={setSelectedCategory}
      activeView={route.memoryView}
      onViewChange={onMemoryViewChange}
    />
  );
}

function Shell({
  body,
  activeModule,
  latestMonth,
  lastSuccessAt,
  refreshStatus,
  onModuleChange
}: {
  body: ReactNode;
  activeModule: ModuleDefinition;
  latestMonth?: string | null;
  lastSuccessAt?: string | null;
  refreshStatus?: string;
  onModuleChange: (moduleId: ModuleId) => void;
}) {
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            <Compass size={18} />
          </span>
          <div>
            <p className="eyebrow">Market Intelligence Console</p>
            <h1>市场监控中心</h1>
          </div>
        </div>
        <div className="status-strip" aria-label="platform status">
          <StatusPill icon={<Gauge size={16} />} label="当前模块" value={activeModule.shortLabel} />
          <StatusPill icon={<CalendarDays size={16} />} label="最新月份" value={latestMonth ?? "--"} />
          <StatusPill icon={<RefreshCw size={16} />} label="刷新" value={formatStatus(refreshStatus, lastSuccessAt)} />
        </div>
      </header>
      <ModuleNav active={activeModule.id} onChange={onModuleChange} />
      {body}
    </main>
  );
}

function ModuleNav({ active, onChange }: { active: ModuleId; onChange: (moduleId: ModuleId) => void }) {
  return (
    <nav className="module-nav" aria-label="modules">
      {moduleDefinitions.map((module) => {
        const Icon = module.icon;
        return (
          <button
            key={module.id}
            type="button"
            className={active === module.id ? "module-nav-item active" : "module-nav-item"}
            onClick={() => onChange(module.id)}
          >
            <Icon size={17} />
            <span>
              <em>{module.eyebrow}</em>
              {module.shortLabel}
            </span>
            <strong>{module.status}</strong>
          </button>
        );
      })}
    </nav>
  );
}

function HomePage({ onNavigate }: { onNavigate: (moduleId: ModuleId) => void }) {
  const cards = moduleDefinitions.filter((module) => module.id !== "home");
  return (
    <div className="page-stack">
      <section className="command-panel platform-hero" aria-label="platform overview">
        <div className="command-copy">
          <p className="eyebrow">Signal desk</p>
          <h2>把每个市场信号收进同一张桌面</h2>
          <p>存储价格、IPO 进程、行业指标和自定义观察池共用同一套导航、状态与卡片语言。</p>
        </div>
        <div className="command-metrics" aria-label="platform summary">
          <Metric label="在线模块" value="3" />
          <Metric label="实时数据源" value="1" />
          <Metric label="预留管线" value="6" />
          <Metric label="界面版本" value="v2" />
        </div>
      </section>

      <section className="module-card-grid" aria-label="monitor modules">
        {cards.map((module) => (
          <ModuleCard key={module.id} module={module} onSelect={() => onNavigate(module.id)} />
        ))}
      </section>

      <section className="workspace lower">
        <div className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Monitor queue</p>
              <h2>监控队列</h2>
            </div>
            <ListChecks size={20} />
          </div>
          <div className="timeline-list">
            <TimelineRow label="韩国存储价格" meta="K-stat / Naver" status="运行中" tone="live" />
            <TimelineRow label="IPO 监控" meta="日历 / 递表 / 热度" status="设计中" tone="design" />
            <TimelineRow label="行业与宏观观察池" meta="汇率 / 利率 / 商品" status="排队" tone="queued" />
          </div>
        </div>

        <div className="panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Operating layer</p>
              <h2>统一工作流</h2>
            </div>
            <Sparkles size={20} />
          </div>
          <div className="workflow-grid">
            <WorkflowItem icon={<Search size={17} />} label="发现" value="网页抓取 / API" />
            <WorkflowItem icon={<Database size={17} />} label="缓存" value="D1 snapshot" />
            <WorkflowItem icon={<BellRing size={17} />} label="提醒" value="阈值与状态" />
          </div>
        </div>
      </section>
    </div>
  );
}

function ModuleCard({ module, onSelect }: { module: ModuleDefinition; onSelect: () => void }) {
  const Icon = module.icon;
  return (
    <button type="button" className="module-card" onClick={onSelect}>
      <span className="module-card-icon">
        <Icon size={22} />
      </span>
      <span className="module-card-copy">
        <em>{module.eyebrow}</em>
        <strong>{module.label}</strong>
        <span>{module.description}</span>
      </span>
      <span className="module-card-action">
        打开
        <ArrowRight size={15} />
      </span>
    </button>
  );
}

function MemoryMonitorPage({
  snapshot,
  selectedCategory,
  setSelectedCategory,
  activeView,
  onViewChange
}: {
  snapshot: SnapshotResponse;
  selectedCategory: CategoryId;
  setSelectedCategory: (category: CategoryId) => void;
  activeView: MainView;
  onViewChange: (view: MainView) => void;
}) {
  const category = snapshot.categories.find((item) => item.id === selectedCategory) ?? snapshot.categories[0];
  const content =
    activeView === "dashboard" ? (
      <DashboardView
        snapshot={snapshot}
        category={category}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
    ) : activeView === "usage" ? (
      <UsageView />
    ) : activeView === "financials" ? (
      <FinancialsView snapshot={snapshot} />
    ) : activeView === "transmission" ? (
      <TransmissionView snapshot={snapshot} />
    ) : (
      <EarningsView snapshot={snapshot} />
    );

  return (
    <>
      <MemoryModuleHeader />
      <MainNav active={activeView} onChange={onViewChange} />
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
  );
}

function MemoryModuleHeader() {
  return (
    <section className="module-header">
      <div>
        <p className="eyebrow">Memory price module</p>
        <h2>韩国存储价格监控器</h2>
      </div>
      <p>K-stat 出口单位价值、Naver 月末收盘价和目的地拆分组成的存储周期观察页。</p>
    </section>
  );
}

function IpoMonitorPage({ state }: { state: IpoLoadState }) {
  if (state.status === "loading") {
    return (
      <div className="page-stack">
        <IpoHeroSkeleton />
        <Loading label="采集 IPO 数据" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="page-stack">
        <IpoHeroSkeleton status="接口失败" />
        <ErrorState message={state.error} />
      </div>
    );
  }

  const tracker = state.data;
  const today = currentHongKongDate();
  const marginBySymbol = new Map(tracker.margin.records.map((record) => [record.symbol, record]));
  const sortedIpos = [...tracker.ipos].sort((a, b) =>
    (a.subscriptionOpen ?? a.allotmentDate ?? a.listingDate ?? "").localeCompare(b.subscriptionOpen ?? b.allotmentDate ?? b.listingDate ?? "")
  );
  const activeIpos = sortedIpos.filter((ipo) => getIpoStage(ipo, today).label !== "已挂牌");
  const displayIpos = activeIpos.length > 0 ? activeIpos : sortedIpos;
  const marginRecords = [...tracker.margin.records].sort((a, b) => (b.oversubscriptionRatio ?? -1) - (a.oversubscriptionRatio ?? -1));
  const topMargin = marginRecords[0];
  const openCount = sortedIpos.filter((ipo) => getIpoStage(ipo, today).label === "招股中").length;
  const pendingListingCount = sortedIpos.filter((ipo) => ["待上市", "等中签"].includes(getIpoStage(ipo, today).label)).length;

  return (
    <div className="page-stack">
      <section className="command-panel ipo-hero" aria-label="ipo monitor">
        <div className="command-copy">
          <p className="eyebrow">HK IPO live radar</p>
          <h2>港股 IPO 监控雷达</h2>
          <p>同步 TradeSmart 的港股新股日历与孖展脉搏，把招股、定价、中签、上市和超购热度放进同一个页面。</p>
        </div>
        <div className="command-metrics" aria-label="ipo summary">
          <Metric label="新股条目" value={String(tracker.count)} />
          <Metric label="招股中" value={String(openCount)} />
          <Metric label="待上市" value={String(pendingListingCount)} />
          <Metric label="最高超购" value={formatRatio(topMargin?.oversubscriptionRatio)} />
        </div>
      </section>

      <section className="workspace">
        <div className="panel feature-panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Margin pulse</p>
              <h2>孖展实时脉搏</h2>
            </div>
            <Radio size={20} />
          </div>
          {marginRecords.length === 0 ? (
            <div className="empty-state">暂无孖展公开数据</div>
          ) : (
            <div className="ipo-pulse-list">
              {marginRecords.map((record) => (
                <IpoPulseCard key={record.symbol} record={record} ipo={tracker.ipos.find((ipo) => ipo.symbol === record.symbol)} />
              ))}
            </div>
          )}
        </div>

        <div className="panel source-panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">Source status</p>
              <h2>来源与更新</h2>
            </div>
            <Landmark size={20} />
          </div>
          <div className="source-list">
            <SourceRow label="页面同步" value={formatHongKongDateTime(tracker.generatedAt)} />
            <SourceRow label="日历来源" value={tracker.source} href={tracker.sourceUrl} />
            <SourceRow label="孖展来源" value={tracker.margin.source} href={tracker.margin.sourceUrl} />
            <SourceRow label="时间窗口" value={`${formatDateOnly(tracker.grid.startDate)} - ${formatDateOnly(tracker.grid.endDate)}`} />
          </div>
          <div className="path-list compact-flow">
            <span>招股截止</span>
            <span>资金冻结</span>
            <span>公布中签</span>
            <span>暗盘观察</span>
            <span>正式挂牌</span>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">Listing calendar</p>
            <h2>港股新股日历</h2>
          </div>
          <CalendarClock size={20} />
        </div>
        <div className="ipo-calendar-table">
          <div className="ipo-calendar-row header">
            <span>代码 / 名称</span>
            <span>阶段</span>
            <span>招股期</span>
            <span>中签 / 上市</span>
            <span>价格 / 入场</span>
            <span>孖展</span>
          </div>
          {displayIpos.map((ipo) => (
            <IpoCalendarRow key={ipo.symbol} ipo={ipo} margin={marginBySymbol.get(ipo.symbol)} today={today} />
          ))}
        </div>
      </section>

      <section className="info-grid">
        <InfoPanel title="时间轴事件" eyebrow="15 day timeline">
          <div className="ipo-event-list">
            {displayIpos.map((ipo) => (
              <div className="ipo-event-row" key={`${ipo.symbol}-events`}>
                <strong>
                  {ipo.name}
                  <small>{ipo.symbolHk}</small>
                </strong>
                <div className="ipo-event-strip">
                  {ipo.events.map((event) => (
                    <span className="ipo-event-chip" key={`${ipo.symbol}-${event.date}-${event.code}`} title={formatEventLabel(event.code, tracker.eventLegend)}>
                      <em>{formatDateOnly(event.date)}</em>
                      <b>{event.code}</b>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </InfoPanel>
        <InfoPanel title="热度判定" eyebrow="watch rules">
          <div className="signal-list">
            <Signal label="超购 1000x 以上" point={marginRecords.filter((record) => (record.oversubscriptionRatio ?? 0) >= 1000).length * 100} />
            <Signal label="孖展 1000 亿以上" point={marginRecords.filter((record) => (record.marginTotalHkdYi ?? 0) >= 1000).length * 100} />
            <Signal label="未来一周上市" point={pendingListingCount * 100} />
          </div>
          <p className="panel-note">孖展和超购是热度信号，不等于投资建议；实际申购仍要核对招股书、券商费率和资金占用。</p>
        </InfoPanel>
      </section>

      <footer className="footnote">
        <p>
          IPO 数据由本站 Worker 采集 TradeSmart 页面中的结构化数据；日历源标注为 AAStocks，孖展源标注为 AiPO。原始页面：
          <a href={tracker.sourcePageUrl} target="_blank" rel="noreferrer">
            TradeSmart IPO Tracker
          </a>
          。
        </p>
      </footer>
    </div>
  );
}

function IpoHeroSkeleton({ status = "读取中" }: { status?: string }) {
  return (
    <section className="command-panel ipo-hero" aria-label="ipo monitor">
      <div className="command-copy">
        <p className="eyebrow">HK IPO live radar</p>
        <h2>港股 IPO 监控雷达</h2>
        <p>正在同步港股新股日历、孖展总额、超额认购和上市节奏。</p>
      </div>
      <div className="command-metrics" aria-label="ipo summary">
        <Metric label="数据源" value="TradeSmart" />
        <Metric label="日历" value="AAStocks" />
        <Metric label="孖展" value="AiPO" />
        <Metric label="接口状态" value={status} />
      </div>
    </section>
  );
}

function IpoPulseCard({ record, ipo }: { record: IpoMarginRecord; ipo?: IpoCalendarItem }) {
  const publicOfferEstimate = record.marginTotalHkdYi != null && record.oversubscriptionRatio ? record.marginTotalHkdYi / record.oversubscriptionRatio : null;

  return (
    <article className="ipo-pulse-card">
      <div className="ipo-pulse-title">
        <span>
          <strong>{record.symbolHk}</strong>
          <em>{record.name}</em>
        </span>
        <StatusChip>{formatRatio(record.oversubscriptionRatio)}</StatusChip>
      </div>
      <div className="ipo-pulse-metrics">
        <Metric label="孖展总额" value={formatHkdYi(record.marginTotalHkdYi)} />
        <Metric label="公开发售估算" value={formatHkdYi(publicOfferEstimate)} />
        <Metric label="一手入场" value={formatHkd(ipo?.entryFeeHkd)} />
      </div>
      <div className="ipo-pulse-meta">
        <span>{record.brokerTopText ?? "暂无券商增量"}</span>
        <time>{formatHongKongDateTime(record.observedAt)}</time>
      </div>
    </article>
  );
}

function IpoCalendarRow({ ipo, margin, today }: { ipo: IpoCalendarItem; margin?: IpoMarginRecord; today: string }) {
  const stage = getIpoStage(ipo, today);
  const price = ipo.offerPriceRange ? `HK$${ipo.offerPriceRange}` : formatHkd(ipo.offerPriceHkd);

  return (
    <div className="ipo-calendar-row">
      <span className="ipo-name-cell">
        <strong>{ipo.symbolHk}</strong>
        <em>{ipo.name}</em>
      </span>
      <span>
        <IpoStageBadge stage={stage} />
      </span>
      <span>{formatDateRange(ipo.subscriptionOpen, ipo.subscriptionClose)}</span>
      <span className="ipo-date-stack">
        <em>中签 {formatDateOnly(ipo.allotmentDate)}</em>
        <em>上市 {formatDateOnly(ipo.listingDate)}</em>
      </span>
      <span className="ipo-date-stack">
        <em>{price}</em>
        <em>{formatHkd(ipo.entryFeeHkd)} / {formatLotSize(ipo.lotSize)}</em>
      </span>
      <span className="ipo-date-stack">
        <em>{formatHkdYi(margin?.marginTotalHkdYi)}</em>
        <em>{formatRatio(margin?.oversubscriptionRatio)}</em>
      </span>
    </div>
  );
}

function IpoStageBadge({ stage }: { stage: IpoStage }) {
  return <em className={`status-chip ${stage.tone}`}>{stage.label}</em>;
}

function SourceRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="source-row">
      <span>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer">
          {value}
        </a>
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function WatchlistPage({ onNavigate }: { onNavigate: (moduleId: ModuleId) => void }) {
  const candidates = [
    { icon: <CircleDollarSign size={20} />, title: "汇率与利率", text: "USD/CNY、KRW/CNY、政策利率和期限利差。" },
    { icon: <Building2 size={20} />, title: "行业价格", text: "面板、被动元件、锂电材料、航运费率。" },
    { icon: <Newspaper size={20} />, title: "财报日历", text: "业绩预告、电话会、盈利修正和指引变化。" },
    { icon: <WalletCards size={20} />, title: "资金与成交", text: "ETF 申赎、北向资金、成交额和波动率。" }
  ];

  return (
    <div className="page-stack">
      <section className="command-panel watchlist-hero" aria-label="future monitors">
        <div className="command-copy">
          <p className="eyebrow">Signal sandbox</p>
          <h2>更多监控先放进观察池</h2>
          <p>这里保留给下一批模块。每个模块都可以复用当前的导航、状态、卡片、图表和提示框。</p>
        </div>
        <div className="command-metrics" aria-label="watchlist summary">
          <Metric label="候选模块" value="4" />
          <Metric label="复用组件" value="8" />
          <Metric label="数据状态" value="待接入" />
          <Metric label="优先级" value="IPO" />
        </div>
      </section>

      <section className="module-card-grid compact">
        {candidates.map((candidate) => (
          <div className="idea-card" key={candidate.title}>
            <span className="module-card-icon">{candidate.icon}</span>
            <strong>{candidate.title}</strong>
            <p>{candidate.text}</p>
          </div>
        ))}
      </section>

      <section className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">Next build</p>
            <h2>优先把 IPO 监控接成真实数据</h2>
          </div>
          <CheckCircle2 size={20} />
        </div>
        <button type="button" className="primary-action" onClick={() => onNavigate("ipo")}>
          <Briefcase size={16} />
          进入 IPO 监控
        </button>
      </section>
    </div>
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
    <div className="dashboard-stack">
      <section className="command-panel" aria-label="market snapshot">
        <div className="command-copy">
          <p className="eyebrow">Customs unit value</p>
          <h2>韩国存储出口价格脉冲</h2>
          <p>HSK 出口金额、净重、目的地结构与韩国半导体股价 MoM 同屏观察。</p>
        </div>
        <div className="command-metrics" aria-label="selected category summary">
          <Metric label={`${category.shortLabel} 最新`} value={formatNumber(category.latest?.unitUsdPerKg, "usdKg")} />
          <Metric label="MoM" value={formatPct(category.latest?.momPct)} />
          <Metric label="YoY" value={formatPct(category.latest?.yoyPct)} />
          <Metric label="价格指数" value={formatIndex(category.latest?.priceIndex)} />
        </div>
      </section>

      <section className="kpi-grid" aria-label="category key metrics">
        {snapshot.categories.map((item) => (
          <KpiCard key={item.id} category={item} selected={item.id === selectedCategory} onSelect={() => setSelectedCategory(item.id)} />
        ))}
      </section>

      <section className="workspace">
        <div className="panel chart-panel feature-panel">
          <div className="panel-head">
            <div>
              <p className="eyebrow">{category.description}</p>
              <h2>{category.label} 单位价值</h2>
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
    </div>
  );
}

function MainNav({ active, onChange }: { active: MainView; onChange: (view: MainView) => void }) {
  const items: Array<{ id: MainView; label: string; icon: ReactNode }> = [
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

function StatusPill({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
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
      <span className="kpi-topline">
        <span className="card-label">{category.shortLabel}</span>
        <span className="hsk-code">HSK {category.hskCode}</span>
      </span>
      <span className="kpi-value-row">
        <strong>{formatNumber(latest?.unitUsdPerKg, "usdKg")}</strong>
        <ChangeBadge label="MoM" value={latest?.momPct ?? null} />
      </span>
      <Sparkline category={category} />
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
        <ChangeBadge label="YoY" value={latest?.yoyPct ?? null} />
        <span className="change neutral">强弱 {strengthLabel(latest?.momPct, latest?.yoyPct)}</span>
      </div>
    </button>
  );
}

function Sparkline({ category }: { category: CategorySnapshot }) {
  const rawPoints = category.series
    .slice(-18)
    .map((point) => point.unitUsdPerKg)
    .filter((value): value is number => value != null && Number.isFinite(value));

  if (rawPoints.length < 2) {
    return <span className="sparkline empty">No trend</span>;
  }

  const width = 160;
  const height = 42;
  const padding = 4;
  const min = Math.min(...rawPoints);
  const max = Math.max(...rawPoints);
  const span = max - min || 1;
  const step = (width - padding * 2) / (rawPoints.length - 1);
  const points = rawPoints.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / span) * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const area = `M${points[0]} L${points.join(" L")} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
      <path className="sparkline-area" d={area} />
      <polyline className="sparkline-line" points={points.join(" ")} />
    </svg>
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
          <CartesianGrid stroke="#e5edf5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" minTickGap={24} tickLine={false} axisLine={false} tick={chartTick} />
          <YAxis tickFormatter={(value) => compactNumber(Number(value))} width={58} tickLine={false} axisLine={false} tick={chartTick} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatNumber(Number(value), "usdKg")} labelFormatter={(label) => `月份 ${label}`} />
          <Line type="monotone" dataKey="unit" name="USD/kg" stroke="#533afd" strokeWidth={2.8} dot={false} connectNulls />
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
          <CartesianGrid stroke="#e5edf5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" minTickGap={28} tickLine={false} axisLine={false} tick={chartTick} />
          <YAxis tickFormatter={(value) => compactNumber(Number(value))} width={48} tickLine={false} axisLine={false} tick={chartTick} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${compactNumber(Number(value))} kg`} labelFormatter={(label) => `月份 ${label}`} />
          <Area type="monotone" dataKey="kg" name="出口重量" fill="#81b81a" fillOpacity={0.14} stroke="#81b81a" strokeWidth={2.2} dot={false} />
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
          <CartesianGrid stroke="#e5edf5" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="month" minTickGap={24} tickLine={false} axisLine={false} tick={chartTick} />
          <YAxis tickFormatter={(value) => `${Math.round(Number(value))}%`} width={50} tickLine={false} axisLine={false} tick={chartTick} />
          <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => formatPct(Number(value))} labelFormatter={(label) => `月份 ${label}`} />
          <Legend verticalAlign="top" height={28} wrapperStyle={{ color: "#50617a", fontSize: 12 }} />
          <Line type="monotone" dataKey="priceMomPct" name={`${category.shortLabel} 单位价值 MoM`} stroke="#533afd" strokeWidth={2.6} dot={false} connectNulls />
          <Line type="monotone" dataKey="hynixMomPct" name="SK hynix 收盘价 MoM" stroke="#81b81a" strokeWidth={2.4} dot={false} connectNulls />
          <Line type="monotone" dataKey="samsungMomPct" name="Samsung 收盘价 MoM" stroke="#ff6118" strokeWidth={2.4} dot={false} connectNulls />
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
            <CartesianGrid stroke="#e5edf5" strokeDasharray="4 4" horizontal={false} />
            <XAxis dataKey="name" interval={0} tickLine={false} height={54} tick={<DestinationAxisTick />} />
            <YAxis tickFormatter={(value) => `${Math.round(Number(value))}%`} width={40} tickLine={false} axisLine={false} tick={chartTick} />
            <Tooltip contentStyle={chartTooltipStyle} formatter={(value) => `${Number(value).toFixed(1)}%`} />
            <Bar dataKey="share" name="出口占比" fill="#533afd" radius={[4, 4, 0, 0]} />
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
      <text textAnchor="middle" fill="#50617a" fontSize={10} fontWeight={400}>
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

function InfoPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
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

function StatusChip({ children }: { children: ReactNode }) {
  return <em className="status-chip">{children}</em>;
}

function TimelineRow({ label, meta, status, tone }: { label: string; meta: string; status: string; tone: "live" | "design" | "queued" }) {
  return (
    <div className="timeline-row">
      <span className={`timeline-dot ${tone}`} />
      <strong>{label}</strong>
      <span>{meta}</span>
      <StatusChip>{status}</StatusChip>
    </div>
  );
}

function WorkflowItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="workflow-item">
      <span>{icon}</span>
      <strong>{label}</strong>
      <em>{value}</em>
    </div>
  );
}

function Loading({ label = "读取缓存数据" }: { label?: string }) {
  return (
    <div className="center-state">
      <RefreshCw className="spin" size={26} />
      <span>{label}</span>
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

function routeFromLocation(): AppRoute {
  return routeFromPath(window.location.pathname);
}

function routeFromPath(pathname: string): AppRoute {
  const pathnameWithoutSlash = pathname.replace(/\/+$/, "") || "/";

  if (pathnameWithoutSlash.startsWith("/ipo")) {
    return { module: "ipo", memoryView: "dashboard" };
  }

  if (pathnameWithoutSlash.startsWith("/watchlist")) {
    return { module: "watchlist", memoryView: "dashboard" };
  }

  if (pathnameWithoutSlash.startsWith("/memory")) {
    const memoryView =
      (Object.entries(memoryViewPaths).find(([, path]) => path === pathnameWithoutSlash)?.[0] as MainView | undefined) ?? "dashboard";
    return { module: "memory", memoryView };
  }

  return { module: "home", memoryView: "dashboard" };
}

function navigateToModule(moduleId: ModuleId, setRoute: (route: AppRoute) => void) {
  const module = getModule(moduleId);
  const nextRoute = routeFromPath(module.path);
  window.history.pushState(null, "", module.path);
  setRoute(nextRoute);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function navigateToMemoryView(view: MainView, setRoute: (route: AppRoute) => void) {
  const path = memoryViewPaths[view];
  const nextRoute = routeFromPath(path);
  window.history.pushState(null, "", path);
  setRoute(nextRoute);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getModule(moduleId: ModuleId): ModuleDefinition {
  return moduleDefinitions.find((module) => module.id === moduleId) ?? moduleDefinitions[0];
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

function currentHongKongDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Hong_Kong",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function getIpoStage(ipo: IpoCalendarItem, today: string): IpoStage {
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

function isDateInRange(date: string, start: string | null, end: string | null): boolean {
  return !!start && !!end && date >= start && date <= end;
}

function formatPct(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function formatRatio(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${Math.round(value).toLocaleString("zh-CN")}x`;
}

function formatHkd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `HK$${value.toLocaleString("zh-CN", { maximumFractionDigits: 2 })}`;
}

function formatHkdYi(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN", { maximumFractionDigits: value >= 100 ? 0 : 2 })} 亿`;
}

function formatLotSize(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toLocaleString("zh-CN")} 股`;
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) {
    return "--";
  }
  return `${formatDateOnly(start)} - ${formatDateOnly(end)}`;
}

function formatDateOnly(value: string | null | undefined): string {
  if (!value) {
    return "--";
  }
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match) {
    return `${match[2]}/${match[3]}`;
  }
  return value;
}

function formatHongKongDateTime(value: string | null | undefined): string {
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

function formatEventLabel(code: string, legend: IpoTrackerResponse["eventLegend"]): string {
  return code
    .split(",")
    .map((part) => legend[part]?.zh ?? legend[part]?.en ?? part)
    .join(" / ");
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
