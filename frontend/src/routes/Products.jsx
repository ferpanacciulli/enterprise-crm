import { useEffect, useState } from 'react';
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

export async function productsLoader({ request }) {
  const url = new URL(request.url);
  const onlyLowStock = url.searchParams.get('lowStock') === '1';
  return api.get(onlyLowStock ? '/api/products/low-stock' : '/api/products');
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

  function toggleLowStock() {
    setSearchParams(onlyLowStock ? {} : { lowStock: '1' });
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
    </div>
  );
}
