import { Plus, Trash2 } from 'lucide-react';
import { NumberField, SelectionField } from './FormControls.jsx';

const MATERIAL_CATEGORIES = ['全部', '作物', '瓷器', '素材'];

export function ManualMaterialsEditor({ materialOptions, materials, onAdd, onRemove, onUpdate }) {
  return (
    <section className="workspace-panel material-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Additional Materials</span>
          <h2>額外素材</h2>
          <p>若任務直接需要一般素材或作物，可在此補充。系統會與每日任務合併計算，避免重複統計。</p>
        </div>
      </div>

      <div className="entry-list">
        {materials.map((material, index) => (
          <div className="entry-row entry-row--manual" key={material.id}>
            <div className="entry-index">{index + 1}</div>
            <SelectionField
              label="分類"
              value={material.category ?? '全部'}
              onChange={(value) => {
                onUpdate(material.id, 'category', value);
                onUpdate(material.id, 'name', '');
              }}
            >
              {MATERIAL_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </SelectionField>
            <SelectionField
              label="素材名稱"
              value={material.name}
              onChange={(value) => onUpdate(material.id, 'name', value)}
            >
              <option value="">選擇素材</option>
              {filterMaterialOptions(materialOptions, material).map((option) => (
                <option key={option.name} value={option.name}>
                  {option.label}
                </option>
              ))}
            </SelectionField>
            <NumberField label="數量" value={material.quantity} onChange={(value) => onUpdate(material.id, 'quantity', value)} />
            <button className="icon-only danger" type="button" onClick={() => onRemove(material.id)} title="移除素材">
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="panel-actions">
        <button className="button button--secondary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" size={17} />
          新增素材
        </button>
      </div>
    </section>
  );
}

function filterMaterialOptions(materialOptions, material) {
  const category = material.category ?? '全部';

  return materialOptions.filter((option) => category === '全部' || option.category === category);
}
