import { CalendarDays, Compass, Gauge, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { CategoryId } from "../shared/catalog";
import type { AShareIpoResponse, ApiError, IpoTrackerResponse, SnapshotResponse } from "../shared/types";
import type { AppRoute, AShareIpoLoadState, IpoLoadState, LoadState, MainView, ModuleDefinition, ModuleId } from "./appTypes";
import { ErrorState, Loading } from "./components/ui";
import { HomePage } from "./features/home/HomePage";
import { IpoMonitorPage } from "./features/ipo/IpoMonitorPage";
import { MemoryModuleHeader, MemoryMonitorPage } from "./features/memory/MemoryMonitorPage";
import { WatchlistPage } from "./features/watchlist/WatchlistPage";
import { categoryOrder, getModule, moduleDefinitions } from "./modules";
import { navigateToMemoryView, navigateToModule, routeFromLocation } from "./routing";

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => routeFromLocation());
  const [memoryState, setMemoryState] = useState<LoadState>({ status: "loading", data: null, error: null });
  const [ipoState, setIpoState] = useState<IpoLoadState>({ status: "loading", data: null, error: null });
  const [aShareIpoState, setAShareIpoState] = useState<AShareIpoLoadState>({ status: "idle", data: null, error: null });
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
    setAShareIpoState({ status: "idle", data: null, error: null });

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

  useEffect(() => {
    if (ipoState.status !== "ready") {
      return;
    }

    let cancelled = false;
    setAShareIpoState({ status: "loading", data: null, error: null });

    fetch("/api/ipo/a-share")
      .then(async (response) => {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as Partial<ApiError> | null;
          throw new Error(body?.detail || body?.error || `HTTP ${response.status}`);
        }
        return response.json() as Promise<AShareIpoResponse>;
      })
      .then((data) => {
        if (!cancelled) {
          setAShareIpoState({ status: "ready", data, error: null });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setAShareIpoState({ status: "error", data: null, error: error instanceof Error ? error.message : String(error) });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ipoState.status]);

  const activeModule = getModule(route.module);
  const shellStatus = getShellStatus(route, memoryState, ipoState);

  return (
    <Shell
      activeModule={activeModule}
      latestLabel={shellStatus.latestLabel}
      refreshLabel={shellStatus.refreshLabel}
      onModuleChange={(moduleId) => navigateToModule(moduleId, setRoute)}
      body={renderRoute({
        route,
        memoryState,
        ipoState,
        aShareIpoState,
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
  aShareIpoState,
  selectedCategory,
  setSelectedCategory,
  onModuleChange,
  onMemoryViewChange
}: {
  route: AppRoute;
  memoryState: LoadState;
  ipoState: IpoLoadState;
  aShareIpoState: AShareIpoLoadState;
  selectedCategory: CategoryId;
  setSelectedCategory: (category: CategoryId) => void;
  onModuleChange: (moduleId: ModuleId) => void;
  onMemoryViewChange: (view: MainView) => void;
}) {
  if (route.module === "home") {
    return <HomePage onNavigate={onModuleChange} />;
  }

  if (route.module === "ipo") {
    return <IpoMonitorPage state={ipoState} aShareState={aShareIpoState} />;
  }

  if (route.module === "watchlist") {
    return <WatchlistPage />;
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
  latestLabel,
  refreshLabel,
  onModuleChange
}: {
  body: ReactNode;
  activeModule: ModuleDefinition;
  latestLabel: string;
  refreshLabel: string;
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
            <div className="brand-title-row">
              <h1>三林帮致富看板</h1>
              <span>有感觉吗</span>
            </div>
          </div>
        </div>
        <div className="status-strip" aria-label="platform status">
          <StatusPill icon={<Gauge size={16} />} label="当前模块" value={activeModule.shortLabel} />
          <StatusPill icon={<CalendarDays size={16} />} label="最新月份" value={latestLabel} />
          <StatusPill icon={<RefreshCw size={16} />} label="刷新" value={refreshLabel} />
        </div>
      </header>
      <ModuleNav active={activeModule.id} onChange={onModuleChange} />
      {body}
    </main>
  );
}

function getShellStatus(route: AppRoute, memoryState: LoadState, ipoState: IpoLoadState): { latestLabel: string; refreshLabel: string } {
  if (route.module === "memory" && memoryState.status === "ready") {
    return {
      latestLabel: memoryState.data.latestMonth ?? "--",
      refreshLabel: formatMemoryStatus(memoryState.data.refresh.status, memoryState.data.lastSuccessAt)
    };
  }

  if (route.module === "ipo" && ipoState.status === "ready") {
    const generatedAt = ipoState.data.generatedAtUtc ?? ipoState.data.generatedAt;
    return {
      latestLabel: formatDateLabel(generatedAt),
      refreshLabel: formatDateTimeLabel(generatedAt)
    };
  }

  if (route.module === "ipo") {
    const now = new Date();
    return {
      latestLabel: formatDateLabel(now),
      refreshLabel: formatDateTimeLabel(now)
    };
  }

  return { latestLabel: "--", refreshLabel: "--" };
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

function formatMemoryStatus(status?: string, lastSuccessAt?: string | null): string {
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

function formatDateLabel(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "--";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Hong_Kong",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

function formatDateTimeLabel(value: Date | string | null | undefined): string {
  const date = parseDate(value);
  if (!date) {
    return "--";
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

function parseDate(value: Date | string | null | undefined): Date | null {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
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
