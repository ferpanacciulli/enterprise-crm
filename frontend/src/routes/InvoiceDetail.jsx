import { Link, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';

export async function invoiceDetailLoader({ params }) {
  return api.get(`/api/invoices/${params.id}`);
}

export default function InvoiceDetail() {
  const invoice = useLoaderData();

  return (
    <div className="page">
      <div className="no-print" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/invoices">&larr; Volver a facturas</Link>
        <button onClick={() => window.print()}>Imprimir</button>
      </div>

      <div className="invoice-sheet">
        <div className="invoice-header">
          <div>
            <h1 style={{ margin: 0 }}>Factura</h1>
            <p style={{ margin: 0, color: '#6b7280' }}>{invoice.invoiceNumber}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: 0 }}>Fecha: {new Date(invoice.issueDate).toLocaleDateString()}</p>
            <p style={{ margin: 0, color: '#6b7280' }}>Emitida por: {invoice.createdByName}</p>
          </div>
        </div>

        <div className="invoice-customer">
          <h3>Cliente</h3>
          <p style={{ margin: 0 }}><strong>{invoice.customerCompanyName}</strong></p>
          {invoice.customerContactName && <p style={{ margin: 0 }}>{invoice.customerContactName}</p>}
          {invoice.customerEmail && <p style={{ margin: 0 }}>{invoice.customerEmail}</p>}
          {invoice.customerAddress && <p style={{ margin: 0 }}>{invoice.customerAddress}</p>}
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Precio unitario</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.sku}</td>
                <td>{item.productName}</td>
                <td>{item.quantity}</td>
                <td>${Number(item.unitPrice).toFixed(2)}</td>
                <td>${Number(item.lineTotal).toFixed(2)}</td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Total:</td>
              <td style={{ fontWeight: 700 }}>${Number(invoice.total).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
