import { Gauge, Settings2, Sprout, UsersRound } from 'lucide-react';
import { getFieldCountForBusinessLevel, getGuestCapForBusinessLevel } from '../utils/planner.js';

export function PlanningSettings({ gatheringPlan, settings, onChange }) {
  return (
    <aside className="panel settings-panel">
      <div className="settings-heading">
        <div className="panel-icon">
          <Settings2 aria-hidden="true" size={20} />
        </div>
        <div>
          <h2>規劃設定</h2>
          <p>先用少量參數估算，後續可改成依客棧等級自動帶入。</p>
        </div>
      </div>

      <div className="settings-focus">
        <span>家業等級</span>
        <strong>{settings.businessLevel}</strong>
        <small>{getFieldCountForBusinessLevel(settings.businessLevel)} 塊農田，莊客上限 {getGuestCapForBusinessLevel(settings.businessLevel)} 位</small>
      </div>

      <div className="settings-grid">
        <div className="settings-group">
          <div className="settings-group__title">
            <Gauge aria-hidden="true" size={16} />
            <span>營運基準</span>
          </div>
          <label>
            <span>家業等級</span>
            <select value={settings.businessLevel} onChange={(event) => onChange('businessLevel', event.target.value)}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                <option key={level} value={level}>
                  {level} 等，{getFieldCountForBusinessLevel(level)} 塊農田
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>販售席位</span>
            <input
              max="24"
              min="1"
              step="1"
              type="number"
              value={settings.seatCount}
              onChange={(event) => onChange('seatCount', event.target.value)}
            />
          </label>
          <label>
            <span>週販售時數</span>
            <input
              min="1"
              step="1"
              type="number"
              value={settings.weeklySalesHours}
              onChange={(event) => onChange('weeklySalesHours', event.target.value)}
            />
          </label>
        </div>

        <div className="settings-group settings-group--muted">
          <div className="settings-group__title">
            <UsersRound aria-hidden="true" size={16} />
            <span>效率假設</span>
          </div>
          <label>
            <span>採集效率</span>
            <select value={settings.materialEfficiencyLevel} onChange={(event) => onChange('materialEfficiencyLevel', event.target.value)}>
              <option value="1">1 等，102%</option>
              <option value="2">2 等，105%</option>
              <option value="3">3 等，107%</option>
              <option value="4">4 等，110%</option>
            </select>
          </label>

          <label>
            <span>販售員工效率</span>
            <select value={settings.employeeEfficiencyLevel} onChange={(event) => onChange('employeeEfficiencyLevel', event.target.value)}>
              <option value="1">1 等，102%</option>
              <option value="2">2 等，105%</option>
              <option value="3">3 等，107%</option>
              <option value="4">4 等，110%</option>
            </select>
          </label>

          <label className="toggle-row">
            <input
              checked={settings.fertilizerEnabled}
              type="checkbox"
              onChange={(event) => onChange('fertilizerEnabled', event.target.checked)}
            />
            <span>使用肥料，單顆種子產量向上取整後 +10%</span>
          </label>
        </div>
      </div>

      <div className="fact-strip">
        <Fact icon={Sprout} label="農田" value={`${getFieldCountForBusinessLevel(settings.businessLevel)} 塊`} />
        <Fact icon={UsersRound} label="莊客上限" value={`${getGuestCapForBusinessLevel(settings.businessLevel)} 位`} />
        <Fact label="單田種子" value="16 顆" />
        <Fact label="採集人手" value={`${gatheringPlan?.recommendedGatherers ?? 0} / ${gatheringPlan?.maxGatherers ?? 0} 位`} />
        <Fact label="一般素材" value="5 / 小時" />
        <Fact label="木頭素材" value="10 / 小時" />
      </div>
    </aside>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="fact">
      {Icon ? <Icon aria-hidden="true" size={16} /> : null}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
