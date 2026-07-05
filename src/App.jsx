import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, FlaskConical, Hammer, RefreshCw, Utensils } from 'lucide-react';
import { ManualMaterialsEditor } from './components/ManualMaterialsEditor.jsx';
import { MetricCard } from './components/MetricCard.jsx';
import { PlannerResults } from './components/PlannerResults.jsx';
import { PlanningSettings } from './components/PlanningSettings.jsx';
import { TaskEditor } from './components/TaskEditor.jsx';
import { WeeklySalesEditor } from './components/WeeklySalesEditor.jsx';
import { loadPlannerData } from './data/loadPlannerData.js';
import {
  calculateTaskPlan,
  calculateTotalCropHours,
  calculateTotalMaterialHours,
  createGatheringPlan,
  createOperationsPlan,
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

const initialWeeklySales = {
  wineRecipeId: '',
  dishRecipeId: '',
};

const initialSettings = {
  businessLevel: 1,
  fertilizerEnabled: false,
  wateringEnabled: true,
  materialEfficiencyLevel: 1,
  seatCount: 6,
  weeklySalesHours: 168,
  employeeEfficiencyLevel: 1,
};

function createMaterialOptions(data) {
  const optionMap = new Map();

  data.ceramics.forEach((item) => {
    optionMap.set(item.品項名稱, {
      label: `Lv.${item.等級} 瓷器：${item.品項名稱}`,
      name: item.品項名稱,
      sort: `1-${String(item.等級).padStart(2, '0')}-${item.品項名稱}`,
    });
  });

  data.cropTimes.forEach((crop) => {
    optionMap.set(crop.作物名稱, {
      label: `Lv.${crop.等級} 作物：${crop.作物名稱}`,
      name: crop.作物名稱,
      sort: `2-${String(crop.等級).padStart(2, '0')}-${crop.作物名稱}`,
    });
  });

  [...data.dishes, ...data.wines, ...data.ceramics].forEach((item) => {
    item.材料.forEach((material) => {
      if (!optionMap.has(material.名稱)) {
        optionMap.set(material.名稱, {
          label: `素材：${material.名稱}`,
          name: material.名稱,
          sort: `3-${material.名稱}`,
        });
      }
    });
  });

  return [...optionMap.values()].sort((a, b) => a.sort.localeCompare(b.sort, 'zh-Hant'));
}

export function App() {
  const [plannerData, setPlannerData] = useState(null);
  const [tasks, setTasks] = useState([createEmptyTask()]);
  const [manualMaterials, setManualMaterials] = useState([createEmptyMaterial()]);
  const [weeklySales, setWeeklySales] = useState(initialWeeklySales);
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
  const wineOptions = useMemo(() => recipeOptions.filter((option) => option.type === '酒水'), [recipeOptions]);
  const dishOptions = useMemo(() => recipeOptions.filter((option) => option.type === '菜品'), [recipeOptions]);
  const materialOptions = useMemo(() => (plannerData ? createMaterialOptions(plannerData) : []), [plannerData]);
  const salesPlan = useMemo(() => (plannerData ? createSalesPlan(plannerData, settings, weeklySales) : null), [plannerData, settings, weeklySales]);
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
  const taskOnlyPlan = useMemo(() => {
    if (!plannerData) {
      return null;
    }

    return calculateTaskPlan(tasks, manualMaterials, plannerData, planningSettings, []);
  }, [manualMaterials, plannerData, planningSettings, tasks]);
  const salesOnlyPlan = useMemo(() => {
    if (!plannerData || !salesPlan) {
      return null;
    }

    return calculateTaskPlan([], [], plannerData, planningSettings, salesPlan.rows);
  }, [plannerData, planningSettings, salesPlan]);

  const totalCropHours = plan ? calculateTotalCropHours(plan.cropNeeds) : 0;
  const totalMaterialHours = plan ? calculateTotalMaterialHours(plan.unresolvedMaterials) : 0;
  const gatheringPlan = plan ? createGatheringPlan(plan.unresolvedMaterials, settings) : null;
  const operationsPlan =
    plan && taskOnlyPlan && salesOnlyPlan && salesPlan
      ? createOperationsPlan({ plan, salesOnlyPlan, salesPlan, settings, taskOnlyPlan })
      : null;
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

  function updateWeeklySales(field, value) {
    setWeeklySales((currentSales) => ({
      ...currentSales,
      [field]: value,
    }));
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="app-header">
          <div>
            <p className="eyebrow">Weekly Planning Workspace</p>
            <h1>家業週任務規劃工具</h1>
            <p>
              建立本週任務、設定營運條件，系統將自動推算最佳販售方案、素材需求、採集配置與種植規劃，協助快速完成每週家業安排。
            </p>
          </div>
          <button className="button button--primary" type="button" onClick={refreshData}>
            <RefreshCw aria-hidden="true" size={18} />
            重新載入資料
          </button>
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

        {status === 'ready' && plannerData && plan && taskOnlyPlan && salesOnlyPlan && salesPlan && gatheringPlan && operationsPlan && (
          <div className="workflow">
            <section className="workflow-section workflow-section--settings">
              <SectionHeader
                step="01"
                eyebrow="Configuration"
                title="規劃設定"
                description="設定本週營運條件，包含家業等級、販售席位、採集效率與種植相關參數。所有分析結果都會依據這些設定即時重新計算。"
              />
              <PlanningSettings gatheringPlan={gatheringPlan} settings={settings} onChange={updateSetting} />
            </section>

            <section className="workflow-section workflow-section--input">
              <SectionHeader
                step="02"
                eyebrow="Planning"
                title="任務規劃"
                description="新增本週需要完成的每日任務與額外素材需求。系統會自動展開加工流程、合併素材需求，並建立完整的生產規劃。"
              />
              <div className="input-grid">
                <WeeklySalesEditor
                  dishOptions={dishOptions}
                  salesPlan={salesPlan}
                  value={weeklySales}
                  wineOptions={wineOptions}
                  onChange={updateWeeklySales}
                />
                <TaskEditor
                  recipeOptions={recipeOptions}
                  tasks={tasks}
                  onAdd={addTask}
                  onRemove={removeTask}
                  onUpdate={updateTask}
                />
                <ManualMaterialsEditor
                  materialOptions={materialOptions}
                  materials={manualMaterials}
                  onAdd={addManualMaterial}
                  onRemove={removeManualMaterial}
                  onUpdate={updateManualMaterial}
                />
              </div>
            </section>

            <section className="workflow-section workflow-section--analysis">
              <SectionHeader
                step="03"
                eyebrow="Insights"
                title="分析結果"
                description="依照目前設定自動產生完整規劃。先查看摘要，再切換各分析頁籤檢視詳細資料，降低閱讀負擔並快速掌握重點。"
              />
              <section className="summary-grid" aria-label="規劃摘要">
                <MetricCard icon={Utensils} label="已選任務" meta="任務池" value={`${selectedTaskCount} 項`} tone="leaf" />
                <MetricCard icon={FlaskConical} label="建議販售" meta={`${settings.seatCount} 席位`} value={`${salesPlan.totalSales} 份`} tone="amber" />
                <MetricCard icon={Clock3} label="種植等待" meta={`${fieldCount} 農田`} value={`${totalCropHours} 小時`} tone="sky" />
                <MetricCard
                  icon={Hammer}
                  label="採集等待"
                  meta={`${totalMaterialHours} 人工時`}
                  value={`${gatheringPlan.elapsedHours} 小時`}
                  tone="rose"
                />
              </section>
              <PlannerResults
                gatheringPlan={gatheringPlan}
                operationsPlan={operationsPlan}
                plan={plan}
                salesOnlyPlan={salesOnlyPlan}
                salesPlan={salesPlan}
                taskOnlyPlan={taskOnlyPlan}
              />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ description, eyebrow, step, title }) {
  return (
    <div className="section-heading">
      <span>{step}</span>
      <div>
        <small>{eyebrow}</small>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
