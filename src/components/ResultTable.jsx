export function ResultTable({ columns, description, rows, title, variant = 'standard' }) {
  return (
    <section className={`result-card result-card--${variant}`}>
      <div className="panel-header panel-header--table">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="table-count">{rows.length} 筆</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={columns.length}>
                  目前沒有資料
                </td>
              </tr>
            ) : (
              rows.map((row, rowIndex) => (
                <tr key={`${row.name ?? row.recipeId ?? title}-${rowIndex}`}>
                  {columns.map((column) => (
                    <td key={column.key}>{formatCell(row[column.key])}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatCell(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  return value;
}
