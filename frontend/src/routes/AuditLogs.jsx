import { useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';

export async function auditLogsLoader({ request }) {
  const url = new URL(request.url);
  const limit = url.searchParams.get('limit') || '100';
  return api.get(`/api/audit-logs?limit=${limit}`);
}

export default function AuditLogs() {
  const logs = useLoaderData();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Auditoría</h1>
      </div>

      <p style={{ color: '#6b7280', marginTop: 0 }}>
        Quién hizo qué y cuándo — solo visible para administradores.
      </p>

      <table className="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Entidad</th>
            <th>Acción</th>
            <th>Detalle</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((entry) => (
            <tr key={entry.id}>
              <td>{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : '—'}</td>
              <td>{entry.username}</td>
              <td>
                {entry.entityName}
                {entry.entityId != null ? ` #${entry.entityId}` : ''}
              </td>
              <td>{entry.action}</td>
              <td>{entry.details || '—'}</td>
            </tr>
          ))}
          {logs.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">
                Todavía no hay eventos registrados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
