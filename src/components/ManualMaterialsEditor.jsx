import { Plus, Trash2 } from 'lucide-react';
import { NumberField, SelectionField } from './FormControls.jsx';

export function ManualMaterialsEditor({ cropTimes, materials, onAdd, onRemove, onUpdate }) {
  return (
    <section className="workspace-panel material-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Material input</span>
          <h2>額外素材</h2>
          <p>若週任務直接要求一般素材或作物，可以在這裡補上，並沿用同一套輸入元件。</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" size={17} />
          新增素材
        </button>
      </div>

      <div className="entry-list">
        {materials.map((material, index) => (
          <div className="entry-row entry-row--manual" key={material.id}>
            <div className="entry-index">{index + 1}</div>
            <SelectionField
              label="素材名稱"
              list="known-materials"
              placeholder="例如：土豆、粗礦石、原木"
              value={material.name}
              onChange={(value) => onUpdate(material.id, 'name', value)}
            />
            <NumberField label="數量" value={material.quantity} onChange={(value) => onUpdate(material.id, 'quantity', value)} />
            <button className="icon-only danger" type="button" onClick={() => onRemove(material.id)} title="移除素材">
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>

      <datalist id="known-materials">
        {cropTimes.map((crop) => (
          <option key={crop.作物名稱} value={crop.作物名稱} />
        ))}
      </datalist>
    </section>
  );
}
