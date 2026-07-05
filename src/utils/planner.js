const RECIPE_TYPES = {
  dishes: '菜品',
  wines: '酒水',
  ceramics: '瓷器',
};

const SEEDS_PER_FIELD = 16;
const MATERIAL_EFFICIENCY_BY_LEVEL = {
  1: 1.02,
  2: 1.05,
  3: 1.07,
  4: 1.1,
};
const BASE_SALE_MINUTES = 62 * MATERIAL_EFFICIENCY_BY_LEVEL[3];
const MAX_GATHERERS = 3;
const GATHERING_INDUSTRIES = ['漁獲', '獵獲', '石料', '林業'];
const FISHING_KEYWORDS = ['魚', '鱠', '蝦', '蟹', '貝', '蚌', '豚', '鰻', '鯉', '鯽', '鱸', '鱖', '鯿', '鰱', '鰍', '鱧', '鯚'];
const HUNTING_KEYWORDS = ['肉', '雞', '鴨', '鵝', '羊', '牛', '豬', '鹿', '兔', '禽', '蛋'];
const STONE_KEYWORDS = ['石', '礦', '玉', '銅', '鐵', '金', '銀', '錫', '鉛', '煤'];
const GUEST_CAP_BY_BUSINESS_LEVEL = {
  1: 10,
  2: 10,
  3: 15,
  4: 20,
  5: 30,
  6: 35,
  7: 45,
  8: 55,
  9: 65,
  10: 75,
};

export function createRecipeOptions(data) {
  return [
    ...data.dishes.map((item) => toRecipeOption(item, RECIPE_TYPES.dishes)),
    ...data.wines.map((item) => toRecipeOption(item, RECIPE_TYPES.wines)),
  ].sort((a, b) => a.level - b.level || a.type.localeCompare(b.type, 'zh-Hant') || a.name.localeCompare(b.name, 'zh-Hant'));
}

export function calculateTaskPlan(tasks, manualMaterials, data, farmSettings = {}, salesPlan = []) {
  const fieldCount = clampFieldCount(farmSettings.fieldCount);
  const fertilizerEnabled = Boolean(farmSettings.fertilizerEnabled);
  const materialEfficiencyLevel = clampMaterialEfficiencyLevel(farmSettings.materialEfficiencyLevel);
  const materialEfficiency = MATERIAL_EFFICIENCY_BY_LEVEL[materialEfficiencyLevel];
  const recipeMap = createRecipeMap(data);
  const cropMap = createCropMap(data.cropTimes);
  const directMaterials = new Map();
  const rawMaterials = new Map();
  const cropNeeds = new Map();
  const unresolvedMaterials = new Map();

  tasks.forEach((task) => {
    const recipe = recipeMap.get(task.recipeId);
    const quantity = toPositiveNumber(task.quantity);

    if (!recipe || quantity <= 0) {
      return;
    }

    recipe.item.材料.forEach((material) => {
      addAmount(directMaterials, material.名稱, material.數量 * quantity);
      expandMaterial(material.名稱, material.數量 * quantity, recipeMap, rawMaterials, cropMap, cropNeeds, unresolvedMaterials, [
        recipe.id,
      ]);
    });
  });

  salesPlan.forEach((sale) => {
    const recipe = recipeMap.get(sale.recipeId);
    const quantity = toPositiveNumber(sale.quantity);

    if (!recipe || quantity <= 0) {
      return;
    }

    recipe.item.材料.forEach((material) => {
      addAmount(directMaterials, material.名稱, material.數量 * quantity);
      expandMaterial(material.名稱, material.數量 * quantity, recipeMap, rawMaterials, cropMap, cropNeeds, unresolvedMaterials, [
        recipe.id,
      ]);
    });
  });

  manualMaterials.forEach((material) => {
    const name = material.name.trim();
    const quantity = toPositiveNumber(material.quantity);

    if (!name || quantity <= 0) {
      return;
    }

    addAmount(directMaterials, name, quantity);
    expandMaterial(name, quantity, recipeMap, rawMaterials, cropMap, cropNeeds, unresolvedMaterials, ['manual']);
  });

  return {
    directMaterials: toRows(directMaterials),
    rawMaterials: toRows(rawMaterials),
    cropNeeds: toRows(cropNeeds).map((row) => {
      const crop = cropMap.get(row.name);
      const hoursPerSeed = crop ? crop.hours : 0;
      const baseYieldPerSeed = crop ? crop.yieldPerSeed : 0;
      const yieldPerSeed = fertilizerEnabled ? Math.ceil(baseYieldPerSeed * 1.1) : baseYieldPerSeed;
      const seedsNeeded = yieldPerSeed > 0 ? Math.ceil(row.quantity / yieldPerSeed) : 0;
      const batchCapacity = fieldCount * SEEDS_PER_FIELD;
      const batchesNeeded = batchCapacity > 0 ? Math.ceil(seedsNeeded / batchCapacity) : 0;
      const expectedYield = round(seedsNeeded * yieldPerSeed);
      const surplus = round(expectedYield - row.quantity);

      return {
        name: row.name,
        quantity: row.quantity,
        level: crop?.level ?? null,
        baseYieldPerSeed,
        yieldPerSeed,
        seedsNeeded,
        fieldCount,
        batchCapacity,
        batchesNeeded,
        hoursPerSeed,
        elapsedHours: round(batchesNeeded * hoursPerSeed),
        totalGrowHours: round(seedsNeeded * hoursPerSeed),
        expectedYield,
        surplus,
      };
    }),
    unresolvedMaterials: toRows(unresolvedMaterials).map((row) => {
      const baseHourlyOutput = getBaseMaterialHourlyOutput(row.name);
      const hourlyOutput = round(baseHourlyOutput * materialEfficiency);

      return {
        ...row,
        efficiencyLevel: materialEfficiencyLevel,
        efficiencyPercent: Math.round(materialEfficiency * 100),
        baseHourlyOutput,
        hourlyOutput,
        productionHours: hourlyOutput > 0 ? round(row.quantity / hourlyOutput) : 0,
      };
    }),
  };
}

