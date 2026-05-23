import { Building2, Landmark } from "lucide-react";
import { useState } from "react";
import type { IpoCalendarItem, IpoMarginRecord } from "../../../shared/types";
import type { IpoLoadState } from "../../appTypes";
import { ErrorState, Loading, Metric } from "../../components/ui";
import { AShareIpoPanel } from "./aShare/AShareIpoPanel";
import { HkIpoPanel } from "./hk/HkIpoPanel";
import type { IpoFilter, IpoMarket } from "./ipoTypes";
import { formatCount, formatDateOnly, formatRatio, getAShareStatusCount, getIpoReferenceDate, getIpoStage } from "./ipoUtils";
import { IpoHeroSkeleton } from "./shared";

export function IpoMonitorPage({ state }: { state: IpoLoadState }) {
  const [activeMarket, setActiveMarket] = useState<IpoMarket>("hk");
  const [activeFilter, setActiveFilter] = useState<IpoFilter>("all");
  const [expandedMarginSymbols, setExpandedMarginSymbols] = useState<Set<string>>(() => new Set());
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);
  const [calculatorSymbol, setCalculatorSymbol] = useState<string | null>(null);
  const [calculatorLots, setCalculatorLots] = useState(1);

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
  const aShare = tracker.aShare;
  const today = getIpoReferenceDate(tracker);
  const marginBySymbol = new Map(tracker.margin.records.map((record) => [record.symbol, record]));
  const sortedIpos = [...tracker.ipos].sort((a, b) =>
    (a.subscriptionOpen ?? a.allotmentDate ?? a.listingDate ?? "").localeCompare(b.subscriptionOpen ?? b.allotmentDate ?? b.listingDate ?? "")
  );
  const stageBySymbol = new Map(sortedIpos.map((ipo) => [ipo.symbol, getIpoStage(ipo, today)]));
  const marginRecords = [...tracker.margin.records].sort((a, b) => (b.oversubscriptionRatio ?? -1) - (a.oversubscriptionRatio ?? -1));
  const topMargin = marginRecords[0];
  const openCount = sortedIpos.filter((ipo) => stageBySymbol.get(ipo.symbol)?.label === "招股中").length;
  const selectedCalculatorIpo =
    sortedIpos.find((ipo) => ipo.symbol === calculatorSymbol) ??
    sortedIpos.find((ipo) => ipo.symbol === topMargin?.symbol) ??
    sortedIpos[0];
  const selectedCalculatorMargin = selectedCalculatorIpo ? marginBySymbol.get(selectedCalculatorIpo.symbol) : undefined;

  const toggleMarginDetails = (symbol: string) => {
    setExpandedMarginSymbols((previous) => {
      const next = new Set(previous);
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  };

  const openCalculator = (symbol: string) => {
    setCalculatorSymbol(symbol);
    setCalculatorLots(1);
  };

  const shareIpo = async (ipo: IpoCalendarItem, margin?: IpoMarginRecord) => {
    const text = `${ipo.symbolHk} ${ipo.name}｜${getIpoStage(ipo, today).label}｜超购 ${formatRatio(margin?.oversubscriptionRatio)}｜上市 ${formatDateOnly(ipo.listingDate)}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSymbol(ipo.symbol);
      window.setTimeout(() => setCopiedSymbol(null), 1600);
    } catch {
      setCopiedSymbol(null);
    }
  };

  return (
    <div className="page-stack">
      <section className="command-panel ipo-hero" aria-label="ipo monitor">
        <div className="command-copy">
          <p className="eyebrow">IPO market radar</p>
          <h2>IPO 监控雷达</h2>
          <p>港股新股日历与 A 股发行动态放在同一个 IPO 工作台里，先按市场切换，再看日历、募资、费用和上市节奏。</p>
        </div>
        <div className="command-metrics" aria-label="ipo summary">
          <Metric label="新股条目" value={String(tracker.count)} />
          <Metric label="招股中" value={String(openCount)} />
          <Metric label="A股发行动态" value={formatCount(aShare?.total)} />
          <Metric label="A股发行中" value={formatCount(getAShareStatusCount(aShare, "启动发行") + getAShareStatusCount(aShare, "发行中"))} />
        </div>
      </section>

      <section className="ipo-market-switch" aria-label="ipo market switch">
        <button type="button" className={activeMarket === "hk" ? "active" : ""} onClick={() => setActiveMarket("hk")}>
          <Landmark size={15} />
          港股 IPO
        </button>
        <button type="button" className={activeMarket === "aShare" ? "active" : ""} onClick={() => setActiveMarket("aShare")}>
          <Building2 size={15} />
          A股发行动态
        </button>
      </section>

      {activeMarket === "aShare" ? (
        <AShareIpoPanel aShare={aShare} />
      ) : (
        <HkIpoPanel
          tracker={tracker}
          today={today}
          activeFilter={activeFilter}
          setActiveFilter={setActiveFilter}
          sortedIpos={sortedIpos}
          stageBySymbol={stageBySymbol}
          marginBySymbol={marginBySymbol}
          marginRecords={marginRecords}
          expandedMarginSymbols={expandedMarginSymbols}
          copiedSymbol={copiedSymbol}
          selectedCalculatorIpo={selectedCalculatorIpo}
          selectedCalculatorMargin={selectedCalculatorMargin}
          calculatorLots={calculatorLots}
          setCalculatorLots={setCalculatorLots}
          onToggleMarginDetails={toggleMarginDetails}
          onShareIpo={shareIpo}
          onOpenCalculator={openCalculator}
        />
      )}
    </div>
  );
}
