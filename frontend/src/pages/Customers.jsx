import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY_FORM = {
  companyName: '',
  contactName: '',
  email: '',
  phone: '',
  industry: '',
  country: '',
  city: '',
  status: 'LEAD',
};

const STATUS_OPTIONS = ['LEAD', 'ACTIVE', 'INACTIVE', 'BLOCKED'];

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function loadCustomers() {
    setLoading(true);
    try {
      const data = await api.get('/api/customers');
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCustomers();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setShowForm(true);
  }

  function openEdit(customer) {
    setEditingId(customer.id);
    setForm({
      companyName: customer.companyName || '',
      contactName: customer.contactName || '',
      email: customer.email || '',
      phone: customer.phone || '',
      industry: customer.industry || '',
      country: customer.country || '',
      city: customer.city || '',
      status: customer.status || 'LEAD',
    });
    setFieldErrors({});
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      if (editingId) {
        await api.put(`/api/customers/${editingId}`, form);
      } else {
        await api.post('/api/customers', form);
      }
      closeForm();
      await loadCustomers();
    } catch (err) {
      setFieldErrors(err.fieldErrors || {});
      if (!err.fieldErrors) {
        alert(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return;
    try {
      await api.del(`/api/customers/${id}`);
      await loadCustomers();
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Clientes</h1>
        <button onClick={openCreate}>+ Nuevo cliente</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Email</th>
              <th>Industria</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.companyName}</td>
                <td>{c.contactName}</td>
                <td>{c.email}</td>
                <td>{c.industry}</td>
                <td>{c.city}</td>
                <td>
                  <span className={`badge badge-${c.status?.toLowerCase()}`}>{c.status}</span>
                </td>
                <td className="actions">
                  <button className="link-btn" onClick={() => openEdit(c)}>Editar</button>
                  <button className="link-btn link-btn-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">No hay clientes cargados todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>

            <label>
              Empresa
              <input value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required />
              {fieldErrors.companyName && <span className="field-error">{fieldErrors.companyName}</span>}
            </label>

            <label>
              Contacto
              <input value={form.contactName} onChange={(e) => update('contactName', e.target.value)} />
            </label>

            <label>
              Email
              <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>

            <label>
              Teléfono
              <input value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>

            <div className="form-row">
              <label>
                Industria
                <input value={form.industry} onChange={(e) => update('industry', e.target.value)} />
              </label>
              <label>
                País
                <input value={form.country} onChange={(e) => update('country', e.target.value)} />
              </label>
              <label>
                Ciudad
                <input value={form.city} onChange={(e) => update('city', e.target.value)} />
              </label>
            </div>

            <label>
              Estado
              <select value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={closeForm}>Cancelar</button>
              <button type="submit" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
