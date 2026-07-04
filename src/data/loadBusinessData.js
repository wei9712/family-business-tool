const DEFAULT_DATA_URL = './data/business-sample.json';

export async function loadBusinessData(url = DEFAULT_DATA_URL) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`JSON 載入失敗：${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  validateBusinessData(data);

  return data;
}

function validateBusinessData(data) {
  if (!data || !data.meta || !Array.isArray(data.items)) {
    throw new Error('JSON 格式需包含 meta 與 items 陣列。');
  }

  data.items.forEach((item, index) => {
    const hasRequiredFields =
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.category === 'string' &&
      typeof item.revenue === 'number' &&
      typeof item.cost === 'number';

    if (!hasRequiredFields) {
      throw new Error(`第 ${index + 1} 筆資料格式不完整。`);
    }
  });
}
