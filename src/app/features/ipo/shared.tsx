import { Metric } from "../../components/ui";
import type { IpoStage } from "./ipoTypes";

export function IpoHeroSkeleton({ status = "读取中" }: { status?: string }) {
  return (
    <section className="command-panel ipo-hero" aria-label="ipo monitor">
      <div className="command-copy">
        <p className="eyebrow">IPO market radar</p>
        <h2>IPO 监控雷达</h2>
        <p>正在同步港股新股日历和 A 股发行动态。</p>
      </div>
      <div className="command-metrics" aria-label="ipo summary">
        <Metric label="数据源" value="TradeSmart" />
        <Metric label="A股" value="投行之声" />
        <Metric label="日历" value="AAStocks" />
        <Metric label="接口状态" value={status} />
      </div>
    </section>
  );
}

export function IpoStageBadge({ stage }: { stage: IpoStage }) {
  return <em className={`status-chip ${stage.tone}`}>{stage.label}</em>;
}

export function SourceRow({ label, value, href }: { label: string; value: string; href?: string }) {
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
