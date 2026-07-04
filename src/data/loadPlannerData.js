const DATASETS = {
  dishes: './data/dishes.json',
  ceramics: './data/ceramics.json',
  wines: './data/wine-recipes.json',
  cropTimes: './data/crop-times.json',
};

export async function loadPlannerData() {
  const entries = await Promise.all(
    Object.entries(DATASETS).map(async ([key, url]) => {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`資料載入失敗：${url}`);
      }

      return [key, await response.json()];
    }),
  );

  return Object.fromEntries(entries);
}
