import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">Enterprise CRM</div>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Dashboard
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => (isActive ? 'active' : '')}>
          Clientes
        </NavLink>
        <NavLink to="/products" className={({ isActive }) => (isActive ? 'active' : '')}>
          Inventario
        </NavLink>
      </div>
      <div className="navbar-user">
        <span>{user?.fullName} <small>({user?.role})</small></span>
        <button onClick={handleLogout}>Salir</button>
      </div>
    </nav>
  );
}
