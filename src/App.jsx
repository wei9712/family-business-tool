import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, Clock3, FlaskConical, Hammer, Plus, RefreshCw, Sprout, Trash2, Utensils } from 'lucide-react';
import { loadPlannerData } from './data/loadPlannerData.js';
import {
  calculateTaskPlan,
  calculateTotalCropHours,
  calculateTotalMaterialHours,
  createGatheringPlan,
  createRecipeOptions,
  createSalesPlan,
  getFieldCountForBusinessLevel,
  getGuestCapForBusinessLevel,
} from './utils/planner.js';

const createEmptyTask = () => ({
  id: crypto.randomUUID(),
  recipeId: '',
  quantity: 1,
});

const createEmptyMaterial = () => ({
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
});

export function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [tasks, setTasks] = useState([createEmptyTask()]);
  const [manualMaterials, setManualMaterials] = useState([createEmptyMaterial()]);
  const [farmSettings, setFarmSettings] = useState({
    businessLevel: 1,
    fertilizerEnabled: false,
    materialEfficiencyLevel: 1,
    seatCount: 6,
    weeklySalesHours: 168,
    employeeEfficiencyLevel: 1,
  });
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  async function refreshData() {
    setStatus('loading');
    setError('');

    try {
      setPlannerData(await loadPlannerData());
      setStatus('ready');
    } catch (loadError) {
      setStatus('error');
      setError(loadError.message);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  const recipeOptions = useMemo(() => {
    if (!plannerData) {
      return [];
    }

    return createRecipeOptions(plannerData);
  }, [plannerData]);

  const salesPlan = useMemo(() => {
    if (!plannerData) {
      return null;
    }

    return createSalesPlan(plannerData, farmSettings);
  }, [plannerData, tasks, manualMaterials, farmSettings]);

  const farmPlanningSettings = useMemo(
    () => ({
      ...farmSettings,
      fieldCount: getFieldCountForBusinessLevel(farmSettings.businessLevel),
    }),
    [farmSettings],
  );

  const plan = useMemo(() => {
    if (!plannerData || !salesPlan) {
      return null;
    }

    return calculateTaskPlan(tasks, manualMaterials, plannerData, farmPlanningSettings, salesPlan.rows);
  }, [plannerData, tasks, manualMaterials, farmPlanningSettings, salesPlan]);

  const totalCropHours = plan ? calculateTotalCropHours(plan.cropNeeds) : 0;
  const totalMaterialHours = plan ? calculateTotalMaterialHours(plan.unresolvedMaterials) : 0;
  const gatheringPlan = plan ? createGatheringPlan(plan.unresolvedMaterials, farmSettings) : null;
  const totalSales = salesPlan ? salesPlan.totalSales : 0;
  const selectedTaskCount = tasks.filter((task) => task.recipeId && Number(task.quantity) > 0).length;

  function addTask() {
    setTasks((currentTasks) => [...currentTasks, createEmptyTask()]);
  }

  function updateTask(taskId, field, value) {
    setTasks((currentTasks) => currentTasks.map((task) => (task.id === taskId ? { ...task, [field]: value } : task)));
  }

  function removeTask(taskId) {
    setTasks((currentTasks) => (currentTasks.length === 1 ? [createEmptyTask()] : currentTasks.filter((task) => task.id !== taskId)));
  }

  function addManualMaterial() {
    setManualMaterials((currentMaterials) => [...currentMaterials, createEmptyMaterial()]);
  }

  function updateManualMaterial(materialId, field, value) {
    setManualMaterials((currentMaterials) =>
      currentMaterials.map((material) => (material.id === materialId ? { ...material, [field]: value } : material)),
    );
  }

  function removeManualMaterial(materialId) {
    setManualMaterials((currentMaterials) =>
      currentMaterials.length === 1 ? [createEmptyMaterial()] : currentMaterials.filter((material) => material.id !== materialId),
    );
  }

  function updateFarmSetting(field, value) {
    setFarmSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Weekly Task Planner</p>
            <h1>家業週任務素材計算</h1>
          </div>
          <button className="icon-button" type="button" onClick={refreshData} title="重新載入資料">
            <RefreshCw aria-hidden="true" size={18} />
            <span>重新載入</span>
          </button>
        </header>

        {status === 'error' && (
          <div className="notice error" role="alert">
            <AlertCircle aria-hidden="true" size={20} />
            <span>{error}</span>
          </div>
        )}

        {status === 'loading' && (
          <div className="notice">
            <RefreshCw aria-hidden="true" size={20} />
            <span>正在讀取菜品、酒水、瓷器與作物資料...</span>
          </div>
        )}

        {status === 'ready' && plannerData && plan && (
          <>
            <section className="summary-grid">
              <MetricCard icon={Utensils} label="已選任務" value={`${selectedTaskCount} 項`} />
              <MetricCard icon={FlaskConical} label="估計販售數" value={`${totalSales} 份`} />
              <MetricCard icon={Clock3} label="估計種植耗時" value={`${totalCropHours} 小時`} />
              <MetricCard icon={Hammer} label="建議採集耗時" value={`${gatheringPlan?.elapsedHours ?? 0} 小時`} />
            </section>

            <section className="planner-layout">
              <div className="tool-panel">
                <div className="section-title">
                  <div>
                    <h2>本週要完成的項目</h2>
                    <p>先選菜品或酒水，再輸入本週需要完成的數量。</p>
                  </div>
                  <button className="icon-button" type="button" onClick={addTask}>
                    <Plus aria-hidden="true" size={18} />
                    <span>新增</span>
                  </button>
                </div>

                <div className="task-list">
                  {tasks.map((task) => (
                    <div className="task-row" key={task.id}>
                      <label>
                        <span>項目</span>
                        <select value={task.recipeId} onChange={(event) => updateTask(task.id, 'recipeId', event.target.value)}>
                          <option value="">選擇菜品或酒水</option>
                          {recipeOptions.map((option) => (
                            <option key={option.id} value={option.id}>
                              Lv.{option.level} {option.type}｜{option.name}
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
                          onChange={(event) => updateTask(task.id, 'quantity', event.target.value)}
                        />
                      </label>
                      <button className="square-button" type="button" onClick={() => removeTask(task.id)} title="移除項目">
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="tool-panel">
                <div className="section-title">
                  <div>
                    <h2>額外素材</h2>
                    <p>任務若直接要求一般素材，可在這裡輸入名稱與數量。</p>
                  </div>
                  <button className="icon-button" type="button" onClick={addManualMaterial}>
                    <Plus aria-hidden="true" size={18} />
                    <span>新增</span>
                  </button>
                </div>

                <div className="task-list">
                  {manualMaterials.map((material) => (
                    <div className="task-row manual-row" key={material.id}>
                      <label>
                        <span>素材名稱</span>
                        <input
                          list="known-materials"
                          placeholder="例如：玉米、粗礦石"
                          type="text"
                          value={material.name}
                          onChange={(event) => updateManualMaterial(material.id, 'name', event.target.value)}
                        />
                      </label>
                      <label className="quantity-field">
                        <span>數量</span>
                        <input
                          min="1"
                          step="1"
                          type="number"
                          value={material.quantity}
                          onChange={(event) => updateManualMaterial(material.id, 'quantity', event.target.value)}
                        />
                      </label>
                      <button className="square-button" type="button" onClick={() => removeManualMaterial(material.id)} title="移除素材">
                        <Trash2 aria-hidden="true" size={18} />
                      </button>
                    </div>
                  ))}
                </div>
                <datalist id="known-materials">
                  {plannerData.cropTimes.map((crop) => (
                    <option key={crop.作物名稱} value={crop.作物名稱} />
                  ))}
                </datalist>
              </div>

              <aside className="placeholder-panel">
                <div className="placeholder-icon">
                  <Sprout aria-hidden="true" size={22} />
                </div>
                <h2>農田設定</h2>
                <p>農田數量依家業等級自動帶入；販售估算先用簡化席位與員工效率。</p>
                <div className="settings-stack">
                  <label>
                    <span>家業等級</span>
                    <select value={farmSettings.businessLevel} onChange={(event) => updateFarmSetting('businessLevel', event.target.value)}>
                      {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
                        <option key={level} value={level}>
                          {level} 等｜{getFieldCountForBusinessLevel(level)} 農田
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
                      value={farmSettings.seatCount}
                      onChange={(event) => updateFarmSetting('seatCount', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>每週營業小時</span>
                    <input
                      min="1"
                      step="1"
                      type="number"
                      value={farmSettings.weeklySalesHours}
                      onChange={(event) => updateFarmSetting('weeklySalesHours', event.target.value)}
                    />
                  </label>
                  <label className="toggle-row">
                    <input
                      checked={farmSettings.fertilizerEnabled}
                      type="checkbox"
                      onChange={(event) => updateFarmSetting('fertilizerEnabled', event.target.checked)}
                    />
                    <span>使用肥料，單次產量 +10%</span>
                  </label>
                  <label>
                    <span>素材效率等級</span>
                    <select
                      value={farmSettings.materialEfficiencyLevel}
                      onChange={(event) => updateFarmSetting('materialEfficiencyLevel', event.target.value)}
                    >
                      <option value="1">1 等｜102%</option>
                      <option value="2">2 等｜105%</option>
                      <option value="3">3 等｜107%</option>
                      <option value="4">4 等｜110%</option>
                    </select>
                  </label>
                  <label>
                    <span>員工效率等級</span>
                    <select
                      value={farmSettings.employeeEfficiencyLevel}
                      onChange={(event) => updateFarmSetting('employeeEfficiencyLevel', event.target.value)}
                    >
                      <option value="1">1 等｜102%</option>
                      <option value="2">2 等｜105%</option>
                      <option value="3">3 等｜107%（約 1 小時 2 分/份）</option>
                      <option value="4">4 等｜110%</option>
                    </select>
                  </label>
                </div>
                <div className="reserved-grid">
                  <span>目前農田</span>
                  <strong>{getFieldCountForBusinessLevel(farmSettings.businessLevel)} 個</strong>
                  <span>莊客上限</span>
                  <strong>{getGuestCapForBusinessLevel(farmSettings.businessLevel)} 位</strong>
                  <span>單田容量</span>
                  <strong>16 種子</strong>
                  <span>農田上限</span>
                  <strong>4 個</strong>
                  <span>建議採集</span>
                  <strong>{gatheringPlan?.recommendedGatherers ?? 0} 位</strong>
                  <span>採集上限</span>
                  <strong>{gatheringPlan?.maxGatherers ?? 0} 位</strong>
                  <span>一般素材</span>
                  <strong>5 / 小時</strong>
                  <span>木頭素材</span>
                  <strong>10 / 小時</strong>
                </div>
              </aside>

              <aside className="placeholder-panel">
                <div className="placeholder-icon">
                  <CalendarDays aria-hidden="true" size={22} />
                </div>
                <h2>客棧等級資料預留</h2>
                <p>這裡之後會接上客棧等級、人數、每日任務倍率，以及維持該等級需要賣出的食材資料。</p>
                <div className="reserved-grid">
                  <span>客棧等級</span>
                  <strong>待接資料</strong>
                  <span>人數/需求</span>
                  <strong>待接資料</strong>
                </div>
              </aside>
            </section>

            <section className="result-grid">
              <ResultTable
                title="推薦販售方案"
                description="依家業等級優先推薦同等級品項；席位約以酒水 2/3、菜品 1/3 分配，並選目前估算耗時較低的品項。"
                columns={[
                  { key: 'type', label: '類型' },
                  { key: 'name', label: '品項' },
                  { key: 'level', label: '等級' },
                  { key: 'seats', label: '席位' },
                  { key: 'quantity', label: '估計販售' },
                  { key: 'saleMinutes', label: '每份分鐘' },
                  { key: 'saleRounds', label: '販售輪次' },
                  { key: 'elapsedSalesHours', label: '並行耗時' },
                ]}
                rows={salesPlan.rows}
              />
              <ResultTable
                title="採集人力建議"
                description="非種植素材最多 3 位莊客同時採集；此表先用總工時平均分攤，作為初估排程。"
                columns={[
                  { key: 'name', label: '素材' },
                  { key: 'quantity', label: '數量' },
                  { key: 'productionHours', label: '單人耗時' },
                  { key: 'workSharePercent', label: '工時占比%' },
                  { key: 'estimatedElapsedHours', label: '建議耗時' },
                ]}
                rows={gatheringPlan.rows}
              />
              <ResultTable
                title="直接材料"
                description="依照你選的菜品/酒水配方直接相加，包含酒壺、瓷器或其他加工項。"
                columns={[
                  { key: 'name', label: '材料' },
                  { key: 'quantity', label: '數量' },
                ]}
                rows={plan.directMaterials}
              />
              <ResultTable
                title="展開後素材"
                description="會把酒水需要的瓷器繼續拆成粗礦石、原木等材料。"
                columns={[
                  { key: 'name', label: '素材' },
                  { key: 'quantity', label: '數量' },
                ]}
                rows={plan.rawMaterials}
              />
              <ResultTable
                title="作物時間"
                description="依照需求量、單次產量、農田數量與肥料設定反推種子數、輪次、預估產量與種植耗時。"
                columns={[
                  { key: 'name', label: '作物' },
                  { key: 'quantity', label: '需求數量' },
                  { key: 'level', label: '等級' },
                  { key: 'yieldPerSeed', label: '單次產量' },
                  { key: 'seedsNeeded', label: '種子數' },
                  { key: 'batchesNeeded', label: '輪次' },
                  { key: 'hoursPerSeed', label: '單次小時' },
                  { key: 'elapsedHours', label: '種植耗時' },
                  { key: 'expectedYield', label: '預估產量' },
                  { key: 'surplus', label: '多產' },
                ]}
                rows={plan.cropNeeds}
              />
              <ResultTable
                title="非種植素材產出"
                description="作物以外的素材先用一般 5/小時、木頭 10/小時計算，再套用素材效率等級。"
                columns={[
                  { key: 'name', label: '素材' },
                  { key: 'quantity', label: '數量' },
                  { key: 'efficiencyPercent', label: '效率' },
                  { key: 'baseHourlyOutput', label: '基礎/小時' },
                  { key: 'hourlyOutput', label: '實際/小時' },
                  { key: 'productionHours', label: '耗時' },
                ]}
                rows={plan.unresolvedMaterials}
              />
            </section>
          </>
        )}
      </section>
    </main>
  );
}

function MetricCard({ icon: Icon, label, value }) {
  return (
    <article className="metric-card">
      <div className="metric-icon">
        <Icon aria-hidden="true" size={20} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function ResultTable({ title, description, columns, rows }) {
  return (
    <section className="table-section compact-table">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>尚無資料</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.name}>
                  {columns.map((column) => (
                    <td key={column.key}>{row[column.key] ?? '-'}</td>
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
