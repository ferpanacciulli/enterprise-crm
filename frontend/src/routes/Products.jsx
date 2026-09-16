import { useEffect, useRef, useState } from 'react';
import { useLoaderData, useFetcher, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';

const EMPTY_FORM = {
  sku: '',
  name: '',
  description: '',
  category: '',
  unitPrice: '',
  quantityInStock: '',
  reorderLevel: '',
};

const REASON_LABELS = {
  MANUAL_ADJUSTMENT: 'Ajuste manual',
  OPPORTUNITY_RESERVE: 'Reservado en oportunidad',
  OPPORTUNITY_RELEASE: 'Liberado de oportunidad',
};

export async function productsLoader({ request }) {
  const url = new URL(request.url);
  const onlyLowStock = url.searchParams.get('lowStock') === '1';
  const search = url.searchParams.get('search') || '';

  if (onlyLowStock) {
    return api.get('/api/products/low-stock');
  }
  if (search) {
    return api.get(`/api/products?search=${encodeURIComponent(search)}`);
  }
  return api.get('/api/products');
}

export async function productsAction({ request }) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  try {
    if (intent === 'delete') {
      await api.del(`/api/products/${formData.get('id')}`);
      return { ok: true };
    }

    if (intent === 'adjustStock') {
      const delta = Number(formData.get('delta'));
      await api.patch(`/api/products/${formData.get('id')}/stock`, { delta });
      return { ok: true };
    }

    const payload = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      unitPrice: parseFloat(formData.get('unitPrice')),
      quantityInStock: parseInt(formData.get('quantityInStock'), 10),
      reorderLevel: parseInt(formData.get('reorderLevel'), 10),
    };

    if (intent === 'update') {
      await api.put(`/api/products/${formData.get('id')}`, payload);
    } else {
      await api.post('/api/products', payload);
    }
    return { ok: true };
  } catch (err) {
    return { error: err.message, fieldErrors: err.fieldErrors || {} };
  }
}

