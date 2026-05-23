import { ArrowRight, ListChecks } from "lucide-react";
import type { ModuleDefinition, ModuleId } from "../../appTypes";
import { StatusChip } from "../../components/ui";
import { moduleDefinitions } from "../../modules";

export function HomePage({ onNavigate }: { onNavigate: (moduleId: ModuleId) => void }) {
  const cards = moduleDefinitions.filter((module) => module.id !== "home");
  return (
    <div className="page-stack">
      <section className="module-card-grid home-modules" aria-label="monitor modules">
        {cards.map((module) => (
          <ModuleCard key={module.id} module={module} onSelect={() => onNavigate(module.id)} />
        ))}
      </section>

      <section className="panel monitor-queue-panel" aria-label="monitor queue">
        <div className="panel-head compact">
          <div>
            <p className="eyebrow">Monitor queue</p>
            <h2>监控队列</h2>
          </div>
          <ListChecks size={20} />
        </div>
        <div className="timeline-list wide">
          <TimelineRow label="韩国存储价格" meta="K-stat / Naver" status="运行中" tone="live" />
          <TimelineRow label="IPO 监控" meta="港股日历 / 孖展 / A股发行" status="运行中" tone="live" />
          <TimelineRow label="行业与宏观观察池" meta="汇率 / 利率 / 商品" status="观察池" tone="queued" />
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
