
import { saveSession, getToken, getRefreshToken, getStoredUser, clearSession, isTokenExpired } from './session';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY. Completá las variables de entorno en Vercel.');
}

// Convertir un objeto de claves camelCase a snake_case (para enviar al API)
function toSnakeCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = toSnakeCase(obj[key]);
    }
    return result;
  }
  return obj;
}

// Convertir un objeto de claves snake_case a camelCase (para leer del API)
function toCamelCase(obj) {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const key of Object.keys(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
    return result;
  }
  return obj;
}

// Mapear rutas del frontend a rutas de Supabase REST API
function mapPath(path) {
  let newPath = path.replace(/^\/api\//, '/');

  // Caso: /products/123 => /products?id=eq.123
  const singleRecordMatch = newPath.match(/^\/([^\/]+)\/([0-9a-f-]{36})$/i);
  if (singleRecordMatch) {
    const [, table, id] = singleRecordMatch;
    return `/${table}?id=eq.${id}`;
  }

  // Caso: /opportunities/123/activities => /activities?opportunity_id=eq.123
  const nestedMatch = newPath.match(/^\/([^\/]+)\/([0-9a-f-]{36})\/([^\/]+)$/i);
  if (nestedMatch) {
    const [, , id, nestedTable] = nestedMatch;
    const tableMap = {
      activities: 'activities',
      products: 'opportunity_products',
      invoices: 'invoice_items',
    };
    const targetTable = tableMap[nestedTable] || nestedTable;
    return `/${targetTable}?opportunity_id=eq.${id}`;
  }

  // Caso: /invoices/123/items => /invoice_items?invoice_id=eq.123
  const invoiceItemsMatch = newPath.match(/^\/invoices\/([0-9a-f-]{36})\/items$/i);
  if (invoiceItemsMatch) {
    const [, id] = invoiceItemsMatch;
    return `/invoice_items?invoice_id=eq.${id}`;
  }

  return newPath;
}

/**
 * Renueva el access_token usando el refresh_token.
 * Devuelve true si se renovó, false si no se pudo (y limpia la sesión).
 */
let refreshPromise = null; // evita que varias requests refresquen a la vez

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshToken = getRefreshToken();
      if (!refreshToken) return false;

      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!res.ok) {
        // El refresh token también está vencido o revocado: cerrar sesión de verdad.
        clearSession();
        return false;
      }

      const data = await res.json();
      // Reutilizamos el usuario guardado para no pisarlo con datos vacíos
      const user = getStoredUser() || {};
      saveSession({
        token: data.access_token,
        refreshToken: data.refresh_token,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      });
      return true;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function supabaseRequest(path, options = {}, _retried = false) {
  // Renovación proactiva: si el token ya venció y tenemos refresh, renovar antes de pedir
  if (isTokenExpired() && getRefreshToken()) {
    const ok = await refreshAccessToken();
    if (!ok) {
      const err = new Error('Tu sesión expiró. Volvé a iniciar sesión.');
      err.status = 401;
      err.sessionExpired = true;
      throw err;
    }
  }

  const token = getToken();
  const finalHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': token ? `Bearer ${token}` : `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  const mappedPath = mapPath(path);
  const url = `${SUPABASE_URL}/rest/v1${mappedPath}`;
  const response = await fetch(url, {
    method: options?.method || 'GET',
    headers: finalHeaders,
    body: options?.body ? JSON.stringify(toSnakeCase(options.body)) : undefined,
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);

  // Token vencido a mitad de camino: renovar y reintentar UNA sola vez
  const jwtExpired =
    response.status === 401 &&
    (body?.message?.toLowerCase().includes('jwt') ||
      body?.error_description?.toLowerCase().includes('expired') ||
      body?.msg?.toLowerCase().includes('jwt'));

  if (jwtExpired && !_retried && getRefreshToken()) {
    const ok = await refreshAccessToken();
    if (ok) {
      return supabaseRequest(path, options, true);
    }
    const err = new Error('Tu sesión expiró. Volvé a iniciar sesión.');
    err.status = 401;
    err.sessionExpired = true;
    throw err;
  }

  if (!response.ok) {
    const err = new Error(body?.message || `Error ${response.status}`);
    err.status = response.status;
    if (response.status === 401) err.sessionExpired = true;
    err.fieldErrors = body?.fieldErrors || null;
    throw err;
  }
  // Convertir las respuestas a camelCase para que el frontend pueda consumirlas fácilmente
  return toCamelCase(body);
}

export const api = {
  get: (path) => supabaseRequest(path, { method: 'GET' }),
  post: (path, body) => supabaseRequest(path, { method: 'POST', body }),
  put: (path, body) => supabaseRequest(path, { method: 'PUT', body }),
  patch: (path, body) => supabaseRequest(path, { method: 'PATCH', body }),
  del: (path) => supabaseRequest(path, { method: 'DELETE' }),
};

export async function login(email, password) {
  const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    let msg = data?.error_description || data?.message || `Error ${res.status}`;
    if (msg?.includes('not confirmed') || msg?.includes('confirm')) {
      msg = 'Tu email no está confirmado. Revisá tu bandeja de entrada o contactá al administrador.';
    }
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const fullName = data.user?.user_metadata?.full_name || email;
  const token = data.access_token;
  const refreshToken = data.refresh_token;

  saveSession({ token, refreshToken, email, fullName, role: 'SALES_REPRESENTATIVE' });

  // Obtener el rol real del usuario desde la tabla users de Supabase
  let userRole = 'SALES_REPRESENTATIVE'; // valor por defecto
  try {
    const users = await api.get(`/api/users?email=eq.${encodeURIComponent(email)}`);
    if (users && users.length > 0) {
      userRole = users[0].role || 'SALES_REPRESENTATIVE';
    }
  } catch (e) {
    console.warn('No se pudo obtener el rol del usuario:', e.message);
  }

  // Actualizar la sesión con el rol correcto
  saveSession({ token, refreshToken, email, fullName, role: userRole });

  return { token, email, fullName, role: userRole };
}

export async function register(payload) {
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      // FIX: los datos del usuario van en "data" para Supabase
      data: { full_name: `${payload.firstName} ${payload.lastName}` },
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const err = new Error(data?.error_description || data?.message || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const fullName = `${payload.firstName} ${payload.lastName}`;

  saveSession({
    token: data.access_token,
    refreshToken: data.refresh_token,
    email: payload.email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  });

  return {
    token: data.access_token,
    email: payload.email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  };
}

export const authApi = {
  login,
  register,
};
