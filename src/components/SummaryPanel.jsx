import { TrendingDown, TrendingUp, WalletCards } from 'lucide-react';
import { formatMoney } from '../utils/formatMoney.js';

const metrics = [
  {
    key: 'revenue',
    label: '總收入',
    icon: TrendingUp,
  },
  {
    key: 'cost',
    label: '總成本',
    icon: TrendingDown,
  },
  {
    key: 'profit',
    label: '結餘',
    icon: WalletCards,
  },
];

export function SummaryPanel({ currency, summary }) {
  return (
    <section className="summary-grid" aria-label="計算摘要">
      {metrics.map((metric) => {
        const Icon = metric.icon;

        return (
          <article className="metric-card" key={metric.key}>
            <div className="metric-icon">
              <Icon aria-hidden="true" size={20} />
            </div>
            <div>
              <p>{metric.label}</p>
              <strong>{formatMoney(summary[metric.key], currency)}</strong>
            </div>
          </article>
        );
      })}
    </section>
  );
}
