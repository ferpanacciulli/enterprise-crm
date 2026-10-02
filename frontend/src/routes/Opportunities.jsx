import { useEffect, useState } from 'react';
import { Link, useLoaderData, useFetcher } from 'react-router-dom';
import { api } from '../lib/api';
import { getStoredUser } from '../lib/session';

const EMPTY_FORM = {
  title: '',
  amount: '',
  stage: 'LEAD',
  expectedCloseDate: '',
  customerId: '',
};

const STAGE_OPTIONS = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export async function opportunitiesLoader() {
  const [opportunities, customers] = await Promise.all([
    api.get('/api/opportunities'),
    api.get('/api/customers'),
  ]);
  return { opportunities, customers };
}

export async function opportunitiesAction({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      await api.del(`/api/opportunities/${formData.get('id')}`);
      return { ok: true };
    }

    const payload = {
      title: formData.get('title'),
      amount: parseFloat(formData.get('amount')),
      stage: formData.get('stage'),
      expectedCloseDate: formData.get('expectedCloseDate') || null,
      customerId: Number(formData.get('customerId')),
    };

    if (intent === 'update') {
      await api.put(`/api/opportunities/${formData.get('id')}`, payload);
    } else {
      await api.post('/api/opportunities', payload);
    }
    return { ok: true };
  } catch (err) {
    return { error: err.message, fieldErrors: err.fieldErrors || {} };
  }
}

export default function Opportunities() {
  const { opportunities, customers } = useLoaderData();
  // DELETE de oportunidades es ADMIN/MANAGER en el backend; SALES crea y edita.
  const canDelete = ['ADMIN', 'MANAGER'].includes(getStoredUser()?.role);
  const formFetcher = useFetcher();
  const deleteFetcher = useFetcher();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fieldErrors = formFetcher.data?.fieldErrors || {};
  const isSaving = formFetcher.state !== 'idle';

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

  function openEdit(opp) {
    setEditingId(opp.id);
    setForm({
      title: opp.title,
      amount: opp.amount,
      stage: opp.stage,
      expectedCloseDate: opp.expectedCloseDate || '',
      customerId: String(opp.customerId),
    });
    setShowForm(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDelete(id) {
    if (!confirm('¿Seguro que querés eliminar esta oportunidad?')) return;
    deleteFetcher.submit({ intent: 'delete', id }, { method: 'post' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Oportunidades</h1>
        <button onClick={openCreate} disabled={customers.length === 0}>+ Nueva oportunidad</button>
      </div>

      {customers.length === 0 && (
        <div className="alert alert-error">
          Necesitás al menos un cliente cargado antes de poder crear una oportunidad.
        </div>
      )}

      {deleteFetcher.data?.error && (
        <div className="alert alert-error">{deleteFetcher.data.error}</div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Etapa</th>
            <th>Cierre estimado</th>
            <th>Dueño</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {opportunities.map((o) => (
            <tr key={o.id}>
              <td><Link to={`/opportunities/${o.id}`}>{o.title}</Link></td>
              <td>{o.customerName}</td>
              <td>${Number(o.amount).toFixed(2)}</td>
              <td><span className={`badge badge-${o.stage === 'WON' ? 'active' : o.stage === 'LOST' ? 'blocked' : 'lead'}`}>{o.stage}</span></td>
              <td>{o.expectedCloseDate || '—'}</td>
              <td>{o.ownerName}</td>
              <td className="actions">
                <button className="link-btn" onClick={() => openEdit(o)}>Editar</button>
                {canDelete && (
                  <button className="link-btn link-btn-danger" onClick={() => handleDelete(o.id)}>Eliminar</button>
                )}
              </td>
            </tr>
          ))}
          {opportunities.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-state">No hay oportunidades cargadas todavía.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <formFetcher.Form method="post" className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Editar oportunidad' : 'Nueva oportunidad'}</h2>

            <input type="hidden" name="intent" value={editingId ? 'update' : 'create'} />
            {editingId && <input type="hidden" name="id" value={editingId} />}

            <label>
              Cliente
              <select name="customerId" value={form.customerId} onChange={(e) => update('customerId', e.target.value)} required>
                <option value="" disabled>Elegí un cliente...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.companyName}</option>
                ))}
              </select>
              {fieldErrors.customerId && <span className="field-error">{fieldErrors.customerId}</span>}
            </label>

            <label>
              Título
              <input name="title" value={form.title} onChange={(e) => update('title', e.target.value)} required />
              {fieldErrors.title && <span className="field-error">{fieldErrors.title}</span>}
            </label>

            <div className="form-row">
              <label>
                Monto
                <input type="number" step="0.01" name="amount" value={form.amount} onChange={(e) => update('amount', e.target.value)} required />
                {fieldErrors.amount && <span className="field-error">{fieldErrors.amount}</span>}
              </label>
              <label>
                Etapa
                <select name="stage" value={form.stage} onChange={(e) => update('stage', e.target.value)}>
                  {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label>
                Cierre estimado
                <input type="date" name="expectedCloseDate" value={form.expectedCloseDate} onChange={(e) => update('expectedCloseDate', e.target.value)} />
              </label>
            </div>

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
