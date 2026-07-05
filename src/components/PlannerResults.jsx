import { useMemo, useState } from 'react';
import { Boxes, ClipboardList, Hammer, Route, Store } from 'lucide-react';
import { ResultTable } from './ResultTable.jsx';

const SALES_COLUMNS = [
  { key: 'type', label: '類型' },
  { key: 'name', label: '推薦品項' },
  { key: 'level', label: '等級' },
  { key: 'seats', label: '席位' },
  { key: 'quantity', label: '販售數量' },
  { key: 'saleMinutes', label: '每份時間（分鐘）' },
  { key: 'saleRounds', label: '販售輪次' },
  { key: 'elapsedSalesHours', label: '販售時數（小時）' },
];

const GATHERING_COLUMNS = [
  { key: 'industry', label: '產業', type: 'tag' },
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '需求數量' },
  { key: 'productionHours', label: '人工時數（小時）' },
  { key: 'workSharePercent', label: '工作占比' },
  { key: 'estimatedElapsedHours', label: '等待時間（小時）' },
];

const OPERATIONS_MATERIAL_COLUMNS = [
  { key: 'industry', label: '產業', type: 'tag', help: '素材所屬的採集產業。同一產業目前最多可同時安排 3 位莊客。' },
  { key: 'name', label: '採集品項', help: '遊戲內實際要派人採集的素材名稱。' },
  { key: 'priority', label: '優先序', help: '同一產業內建議先處理的順序，數字越小越優先。' },
  { key: 'salesWorkerHours', label: '販售採集工時（小時）', help: '為了維持每週販售品項不中斷，這個素材需要投入的採集工時。像肉類出現在這欄，代表本週販售的菜品或酒水配方會消耗肉類。' },
  { key: 'taskWorkerHours', label: '任務採集工時（小時）', help: '本週任務與額外素材造成的採集工時，不含每週販售需求。' },
  { key: 'totalWorkerHours', label: '總採集工時（小時）', help: '販售採集工時加上任務採集工時。' },
  { key: 'recommendedGatherers', label: '起手人手', help: '建議一開始先安排在這個品項的人數。完成後會依優先序輪替到其他品項。' },
  { key: 'maxGatherers', label: '產業上限', help: '這個品項所屬產業目前最多可同時安排的人數。' },
  { key: 'elapsedHours', label: '等待時間（小時）', help: '依起手人手與輪替規則估算，完成這個品項需求大約需要的小時數。' },
  { key: 'status', label: '狀態', type: 'tag', help: '可完成表示目前時間窗內可完成；排隊表示同產業人手已滿，需等前面品項完成後輪替；瓶頸表示目前設定下超出產能。' },
];

const OPERATIONS_CROP_COLUMNS = [
  { key: 'name', label: '作物' },
  { key: 'salesQuantity', label: '販售需求' },
  { key: 'taskQuantity', label: '任務需求' },
  { key: 'quantity', label: '總需求' },
  { key: 'seedsNeeded', label: '種子數' },
  { key: 'batchesNeeded', label: '批次' },
  { key: 'elapsedHours', label: '等待時間（小時）' },
  { key: 'status', label: '狀態', type: 'tag' },
];

const SIMPLE_MATERIAL_COLUMNS = [
  { key: 'source', label: '來源', type: 'tag' },
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '數量' },
];

const CROP_COLUMNS = [
  { key: 'source', label: '來源', type: 'tag' },
  { key: 'name', label: '作物' },
  { key: 'quantity', label: '需求產量' },
  { key: 'level', label: '等級' },
  { key: 'yieldPerSeed', label: '單顆產量' },
  { key: 'seedsNeeded', label: '種子數' },
  { key: 'batchesNeeded', label: '批次' },
  { key: 'hoursPerSeed', label: '單批時間（小時）' },
  { key: 'elapsedHours', label: '等待時間（小時）' },
  { key: 'expectedYield', label: '預估產量' },
  { key: 'surplus', label: '剩餘數量' },
];

const MATERIAL_COLUMNS = [
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '數量' },
  { key: 'efficiencyPercent', label: '效率 %' },
  { key: 'baseHourlyOutput', label: '基礎 / 小時' },
  { key: 'hourlyOutput', label: '實際 / 小時' },
  { key: 'productionHours', label: '人工作業時數（小時）' },
];