export function calculateTotalCropHours(cropNeeds) {
  return round(cropNeeds.reduce((total, crop) => total + crop.elapsedHours, 0));
}

export function calculateTotalMaterialHours(materials) {
  return round(materials.reduce((total, material) => total + material.productionHours, 0));
}

export function createGatheringPlan(materials, settings = {}) {
  const businessLevel = clampBusinessLevel(settings.businessLevel);
  const guestCap = getGuestCapForBusinessLevel(businessLevel);
  const totalWorkerHours = calculateTotalMaterialHours(materials);
  const industryPlans = createIndustryGatheringPlans(materials, guestCap);
  const activeIndustryPlans = industryPlans.filter((plan) => plan.totalWorkerHours > 0);
  const recommendedGatherers = activeIndustryPlans.reduce((total, plan) => total + plan.recommendedGatherers, 0);
  const maxGatherers = industryPlans.reduce((total, plan) => total + plan.maxGatherers, 0);
  const elapsedHours = activeIndustryPlans.reduce((max, plan) => Math.max(max, plan.elapsedHours), 0);

  return {
    businessLevel,
    guestCap,
    maxGatherers,
    recommendedGatherers,
    totalWorkerHours,
    elapsedHours: round(elapsedHours),
    industryPlans,
    rows: materials.map((material) => {
      const industry = getMaterialIndustry(material.name);
      const industryPlan = industryPlans.find((plan) => plan.industry === industry);
      const share = industryPlan?.totalWorkerHours > 0 ? material.productionHours / industryPlan.totalWorkerHours : 0;
      const estimatedElapsedHours = industryPlan?.recommendedGatherers > 0 ? round(material.productionHours / industryPlan.recommendedGatherers) : 0;

      return {
        ...material,
        industry,
        workSharePercent: Math.round(share * 100),
        assignedWorkHours: round(material.productionHours),
        estimatedElapsedHours,
      };
    }),
  };
}

