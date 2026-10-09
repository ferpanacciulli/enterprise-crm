import { Link, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';

export async function dashboardLoader() {
  const [customers, opportunities, products, lowStock] = await Promise.all([
    api.get('/api/customers'),
    api.get('/api/opportunities'),
    api.get('/api/products'),
    api.get('/api/products/low-stock'),
  ]);

  return {
    customers: customers.length,
    opportunities: opportunities.length,
    pipelineValue: opportunities
      .filter((o) => o.stage !== 'WON' && o.stage !== 'LOST')
      .reduce((sum, o) => sum + Number(o.amount), 0),
    products: products.length,
    lowStock: lowStock.length,
  };
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
        <Link to="/products" className="stat-card">
          <span className="stat-value">{stats.products}</span>
          <span className="stat-label">Productos en catálogo</span>
        </Link>
        <Link to="/products" className="stat-card stat-card-warning">
          <span className="stat-value">{stats.lowStock}</span>
          <span className="stat-label">Productos con bajo stock</span>
        </Link>
      </div>
    </div>
  );
}
