import { Building2, CircleDollarSign, Newspaper, WalletCards } from "lucide-react";
import { Metric } from "../../components/ui";

export function WatchlistPage() {
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
          <Metric label="可复用组件" value="8" />
          <Metric label="数据状态" value="待接入" />
          <Metric label="优先级" value="待定" />
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

    </div>
  );
}
