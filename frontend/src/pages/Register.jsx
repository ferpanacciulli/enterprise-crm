import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);
    try {
      await register(form);
      navigate('/');
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fieldErrors || {});
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Crear cuenta</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <label>
          Nombre
          <input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
          {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
        </label>

        <label>
          Apellido
          <input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
        </label>

        <label>
          Email
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </label>

        <button type="submit" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </form>
    </div>
  );
}