export function createOperationsPlan({ plan, salesOnlyPlan, salesPlan, settings = {}, taskOnlyPlan }) {
  const businessLevel = clampBusinessLevel(settings.businessLevel);
  const guestCap = getGuestCapForBusinessLevel(businessLevel);
  const weeklyHours = toPositiveNumber(settings.weeklySalesHours) || 168;
  const maxGatherersPerIndustry = Math.min(MAX_GATHERERS, guestCap);
  const salesIndustryPlans = createIndustryGatheringPlans(salesOnlyPlan.unresolvedMaterials, guestCap);
  const taskIndustryPlans = createIndustryGatheringPlans(taskOnlyPlan.unresolvedMaterials, guestCap);
  const gatheringRows = GATHERING_INDUSTRIES.map((industry) => {
    const salesWorkerHours = salesIndustryPlans.find((row) => row.industry === industry)?.totalWorkerHours ?? 0;
    const taskWorkerHours = taskIndustryPlans.find((row) => row.industry === industry)?.totalWorkerHours ?? 0;
    const totalWorkerHours = round(salesWorkerHours + taskWorkerHours);
    const requiredGatherers = totalWorkerHours > 0 ? Math.ceil(totalWorkerHours / weeklyHours) : 0;
    const recommendedGatherers = Math.min(requiredGatherers, maxGatherersPerIndustry);
    const capacityHours = round(maxGatherersPerIndustry * weeklyHours);
    const elapsedHours = recommendedGatherers > 0 ? round(totalWorkerHours / recommendedGatherers) : 0;
    const status = totalWorkerHours > capacityHours ? '瓶頸' : totalWorkerHours > 0 ? '可完成' : '無需求';

    return {
      industry,
      salesWorkerHours,
      taskWorkerHours,
      totalWorkerHours,
      recommendedGatherers,
      maxGatherers: maxGatherersPerIndustry,
      capacityHours,
      elapsedHours,
      status,
    };
  });
  const activeGatheringRows = gatheringRows.filter((row) => row.totalWorkerHours > 0);
  const recommendedGatherers = activeGatheringRows.reduce((total, row) => total + row.recommendedGatherers, 0);
  const gatheringElapsedHours = activeGatheringRows.reduce((max, row) => Math.max(max, row.elapsedHours), 0);
  const gatheringBottlenecks = activeGatheringRows.filter((row) => row.status === '瓶頸');
  const cropRows = plan.cropNeeds.map((crop) => {
    const salesCrop = salesOnlyPlan.cropNeeds.find((row) => row.name === crop.name);
    const taskCrop = taskOnlyPlan.cropNeeds.find((row) => row.name === crop.name);

    return {
      name: crop.name,
      salesQuantity: salesCrop?.quantity ?? 0,
      taskQuantity: taskCrop?.quantity ?? 0,
      quantity: crop.quantity,
      seedsNeeded: crop.seedsNeeded,
      batchesNeeded: crop.batchesNeeded,
      elapsedHours: crop.elapsedHours,
      status: crop.elapsedHours > weeklyHours ? '瓶頸' : '可完成',
    };
  });
  const totalCropHours = calculateTotalCropHours(plan.cropNeeds);
  const cropStatus = totalCropHours > weeklyHours ? '瓶頸' : totalCropHours > 0 ? '可完成' : '無需求';
  const cropBottlenecks = cropRows.filter((row) => row.status === '瓶頸');
  const guestStatus = recommendedGatherers > guestCap ? '瓶頸' : recommendedGatherers > 0 ? '可完成' : '無需求';
  const bottlenecks = [
    ...gatheringBottlenecks.map((row) => `${row.industry}採集`),
    ...(cropStatus === '瓶頸' ? ['種植排程'] : []),
    ...(guestStatus === '瓶頸' ? ['莊客上限'] : []),
  ];
  const status = salesPlan.rows.length === 0 ? '未設定販售' : bottlenecks.length > 0 ? '有瓶頸' : '可維持';

  return {
    status,
    weeklyHours,
    guestCap,
    recommendedGatherers,
    gatheringElapsedHours: round(gatheringElapsedHours),
    gatheringRows,
    cropRows,
    totalCropHours,
    cropStatus,
    guestStatus,
    bottlenecks,
    salesConfigured: salesPlan.rows.length > 0,
  };
}

