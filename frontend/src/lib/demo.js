// Modo demo: permite desplegar el frontend en Vercel SIN backend.
// Se activa con VITE_DEMO_MODE=true. Los datos viven en memoria + localStorage,
// asi cualquiera puede probar el CRM (login, CRUD, facturas) sin levantar Java.
//
// En local (npm run dev sin esa variable) la app sigue pegando al backend real.
import { demoOppInvoice } from './demo2';

const DEMO_KEY = 'crm_demo_db';

export function isDemoMode() {
  return import.meta.env.VITE_DEMO_MODE === 'true';
}

function mkDemoInvoices() {
  // Facturas de ejemplo repartidas en los últimos 6 meses para que el
  // gráfico de ventas se vea con vida desde el primer login demo.
  const now = new Date();
  const specs = [
    { monthsAgo: 5, total: 1899.98, customer: 'Acme Corp', n: 1 },
    { monthsAgo: 4, total: 259.97, customer: 'Globex', n: 2 },
    { monthsAgo: 4, total: 1299.99, customer: 'Initech', n: 3 },
    { monthsAgo: 3, total: 3499.5, customer: 'Acme Corp', n: 4 },
    { monthsAgo: 2, total: 598.0, customer: 'Globex', n: 5 },
    { monthsAgo: 1, total: 4299.99, customer: 'Acme Corp', n: 6 },
    { monthsAgo: 0, total: 2659.97, customer: 'Acme Corp', n: 7 },
  ];
  return specs.map((s) => {
    const d = new Date(now.getFullYear(), now.getMonth() - s.monthsAgo, 12);
    return {
      id: s.n,
      invoiceNumber: `FAC-${String(s.n).padStart(4, '0')}`,
      customerCompanyName: s.customer,
      customerContactName: '',
      customerEmail: '',
      customerAddress: '',
      issueDate: d.toISOString(),
      total: s.total,
      createdByName: 'Admin Demo',
      items: [{ id: s.n, sku: 'LAP-001', productName: 'Laptop Pro 14', quantity: 1, unitPrice: s.total, lineTotal: s.total }],
    };
  });
}

function seed() {
  return {
    user: { email: 'admin@crm.com', fullName: 'Admin Demo', role: 'ADMIN' },
    customers: [
      { id: 1, companyName: 'Acme Corp', contactName: 'Juan Pérez', email: 'juan@acme.com', phone: '+54 11 5555-0101', industry: 'Manufactura', country: 'Argentina', city: 'Buenos Aires', status: 'ACTIVE' },
      { id: 2, companyName: 'Globex', contactName: 'Ana Gómez', email: 'ana@globex.com', phone: '+54 11 5555-0202', industry: 'Tecnología', country: 'Argentina', city: 'Córdoba', status: 'LEAD' },
      { id: 3, companyName: 'Initech', contactName: 'Carlos Ruiz', email: 'carlos@initech.com', phone: '+54 11 5555-0303', industry: 'Software', country: 'Chile', city: 'Santiago', status: 'ACTIVE' },
    ],
    products: [
      { id: 1, sku: 'LAP-001', name: 'Laptop Pro 14', description: 'Laptop empresarial 16GB RAM', category: 'Hardware', unitPrice: 1299.99, quantityInStock: 25, reorderLevel: 5, imageData: null, imageContentType: null },
      { id: 2, sku: 'MOU-002', name: 'Mouse inalámbrico', description: 'Mouse ergonómico 2.4GHz', category: 'Accesorios', unitPrice: 29.99, quantityInStock: 3, reorderLevel: 10, imageData: null, imageContentType: null },
      { id: 3, sku: 'LIC-003', name: 'Licencia CRM anual', description: 'Suscripción por usuario / año', category: 'Software', unitPrice: 199.0, quantityInStock: 100, reorderLevel: 10, imageData: null, imageContentType: null },
    ],
    opportunities: [
      { id: 1, title: 'Renovación flota Acme', amount: 25999.8, stage: 'NEGOTIATION', expectedCloseDate: '2026-11-30', customerId: 1, customerName: 'Acme Corp', ownerName: 'Admin Demo' },
      { id: 2, title: 'Piloto Globex', amount: 1990.0, stage: 'PROPOSAL', expectedCloseDate: '2026-10-31', customerId: 2, customerName: 'Globex', ownerName: 'Admin Demo' },
      { id: 3, title: 'Licencias Initech', amount: 5970.0, stage: 'QUALIFIED', expectedCloseDate: '2026-12-15', customerId: 3, customerName: 'Initech', ownerName: 'Admin Demo' },
      { id: 4, title: 'Soporte anual Acme', amount: 12000.0, stage: 'WON', expectedCloseDate: '2026-08-01', customerId: 1, customerName: 'Acme Corp', ownerName: 'Admin Demo' },
      { id: 5, title: 'Starter Globex', amount: 890.0, stage: 'LEAD', expectedCloseDate: '2027-01-15', customerId: 2, customerName: 'Globex', ownerName: 'Admin Demo' },
    ],
    invoices: mkDemoInvoices(),
    activities: {
      1: [{ id: 1, type: 'NOTE', description: 'Llamé al cliente, quedó en confirmar la próxima semana.', createdByName: 'Admin Demo', activityDate: new Date().toISOString() }],
      2: [],
    },
    oppProducts: {
      1: [{ id: 1, productName: 'Laptop Pro 14', sku: 'LAP-001', quantity: 2, unitPrice: 1299.99, lineTotal: 2599.98 }],
      2: [],
    },
    auditLogs: [
      { id: 1, createdAt: new Date().toISOString(), username: 'admin@crm.com', entityName: 'Customer', entityId: 1, action: 'CREATE', details: 'Cliente de ejemplo (modo demo)' },
    ],
    seq: 100,
  };
}

