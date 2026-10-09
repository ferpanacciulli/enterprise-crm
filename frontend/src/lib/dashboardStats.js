// Agregaciones del dashboard: ventas por mes y pipeline por etapa.
// Vive acá (no en el loader) para poder unit-testearla sin React Router.

export const STAGE_ORDER = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function last6Months(now = new Date()) {
  const out = [];
  for (let i = 5; i >= 0; i--) {
    out.push(monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)));
  }
  return out;
}

export function buildDashboardStats({ customers, opportunities, products, lowStock, invoices }) {
  const months = last6Months();
  const salesByMonth = Object.fromEntries(months.map((k) => [k, 0]));
  for (const inv of invoices) {
    const d = new Date(inv.issueDate);
    if (Number.isNaN(d.getTime())) continue;
    const k = monthKey(d);
    if (k in salesByMonth) salesByMonth[k] += Number(inv.total) || 0;
  }
  const salesSeries = months.map((key) => ({ key, total: salesByMonth[key] }));
  const totalSales = salesSeries.reduce((s, p) => s + p.total, 0);

  const byStage = {};
  for (const o of opportunities) {
    const entry = (byStage[o.stage] = byStage[o.stage] || { count: 0, amount: 0 });
    entry.count += 1;
    entry.amount += Number(o.amount) || 0;
  }
  const pipelineStages = STAGE_ORDER.filter((s) => byStage[s]).map((stage) => ({ stage, ...byStage[stage] }));
  const openPipeline = pipelineStages
    .filter((p) => p.stage !== 'WON' && p.stage !== 'LOST')
    .reduce((s, p) => s + p.amount, 0);

  return {
    customers: customers.length,
    opportunities: opportunities.filter((o) => o.stage !== 'WON' && o.stage !== 'LOST').length,
    pipelineValue: openPipeline,
    products: products.length,
    lowStock: lowStock.length,
    salesSeries,
    totalSales,
    currentMonthSales: salesSeries[salesSeries.length - 1].total,
    pipelineStages,
    maxStageAmount: Math.max(1, ...pipelineStages.map((p) => p.amount)),
    maxSales: Math.max(1, ...salesSeries.map((p) => p.total)),
  };
}
