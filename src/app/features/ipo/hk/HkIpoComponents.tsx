import { Calculator, CheckCircle2, ChevronDown, ExternalLink, Share2 } from "lucide-react";
import type { IpoCalendarItem, IpoMarginRecord, IpoTrackerResponse } from "../../../../shared/types";
import { Metric, StatusChip } from "../../../components/ui";
import { IpoStageBadge } from "../shared";
import {
  buildAllocationEstimates,
  buildDateWindow,
  clampNumber,
  estimateAllocation,
  formatDateOnly,
  formatDateRange,
  formatHkd,
  formatHkdYi,
  formatHongKongDateTime,
  formatLotSize,
  formatRatio,
  formatTimelineDate,
  formatWeekday,
  getCashBackDate,
  getDarkMarketDate,
  getIpoStage,
  isDateInRange
} from "../ipoUtils";

export function IpoPulseCard({
  record,
  ipo,
  expanded,
  copied,
  onToggleDetails,
  onShare,
  onOpenCalculator
}: {
  record: IpoMarginRecord;
  ipo?: IpoCalendarItem;
  expanded: boolean;
  copied: boolean;
  onToggleDetails: () => void;
  onShare: (ipo: IpoCalendarItem) => void;
  onOpenCalculator: (symbol: string) => void;
}) {
  const publicOfferEstimate = record.marginTotalHkdYi != null && record.oversubscriptionRatio ? record.marginTotalHkdYi / record.oversubscriptionRatio : null;
  const estimates = buildAllocationEstimates(record, ipo);

  return (
    <article className="ipo-pulse-card">
      <div className="ipo-pulse-title">
        <span>
          <strong>{record.symbolHk}</strong>
          <em>{record.name}</em>
        </span>
        <div className="ipo-card-actions">
          {ipo && (
            <button type="button" title="分享" onClick={() => onShare(ipo)}>
              {copied ? <CheckCircle2 size={15} /> : <Share2 size={15} />}
            </button>
          )}
          <StatusChip>{formatRatio(record.oversubscriptionRatio)}</StatusChip>
        </div>
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
      <div className="ipo-allocation-grid">
        {estimates.slice(0, 3).map((estimate) => (
          <div className="ipo-allocation-card" key={estimate.label}>
            <span>{estimate.label}</span>
            <strong>{estimate.result}</strong>
            <em>{estimate.lots.toLocaleString("zh-CN")} 手</em>
          </div>
        ))}
      </div>
      {expanded && (
        <div className="ipo-allocation-grid expanded">
          {estimates.slice(3).map((estimate) => (
            <div className="ipo-allocation-card" key={estimate.label}>
              <span>{estimate.label}</span>
              <strong>{estimate.result}</strong>
              <em>{estimate.lots.toLocaleString("zh-CN")} 手</em>
            </div>
          ))}
        </div>
      )}
      <div className="ipo-pulse-actions">
        <button type="button" onClick={onToggleDetails}>
          <ChevronDown className={expanded ? "flip" : ""} size={15} />
          {expanded ? "收起乙组" : "展开乙1-4"}
        </button>
        {ipo && (
          <button type="button" onClick={() => onOpenCalculator(ipo.symbol)}>
            <Calculator size={15} />
            细调手数
          </button>
        )}
      </div>
    </article>
  );
}

export function IpoCalendarRow({
  ipo,
  margin,
  today,
  onOpenCalculator
}: {
  ipo: IpoCalendarItem;
  margin?: IpoMarginRecord;
  today: string;
  onOpenCalculator: (symbol: string) => void;
}) {
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
      <div className="ipo-row-actions">
        <button type="button" onClick={() => onOpenCalculator(ipo.symbol)}>
          <Calculator size={14} />
          估算
        </button>
        {ipo.aastocksUrl && (
          <a href={ipo.aastocksUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={14} />
            原始
          </a>
        )}
      </div>
    </div>
  );
}