export function createSalesPlan(data, settings = {}, weeklySales = {}) {
  const businessLevel = clampBusinessLevel(settings.businessLevel);
  const seatCount = clampSeatCount(settings.seatCount);
  const weeklySalesHours = toPositiveNumber(settings.weeklySalesHours) || 168;
  const employeeEfficiencyLevel = clampMaterialEfficiencyLevel(settings.employeeEfficiencyLevel);
  const employeeEfficiency = MATERIAL_EFFICIENCY_BY_LEVEL[employeeEfficiencyLevel];
  const saleMinutes = round(BASE_SALE_MINUTES / employeeEfficiency);
  const salesCapacity = Math.floor((weeklySalesHours * 60 * seatCount) / saleMinutes);
  const recipeMap = createRecipeMap(data);
  const selectedWine = recipeMap.get(weeklySales.wineRecipeId);
  const selectedDish = recipeMap.get(weeklySales.dishRecipeId);
  const hasWine = selectedWine?.type === RECIPE_TYPES.wines;
  const hasDish = selectedDish?.type === RECIPE_TYPES.dishes;
  const wineSeats = hasWine && hasDish ? Math.min(seatCount, Math.max(1, Math.ceil((seatCount * 2) / 3))) : hasWine ? seatCount : 0;
  const dishSeats = hasWine && hasDish ? Math.max(0, seatCount - wineSeats) : hasDish ? seatCount : 0;
  const wineQuantity = wineSeats > 0 ? Math.floor((salesCapacity * wineSeats) / seatCount) : 0;
  const dishQuantity = dishSeats > 0 ? Math.max(0, salesCapacity - wineQuantity) : 0;
  const rows = [
    createSelectedSalesRow(selectedWine, wineSeats, wineQuantity, saleMinutes),
    createSelectedSalesRow(selectedDish, dishSeats, dishQuantity, saleMinutes),
  ].filter((row) => row && row.quantity > 0);

  return {
    businessLevel,
    fieldCount: getFieldCountForBusinessLevel(businessLevel),
    seatCount,
    weeklySalesHours,
    employeeEfficiencyLevel,
    employeeEfficiencyPercent: Math.round(employeeEfficiency * 100),
    saleMinutes,
    salesCapacity,
    totalSales: rows.reduce((total, row) => total + row.quantity, 0),
    rows,
  };
}

export function getFieldCountForBusinessLevel(level) {
  const businessLevel = clampBusinessLevel(level);

  if (businessLevel >= 7) {
    return 4;
  }

  if (businessLevel >= 5) {
    return 3;
  }

  if (businessLevel >= 4) {
    return 2;
  }

  return 1;
}

export function getGuestCapForBusinessLevel(level) {
  return GUEST_CAP_BY_BUSINESS_LEVEL[clampBusinessLevel(level)];
}

function expandMaterial(name, quantity, recipeMap, rawMaterials, cropMap, cropNeeds, unresolvedMaterials, stack) {
  const recipe = recipeMap.get(name);

  if (recipe && !stack.includes(recipe.id)) {
    recipe.item.材料.forEach((material) => {
      expandMaterial(material.名稱, material.數量 * quantity, recipeMap, rawMaterials, cropMap, cropNeeds, unresolvedMaterials, [
        ...stack,
        recipe.id,
      ]);
    });
    return;
  }

  addAmount(rawMaterials, name, quantity);

  if (cropMap.has(name)) {
    addAmount(cropNeeds, name, quantity);
    return;
  }

  addAmount(unresolvedMaterials, name, quantity);
}

