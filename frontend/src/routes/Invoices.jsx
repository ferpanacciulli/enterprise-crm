import { Link, useLoaderData } from 'react-router-dom';
import { api } from '../lib/api';

export async function invoicesLoader() {
  return api.get('/api/invoices');
}

export default function Invoices() {
  const invoices = useLoaderData();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Facturas</h1>
        <Link to="/invoices/new"><button>+ Nueva factura</button></Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id}>
              <td>{inv.invoiceNumber}</td>
              <td>{inv.customerCompanyName}</td>
              <td>{new Date(inv.issueDate).toLocaleDateString()}</td>
              <td>${Number(inv.total).toFixed(2)}</td>
              <td className="actions">
                <Link className="link-btn" to={`/invoices/${inv.id}`}>Ver</Link>
              </td>
            </tr>
          ))}
          {invoices.length === 0 && (
            <tr>
              <td colSpan={5} className="empty-state">Todavía no se generó ninguna factura.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
