const RECIPE_TYPES = {
  dishes: '菜品',
  wines: '酒水',
  ceramics: '瓷器',
};

export function createRecipeOptions(data) {
  return [
    ...data.dishes.map((item) => toRecipeOption(item, RECIPE_TYPES.dishes)),
    ...data.wines.map((item) => toRecipeOption(item, RECIPE_TYPES.wines)),
  ].sort((a, b) => a.level - b.level || a.type.localeCompare(b.type, 'zh-Hant') || a.name.localeCompare(b.name, 'zh-Hant'));
}

export function calculateTaskPlan(tasks, manualMaterials, data) {
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
      const yieldPerSeed = crop ? crop.yieldPerSeed : 0;
      const seedsNeeded = yieldPerSeed > 0 ? Math.ceil(row.quantity / yieldPerSeed) : 0;

      return {
        name: row.name,
        quantity: row.quantity,
        level: crop?.level ?? null,
        yieldPerSeed,
        seedsNeeded,
        hoursPerSeed,
        totalHours: round(seedsNeeded * hoursPerSeed),
      };
    }),
    unresolvedMaterials: toRows(unresolvedMaterials),
  };
}

export function calculateTotalCropHours(cropNeeds) {
  return round(cropNeeds.reduce((total, crop) => total + crop.totalHours, 0));
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
