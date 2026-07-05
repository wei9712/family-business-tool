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
                <th key={column.key}>
                  <span className="column-heading">
                    <span>{column.label}</span>
                    {column.help && (
                      <span aria-label={column.help} className="column-help" role="img" tabIndex={0} title={column.help}>
                        ?
                      </span>
                    )}
                  </span>
                </th>
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
                    <td key={column.key}>{formatCell(row[column.key], column)}</td>
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

function formatCell(value, column) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  if (column.type === 'tag') {
    return <span className={`source-tag source-tag--${getTagTone(value)}`}>{value}</span>;
  }

  return value;
}

function getTagTone(value) {
  if (value === '販售') {
    return 'sales';
  }

  if (value === '任務') {
    return 'task';
  }

  if (value === '瓶頸' || value === '有瓶頸') {
    return 'warning';
  }

  if (value === '可完成' || value === '可維持') {
    return 'success';
  }

  return 'neutral';
}
