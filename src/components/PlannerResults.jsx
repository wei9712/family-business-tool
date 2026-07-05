import { useMemo, useState } from 'react';
import { Boxes, ClipboardList, Hammer, Store } from 'lucide-react';
import { ResultTable } from './ResultTable.jsx';

const SALES_COLUMNS = [
  { key: 'type', label: '類型' },
  { key: 'name', label: '推薦品項' },
  { key: 'level', label: '等級' },
  { key: 'seats', label: '席位' },
  { key: 'quantity', label: '販售數量' },
  { key: 'saleMinutes', label: '每份分鐘' },
  { key: 'saleRounds', label: '販售輪次' },
  { key: 'elapsedSalesHours', label: '販售時數' },
];

const GATHERING_COLUMNS = [
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '數量' },
  { key: 'productionHours', label: '人工作業時數' },
  { key: 'workSharePercent', label: '工作占比 %' },
  { key: 'estimatedElapsedHours', label: '實際等待時數' },
];

const SIMPLE_MATERIAL_COLUMNS = [
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '數量' },
];

const CROP_COLUMNS = [
  { key: 'name', label: '作物' },
  { key: 'quantity', label: '需求產量' },
  { key: 'level', label: '等級' },
  { key: 'yieldPerSeed', label: '單顆產量' },
  { key: 'seedsNeeded', label: '種子數' },
  { key: 'batchesNeeded', label: '批次' },
  { key: 'hoursPerSeed', label: '單批小時' },
  { key: 'elapsedHours', label: '等待時數' },
  { key: 'expectedYield', label: '預估產量' },
  { key: 'surplus', label: '餘量' },
];

const MATERIAL_COLUMNS = [
  { key: 'name', label: '素材' },
  { key: 'quantity', label: '數量' },
  { key: 'efficiencyPercent', label: '效率 %' },
  { key: 'baseHourlyOutput', label: '基礎 / 小時' },
  { key: 'hourlyOutput', label: '實際 / 小時' },
  { key: 'productionHours', label: '人工作業時數' },
];

export function PlannerResults({ gatheringPlan, plan, salesPlan }) {
  const [activeTab, setActiveTab] = useState('sales');
  const tabs = useMemo(
    () => [
      {
        id: 'sales',
        label: '販售',
        icon: Store,
        count: salesPlan.rows.length,
        content: <SalesAnalysis salesPlan={salesPlan} />,
      },
      {
        id: 'gathering',
        label: '採集',
        icon: Hammer,
        count: gatheringPlan.rows.length,
        content: <GatheringAnalysis gatheringPlan={gatheringPlan} />,
      },
      {
        id: 'materials',
        label: '素材',
        icon: Boxes,
        count: plan.rawMaterials.length,
        content: <MaterialAnalysis plan={plan} />,
      },
      {
        id: 'crops',
        label: '種植',
        icon: ClipboardList,
        count: plan.cropNeeds.length,
        content: <CropAnalysis plan={plan} />,
      },
    ],
    [gatheringPlan, plan, salesPlan],
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

function SalesAnalysis({ salesPlan }) {
  const topSale = salesPlan.rows[0];

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="本週可販售" value={`${salesPlan.totalSales} 份`} note={`${salesPlan.seatCount} 席位，${salesPlan.weeklySalesHours} 小時`} tone="primary" />
        <InsightCard label="最佳方案" value={topSale?.name ?? '尚無'} note={topSale ? `${topSale.type}，Lv.${topSale.level}` : '尚無推薦品項'} />
        <InsightCard label="每份耗時" value={`${salesPlan.saleMinutes} 分鐘`} note={`員工效率 ${salesPlan.employeeEfficiencyPercent}%`} />
      </div>
      <ResultTable
        title="完整販售資料"
        description="席位以酒水偏多、菜品偏少作為初估，並以目前家業等級推薦品項。"
        columns={SALES_COLUMNS}
        rows={salesPlan.rows}
        variant="featured"
      />
    </>
  );
}

function GatheringAnalysis({ gatheringPlan }) {
  const topMaterial = [...gatheringPlan.rows].sort((a, b) => b.productionHours - a.productionHours)[0];

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="建議採集人手" value={`${gatheringPlan.recommendedGatherers} 位`} note={`最多可派 ${gatheringPlan.maxGatherers} 位`} tone="primary" />
        <InsightCard label="採集等待" value={`${gatheringPlan.elapsedHours} 小時`} note={`${gatheringPlan.totalWorkerHours} 人工作業時數`} />
        <InsightCard label="主要壓力素材" value={topMaterial?.name ?? '尚無'} note={topMaterial ? `${topMaterial.workSharePercent}% 工作占比` : '沒有非種植素材'} />
      </div>
      <ResultTable
        title="完整採集資料"
        description="非種植素材最多 3 位莊客協助採集，依工作量估算合理人手與等待時間。"
        columns={GATHERING_COLUMNS}
        rows={gatheringPlan.rows}
      />
    </>
  );
}

function MaterialAnalysis({ plan }) {
  return (
    <>
      <div className="insight-grid">
        <InsightCard label="直接素材種類" value={`${plan.directMaterials.length} 種`} note="任務與販售第一層需求" tone="primary" />
        <InsightCard label="原始素材種類" value={`${plan.rawMaterials.length} 種`} note="加工品展開後總盤點" />
        <InsightCard label="非種植素材" value={`${plan.unresolvedMaterials.length} 種`} note="需採集或其他來源取得" />
      </div>
      <div className="analysis-split">
        <ResultTable
          title="直接需求素材"
          description="每日任務與推薦販售方案合併後，第一層會直接用到的素材或加工品。"
          columns={SIMPLE_MATERIAL_COLUMNS}
          rows={plan.directMaterials}
          variant="compact"
        />
        <ResultTable
          title="展開後原始素材"
          description="加工品會繼續展開為原始素材，方便檢查總需求。"
          columns={SIMPLE_MATERIAL_COLUMNS}
          rows={plan.rawMaterials}
          variant="compact"
        />
      </div>
      <ResultTable
        title="非種植素材需求"
        description="無法種植的素材以基礎產出與效率等級換算採集時間，木頭類素材用每小時 10 個。"
        columns={MATERIAL_COLUMNS}
        rows={plan.unresolvedMaterials}
      />
    </>
  );
}

function CropAnalysis({ plan }) {
  const totalSeeds = plan.cropNeeds.reduce((total, crop) => total + crop.seedsNeeded, 0);
  const maxWait = plan.cropNeeds.reduce((max, crop) => Math.max(max, crop.elapsedHours), 0);
  const topCrop = [...plan.cropNeeds].sort((a, b) => b.quantity - a.quantity)[0];

  return (
    <>
      <div className="insight-grid">
        <InsightCard label="作物種類" value={`${plan.cropNeeds.length} 種`} note="需要安排種植的作物" tone="primary" />
        <InsightCard label="種子總數" value={`${totalSeeds} 顆`} note="依需求量與單顆產量估算" />
        <InsightCard label="最長等待" value={`${maxWait} 小時`} note={topCrop ? `主要作物：${topCrop.name}` : '尚無作物需求'} />
      </div>
      <ResultTable
        title="完整種植規劃"
        description="作物依單顆種子產量、農田數與肥料設定，估算種子數、批次、時間與餘量。"
        columns={CROP_COLUMNS}
        rows={plan.cropNeeds}
        variant="wide"
      />
    </>
  );
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
