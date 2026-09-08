import { useEffect, useRef } from 'react';
import { Link, useLoaderData, useFetcher, useParams } from 'react-router-dom';
import { api } from '../lib/api';

const TYPE_LABELS = {
  CALL: '📞 Llamada',
  EMAIL: '✉️ Email',
  MEETING: '🤝 Reunión',
  TASK: '✅ Tarea',
  NOTE: '📝 Nota',
};

export async function opportunityDetailLoader({ params }) {
  const [opportunity, activities] = await Promise.all([
    api.get(`/api/opportunities/${params.id}`),
    api.get(`/api/opportunities/${params.id}/activities`),
  ]);
  return { opportunity, activities };
}

export async function opportunityDetailAction({ request, params }) {
  const formData = await request.formData();

  try {
    await api.post(`/api/opportunities/${params.id}/activities`, {
      type: formData.get('type'),
      description: formData.get('description'),
    });
    return { ok: true };
  } catch (err) {
    return { error: err.message, fieldErrors: err.fieldErrors || {} };
  }
}

export default function OpportunityDetail() {
  const { opportunity, activities } = useLoaderData();
  const { id } = useParams();
  const fetcher = useFetcher();
  const formRef = useRef(null);

  const isSaving = fetcher.state !== 'idle';
  const fieldErrors = fetcher.data?.fieldErrors || {};

  // Cuando el mensaje se guarda bien, limpiamos el textarea para el proximo
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data?.ok) {
      formRef.current?.reset();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="page">
      <Link to="/opportunities">&larr; Volver a oportunidades</Link>

      <div className="page-header" style={{ marginTop: '1rem' }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{opportunity.title}</h1>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {opportunity.customerName} · ${Number(opportunity.amount).toFixed(2)} ·{' '}
            <span className={`badge badge-${opportunity.stage === 'WON' ? 'active' : opportunity.stage === 'LOST' ? 'blocked' : 'lead'}`}>
              {opportunity.stage}
            </span>
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: '1.1rem' }}>Historial de mensajes</h2>

      <fetcher.Form method="post" ref={formRef} className="modal-card" style={{ width: '100%', maxWidth: 'none', marginBottom: '1.5rem' }}>
        {fetcher.data?.error && <div className="alert alert-error">{fetcher.data.error}</div>}
        <div className="form-row" style={{ gridTemplateColumns: '160px 1fr auto' }}>
          <label>
            Tipo
            <select name="type" defaultValue="NOTE">
              {Object.keys(TYPE_LABELS).map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </label>
          <label>
            Mensaje
            <input name="description" placeholder="Ej: Llamé al cliente, quedó en confirmar la próxima semana..." required />
            {fieldErrors.description && <span className="field-error">{fieldErrors.description}</span>}
          </label>
          <label style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={isSaving}>{isSaving ? 'Enviando...' : 'Agregar'}</button>
          </label>
        </div>
      </fetcher.Form>

      <div className="timeline">
        {activities.map((a) => (
          <div key={a.id} className="timeline-item">
            <div className="timeline-header">
              <strong>{TYPE_LABELS[a.type] || a.type}</strong>
              <span className="timeline-meta">{a.createdByName} · {new Date(a.activityDate).toLocaleString()}</span>
            </div>
            <p>{a.description}</p>
          </div>
        ))}
        {activities.length === 0 && (
          <p className="empty-state">Todavía no hay mensajes registrados para esta oportunidad.</p>
        )}
      </div>
    </div>
  );
}
