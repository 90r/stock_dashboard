import { ArrowRight, CalendarClock, Filter, Landmark, Radio } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { IpoCalendarItem, IpoMarginRecord, IpoTrackerResponse } from "../../../../shared/types";
import { InfoPanel, Signal } from "../../../components/ui";
import type { IpoFilter, IpoStage } from "../ipoTypes";
import { filterIpos, formatDateOnly, formatHongKongDateTime } from "../ipoUtils";
import { SourceRow } from "../shared";
import { IpoCalculatorPanel, IpoCalendarRow, IpoFaq, IpoPulseCard, IpoTimelinePanel } from "./HkIpoComponents";

export function HkIpoPanel({
  tracker,
  today,
  activeFilter,
  setActiveFilter,
  sortedIpos,
  stageBySymbol,
  marginBySymbol,
  marginRecords,
  expandedMarginSymbols,
  copiedSymbol,
  selectedCalculatorIpo,
  selectedCalculatorMargin,
  calculatorLots,
  setCalculatorLots,
  onToggleMarginDetails,
  onShareIpo,
  onOpenCalculator
}: {
  tracker: IpoTrackerResponse;
  today: string;
  activeFilter: IpoFilter;
  setActiveFilter: Dispatch<SetStateAction<IpoFilter>>;
  sortedIpos: IpoCalendarItem[];
  stageBySymbol: Map<string, IpoStage>;
  marginBySymbol: Map<string, IpoMarginRecord>;
  marginRecords: IpoMarginRecord[];
  expandedMarginSymbols: Set<string>;
  copiedSymbol: string | null;
  selectedCalculatorIpo?: IpoCalendarItem;
  selectedCalculatorMargin?: IpoMarginRecord;
  calculatorLots: number;
  setCalculatorLots: (lots: number) => void;
  onToggleMarginDetails: (symbol: string) => void;
  onShareIpo: (ipo: IpoCalendarItem, margin?: IpoMarginRecord) => void;
  onOpenCalculator: (symbol: string) => void;
}) {
  const displayIpos = filterIpos(sortedIpos, activeFilter, stageBySymbol);
  const openCount = sortedIpos.filter((ipo) => stageBySymbol.get(ipo.symbol)?.label === "招股中").length;
  const pendingListingCount = sortedIpos.filter((ipo) => ["待上市", "等中签", "已公布"].includes(stageBySymbol.get(ipo.symbol)?.label ?? "")).length;
  const listedCount = sortedIpos.filter((ipo) => stageBySymbol.get(ipo.symbol)?.label === "已挂牌").length;

  return (
    <>
      <section className="flow-strip" aria-label="ipo cash flow">
        <strong>资金流</strong>
        <span>招股截止</span>
        <ArrowRight size={14} />
        <span>资金冻结</span>
        <ArrowRight size={14} />
        <span>公布中签前一天下午回笼未中签资金</span>
        <ArrowRight size={14} />
        <span>暗盘</span>
        <ArrowRight size={14} />
        <span>09:00 正式挂牌</span>
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
                <IpoPulseCard
                  key={record.symbol}
                  record={record}
                  ipo={tracker.ipos.find((ipo) => ipo.symbol === record.symbol)}
                  expanded={expandedMarginSymbols.has(record.symbol)}
                  copied={copiedSymbol === record.symbol}
                  onToggleDetails={() => onToggleMarginDetails(record.symbol)}
                  onShare={(ipo) => onShareIpo(ipo, record)}
                  onOpenCalculator={onOpenCalculator}
                />
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

      <section className="ipo-filter-bar" aria-label="ipo filters">
        <Filter size={16} />
        <button type="button" className={activeFilter === "all" ? "active" : ""} onClick={() => setActiveFilter("all")}>
          全部 <strong>{sortedIpos.length}</strong>
        </button>
        <button type="button" className={activeFilter === "open" ? "active" : ""} onClick={() => setActiveFilter("open")}>
          招股中 <strong>{openCount}</strong>
        </button>
        <button type="button" className={activeFilter === "upcoming" ? "active" : ""} onClick={() => setActiveFilter("upcoming")}>
          即将上市 <strong>{pendingListingCount}</strong>
        </button>
        <button type="button" className={activeFilter === "listed" ? "active" : ""} onClick={() => setActiveFilter("listed")}>
          最新挂牌 <strong>{listedCount}</strong>
        </button>
      </section>

      <IpoTimelinePanel ipos={displayIpos} grid={tracker.grid} today={today} />

      <section className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">IPO detail cards</p>
            <h2>新股详情</h2>
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
            <IpoCalendarRow key={ipo.symbol} ipo={ipo} margin={marginBySymbol.get(ipo.symbol)} today={today} onOpenCalculator={onOpenCalculator} />
          ))}
        </div>
      </section>

      <section className="info-grid">
        <IpoCalculatorPanel ipo={selectedCalculatorIpo} margin={selectedCalculatorMargin} lots={calculatorLots} setLots={setCalculatorLots} />
        <InfoPanel title="热度判定" eyebrow="watch rules">
          <div className="signal-list">
            <Signal label="超购 1000x 以上" point={marginRecords.filter((record) => (record.oversubscriptionRatio ?? 0) >= 1000).length * 100} />
            <Signal label="孖展 1000 亿以上" point={marginRecords.filter((record) => (record.marginTotalHkdYi ?? 0) >= 1000).length * 100} />
            <Signal label="未来一周上市" point={pendingListingCount * 100} />
          </div>
          <p className="panel-note">孖展和超购是热度信号，不等于投资建议；实际申购仍要核对招股书、券商费率和资金占用。</p>
        </InfoPanel>
      </section>

      <section className="info-grid">
        <InfoPanel title="从日历到中签" eyebrow="calculator workflow">
          <p>先在这里筛 IPO 和观察资金日历，再用内置模拟器估算不同手数的冻结金额与近似概率。申购前再核对招股书、券商融资比例和手续费。</p>
          <div className="path-list">
            <span>挑选正在招股或即将上市的标的</span>
            <span>查看孖展总额和超额认购热度</span>
            <span>用手数模拟器估算资金占用和中签概率</span>
          </div>
        </InfoPanel>
        <InfoPanel title="延伸阅读与 FAQ" eyebrow="reference">
          <IpoFaq />
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
    </>
  );
}
