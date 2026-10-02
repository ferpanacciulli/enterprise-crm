import { NavLink, Outlet, useLoaderData, useFetcher } from 'react-router-dom';
import { requireAuth } from '../lib/session';

export function appLayoutLoader() {
  return requireAuth();
}

export default function AppLayout() {
  const { user } = useLoaderData();
  const logoutFetcher = useFetcher();

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="navbar-brand">Enterprise CRM</div>
        <div className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Dashboard
          </NavLink>
          <NavLink to="/customers" className={({ isActive }) => (isActive ? 'active' : '')}>
            Clientes
          </NavLink>
          <NavLink to="/opportunities" className={({ isActive }) => (isActive ? 'active' : '')}>
            Oportunidades
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
            Inventario
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => (isActive ? 'active' : '')}>
            Facturas
          </NavLink>
          {user?.role === 'ADMIN' && (
            <NavLink to="/audit-logs" className={({ isActive }) => (isActive ? 'active' : '')}>
              Auditoría
            </NavLink>
          )}
        </div>
        <div className="navbar-user">
          <span>
            {user?.fullName} <small>({user?.role})</small>
          </span>
          <logoutFetcher.Form method="post" action="/logout">
            <button type="submit">Salir</button>
          </logoutFetcher.Form>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
