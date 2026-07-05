import { Plus, Trash2 } from 'lucide-react';

export function TaskEditor({ recipeOptions, tasks, onAdd, onRemove, onUpdate }) {
  return (
    <section className="panel panel--wide">
      <div className="panel-header">
        <div>
          <h2>每日任務</h2>
          <p>選擇這週要完成的菜品或酒水，系統會展開加工品與原始素材。</p>
        </div>
        <button className="button button--secondary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" size={17} />
          新增
        </button>
      </div>

      <div className="form-stack">
        {tasks.map((task) => (
          <div className="entry-row" key={task.id}>
            <label>
              <span>任務品項</span>
              <select value={task.recipeId} onChange={(event) => onUpdate(task.id, 'recipeId', event.target.value)}>
                <option value="">選擇菜品或酒水</option>
                {recipeOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    Lv.{option.level} {option.type}：{option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="quantity-field">
              <span>數量</span>
              <input
                min="1"
                step="1"
                type="number"
                value={task.quantity}
                onChange={(event) => onUpdate(task.id, 'quantity', event.target.value)}
              />
            </label>
            <button className="icon-only danger" type="button" onClick={() => onRemove(task.id)} title="移除任務">
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
