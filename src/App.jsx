import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, FlaskConical, Hammer, RefreshCw, Sparkles, Utensils } from 'lucide-react';
import { ManualMaterialsEditor } from './components/ManualMaterialsEditor.jsx';
import { MetricCard } from './components/MetricCard.jsx';
import { PlannerResults } from './components/PlannerResults.jsx';
import { PlanningSettings } from './components/PlanningSettings.jsx';
import { TaskEditor } from './components/TaskEditor.jsx';
import { loadPlannerData } from './data/loadPlannerData.js';
import {
  calculateTaskPlan,
  calculateTotalCropHours,
  calculateTotalMaterialHours,
  createGatheringPlan,
  createRecipeOptions,
  createSalesPlan,
  getFieldCountForBusinessLevel,
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

const initialSettings = {
  businessLevel: 1,
  fertilizerEnabled: false,
  materialEfficiencyLevel: 1,
  seatCount: 6,
  weeklySalesHours: 168,
  employeeEfficiencyLevel: 1,
};

export function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [tasks, setTasks] = useState([createEmptyTask()]);
  const [manualMaterials, setManualMaterials] = useState([createEmptyMaterial()]);
  const [settings, setSettings] = useState(initialSettings);
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

  const recipeOptions = useMemo(() => (plannerData ? createRecipeOptions(plannerData) : []), [plannerData]);
  const salesPlan = useMemo(() => (plannerData ? createSalesPlan(plannerData, settings) : null), [plannerData, settings]);
  const planningSettings = useMemo(
    () => ({
      ...settings,
      fieldCount: getFieldCountForBusinessLevel(settings.businessLevel),
    }),
    [settings],
  );

  const plan = useMemo(() => {
    if (!plannerData || !salesPlan) {
      return null;
    }

    return calculateTaskPlan(tasks, manualMaterials, plannerData, planningSettings, salesPlan.rows);
  }, [manualMaterials, plannerData, planningSettings, salesPlan, tasks]);

  const totalCropHours = plan ? calculateTotalCropHours(plan.cropNeeds) : 0;
  const totalMaterialHours = plan ? calculateTotalMaterialHours(plan.unresolvedMaterials) : 0;
  const gatheringPlan = plan ? createGatheringPlan(plan.unresolvedMaterials, settings) : null;
  const selectedTaskCount = tasks.filter((task) => task.recipeId && Number(task.quantity) > 0).length;
  const fieldCount = getFieldCountForBusinessLevel(settings.businessLevel);

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

  function updateSetting(field, value) {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [field]: value,
    }));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="hero-panel">
          <div className="hero-copy">
            <p className="eyebrow">Weekly Planning Console</p>
            <h1>家業週任務素材計算工具</h1>
            <p>
              輸入這週的菜品、酒水與額外素材，快速估算作物種植、採集人力、販售席位與總等待時間。
            </p>
          </div>
          <div className="hero-actions">
            <div className="hero-status">
              <Sparkles aria-hidden="true" size={18} />
              <span>目前以家業 {settings.businessLevel} 等估算</span>
            </div>
            <button className="button button--primary" type="button" onClick={refreshData}>
              <RefreshCw aria-hidden="true" size={18} />
              重新載入資料
            </button>
          </div>
        </header>

        {status === 'error' && (
          <div className="notice notice--error" role="alert">
            <AlertCircle aria-hidden="true" size={20} />
            <span>{error}</span>
          </div>
        )}

        {status === 'loading' && (
          <div className="notice">
            <RefreshCw aria-hidden="true" size={20} />
            <span>正在載入配方與作物資料...</span>
          </div>
        )}

        {status === 'ready' && plannerData && plan && salesPlan && gatheringPlan && (
          <>
            <section className="summary-grid" aria-label="規劃摘要">
              <MetricCard icon={Utensils} label="已選任務" meta="任務池" value={`${selectedTaskCount} 項`} tone="leaf" />
              <MetricCard icon={FlaskConical} label="建議販售" meta={`${settings.seatCount} 席位`} value={`${salesPlan.totalSales} 份`} tone="amber" />
              <MetricCard icon={Clock3} label="種植等待" meta={`${fieldCount} 農田`} value={`${totalCropHours} 小時`} tone="sky" />
              <MetricCard
                icon={Hammer}
                label="採集等待"
                meta={`${gatheringPlan.recommendedGatherers} 人手`}
                value={`${gatheringPlan.elapsedHours} 小時`}
                tone="rose"
              />
            </section>

            <section className="planner-grid">
              <div className="input-column">
                <TaskEditor
                  recipeOptions={recipeOptions}
                  tasks={tasks}
                  onAdd={addTask}
                  onRemove={removeTask}
                  onUpdate={updateTask}
                />
                <ManualMaterialsEditor
                  cropTimes={plannerData.cropTimes}
                  materials={manualMaterials}
                  onAdd={addManualMaterial}
                  onRemove={removeManualMaterial}
                  onUpdate={updateManualMaterial}
                />
              </div>
              <PlanningSettings gatheringPlan={gatheringPlan} settings={settings} onChange={updateSetting} />
            </section>

            <PlannerResults gatheringPlan={gatheringPlan} plan={plan} salesPlan={salesPlan} />
          </>
        )}
      </section>
    </main>
  );
}
