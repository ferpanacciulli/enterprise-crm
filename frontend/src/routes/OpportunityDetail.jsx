import { useEffect, useRef, useState } from 'react';
import { Link, useLoaderData, useFetcher } from 'react-router-dom';
import { api } from '../lib/api';

const TYPE_LABELS = {
  CALL: '📞 Llamada',
  EMAIL: '✉️ Email',
  MEETING: '🤝 Reunión',
  TASK: '✅ Tarea',
  NOTE: '📝 Nota',
};

export async function opportunityDetailLoader({ params }) {
  const [opportunity, activities, items, products] = await Promise.all([
    api.get(`/api/opportunities/${params.id}`),
    api.get(`/api/opportunities/${params.id}/activities`),
    api.get(`/api/opportunities/${params.id}/products`),
    api.get('/api/products'),
  ]);
  return { opportunity, activities, items, products };
}

export async function opportunityDetailAction({ request, params }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'addProduct') {
      await api.post(`/api/opportunities/${params.id}/products`, {
        productId: Number(formData.get('productId')),
        quantity: parseInt(formData.get('quantity'), 10),
      });
      return { ok: true };
    }

    if (intent === 'removeProduct') {
      await api.del(`/api/opportunities/${params.id}/products/${formData.get('itemId')}`);
      return { ok: true };
    }

    // default: agregar mensaje/actividad
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
  const { opportunity, activities, items, products } = useLoaderData();

  const messageFetcher = useFetcher();
  const productFetcher = useFetcher();
  const removeProductFetcher = useFetcher();
  const messageFormRef = useRef(null);
  const productFormRef = useRef(null);

  const isSavingMessage = messageFetcher.state !== 'idle';
  const messageFieldErrors = messageFetcher.data?.fieldErrors || {};

  const isSavingProduct = productFetcher.state !== 'idle';
  const productError = productFetcher.data?.error;

  const [selectedProductId, setSelectedProductId] = useState('');

  useEffect(() => {
    if (messageFetcher.state === 'idle' && messageFetcher.data?.ok) {
      messageFormRef.current?.reset();
    }
  }, [messageFetcher.state, messageFetcher.data]);

  useEffect(() => {
    if (productFetcher.state === 'idle' && productFetcher.data?.ok) {
      productFormRef.current?.reset();
      setSelectedProductId('');
    }
  }, [productFetcher.state, productFetcher.data]);

  const itemsTotal = items.reduce((sum, i) => sum + Number(i.lineTotal), 0);

  function handleRemoveItem(itemId) {
    if (!confirm('¿Sacar este producto de la oportunidad? El stock reservado vuelve al inventario.')) return;
    removeProductFetcher.submit({ intent: 'removeProduct', itemId }, { method: 'post' });
  }

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

      <h2 style={{ fontSize: '1.1rem' }}>Productos reservados</h2>

      {productError && <div className="alert alert-error">{productError}</div>}

      <productFetcher.Form
        method="post"
        ref={productFormRef}
        className="modal-card"
        style={{ width: '100%', maxWidth: 'none', marginBottom: '1rem' }}
      >
        <input type="hidden" name="intent" value="addProduct" />
        <div className="form-row" style={{ gridTemplateColumns: '1fr 140px auto' }}>
          <label>
            Producto
            <select
              name="productId"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              required
            >
              <option value="" disabled>Elegí un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (stock: {p.quantityInStock})
                </option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <input type="number" name="quantity" min="1" defaultValue="1" required />
          </label>
          <label style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={isSavingProduct}>{isSavingProduct ? 'Reservando...' : 'Reservar'}</button>
          </label>
        </div>
      </productFetcher.Form>

      <table className="data-table" style={{ marginBottom: '2rem' }}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>SKU</th>
            <th>Cantidad</th>
            <th>Precio unitario</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.productName}</td>
              <td>{i.sku}</td>
              <td>{i.quantity}</td>
              <td>${Number(i.unitPrice).toFixed(2)}</td>
              <td>${Number(i.lineTotal).toFixed(2)}</td>
              <td className="actions">
                <button className="link-btn link-btn-danger" onClick={() => handleRemoveItem(i.id)}>Quitar</button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="empty-state">No hay productos reservados para esta oportunidad.</td>
            </tr>
          )}
          {items.length > 0 && (
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600 }}>Total reservado:</td>
              <td style={{ fontWeight: 600 }}>${itemsTotal.toFixed(2)}</td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>

      <h2 style={{ fontSize: '1.1rem' }}>Historial de mensajes</h2>

      <messageFetcher.Form method="post" ref={messageFormRef} className="modal-card" style={{ width: '100%', maxWidth: 'none', marginBottom: '1.5rem' }}>
        <input type="hidden" name="intent" value="addMessage" />
        {messageFetcher.data?.error && <div className="alert alert-error">{messageFetcher.data.error}</div>}
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
            {messageFieldErrors.description && <span className="field-error">{messageFieldErrors.description}</span>}
          </label>
          <label style={{ alignSelf: 'end' }}>
            <button type="submit" disabled={isSavingMessage}>{isSavingMessage ? 'Enviando...' : 'Agregar'}</button>
          </label>
        </div>
      </messageFetcher.Form>

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
