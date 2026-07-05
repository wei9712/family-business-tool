import { Plus, Trash2 } from 'lucide-react';

export function ManualMaterialsEditor({ cropTimes, materials, onAdd, onRemove, onUpdate }) {
  return (
    <section className="panel panel--wide">
      <div className="panel-header">
        <div>
          <h2>額外素材</h2>
          <p>任務若直接要求素材，可以在這裡輸入，作物會自動轉成種植需求。</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" size={17} />
          新增
        </button>
      </div>

      <div className="form-stack">
        {materials.map((material) => (
          <div className="entry-row entry-row--manual" key={material.id}>
            <label>
              <span>素材名稱</span>
              <input
                list="known-materials"
                placeholder="例如：土豆、粗礦石、原木"
                type="text"
                value={material.name}
                onChange={(event) => onUpdate(material.id, 'name', event.target.value)}
              />
            </label>
            <label className="quantity-field">
              <span>數量</span>
              <input
                min="1"
                step="1"
                type="number"
                value={material.quantity}
                onChange={(event) => onUpdate(material.id, 'quantity', event.target.value)}
              />
            </label>
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
