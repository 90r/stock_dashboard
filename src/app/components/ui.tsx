import { AlertTriangle, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { formatIndex } from "../utils/format";

export function InfoPanel({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
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

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export function Signal({ label, point }: { label: string; point: number | null | undefined }) {
  return (
    <div className="signal-row">
      <span>{label}</span>
      <strong>{formatIndex(point)}</strong>
      <em>{point == null ? "缺少基准" : point >= 130 ? "强" : point >= 100 ? "改善" : "偏弱"}</em>
    </div>
  );
}

export function StatusChip({ children }: { children: ReactNode }) {
  return <em className="status-chip">{children}</em>;
}

export function Loading({ label = "读取缓存数据" }: { label?: string }) {
  return (
    <div className="center-state">
      <RefreshCw className="spin" size={26} />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="center-state error">
      <AlertTriangle size={26} />
      <span>{message}</span>
    </div>
  );
}
