// Gráficos en CSS puro (sin dependencias): barras de ventas y pipeline.
export const STAGE_LABELS = {
  LEAD: 'Lead',
  QUALIFIED: 'Calificada',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociación',
  WON: 'Ganada',
  LOST: 'Perdida',
};

const STAGE_COLORS = {
  LEAD: '#94a3b8',
  QUALIFIED: '#38bdf8',
  PROPOSAL: '#a78bfa',
  NEGOTIATION: '#f59e0b',
  WON: '#22c55e',
  LOST: '#ef4444',
};

export function SalesChart({ series, max }) {
  return (
    <div className="chart-bars">
      {series.map((p) => (
        <div key={p.key} className="chart-bar-col" title={`${p.key}: $${p.total.toFixed(2)}`}>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ height: `${Math.max(2, (p.total / max) * 100)}%` }} />
          </div>
          <span className="chart-bar-label">{p.key.slice(5)}</span>
          <span className="chart-bar-value">
            ${p.total >= 1000 ? `${(p.total / 1000).toFixed(1)}k` : p.total.toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PipelineChart({ stages, max }) {
  if (stages.length === 0) return <p className="empty-state">Todavía no hay oportunidades.</p>;
  return (
    <div className="pipeline-rows">
      {stages.map((p) => (
        <div key={p.stage} className="pipeline-row">
          <span className="pipeline-stage" style={{ borderLeftColor: STAGE_COLORS[p.stage] || '#64748b' }}>
            {STAGE_LABELS[p.stage] || p.stage} · {p.count}
          </span>
          <div className="pipeline-track">
            <div
              className="pipeline-fill"
              style={{ width: `${Math.max(2, (p.amount / max) * 100)}%`, background: STAGE_COLORS[p.stage] || '#64748b' }}
            />
          </div>
          <span className="pipeline-amount">${p.amount.toFixed(0)}</span>
        </div>
      ))}
    </div>
  );
}
