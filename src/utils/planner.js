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
  const maxGatherers = Math.min(MAX_GATHERERS, guestCap);
  const totalWorkerHours = calculateTotalMaterialHours(materials);
  const recommendedGatherers = recommendGatherers(totalWorkerHours, maxGatherers);
  const elapsedHours = recommendedGatherers > 0 ? round(totalWorkerHours / recommendedGatherers) : 0;

  return {
    businessLevel,
    guestCap,
    maxGatherers,
    recommendedGatherers,
    totalWorkerHours,
    elapsedHours,
    rows: materials.map((material) => {
      const share = totalWorkerHours > 0 ? material.productionHours / totalWorkerHours : 0;
      const estimatedElapsedHours = recommendedGatherers > 0 ? round(material.productionHours / recommendedGatherers) : 0;

      return {
        ...material,
        workSharePercent: Math.round(share * 100),
        assignedWorkHours: round(material.productionHours),
        estimatedElapsedHours,
      };
    }),
  };
}

export function createSalesPlan(data, settings = {}) {
  const businessLevel = clampBusinessLevel(settings.businessLevel);
  const seatCount = clampSeatCount(settings.seatCount);
  const weeklySalesHours = toPositiveNumber(settings.weeklySalesHours) || 168;
  const employeeEfficiencyLevel = clampMaterialEfficiencyLevel(settings.employeeEfficiencyLevel);
  const employeeEfficiency = MATERIAL_EFFICIENCY_BY_LEVEL[employeeEfficiencyLevel];
  const saleMinutes = round(BASE_SALE_MINUTES / employeeEfficiency);
  const totalSales = Math.floor((weeklySalesHours * 60 * seatCount) / saleMinutes);
  const wineSeats = Math.min(seatCount, Math.max(1, Math.ceil((seatCount * 2) / 3)));
  const dishSeats = Math.max(0, seatCount - wineSeats);
  const wineQuantity = Math.floor((totalSales * wineSeats) / seatCount);
  const dishQuantity = Math.max(0, totalSales - wineQuantity);
  const scoringSettings = {
    fieldCount: getFieldCountForBusinessLevel(businessLevel),
    fertilizerEnabled: Boolean(settings.fertilizerEnabled),
    materialEfficiencyLevel: settings.materialEfficiencyLevel,
  };

  return {
    businessLevel,
    fieldCount: getFieldCountForBusinessLevel(businessLevel),
    seatCount,
    weeklySalesHours,
    employeeEfficiencyLevel,
    employeeEfficiencyPercent: Math.round(employeeEfficiency * 100),
    saleMinutes,
    totalSales,
    rows: [
      createSalesRow(RECIPE_TYPES.wines, data.wines, wineSeats, wineQuantity, businessLevel, saleMinutes, data, scoringSettings),
      createSalesRow(RECIPE_TYPES.dishes, data.dishes, dishSeats, dishQuantity, businessLevel, saleMinutes, data, scoringSettings),
    ].filter((row) => row && row.quantity > 0),
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

function createSalesRow(type, items, seats, quantity, businessLevel, saleMinutes, data, scoringSettings) {
  if (seats <= 0 || quantity <= 0) {
    return null;
  }

  const item = chooseRecommendedItem(type, items, businessLevel, data, scoringSettings);

  if (!item) {
    return null;
  }

  return {
    recipeId: `${type}:${item.品項名稱}`,
    type,
    name: item.品項名稱,
    level: item.等級,
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

function chooseRecommendedItem(type, items, businessLevel, data, scoringSettings) {
  const exactLevelItems = items.filter((item) => item.等級 === businessLevel);
  const fallbackItems = items.filter((item) => item.等級 <= businessLevel);
  const candidates = exactLevelItems.length > 0 ? exactLevelItems : fallbackItems;

  return candidates
    .map((item) => ({
      item,
      score: estimateRecipeHours(`${type}:${item.品項名稱}`, data, scoringSettings),
    }))
    .sort((a, b) => a.score - b.score || b.item.等級 - a.item.等級 || a.item.品項名稱.localeCompare(b.item.品項名稱, 'zh-Hant'))[0]
    ?.item;
}

function estimateRecipeHours(recipeId, data, scoringSettings) {
  const plan = calculateTaskPlan([{ id: 'estimate', recipeId, quantity: 1 }], [], data, scoringSettings, []);
  return calculateTotalCropHours(plan.cropNeeds) + calculateTotalMaterialHours(plan.unresolvedMaterials);
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
