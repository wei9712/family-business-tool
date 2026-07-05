import { Plus, Trash2 } from 'lucide-react';
import { NumberField, SelectionField } from './FormControls.jsx';

export function TaskEditor({ recipeOptions, tasks, onAdd, onRemove, onUpdate }) {
  return (
    <section className="workspace-panel task-panel">
      <div className="panel-header">
        <div>
          <span className="panel-kicker">Daily Tasks</span>
          <h2>每日任務</h2>
          <p>選擇本週需要完成的菜品或酒水，系統將自動推算加工需求、販售數量與後續原始素材。</p>
        </div>
      </div>

      <div className="entry-list">
        {tasks.map((task, index) => (
          <div className="entry-row" key={task.id}>
            <div className="entry-index">{index + 1}</div>
            <SelectionField label="任務品項" value={task.recipeId} onChange={(value) => onUpdate(task.id, 'recipeId', value)}>
              <option value="">選擇菜品或酒水</option>
              {recipeOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  Lv.{option.level} {option.type}：{option.name}
                </option>
              ))}
            </SelectionField>
            <NumberField label="數量" value={task.quantity} onChange={(value) => onUpdate(task.id, 'quantity', value)} />
            <button className="icon-only danger" type="button" onClick={() => onRemove(task.id)} title="移除任務">
              <Trash2 aria-hidden="true" size={18} />
            </button>
          </div>
        ))}
      </div>
      <div className="panel-actions">
        <button className="button button--secondary" type="button" onClick={onAdd}>
          <Plus aria-hidden="true" size={17} />
          新增任務
        </button>
      </div>
    </section>
  );
}
