import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Clock3, FlaskConical, Hammer, RefreshCw, Utensils } from 'lucide-react';
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
  const materialOptions = useMemo(() => (plannerData ? createMaterialOptions(plannerData) : []), [plannerData]);
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
        <header className="app-header">
          <div>
            <p className="eyebrow">Weekly Planning Workspace</p>
            <h1>家業週任務素材規劃工具</h1>
            <p>先設定營運條件，再輸入任務，最後查看本週販售、採集、素材與種植分析。</p>
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

        {status === 'ready' && plannerData && plan && salesPlan && gatheringPlan && (
          <div className="workflow">
            <section className="workflow-section workflow-section--settings">
              <SectionHeader
                step="01"
                title="設定條件"
                description="這些條件會影響販售速度、農田容量、肥料產量與採集人手，先校準再開始輸入。"
              />
              <PlanningSettings gatheringPlan={gatheringPlan} settings={settings} onChange={updateSetting} />
            </section>

            <section className="workflow-section workflow-section--input">
              <SectionHeader
                step="02"
                title="輸入任務"
                description="任務品項與額外素材使用同一套輸入元件，降低操作成本，也方便後續擴充搜尋式選單。"
              />
              <div className="input-grid">
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
                title="查看分析結果"
                description="先看關鍵數字與洞察，再用頁籤查看完整明細，避免一次閱讀所有表格。"
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
              <PlannerResults gatheringPlan={gatheringPlan} plan={plan} salesPlan={salesPlan} />
            </section>
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeader({ description, step, title }) {
  return (
    <div className="section-heading">
      <span>{step}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
