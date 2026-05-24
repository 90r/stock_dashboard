import { AlertTriangle, ArrowRight, Building2, CalendarClock, ExternalLink, Landmark } from "lucide-react";
import type { AShareIpoIssuanceItem } from "../../../../shared/types";
import type { AShareIpoLoadState } from "../../../appTypes";
import { ErrorState, InfoPanel, Loading, Metric } from "../../../components/ui";
import { IpoStageBadge, SourceRow } from "../shared";
import {
  averageNumber,
  formatCount,
  formatDateOnly,
  formatDays,
  formatPercentPoint,
  formatShanghaiDateTime,
  formatWanAmount,
  formatWanText,
  getAShareStage,
  getAShareStatusCount,
  maxPctTextValue,
  sumWanAmount
} from "../ipoUtils";

export function AShareIpoPanel({ state }: { state: AShareIpoLoadState }) {
  if (state.status === "idle" || state.status === "loading") {
    return <Loading label="采集 A 股发行动态" />;
  }

  if (state.status === "error") {
    return <ErrorState message={state.error} />;
  }

  const aShare = state.data;
  const rows = aShare?.items ?? [];
  const latestRows = rows.slice(0, 8);
  const inProgress = getAShareStatusCount(aShare, "启动发行") + getAShareStatusCount(aShare, "发行中");
  const success = getAShareStatusCount(aShare, "发行成功");
  const failed = getAShareStatusCount(aShare, "发行失败");
  const totalProceeds = sumWanAmount(rows.map((row) => row.totalProceeds));
  const totalCosts = sumWanAmount(rows.map((row) => row.issuanceCosts));
  const latest = rows[0];

  return (
    <>
      {aShare?.error && (
        <div className="banner" role="status">
          <AlertTriangle size={18} />
          <span>A股发行动态暂未取到实时数据：{aShare.error}</span>
        </div>
      )}

      <section className="workspace">
        <div className="panel feature-panel">
          <div className="panel-head compact">
            <div>
              <p className="eyebrow">A-share issuance</p>
              <h2>A股发行动态</h2>
            </div>
            <Building2 size={20} />
          </div>
          <div className="a-share-summary">
            <Metric label="发行动态总数" value={formatCount(aShare?.total)} />
            <Metric label="发行中" value={formatCount(inProgress)} />
            <Metric label="发行成功" value={formatCount(success)} />
            <Metric label="发行失败" value={formatCount(failed)} />
          </div>
          <div className="a-share-board-list" aria-label="board counts">
            {Object.entries(aShare?.boardCounts ?? {}).map(([board, count]) => (
              <div className="a-share-board-row" key={board}>
                <span>{board}</span>
                <strong>{count.toLocaleString("zh-CN")}</strong>
              </div>
            ))}
          </div>
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
            <SourceRow label="页面同步" value={formatShanghaiDateTime(aShare?.generatedAt)} />
            <SourceRow label="数据来源" value={aShare?.source ?? "投行之声"} href={aShare?.sourcePageUrl ?? "https://www.iposeek.com/ipo-review/new-stock"} />
            <SourceRow label="当前筛选" value={`${aShare?.filters.board ?? "全部"} / ${aShare?.filters.issuanceStatus ?? "全部"}`} />
            <SourceRow label="排序字段" value={`${aShare?.filters.sort ?? "issuanceStartDate"} ${aShare?.filters.order ?? "desc"}`} />
          </div>
          <div className="mini-metrics">
            <Metric label="本页募资合计" value={formatWanAmount(totalProceeds)} />
            <Metric label="本页费用合计" value={formatWanAmount(totalCosts)} />
            <Metric label="最新启动" value={formatDateOnly(latest?.issuanceStartDate)} />
          </div>
        </div>
      </section>

      <section className="flow-strip" aria-label="a share issuance flow">
        <strong>A股发行链路</strong>
        <span>启动发行</span>
        <ArrowRight size={14} />
        <span>询价 / 定价</span>
        <ArrowRight size={14} />
        <span>募资与费用确认</span>
        <ArrowRight size={14} />
        <span>上市</span>
      </section>

      <section className="panel">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">new stock issuance</p>
            <h2>发行动态明细</h2>
          </div>
          <CalendarClock size={20} />
        </div>
        {latestRows.length === 0 ? (
          <div className="empty-state">暂无 A 股发行动态数据</div>
        ) : (
          <div className="a-share-table">
            <div className="a-share-row header">
              <span>代码 / 简称</span>
              <span>板块</span>
              <span>状态</span>
              <span>启动 / 上市</span>
              <span>发行价 / PE</span>
              <span>募资 / 费用</span>
              <span>中介费用</span>
            </div>
            {latestRows.map((row) => (
              <AShareIpoRow key={`${row.id ?? row.shareCode}-${row.sequenceNo ?? row.shareCode}`} row={row} />
            ))}
          </div>
        )}
      </section>

      <section className="info-grid">
        <InfoPanel title="费用观察" eyebrow="fee mix">
          <div className="a-share-observation-list">
            <AShareObservationRow label="发行费用率最高" value={formatPercentPoint(maxPctTextValue(rows.map((row) => row.issuanceCostsRatio)))} meta="本页样本" />
            <AShareObservationRow label="承销保荐费率最高" value={formatPercentPoint(maxPctTextValue(rows.map((row) => row.sponsorshipFeeRatio)))} meta="本页样本" />
            <AShareObservationRow label="平均审核天数" value={formatDays(averageNumber(rows.map((row) => row.auditDays)))} meta="本页样本" />
          </div>
          <p className="panel-note">金额单位沿用投行之声口径：募资总额、发行费用等字段为万元。</p>
        </InfoPanel>
      </section>

      <footer className="footnote">
        <p>
          A股发行动态由本站 Worker 采集投行之声“首发上市动态”接口。原始页面：
          <a href={aShare?.sourcePageUrl ?? "https://www.iposeek.com/ipo-review/new-stock"} target="_blank" rel="noreferrer">
            投行之声发行动态
          </a>
          。
        </p>
      </footer>
    </>
  );
}

