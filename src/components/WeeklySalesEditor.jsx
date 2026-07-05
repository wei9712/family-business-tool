import { Store } from 'lucide-react';
import { SelectionField } from './FormControls.jsx';

export function WeeklySalesEditor({ dishOptions, onChange, salesPlan, value, wineOptions }) {
  return (
    <section className="workspace-panel sales-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Weekly Sales</span>
          <h2>每週販售規劃</h2>
          <p>選擇本週系統推薦販售的酒水與菜品。未選擇時，不會將販售需求納入素材與種植計算。</p>
        </div>
        <div className="sales-capacity">
          <Store aria-hidden="true" size={18} />
          <span>{salesPlan.salesCapacity} 份容量</span>
        </div>
      </div>

      <div className="sales-grid">
        <SelectionField label="推薦酒水" value={value.wineRecipeId} onChange={(nextValue) => onChange('wineRecipeId', nextValue)}>
          <option value="">不計算酒水販售</option>
          {wineOptions.map((option) => (
            <option key={option.id} value={option.id}>
              Lv.{option.level} 酒水：{option.name}
            </option>
          ))}
        </SelectionField>
        <SelectionField label="推薦菜品" value={value.dishRecipeId} onChange={(nextValue) => onChange('dishRecipeId', nextValue)}>
          <option value="">不計算菜品販售</option>
          {dishOptions.map((option) => (
            <option key={option.id} value={option.id}>
              Lv.{option.level} 菜品：{option.name}
            </option>
          ))}
        </SelectionField>
      </div>
    </section>
  );
}