function createRecipeMap(data) {
  const recipes = [
    ...data.dishes.map((item) => toRecipeOption(item, RECIPE_TYPES.dishes)),
    ...data.wines.map((item) => toRecipeOption(item, RECIPE_TYPES.wines)),
    ...data.ceramics.map((item) => toRecipeOption(item, RECIPE_TYPES.ceramics)),
  ];

  return new Map(recipes.flatMap((recipe) => [[recipe.id, recipe], [recipe.name, recipe]]));
}

function createCropMap(crops) {
  return new Map(
    crops.map((crop) => [
      crop.作物名稱,
      {
        level: crop.等級,
        hours: parseHours(crop.生長時間),
        yieldPerSeed: getCropYield(crop),
      },
    ]),
  );
}

function toRecipeOption(item, type) {
  return {
    id: `${type}:${item.品項名稱}`,
    type,
    name: item.品項名稱,
    level: item.等級,
    item,
  };
}

function parseHours(value) {
  const matched = String(value).match(/[\d.]+/);
  return matched ? Number(matched[0]) : 0;
}

function getCropYield(crop) {
  const explicitYield = Number(crop.單次產量);

  if (Number.isFinite(explicitYield) && explicitYield > 0) {
    return explicitYield;
  }

  const hours = parseHours(crop.生長時間);

  if (hours === 3.6) {
    return 12;
  }

  if (hours === 14.4) {
    return 24;
  }

  return 0;
}

function toPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function clampBusinessLevel(value) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(Math.max(number, 1), 10);
}

function clampSeatCount(value) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(Math.max(number, 1), 24);
}

function clampFieldCount(value) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(Math.max(number, 1), 4);
}

function clampMaterialEfficiencyLevel(value) {
  const number = Math.floor(Number(value));

  if (!Number.isFinite(number)) {
    return 1;
  }

  return Math.min(Math.max(number, 1), 4);
}

function getBaseMaterialHourlyOutput(name) {
  return name.includes('木') ? 10 : 5;
}

function createIndustryGatheringPlans(materials, guestCap) {
  const maxGatherersPerIndustry = Math.min(MAX_GATHERERS, guestCap);

  return GATHERING_INDUSTRIES.map((industry) => {
    const industryMaterials = materials.filter((material) => getMaterialIndustry(material.name) === industry);
    const totalWorkerHours = calculateTotalMaterialHours(industryMaterials);
    const recommendedGatherers = recommendGatherers(totalWorkerHours, maxGatherersPerIndustry);
    const elapsedHours = recommendedGatherers > 0 ? round(totalWorkerHours / recommendedGatherers) : 0;

    return {
      industry,
      maxGatherers: maxGatherersPerIndustry,
      recommendedGatherers,
      totalWorkerHours,
      elapsedHours,
    };
  });
}

function getMaterialIndustry(name) {
  if (hasKeyword(name, FISHING_KEYWORDS)) {
    return '漁獲';
  }

  if (hasKeyword(name, HUNTING_KEYWORDS)) {
    return '獵獲';
  }

  if (hasKeyword(name, STONE_KEYWORDS)) {
    return '石料';
  }

  return '林業';
}

function hasKeyword(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword));
}

function createSelectedSalesRow(recipe, seats, quantity, saleMinutes) {
  if (!recipe || seats <= 0 || quantity <= 0) {
    return null;
  }

  return {
    recipeId: recipe.id,
    type: recipe.type,
    name: recipe.name,
    level: recipe.level,
    seats,
    quantity,
    saleMinutes,
    saleRounds: Math.ceil(quantity / seats),
    elapsedSalesHours: round((Math.ceil(quantity / seats) * saleMinutes) / 60),
  };
}

function recommendGatherers(totalWorkerHours, maxGatherers) {
  if (totalWorkerHours <= 0) {
    return 0;
  }

  if (totalWorkerHours <= 8) {
    return 1;
  }

  if (totalWorkerHours <= 16 && maxGatherers >= 2) {
    return 2;
  }

  return maxGatherers;
}

function addAmount(map, name, quantity) {
  map.set(name, round((map.get(name) || 0) + quantity));
}

function toRows(map) {
  return [...map.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
