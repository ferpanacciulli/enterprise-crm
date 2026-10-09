// Parte 2 del router demo: oportunidades, actividades, productos reservados,
// facturas y auditoría. Recibe los helpers de demo.js (sin imports circulares).
export function demoOppInvoice(db, me, method, urlPath, params, body, fail, persist, clone, audit, nextId) {
  let m;
  if (urlPath === '/api/opportunities' && method === 'GET') return clone(db.opportunities);
  if (urlPath === '/api/opportunities' && method === 'POST') {
    const customer = db.customers.find((c) => c.id === Number(body.customerId));
    const item = { id: nextId(db), ownerName: me.fullName, customerName: customer?.companyName || '', ...body };
    db.opportunities.push(item);
    db.activities[item.id] = [];
    db.oppProducts[item.id] = [];
    audit(db, me.email, 'Opportunity', item.id, 'CREATE', item.title);
    return persist(item);
  }
  m = urlPath.match(/^\/api\/opportunities\/(\d+)$/);
  if (m && !urlPath.includes('/activities') && !urlPath.includes('/products')) {
    const id = Number(m[1]);
    const idx = db.opportunities.findIndex((o) => o.id === id);
    if (idx === -1) fail(404, 'Oportunidad no encontrada');
    if (method === 'GET') return clone(db.opportunities[idx]);
    if (method === 'PUT') {
      const customer = db.customers.find((c) => c.id === Number(body.customerId ?? db.opportunities[idx].customerId));
      db.opportunities[idx] = { ...db.opportunities[idx], ...body, customerName: customer?.companyName || db.opportunities[idx].customerName };
      audit(db, me.email, 'Opportunity', id, 'UPDATE', db.opportunities[idx].title);
      return persist(db.opportunities[idx]);
    }
    if (method === 'DELETE') {
      db.opportunities.splice(idx, 1);
      delete db.activities[id];
      delete db.oppProducts[id];
      audit(db, me.email, 'Opportunity', id, 'DELETE', '');
      return persist(null);
    }
  }
  m = urlPath.match(/^\/api\/opportunities\/(\d+)\/activities$/);
  if (m) {
    const id = Number(m[1]);
    if (method === 'GET') return clone(db.activities[id] || []);
    const item = { id: nextId(db), createdByName: me.fullName, activityDate: new Date().toISOString(), ...body };
    (db.activities[id] = db.activities[id] || []).unshift(item);
    return persist(item);
  }
  m = urlPath.match(/^\/api\/opportunities\/(\d+)\/products$/);
  if (m) {
    const id = Number(m[1]);
    if (method === 'GET') return clone(db.oppProducts[id] || []);
    const product = db.products.find((p) => p.id === Number(body.productId));
    if (!product) fail(404, 'Producto no encontrado');
    const qty = Number(body.quantity || 1);
    if (product.quantityInStock < qty) fail(400, 'Stock insuficiente');
    product.quantityInStock -= qty;
    const item = { id: nextId(db), productName: product.name, sku: product.sku, quantity: qty, unitPrice: product.unitPrice, lineTotal: Number(product.unitPrice) * qty };
    (db.oppProducts[id] = db.oppProducts[id] || []).push(item);
    return persist(item);
  }
  m = urlPath.match(/^\/api\/opportunities\/(\d+)\/products\/(\d+)$/);
  if (m && method === 'DELETE') {
    const oppId = Number(m[1]);
    const itemId = Number(m[2]);
    const list = db.oppProducts[oppId] || [];
    const idx = list.findIndex((i) => i.id === itemId);
    if (idx === -1) fail(404, 'Ítem no encontrado');
    const [removed] = list.splice(idx, 1);
    const product = db.products.find((p) => p.sku === removed.sku);
    if (product) product.quantityInStock += removed.quantity;
    return persist(null);
  }
  if (urlPath === '/api/invoices' && method === 'GET') return clone(db.invoices);
  if (urlPath === '/api/invoices' && method === 'POST') {
    const customer = db.customers.find((c) => c.id === Number(body.customerId));
    if (!customer) fail(400, 'Elegí un cliente válido');
    const items = (body.lines || []).map((l) => {
      const p = db.products.find((x) => x.id === Number(l.productId));
      if (!p) fail(400, 'Producto inválido en una línea');
      if (p.quantityInStock < l.quantity) fail(400, `Stock insuficiente para ${p.name}`);
      p.quantityInStock -= l.quantity;
      return { id: nextId(db), sku: p.sku, productName: p.name, quantity: l.quantity, unitPrice: p.unitPrice, lineTotal: Number(p.unitPrice) * l.quantity };
    });
    const total = items.reduce((s, i) => s + i.lineTotal, 0);
    const invoice = { id: nextId(db), invoiceNumber: `FAC-${String(db.invoices.length + 1).padStart(4, '0')}`, customerCompanyName: customer.companyName, customerContactName: customer.contactName, customerEmail: customer.email, customerAddress: [customer.city, customer.country].filter(Boolean).join(', '), issueDate: new Date().toISOString(), total, createdByName: me.fullName, items };
    db.invoices.push(invoice);
    audit(db, me.email, 'Invoice', invoice.id, 'CREATE', invoice.invoiceNumber);
    return persist(invoice);
  }
  m = urlPath.match(/^\/api\/invoices\/(\d+)$/);
  if (m && method === 'GET') {
    const inv = db.invoices.find((i) => i.id === Number(m[1]));
    if (!inv) fail(404, 'Factura no encontrada');
    return clone(inv);
  }
  if (urlPath === '/api/audit-logs' && method === 'GET') {
    const limit = Number(params.get('limit') || '100');
    return clone(db.auditLogs.slice(0, limit));
  }
  fail(404, `Demo: ${method} ${urlPath} no implementado`);
}
