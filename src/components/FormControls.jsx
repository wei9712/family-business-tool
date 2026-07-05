export function SelectionField({ children, label, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select className="control" value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
    </label>
  );
}

export function NumberField({ label, max, min = 1, onChange, value }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="control"
        max={max}
        min={min}
        step="1"
        type="number"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