export function PlannerResults({ gatheringPlan, operationsPlan, plan, salesOnlyPlan, salesPlan, taskOnlyPlan }) {
  const [activeTab, setActiveTab] = useState('operations');
  const tabs = useMemo(
    () => [
      {
        id: 'operations',
        label: '營運建議',
        icon: Route,
        count: operationsPlan.bottlenecks.length,
        content: <OperationsAnalysis operationsPlan={operationsPlan} />,
      },
      {
        id: 'sales',
        label: '販售分析',
        icon: Store,
        count: salesPlan.rows.length,
        content: <SalesAnalysis salesPlan={salesPlan} />,
      },
      {
        id: 'gathering',
        label: '採集分析',
        icon: Hammer,
        count: gatheringPlan.rows.length,
        content: <GatheringAnalysis gatheringPlan={gatheringPlan} />,
      },
      {
        id: 'materials',
        label: '素材分析',
        icon: Boxes,
        count: plan.rawMaterials.length,
        content: <MaterialAnalysis plan={plan} salesOnlyPlan={salesOnlyPlan} taskOnlyPlan={taskOnlyPlan} />,
      },
      {
        id: 'crops',
        label: '種植分析',
        icon: ClipboardList,
        count: plan.cropNeeds.length,
        content: <CropAnalysis plan={plan} salesOnlyPlan={salesOnlyPlan} taskOnlyPlan={taskOnlyPlan} />,
      },
    ],
    [gatheringPlan, operationsPlan, plan, salesOnlyPlan, salesPlan, taskOnlyPlan],
  );
  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content ?? tabs[0].content;

  return (
    <section className="analysis-board" aria-label="分析結果">
      <div className="analysis-tabs" role="tablist" aria-label="分析分類">
        {tabs.map((tab) => {
          const Icon = tab.icon;

          return (
            <button
              aria-selected={activeTab === tab.id}
              className="analysis-tab"
              key={tab.id}
              role="tab"
              type="button"
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon aria-hidden="true" size={17} />
              <span>{tab.label}</span>
              <strong>{tab.count}</strong>
            </button>
          );
        })}
      </div>

      <div className="analysis-content" role="tabpanel">
        {activeContent}
      </div>
    </section>
  );
}

function OperationsAnalysis({ operationsPlan }) {
  const activeMaterialRows = operationsPlan.materialRows.filter((row) => row.totalWorkerHours > 0);
  const cropRows = operationsPlan.cropRows.filter((row) => row.quantity > 0);
  const statusNote =
    operationsPlan.status === '可維持'
      ? '目前週產能可覆蓋販售與任務需求'
      : operationsPlan.status === '未設定販售'
        ? '未選擇本週販售品項，僅評估任務需求'
        : `需優先處理：${operationsPlan.bottlenecks.join('、')}`;

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="整體狀態" value={operationsPlan.status} note={statusNote} tone={operationsPlan.status === '可維持' ? 'primary' : 'neutral'} />
        <InsightCard
          label="建議採集人手"
          value={`${operationsPlan.recommendedGatherers} 位`}
          note={`${operationsPlan.guestCap} 位莊客上限，依產業分配`}
        />
        <InsightCard
          label="週期等待"
          value={`${Math.max(operationsPlan.gatheringElapsedHours, operationsPlan.totalCropHours)} 小時`}
          note={`採集 ${operationsPlan.gatheringElapsedHours} 小時，種植 ${operationsPlan.totalCropHours} 小時`}
        />
      </div>
      <ResultTable
        title="品項人手安排"
        description="依照遊戲內可操作的採集品項估算起手人手。同一產業最多 3 位莊客，品項完成後再依優先序把人手輪替到下一個素材。"
        columns={OPERATIONS_MATERIAL_COLUMNS}
        rows={activeMaterialRows}
      />
      <ResultTable
        title="作物產能檢查"
        description="將販售維持需求與任務需求合併檢查，評估目前農田與肥料設定是否能在時間窗內完成。"
        columns={OPERATIONS_CROP_COLUMNS}
        rows={cropRows}
        variant="wide"
      />
    </>
  );
}

function SalesAnalysis({ salesPlan }) {
  const topSale = salesPlan.rows[0];

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="本週可販售" value={`${salesPlan.totalSales} 份`} note={`${salesPlan.seatCount} 席位，${salesPlan.weeklySalesHours} 小時`} tone="primary" />
        <InsightCard label="本週販售品項" value={topSale?.name ?? '尚未設定'} note={topSale ? `${topSale.type}，Lv.${topSale.level}` : '未選擇時不納入素材計算'} />
        <InsightCard label="每份耗時" value={`${salesPlan.saleMinutes} 分鐘`} note={`員工效率 ${salesPlan.employeeEfficiencyPercent}%`} />
      </div>
      <ResultTable
        title="推薦販售方案"
        description="依據目前家業等級、販售席位與任務需求，自動推薦本週最佳販售配置與預估販售時間。"
        columns={SALES_COLUMNS}
        rows={salesPlan.rows}
        variant="featured"
      />
    </>
  );
}