export default function Products() {
  const products = useLoaderData();
  const [searchParams, setSearchParams] = useSearchParams();
  const onlyLowStock = searchParams.get('lowStock') === '1';

  const formFetcher = useFetcher();
  const stockFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const historyFetcher = useFetcher();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [historyProduct, setHistoryProduct] = useState(null);
  const debounceRef = useRef(null);

  const fieldErrors = formFetcher.data?.fieldErrors || {};
  const isSaving = formFetcher.state !== 'idle';

  useEffect(() => {
    if (formFetcher.state === 'idle' && formFetcher.data?.ok) {
      setShowForm(false);
    }
  }, [formFetcher.state, formFetcher.data]);

  function toggleLowStock() {
    setSearchParams(onlyLowStock ? {} : { lowStock: '1' });
  }

  // Debounce simple: espera 350ms de silencio antes de actualizar la URL
  // (y por lo tanto disparar la revalidacion del loader).
  function handleSearchChange(value) {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const next = {};
      if (value) next.search = value;
      setSearchParams(next);
    }, 350);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(product) {
    setEditingId(product.id);
    setForm({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      unitPrice: product.unitPrice,
      quantityInStock: product.quantityInStock,
      reorderLevel: product.reorderLevel,
    });
    setShowForm(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleDelete(id) {
    if (!confirm('¿Seguro que querés eliminar este producto?')) return;
    deleteFetcher.submit({ intent: 'delete', id }, { method: 'post' });
  }

  function handleAdjustStock(id, delta) {
    stockFetcher.submit({ intent: 'adjustStock', id, delta }, { method: 'post' });
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Inventario</h1>
        <div className="page-header-actions">
          <input
            placeholder="Buscar por nombre, SKU o categoría..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            disabled={onlyLowStock}
            style={{ padding: '0.5rem', borderRadius: 6, border: '1px solid #d1d5db', minWidth: 260 }}
          />
          <label className="checkbox-label">
            <input type="checkbox" checked={onlyLowStock} onChange={toggleLowStock} />
            Solo bajo stock
          </label>
          <button onClick={openCreate}>+ Nuevo producto</button>
        </div>
      </div>

      {stockFetcher.data?.error && <div className="alert alert-error">{stockFetcher.data.error}</div>}

      <table className="data-table">
        <thead>
          <tr>
            <th>SKU</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Reorden</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className={p.lowStock ? 'row-warning' : ''}>
              <td>{p.sku}</td>
              <td>
                {p.name}
                {p.lowStock && <span className="badge badge-blocked" style={{ marginLeft: 8 }}>Bajo stock</span>}
              </td>
              <td>{p.category}</td>
              <td>${Number(p.unitPrice).toFixed(2)}</td>
              <td>
                <div className="stock-controls">
                  <button type="button" className="icon-btn" onClick={() => handleAdjustStock(p.id, -1)}>-</button>
                  <span>{p.quantityInStock}</span>
                  <button type="button" className="icon-btn" onClick={() => handleAdjustStock(p.id, 1)}>+</button>
                </div>
              </td>
              <td>{p.reorderLevel}</td>
              <td className="actions">
                <button
                  className="link-btn"
                  onClick={() => {
                    setHistoryProduct(p);
                    historyFetcher.load(`/api/products/${p.id}/stock-movements`);
                  }}
                >
                  Historial
                </button>
                <button className="link-btn" onClick={() => openEdit(p)}>Editar</button>
                <button className="link-btn link-btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>
              </td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={7} className="empty-state">No hay productos para mostrar.</td>
            </tr>
          )}
        </tbody>
      </table>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <formFetcher.Form method="post" className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>

            <input type="hidden" name="intent" value={editingId ? 'update' : 'create'} />
            {editingId && <input type="hidden" name="id" value={editingId} />}

            <label>
              SKU
              <input name="sku" value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
              {fieldErrors.sku && <span className="field-error">{fieldErrors.sku}</span>}
            </label>

            <label>
              Nombre
              <input name="name" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </label>

            <label>
              Descripción
              <textarea name="description" value={form.description} onChange={(e) => update('description', e.target.value)} />
            </label>

            <label>
              Categoría
              <input name="category" value={form.category} onChange={(e) => update('category', e.target.value)} />
            </label>

            <div className="form-row">
              <label>
                Precio unitario
                <input type="number" step="0.01" name="unitPrice" value={form.unitPrice} onChange={(e) => update('unitPrice', e.target.value)} required />
                {fieldErrors.unitPrice && <span className="field-error">{fieldErrors.unitPrice}</span>}
              </label>
              <label>
                Stock inicial
                <input type="number" name="quantityInStock" value={form.quantityInStock} onChange={(e) => update('quantityInStock', e.target.value)} required />
              </label>
              <label>
                Nivel de reorden
                <input type="number" name="reorderLevel" value={form.reorderLevel} onChange={(e) => update('reorderLevel', e.target.value)} required />
              </label>
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancelar</button>
              <button type="submit" disabled={isSaving}>{isSaving ? 'Guardando...' : 'Guardar'}</button>
            </div>
          </formFetcher.Form>
        </div>
      )}

      {historyProduct && (
        <div className="modal-overlay" onClick={() => setHistoryProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2>Historial de stock — {historyProduct.name}</h2>

            {historyFetcher.state === 'loading' && <p>Cargando...</p>}

            {historyFetcher.data && (
              <div className="timeline">
                {historyFetcher.data.map((m) => (
                  <div key={m.id} className="timeline-item">
                    <div className="timeline-header">
                      <strong>
                        {m.quantityChange > 0 ? '+' : ''}{m.quantityChange} unidades — {REASON_LABELS[m.reason] || m.reason}
                      </strong>
                      <span className="timeline-meta">{m.performedByName} · {new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    {m.opportunityTitle && <p>Oportunidad: {m.opportunityTitle}</p>}
                  </div>
                ))}
                {historyFetcher.data.length === 0 && (
                  <p className="empty-state">Todavía no hay movimientos registrados para este producto.</p>
                )}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setHistoryProduct(null)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
