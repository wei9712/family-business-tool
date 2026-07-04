export function calculateBusinessSummary(items) {
  return items.reduce(
    (summary, item) => {
      const revenue = Number(item.revenue) || 0;
      const cost = Number(item.cost) || 0;

      summary.revenue += revenue;
      summary.cost += cost;
      summary.profit += revenue - cost;
      summary.count += 1;

      return summary;
    },
    {
      revenue: 0,
      cost: 0,
      profit: 0,
      count: 0,
    },
  );
}
