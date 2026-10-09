import { useEffect, useState } from 'react';
import { useLoaderData, useFetcher } from 'react-router-dom';
import { api } from '../lib/api';
import { getStoredUser } from '../lib/session';

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

export async function customersLoader() {
  return api.get('/api/customers');
}

export async function customersAction({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      await api.del(`/api/customers/${formData.get('id')}`);
      return { ok: true };
    }

    const payload = {
      companyName: formData.get('companyName'),
      contactName: formData.get('contactName'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      industry: formData.get('industry'),
      country: formData.get('country'),
      city: formData.get('city'),
      status: formData.get('status'),
    };

    if (intent === 'update') {
      await api.put(`/api/customers/${formData.get('id')}`, payload);
    } else {
      await api.post('/api/customers', payload);
    }
    return { ok: true };
  } catch (err) {
    return { error: err.message, fieldErrors: err.fieldErrors || {} };
  }
}

export default function Customers() {
  const customers = useLoaderData();
  const currentRole = getStoredUser()?.role;
  // Todos los roles crean/editan clientes (registro de leads del CRM);
  // solo ADMIN y MANAGER pueden eliminar
  const canWrite = ['ADMIN', 'MANAGER', 'SALES_REPRESENTATIVE'].includes(currentRole);
  const canDelete = ['ADMIN', 'MANAGER'].includes(currentRole);
  const formFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const formError = formFetcher.data?.error;
  const deleteError = deleteFetcher.data?.error;
  const fieldErrors = formFetcher.data?.fieldErrors || {};
  const isSaving = formFetcher.state !== 'idle';

  // Cuando el fetcher termina bien, cerramos el modal.
  // React Router ya revalido el loader solo -> la tabla se actualiza sin pedirlo nosotros.
  useEffect(() => {
    if (formFetcher.state === 'idle' && formFetcher.data?.ok) {
      setShowForm(false);
    }
  }, [formFetcher.state, formFetcher.data]);

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
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
    setShowForm(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDelete(id) {
    if (!confirm('¿Seguro que querés eliminar este cliente?')) return;
    deleteFetcher.submit({ intent: 'delete', id }, { method: 'post' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p className="page-sub">Empresas y contactos del negocio.</p>
        </div>
        {canWrite && <button onClick={openCreate}>+ Nuevo cliente</button>}
      </div>

      {!canWrite && (
        <div className="alert alert-error">Tu rol ({currentRole}) es de solo lectura en esta sección.</div>
      )}
      {(formError || deleteError) && (
        <div className="alert alert-error">{formError || deleteError}</div>
      )}

      <div className="table-wrap">
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
                {canWrite && <button className="link-btn" onClick={() => openEdit(c)}>Editar</button>}
                {canDelete && <button className="link-btn link-btn-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>}
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
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <formFetcher.Form
            method="post"
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>{editingId ? 'Editar cliente' : 'Nuevo cliente'}</h2>

            <input type="hidden" name="intent" value={editingId ? 'update' : 'create'} />
            {editingId && <input type="hidden" name="id" value={editingId} />}

            <label>
              Empresa
              <input name="companyName" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} required />
              {fieldErrors.companyName && <span className="field-error">{fieldErrors.companyName}</span>}
            </label>

            <label>
              Contacto
              <input name="contactName" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} />
            </label>

            <label>
              Email
              <input type="email" name="email" value={form.email} onChange={(e) => update('email', e.target.value)} />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </label>

            <label>
              Teléfono
              <input name="phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            </label>

            <div className="form-row">
              <label>
                Industria
                <input name="industry" value={form.industry} onChange={(e) => update('industry', e.target.value)} />
              </label>
              <label>
                País
                <input name="country" value={form.country} onChange={(e) => update('country', e.target.value)} />
              </label>
              <label>
                Ciudad
                <input name="city" value={form.city} onChange={(e) => update('city', e.target.value)} />
              </label>
            </div>

            <label>
              Estado
              <select name="status" value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </formFetcher.Form>
        </div>
      )}
    </div>
  );
}
