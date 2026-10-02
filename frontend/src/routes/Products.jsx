import { useEffect, useRef, useState } from 'react';
import { useLoaderData, useFetcher, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { getStoredUser } from '../lib/session';

const EMPTY_FORM = {
  sku: '',
  name: '',
  description: '',
  category: '',
  unitPrice: '',
  quantityInStock: '',
  reorderLevel: '',
  imageDataUrl: '', // "data:image/png;base64,...." completo, o vacio si no tiene foto. Se parsea en el action para mandar solo el base64 y contentType al backend.
};

const REASON_LABELS = {
  MANUAL_ADJUSTMENT: 'Ajuste manual',
  OPPORTUNITY_RESERVE: 'Reservado en oportunidad',
  OPPORTUNITY_RELEASE: 'Liberado de oportunidad',
  INVOICE_SALE: 'Venta facturada',
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB

function buildImageUrl(product) {
  if (!product?.imageData) return null;
  return `data:${product.imageContentType};base64,${product.imageData}`;
}

// Separa un data URL completo en { contentType, data (base64 puro) }
function parseDataUrl(dataUrl) {
  if (!dataUrl) return { contentType: null, data: null };
  const match = /^data:(.+);base64,(.+)$/.exec(dataUrl);
  if (!match) return { contentType: null, data: null };
  return { contentType: match[1], data: match[2] };
}

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

    const { contentType, data } = parseDataUrl(formData.get('imageDataUrl'));

    const payload = {
      sku: formData.get('sku'),
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      unitPrice: parseFloat(formData.get('unitPrice')),
      quantityInStock: parseInt(formData.get('quantityInStock'), 10),
      reorderLevel: parseInt(formData.get('reorderLevel'), 10),
      // Si no se toco el campo de imagen, mandamos null y el backend no pisa la que ya tenia
      imageData: data,
      imageContentType: contentType,
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
  // Catalogo de productos: ADMIN/MANAGER crean, editan, ajustan stock y borran;
  // SALES solo consulta (no toca el catalogo).
  const currentRole = getStoredUser()?.role;
  const canWrite = ['ADMIN', 'MANAGER'].includes(currentRole);
  const canDelete = ['ADMIN', 'MANAGER'].includes(currentRole);
  const [searchParams, setSearchParams] = useSearchParams();
  const onlyLowStock = searchParams.get('lowStock') === '1';

  const formFetcher = useFetcher();
  const stockFetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const isReadOnlyEmpty = !canWrite && products.length === 0;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [imageError, setImageError] = useState(null);
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
    setImageError(null);
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
      imageDataUrl: buildImageUrl(product) || '',
    });
    setImageError(null);
    setShowForm(true);
  }

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_BYTES) {
      setImageError('La imagen no puede pesar más de 2MB.');
      e.target.value = '';
      return;
    }

    setImageError(null);
    const reader = new FileReader();
    reader.onload = () => update('imageDataUrl', reader.result);
    reader.readAsDataURL(file);
  }

  function handleDelete(id) {
    if (!confirm('¿Seguro que querés eliminar este producto?')) return;
    deleteFetcher.submit({ intent: 'delete', id }, { method: 'post' });
  }

  function handleAdjustStock(id, delta) {
    stockFetcher.submit({ intent: 'adjustStock', id, delta }, { method: 'post' });
  }

  async function openHistory(product) {
    setHistoryProduct(product);
    setHistoryData(null);
    setHistoryError(null);
    setHistoryLoading(true);
    try {
      const data = await api.get(`/api/products/${product.id}/stock-movements`);
      setHistoryData(data);
    } catch (err) {
      setHistoryError(err.message);
    } finally {
      setHistoryLoading(false);
    }
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
          <button onClick={openCreate} disabled={!canWrite} title={canWrite ? '' : 'Tu rol es de solo lectura'}>+ Nuevo producto</button>
        </div>
      </div>

      {stockFetcher.data?.error && <div className="alert alert-error">{stockFetcher.data.error}</div>}

      {isReadOnlyEmpty && (
        <div className="alert alert-error">
          Tu rol ({currentRole}) es de solo lectura en esta sección: podés consultar y ver el historial, pero no modificar el inventario.
        </div>
      )}

      {(formFetcher.data?.error || stockFetcher.data?.error || deleteFetcher.data?.error) && (
        <div className="alert alert-error">
          {formFetcher.data?.error || stockFetcher.data?.error || deleteFetcher.data?.error}
        </div>
      )}

      <table className="data-table">
        <thead>
          <tr>
            <th></th>
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
          {products.map((p) => {
            const imageUrl = buildImageUrl(p);
            return (
              <tr key={p.id} className={p.lowStock ? 'row-warning' : ''}>
                <td>
                  {imageUrl ? (
                    <img src={imageUrl} alt={p.name} className="product-thumb" />
                  ) : (
                    <div className="product-thumb product-thumb-placeholder">📦</div>
                  )}
                </td>
                <td>{p.sku}</td>
                <td>
                  {p.name}
                  {p.lowStock && <span className="badge badge-blocked" style={{ marginLeft: 8 }}>Bajo stock</span>}
                </td>
                <td>{p.category}</td>
                <td>${Number(p.unitPrice).toFixed(2)}</td>
                <td>
                  <div className="stock-controls">
                    <button type="button" className="icon-btn" onClick={() => handleAdjustStock(p.id, -1)} disabled={!canWrite}>-</button>
                    <span>{p.quantityInStock}</span>
                    <button type="button" className="icon-btn" onClick={() => handleAdjustStock(p.id, 1)} disabled={!canWrite}>+</button>
                  </div>
                </td>
                <td>{p.reorderLevel}</td>
                <td className="actions">
                  <button
                    className="link-btn"
                    onClick={() => openHistory(p)}
                  >
                    Historial
                  </button>
                  <button className="link-btn" onClick={() => openEdit(p)} disabled={!canWrite}>Editar</button>
                  {canDelete && <button className="link-btn link-btn-danger" onClick={() => handleDelete(p.id)}>Eliminar</button>}
                </td>
              </tr>
            );
          })}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} className="empty-state">No hay productos para mostrar.</td>
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
            <input type="hidden" name="imageDataUrl" value={form.imageDataUrl} />

            <label>
              Foto (opcional, máx 2MB)
              {form.imageDataUrl && (
                <img src={form.imageDataUrl} alt="preview" className="product-thumb" style={{ display: 'block', marginBottom: 6 }} />
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} />
              {imageError && <span className="field-error">{imageError}</span>}
            </label>

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

            {historyLoading && <p>Cargando...</p>}
            {historyError && <div className="alert alert-error">{historyError}</div>}

            {historyData && (
              <div className="timeline">
                {historyData.map((m) => (
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
                {historyData.length === 0 && (
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
