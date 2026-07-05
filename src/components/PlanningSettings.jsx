import { Gauge, Sprout, UsersRound, Wheat } from 'lucide-react';
import { NumberField, SelectionField } from './FormControls.jsx';
import { getFieldCountForBusinessLevel, getGuestCapForBusinessLevel } from '../utils/planner.js';

export function PlanningSettings({ gatheringPlan, settings, onChange }) {
  const fieldCount = getFieldCountForBusinessLevel(settings.businessLevel);
  const guestCap = getGuestCapForBusinessLevel(settings.businessLevel);

  return (
    <section className="settings-workspace">
      <div className="settings-summary">
        <div className="settings-level">
          <span>家業等級</span>
          <strong>{settings.businessLevel}</strong>
        </div>
        <div className="settings-insights">
          <Fact icon={Sprout} label="農田" value={`${fieldCount} 塊`} />
          <Fact icon={UsersRound} label="莊客上限" value={`${guestCap} 位`} />
          <Fact icon={Wheat} label="單田種子" value="16 顆" />
          <Fact label="採集人手" value={`${gatheringPlan?.recommendedGatherers ?? 0} / ${gatheringPlan?.maxGatherers ?? 0} 位`} />
        </div>
      </div>

      <div className="settings-controls">
        <div className="control-group">
          <div className="control-group__title">
            <Gauge aria-hidden="true" size={16} />
            <span>營運條件</span>
          </div>
          <div className="control-grid">
            <SelectionField label="家業等級" value={settings.businessLevel} onChange={(value) => onChange('businessLevel', value)}>
              {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                <option key={level} value={level}>
                  {level} 等，{getFieldCountForBusinessLevel(level)} 塊農田
                </option>
              ))}
            </SelectionField>
            <NumberField label="販售席位" max="24" value={settings.seatCount} onChange={(value) => onChange('seatCount', value)} />
            <NumberField label="週販售時數" value={settings.weeklySalesHours} onChange={(value) => onChange('weeklySalesHours', value)} />
          </div>
        </div>

        <div className="control-group control-group--soft">
          <div className="control-group__title">
            <UsersRound aria-hidden="true" size={16} />
            <span>效率假設</span>
          </div>
          <div className="control-grid">
            <SelectionField
              label="採集效率"
              value={settings.materialEfficiencyLevel}
              onChange={(value) => onChange('materialEfficiencyLevel', value)}
            >
              <option value="1">1 等，102%</option>
              <option value="2">2 等，105%</option>
              <option value="3">3 等，107%</option>
              <option value="4">4 等，110%</option>
            </SelectionField>
            <SelectionField
              label="販售員工效率"
              value={settings.employeeEfficiencyLevel}
              onChange={(value) => onChange('employeeEfficiencyLevel', value)}
            >
              <option value="1">1 等，102%</option>
              <option value="2">2 等，105%</option>
              <option value="3">3 等，107%</option>
              <option value="4">4 等，110%</option>
            </SelectionField>
            <label className="toggle-card">
              <input
                checked={settings.fertilizerEnabled}
                type="checkbox"
                onChange={(event) => onChange('fertilizerEnabled', event.target.checked)}
              />
              <span>
                <strong>使用肥料</strong>
                單顆種子產量向上取整後 +10%
              </span>
            </label>
            <label className="toggle-card">
              <input
                checked={settings.wateringEnabled}
                type="checkbox"
                onChange={(event) => onChange('wateringEnabled', event.target.checked)}
              />
              <span>
                <strong>使用澆水</strong>
                種植等待時間減少 20%
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
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
