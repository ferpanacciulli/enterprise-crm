import { useEffect, useState } from 'react';
import { api } from '../api/client';

const EMPTY_FORM = {
  sku: '',
  name: '',
  description: '',
  category: '',
  unitPrice: '',
  quantityInStock: '',
  reorderLevel: '',
  active: true,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  async function loadProducts(lowStockOnly = onlyLowStock) {
    setLoading(true);
    try {
      const data = await api.get(lowStockOnly ? '/api/products/low-stock' : '/api/products');
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleLowStock() {
    const next = !onlyLowStock;
    setOnlyLowStock(next);
    loadProducts(next);
  }

  function openCreate() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFieldErrors({});
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
      active: product.active,
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
    const payload = {
      ...form,
      unitPrice: parseFloat(form.unitPrice),
      quantityInStock: parseInt(form.quantityInStock, 10),
      reorderLevel: parseInt(form.reorderLevel, 10),
    };
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, payload);
      } else {
        await api.post('/api/products', payload);
      }
      closeForm();
      await loadProducts();
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
    if (!confirm('¿Seguro que querés eliminar este producto?')) return;
    try {
      await api.del(`/api/products/${id}`);
      await loadProducts();
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleAdjustStock(id, delta) {
    try {
      await api.patch(`/api/products/${id}/stock`, { delta });
      await loadProducts();
    } catch (err) {
      alert(err.message);
    }
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

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <p>Cargando...</p>
      ) : (
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
                    <button className="icon-btn" onClick={() => handleAdjustStock(p.id, -1)}>-</button>
                    <span>{p.quantityInStock}</span>
                    <button className="icon-btn" onClick={() => handleAdjustStock(p.id, 1)}>+</button>
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
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <form className="modal-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
            <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>

            <label>
              SKU
              <input value={form.sku} onChange={(e) => update('sku', e.target.value)} required />
              {fieldErrors.sku && <span className="field-error">{fieldErrors.sku}</span>}
            </label>

            <label>
              Nombre
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
              {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
            </label>

            <label>
              Descripción
              <textarea value={form.description} onChange={(e) => update('description', e.target.value)} />
            </label>

            <label>
              Categoría
              <input value={form.category} onChange={(e) => update('category', e.target.value)} />
            </label>

            <div className="form-row">
              <label>
                Precio unitario
                <input
                  type="number"
                  step="0.01"
                  value={form.unitPrice}
                  onChange={(e) => update('unitPrice', e.target.value)}
                  required
                />
                {fieldErrors.unitPrice && <span className="field-error">{fieldErrors.unitPrice}</span>}
              </label>
              <label>
                Stock inicial
                <input
                  type="number"
                  value={form.quantityInStock}
                  onChange={(e) => update('quantityInStock', e.target.value)}
                  required
                />
              </label>
              <label>
                Nivel de reorden
                <input
                  type="number"
                  value={form.reorderLevel}
                  onChange={(e) => update('reorderLevel', e.target.value)}
                  required
                />
              </label>
            </div>

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
