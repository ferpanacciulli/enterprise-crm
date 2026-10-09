import { Link, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';
import { SalesChart, PipelineChart } from '../components/charts';
import { buildDashboardStats } from '../lib/dashboardStats';

export async function dashboardLoader() {
  const [customers, opportunities, products, lowStock, invoices] = await Promise.all([
    api.get('/api/customers'),
    api.get('/api/opportunities'),
    api.get('/api/products'),
    api.get('/api/products/low-stock'),
    api.get('/api/invoices'),
  ]);

  return buildDashboardStats({ customers, opportunities, products, lowStock, invoices });
}

export default function Dashboard() {
  const stats = useLoaderData();

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <p className="page-sub">Vista general del negocio en tiempo real.</p>
      <div className="stats-grid" style={{ marginTop: '1.25rem' }}>
        <Link to="/customers" className="stat-card">
          <span className="stat-value">{stats.customers}</span>
          <span className="stat-label">Clientes</span>
        </Link>
        <Link to="/opportunities" className="stat-card">
          <span className="stat-value">{stats.opportunities}</span>
          <span className="stat-label">Oportunidades abiertas</span>
        </Link>
        <Link to="/opportunities" className="stat-card">
          <span className="stat-value">${stats.pipelineValue.toFixed(0)}</span>
          <span className="stat-label">Valor del pipeline</span>
        </Link>
        <Link to="/invoices" className="stat-card stat-card-ok">
          <span className="stat-value">${stats.currentMonthSales.toFixed(0)}</span>
          <span className="stat-label">Ventas este mes</span>
        </Link>
        <Link to="/products" className="stat-card">
          <span className="stat-value">{stats.products}</span>
          <span className="stat-label">Productos en catálogo</span>
        </Link>
        <Link to="/products" className="stat-card stat-card-warning">
          <span className="stat-value">{stats.lowStock}</span>
          <span className="stat-label">Productos con bajo stock</span>
        </Link>
      </div>

      <div className="charts-grid">
        <section className="card">
          <h2>Ventas — últimos 6 meses</h2>
          <p className="page-sub">Total facturado: ${stats.totalSales.toFixed(2)}</p>
          <SalesChart series={stats.salesSeries} max={stats.maxSales} />
        </section>

        <section className="card">
          <h2>Pipeline por etapa</h2>
          <p className="page-sub">Monto acumulado por etapa de la oportunidad.</p>
          <PipelineChart stages={stats.pipelineStages} max={stats.maxStageAmount} />
        </section>
      </div>
    </div>
  );
}