export function IpoTimelinePanel({
  ipos,
  grid,
  today
}: {
  ipos: IpoCalendarItem[];
  grid: IpoTrackerResponse["grid"];
  today: string;
}) {
  const dates = grid.dates.length > 0 ? grid.dates : buildDateWindow(today, 15);

  return (
    <section className="panel ipo-timeline-panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">15 day timeline</p>
          <h2>15 日时间轴</h2>
        </div>
        <span className="timeline-range">{formatDateOnly(dates[0])} - {formatDateOnly(dates.at(-1))}</span>
      </div>
      <div className="ipo-timeline-scroll">
        <div className="ipo-timeline-head" style={{ gridTemplateColumns: `180px repeat(${dates.length}, 44px)` }}>
          <span />
          {dates.map((date) => (
            <strong className={date === today ? "today" : ""} key={date}>
              {formatTimelineDate(date)}
              <em>{formatWeekday(date)}</em>
            </strong>
          ))}
        </div>
        {ipos.map((ipo) => (
          <div className="ipo-timeline-line" style={{ gridTemplateColumns: `180px repeat(${dates.length}, 44px)` }} key={ipo.symbol}>
            <span className="timeline-company">
              <b>{ipo.name}</b>
              <em>{ipo.symbolHk}</em>
            </span>
            {dates.map((date) => (
              <IpoTimelineCell key={`${ipo.symbol}-${date}`} ipo={ipo} date={date} />
            ))}
          </div>
        ))}
      </div>
      <div className="timeline-legend">
        <span><i className="phase-subscribe" />招股期</span>
        <span><i className="phase-cash" />资金回笼</span>
        <span><i className="phase-dark" />暗盘</span>
        <span><i className="phase-listing" />上市日</span>
        <span><i className="phase-key" />关键日</span>
      </div>
    </section>
  );
}

function IpoTimelineCell({ ipo, date }: { ipo: IpoCalendarItem; date: string }) {
  const keyEvent = ipo.events.find((event) => event.date === date);
  const isSubscribe = isDateInRange(date, ipo.subscriptionOpen, ipo.subscriptionClose);
  const isCashBack = getCashBackDate(ipo) === date;
  const isDark = getDarkMarketDate(ipo) === date;

  if (ipo.listingDate === date) {
    return <span className="timeline-cell phase-listing" title="上市日">市</span>;
  }
  if (isDark) {
    return <span className="timeline-cell phase-dark" title="暗盘">暗</span>;
  }
  if (isCashBack) {
    return <span className="timeline-cell phase-cash" title="资金回笼">回</span>;
  }
  if (keyEvent) {
    return <span className="timeline-cell phase-key" title={keyEvent.label}>{keyEvent.code}</span>;
  }
  if (isSubscribe) {
    return <span className="timeline-cell phase-subscribe" title="招股期" />;
  }
  return <span className="timeline-cell" />;
}

export function IpoCalculatorPanel({
  ipo,
  margin,
  lots,
  setLots
}: {
  ipo?: IpoCalendarItem;
  margin?: IpoMarginRecord;
  lots: number;
  setLots: (lots: number) => void;
}) {
  const estimate = estimateAllocation(lots, margin?.oversubscriptionRatio);
  const capital = ipo?.entryFeeHkd != null ? ipo.entryFeeHkd * lots : null;

  return (
    <div className="panel ipo-calculator-panel">
      <div className="panel-head compact">
        <div>
          <p className="eyebrow">subscription calculator</p>
          <h2>中签率模拟器</h2>
        </div>
        <Calculator size={20} />
      </div>
      {ipo ? (
        <>
          <div className="calculator-target">
            <strong>{ipo.name}</strong>
            <span>{ipo.symbolHk} · 超购 {formatRatio(margin?.oversubscriptionRatio)}</span>
          </div>
          <label className="lot-slider">
            <span>申购手数</span>
            <input type="range" min="1" max="2500" step="1" value={lots} onChange={(event) => setLots(Number(event.target.value))} />
            <input type="number" min="1" max="2500" value={lots} onChange={(event) => setLots(clampNumber(Number(event.target.value), 1, 2500))} />
          </label>
          <div className="mini-metrics">
            <Metric label="冻结资金" value={formatHkd(capital)} />
            <Metric label="估算机会" value={estimate.result} />
            <Metric label="公开发售" value={formatHkdYi(margin?.marginTotalHkdYi && margin.oversubscriptionRatio ? margin.marginTotalHkdYi / margin.oversubscriptionRatio : null)} />
          </div>
          <p className="panel-note">这是按超购倍数反推的粗略模型，用来比较手数，不替代正式配售公告。</p>
        </>
      ) : (
        <div className="empty-state">暂无可模拟的新股</div>
      )}
    </div>
  );
}

export function IpoFaq() {
  const items = [
    ["此日历多久更新一次？", "日历源标注为每日两次；孖展公开数据通常按小时刷新，本站接口会实时抓取页面结构化数据。"],
    ["代码是什么意思？", "O 为招股开始，P 为招股中，C 为截止，F 为定价，A 为公布中签，L 为上市。"],
    ["资金什么时候回笼？", "页面按公布中签前一天下午推算未中签资金回笼，具体到账以券商为准。"],
    ["暗盘是什么？", "暗盘通常发生在正式上市前一晚，是部分券商提供的场外交易参考。"],
    ["如何估算中签概率？", "用孖展总额和超购倍数反推公开发售规模，再按手数做近似概率比较。"]
  ];
  return (
    <div className="faq-list">
      {items.map(([question, answer]) => (
        <details key={question}>
          <summary>{question}</summary>
          <p>{answer}</p>
        </details>
      ))}
    </div>
  );
}
