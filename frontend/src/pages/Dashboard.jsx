import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const [stats, setStats] = useState({ customers: 0, products: 0, lowStock: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [customers, products, lowStock] = await Promise.all([
          api.get('/api/customers'),
          api.get('/api/products'),
          api.get('/api/products/low-stock'),
        ]);
        setStats({
          customers: customers.length,
          products: products.length,
          lowStock: lowStock.length,
        });
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <div className="page"><p>Cargando...</p></div>;

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
