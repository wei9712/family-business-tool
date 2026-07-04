import { formatMoney } from '../utils/formatMoney.js';

export function ItemsTable({ currency, items }) {
  return (
    <section className="table-section">
      <div className="section-title">
        <h2>明細資料</h2>
        <p>由 JSON 載入後即時計算每筆結餘</p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>名稱</th>
              <th>分類</th>
              <th>收入</th>
              <th>成本</th>
              <th>結餘</th>
              <th>備註</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{formatMoney(item.revenue, currency)}</td>
                <td>{formatMoney(item.cost, currency)}</td>
                <td className={item.revenue - item.cost >= 0 ? 'positive' : 'negative'}>
                  {formatMoney(item.revenue - item.cost, currency)}
                </td>
                <td>{item.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
