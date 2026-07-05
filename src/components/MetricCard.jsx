export function MetricCard({ icon: Icon, label, meta, value, tone = 'default' }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__top">
        <div className="metric-icon">
          <Icon aria-hidden="true" size={20} />
        </div>
        {meta ? <span className="metric-chip">{meta}</span> : null}
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
