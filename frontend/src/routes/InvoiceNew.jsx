import { useState } from 'react';
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router-dom';
import { api } from '../lib/api';

export async function invoiceNewLoader() {
  const [customers, products] = await Promise.all([
    api.get('/api/customers'),
    api.get('/api/products'),
  ]);
  return { customers, products };
}

export async function invoiceNewAction({ request }) {
  const formData = await request.formData();
  const customerId = Number(formData.get('customerId'));
  const lines = JSON.parse(formData.get('lines') || '[]');

  try {
    const invoice = await api.post('/api/invoices', { customerId, lines });
    return redirect(`/invoices/${invoice.id}`);
  } catch (err) {
    return { error: err.message };
  }
}

export default function InvoiceNew() {
  const { customers, products } = useLoaderData();
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState([]);
  const [draftProductId, setDraftProductId] = useState('');
  const [draftQuantity, setDraftQuantity] = useState(1);

  const productById = Object.fromEntries(products.map((p) => [p.id, p]));

  const total = lines.reduce((sum, l) => {
    const product = productById[l.productId];
    return sum + (product ? Number(product.unitPrice) * l.quantity : 0);
  }, 0);

  function addLine() {
    if (!draftProductId) return;
    const productId = Number(draftProductId);
    const quantity = Number(draftQuantity) || 1;

    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (existing) {
        return prev.map((l) => (l.productId === productId ? { ...l, quantity: l.quantity + quantity } : l));
      }
      return [...prev, { productId, quantity }];
    });
    setDraftProductId('');
    setDraftQuantity(1);
  }

  function removeLine(productId) {
    setLines((prev) => prev.filter((l) => l.productId !== productId));
  }

  const canSubmit = customerId && lines.length > 0 && !isSubmitting;

  return (
    <div className="page">
      <Link to="/invoices">&larr; Volver a facturas</Link>

      <h1 style={{ marginTop: '1rem' }}>Nueva factura</h1>

      {actionData?.error && <div className="alert alert-error">{actionData.error}</div>}

      <div className="modal-card" style={{ width: '100%', maxWidth: 600, marginBottom: '1.5rem' }}>
        <label>
          Cliente
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="" disabled>Elegí un cliente...</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>
        </label>

        <div className="form-row" style={{ gridTemplateColumns: '1fr 100px auto', marginTop: '1rem' }}>
          <label>
            Producto
            <select value={draftProductId} onChange={(e) => setDraftProductId(e.target.value)}>
              <option value="" disabled>Elegí un producto...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} (stock: {p.quantityInStock})</option>
              ))}
            </select>
          </label>
          <label>
            Cant.
            <input type="number" min="1" value={draftQuantity} onChange={(e) => setDraftQuantity(e.target.value)} />
          </label>
          <label style={{ alignSelf: 'end' }}>
            <button type="button" onClick={addLine}>Agregar línea</button>
          </label>
        </div>
      </div>

      <table className="data-table" style={{ marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th>Producto</th>
            <th>Cantidad</th>
            <th>Precio unitario</th>
            <th>Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => {
            const product = productById[l.productId];
            return (
              <tr key={l.productId}>
                <td>{product?.name}</td>
                <td>{l.quantity}</td>
                <td>${Number(product?.unitPrice).toFixed(2)}</td>
                <td>${(Number(product?.unitPrice) * l.quantity).toFixed(2)}</td>
                <td className="actions">
                  <button className="link-btn link-btn-danger" onClick={() => removeLine(l.productId)}>Quitar</button>
                </td>
              </tr>
            );
          })}
          {lines.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">Agregá al menos un producto.</td>
            </tr>
          )}
          {lines.length > 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 600 }}>Total:</td>
              <td style={{ fontWeight: 600 }}>${total.toFixed(2)}</td>
              <td></td>
            </tr>
          )}
        </tbody>
      </table>

      <Form method="post">
        <input type="hidden" name="customerId" value={customerId} />
        <input type="hidden" name="lines" value={JSON.stringify(lines)} />
        <button type="submit" disabled={!canSubmit}>
          {isSubmitting ? 'Generando factura...' : 'Generar factura'}
        </button>
      </Form>
    </div>
  );
}
