export function MetricCard({ icon: Icon, label, value, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-icon">
        <Icon aria-hidden="true" size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