function AShareObservationRow({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="a-share-observation-row">
      <span>{label}</span>
      <strong>{value}</strong>
      <em>{meta}</em>
    </div>
  );
}

function AShareIpoRow({ row }: { row: AShareIpoIssuanceItem }) {
  return (
    <div className="a-share-row">
      <span className="ipo-name-cell">
        <strong>{row.shareCode || "--"}</strong>
        <em>{row.shareName || row.companyChineseName || "--"}</em>
      </span>
      <span className="ipo-date-stack">
        <em>{row.place || "--"}</em>
        <strong>{row.board || "--"}</strong>
      </span>
      <span>
        <IpoStageBadge stage={getAShareStage(row.issuanceStatus)} />
      </span>
      <span className="ipo-date-stack">
        <em>启动 {formatDateOnly(row.issuanceStartDate)}</em>
        <em>上市 {formatDateOnly(row.listDate)}</em>
      </span>
      <span className="ipo-date-stack">
        <em>{row.issuancePrice ? `¥${row.issuancePrice}` : "--"}</em>
        <em>PE {row.peRatio ?? "--"}</em>
      </span>
      <span className="ipo-date-stack">
        <em>{formatWanText(row.totalProceeds)}</em>
        <em>费用 {formatWanText(row.issuanceCosts)}</em>
      </span>
      <span className="ipo-date-stack">
        <em>承销 {formatWanText(row.sponsorshipFee)}</em>
        <em>律所 {formatWanText(row.lawyerFee)}</em>
      </span>
      {row.detailUrl && (
        <a className="a-share-row-link" href={row.detailUrl} target="_blank" rel="noreferrer" title="打开原始详情">
          <ExternalLink size={14} />
        </a>
      )}
    </div>
  );
}
