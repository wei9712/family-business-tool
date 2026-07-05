import { Boxes, ClipboardList, Route } from 'lucide-react';
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
  return (
    <section className="results-board" aria-label="計算結果">
      <ResultGroup
        icon={Route}
        kicker="Operation"
        title="營運建議"
        description="先看販售與採集怎麼分配，確認本週主路線是否合理。"
      >
        <ResultTable
          title="推薦販售方案"
          description="依目前家業等級優先推薦同等級品項，席位採酒水偏多、菜品偏少的初估配置。"
          columns={SALES_COLUMNS}
          rows={salesPlan.rows}
          variant="featured"
        />
        <ResultTable
          title="採集人手配置"
          description="非種植素材最多 3 位莊客協助採集，系統依工作量估算合理人手與等待時間。"
          columns={GATHERING_COLUMNS}
          rows={gatheringPlan.rows}
        />
      </ResultGroup>

      <ResultGroup
        icon={Boxes}
        kicker="Inventory"
        title="素材盤點"
        description="檢查任務與販售合併後會消耗哪些素材，並展開加工品。"
      >
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
      </ResultGroup>

      <ResultGroup
        icon={ClipboardList}
        kicker="Production"
        title="生產排程"
        description="把作物、種子、批次與非種植素材採集時間分開看，方便安排順序。"
      >
        <ResultTable
          title="種植規劃"
          description="作物依單顆種子產量、農田數與肥料設定，估算種子數、批次、時間與餘量。"
          columns={CROP_COLUMNS}
          rows={plan.cropNeeds}
          variant="wide"
        />
        <ResultTable
          title="非種植素材"
          description="無法種植的素材以基礎產出與效率等級換算採集時間，木頭類素材用每小時 10 個。"
          columns={MATERIAL_COLUMNS}
          rows={plan.unresolvedMaterials}
          variant="wide"
        />
      </ResultGroup>
    </section>
  );
}

function ResultGroup({ children, description, icon: Icon, kicker, title }) {
  return (
    <section className="result-group">
      <div className="result-group__header">
        <div className="result-group__icon">
          <Icon aria-hidden="true" size={18} />
        </div>
        <div>
          <span>{kicker}</span>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </div>
      <div className="result-group__grid">{children}</div>
    </section>
  );
}
