import { Link, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';

export async function dashboardLoader() {
  const [customers, products, lowStock] = await Promise.all([
    api.get('/api/customers'),
    api.get('/api/products'),
    api.get('/api/products/low-stock'),
  ]);

  return {
    customers: customers.length,
    products: products.length,
    lowStock: lowStock.length,
  };
}

export default function Dashboard() {
  const stats = useLoaderData();

  return (
    <div className="page">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <Link to="/customers" className="stat-card">
          <span className="stat-value">{stats.customers}</span>
          <span className="stat-label">Clientes</span>
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