function GatheringAnalysis({ gatheringPlan }) {
  const topMaterial = [...gatheringPlan.rows].sort((a, b) => b.productionHours - a.productionHours)[0];
  const activeIndustries = gatheringPlan.industryPlans.filter((plan) => plan.totalWorkerHours > 0);

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="建議採集人手" value={`${gatheringPlan.recommendedGatherers} 位`} note={`依 ${activeIndustries.length} 個產業分配，每產業最多 3 位`} tone="primary" />
        <InsightCard label="採集等待" value={`${gatheringPlan.elapsedHours} 小時`} note={`${gatheringPlan.totalWorkerHours} 人工作業時數，可跨產業並行`} />
        <InsightCard label="主要壓力素材" value={topMaterial?.name ?? '尚無'} note={topMaterial ? `${topMaterial.industry}，${topMaterial.workSharePercent}% 產業占比` : '沒有非種植素材'} />
      </div>
      <ResultTable
        title="採集配置"
        description="依據素材所屬產業分別估算採集工作量，每個產業目前最多可配置 3 位莊客並行採集。"
        columns={GATHERING_COLUMNS}
        rows={gatheringPlan.rows}
      />
    </>
  );
}

function MaterialAnalysis({ plan, salesOnlyPlan, taskOnlyPlan }) {
  const directMaterials = withSourceRows(taskOnlyPlan.directMaterials, salesOnlyPlan.directMaterials);
  const rawMaterials = withSourceRows(taskOnlyPlan.rawMaterials, salesOnlyPlan.rawMaterials);

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="直接素材種類" value={`${plan.directMaterials.length} 種`} note="任務與販售第一層需求" tone="primary" />
        <InsightCard label="原始素材種類" value={`${plan.rawMaterials.length} 種`} note="加工品展開後總盤點" />
        <InsightCard label="非種植素材" value={`${plan.unresolvedMaterials.length} 種`} note="需採集或其他來源取得" />
      </div>
      <ResultTable
        title="直接需求素材"
        description="整合每日任務、額外素材與本週販售規劃後，統計第一層直接需要準備的素材與加工品。"
        columns={SIMPLE_MATERIAL_COLUMNS}
        rows={directMaterials}
        variant="compact"
      />
      <ResultTable
        title="原始素材需求"
        description="將所有加工品展開至最終原始素材，並以標籤標示需求來自任務或販售。"
        columns={SIMPLE_MATERIAL_COLUMNS}
        rows={rawMaterials}
        variant="compact"
      />
      <ResultTable
        title="非種植素材需求"
        description="依據目前採集效率換算一般素材與木頭素材的需求量與工作時間。"
        columns={MATERIAL_COLUMNS}
        rows={plan.unresolvedMaterials}
      />
    </>
  );
}

function CropAnalysis({ plan, salesOnlyPlan, taskOnlyPlan }) {
  const totalSeeds = plan.cropNeeds.reduce((total, crop) => total + crop.seedsNeeded, 0);
  const maxWait = plan.cropNeeds.reduce((max, crop) => Math.max(max, crop.elapsedHours), 0);
  const topCrop = [...plan.cropNeeds].sort((a, b) => b.quantity - a.quantity)[0];
  const cropNeeds = withSourceRows(taskOnlyPlan.cropNeeds, salesOnlyPlan.cropNeeds);

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="作物種類" value={`${plan.cropNeeds.length} 種`} note="需要安排種植的作物" tone="primary" />
        <InsightCard label="種子總數" value={`${totalSeeds} 顆`} note="依需求量與單顆產量估算" />
        <InsightCard label="最長等待" value={`${maxWait} 小時`} note={topCrop ? `主要作物：${topCrop.name}` : '尚無作物需求'} />
      </div>
      <ResultTable
        title="種植規劃"
        description="依據需求來源、農田數量、單批生長時間與肥料設定，估算種子需求、批次、等待時間與預估產量。"
        columns={CROP_COLUMNS}
        rows={cropNeeds}
        variant="wide"
      />
    </>
  );
}

function withSourceRows(taskRows, salesRows) {
  return [
    ...taskRows.map((row) => ({ ...row, source: '任務' })),
    ...salesRows.map((row) => ({ ...row, source: '販售' })),
  ];
}

function InsightCard({ label, note, tone = 'neutral', value }) {
  return (
    <article className={`insight-card insight-card--${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{note}</p>
    </article>
  );
}