export function getDemoDb() {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* seed de nuevo */ }
  const db = seed();
  localStorage.setItem(DEMO_KEY, JSON.stringify(db));
  return db;
}

export function saveDemoDb(db) {
  localStorage.setItem(DEMO_KEY, JSON.stringify(db));
}

function nextId(db) {
  db.seq += 1;
  return db.seq;
}

function authResponse(user) {
  return { token: `demo.${Date.now()}.token`, email: user.email, fullName: user.fullName, role: user.role };
}

export async function demoLogin(email) {
  const db = getDemoDb();
  // En demo cualquier email entra; si es el admin usa su rol, sino SALES.
  const user = email?.toLowerCase() === 'admin@crm.com' ? db.user : { email, fullName: 'Usuario Demo', role: 'SALES_REPRESENTATIVE' };
  await new Promise((r) => setTimeout(r, 350)); // pequeña latencia simulada
  return authResponse(user);
}

export async function demoRegister(payload) {
  const user = { email: payload.email, fullName: `${payload.firstName} ${payload.lastName}`, role: 'SALES_REPRESENTATIVE' };
  await new Promise((r) => setTimeout(r, 350));
  return authResponse(user);
}

// --- Router demo (parte 1: helpers + customers + products) ---
function clone(x) { return structuredClone(x); }
function audit(db, username, entityName, entityId, action, details) {
  db.auditLogs.unshift({ id: nextId(db), createdAt: new Date().toISOString(), username, entityName, entityId, action, details });
}
function currentUser() {
  try {
    const raw = localStorage.getItem('crm_user');
    if (raw) return JSON.parse(raw);
  } catch { /* default */ }
  return { email: 'demo@crm.com', fullName: 'Usuario Demo' };
}
export function demoApi(method, path, body) {
  const db = getDemoDb();
  const me = currentUser();
  const [urlPath, query] = path.split('?');
  const params = new URLSearchParams(query || '');
  const fail = (status, message) => { const e = new Error(message); e.status = status; throw e; };
  const persist = (result) => { saveDemoDb(db); return clone(result); };

  if (urlPath === '/api/customers' && method === 'GET') return clone(db.customers);
  if (urlPath === '/api/customers' && method === 'POST') {
    const item = { id: nextId(db), status: 'LEAD', ...body };
    db.customers.push(item);
    audit(db, me.email, 'Customer', item.id, 'CREATE', item.companyName);
    return persist(item);
  }
  let m = urlPath.match(/^\/api\/customers\/(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    const idx = db.customers.findIndex((c) => c.id === id);
    if (idx === -1) fail(404, 'Cliente no encontrado');
    if (method === 'PUT') {
      db.customers[idx] = { ...db.customers[idx], ...body };
      audit(db, me.email, 'Customer', id, 'UPDATE', db.customers[idx].companyName);
      return persist(db.customers[idx]);
    }
    if (method === 'DELETE') {
      db.customers.splice(idx, 1);
      audit(db, me.email, 'Customer', id, 'DELETE', '');
      return persist(null);
    }
  }

  if (urlPath === '/api/products/low-stock' && method === 'GET') {
    return clone(db.products.filter((p) => p.quantityInStock <= p.reorderLevel));
  }
  if (urlPath === '/api/products' && method === 'GET') {
    const search = (params.get('search') || '').toLowerCase();
    if (!search) return clone(db.products);
    return clone(db.products.filter((p) =>
      [p.name, p.sku, p.category].some((f) => (f || '').toLowerCase().includes(search))));
  }
  if (urlPath === '/api/products' && method === 'POST') {
    const item = { id: nextId(db), ...body };
    db.products.push(item);
    audit(db, me.email, 'Product', item.id, 'CREATE', item.name);
    return persist(item);
  }
  m = urlPath.match(/^\/api\/products\/(\d+)$/);
  if (m) {
    const id = Number(m[1]);
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) fail(404, 'Producto no encontrado');
    if (method === 'PUT') {
      const prev = db.products[idx];
      db.products[idx] = { ...prev, ...body };
      if (body.imageData === undefined) { db.products[idx].imageData = prev.imageData; db.products[idx].imageContentType = prev.imageContentType; }
      audit(db, me.email, 'Product', id, 'UPDATE', db.products[idx].name);
      return persist(db.products[idx]);
    }
    if (method === 'DELETE') {
      db.products.splice(idx, 1);
      audit(db, me.email, 'Product', id, 'DELETE', '');
      return persist(null);
    }
  }
  m = urlPath.match(/^\/api\/products\/(\d+)\/stock$/);
  if (m && method === 'PATCH') {
    const p = db.products.find((x) => x.id === Number(m[1]));
    if (!p) fail(404, 'Producto no encontrado');
    p.quantityInStock = Math.max(0, p.quantityInStock + Number(body.delta || 0));
    audit(db, me.email, 'Product', p.id, 'STOCK_ADJUST', `Nuevo stock: ${p.quantityInStock}`);
    return persist(p);
  }
  m = urlPath.match(/^\/api\/products\/(\d+)\/stock-movements$/);
  if (m && method === 'GET') return [];

  return demoOppInvoice(db, me, method, urlPath, params, body, fail, persist, clone, audit, nextId);
}
