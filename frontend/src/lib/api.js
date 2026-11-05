import { saveSession } from './session';

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

async function supabaseRequest(path, options = {}) {
  const finalHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(options?.headers || {}),
  };
  const supabasePath = path.replace(/^\/api\//, '/');
  const url = `${SUPABASE_URL}/rest/v1${supabasePath}`;
  const response = await fetch(url, {
    method: options?.method || 'GET',
    headers: finalHeaders,
    body: options?.body ? JSON.stringify(toSnakeCase(options.body)) : undefined,
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const err = new Error(body?.message || `Error ${response.status}`);
    err.status = response.status;
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

  saveSession({
    token: data.access_token || 'supabase_token',
    email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  });

  return {
    token: data.access_token || 'supabase_token',
    email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  };
}

export async function register(payload) {
  const url = `${SUPABASE_URL}/auth/v1/signup`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: payload.email,
      password: payload.password,
      email_confirm: true,
      metadata: { full_name: `${payload.firstName} ${payload.lastName}` },
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    const err = new Error(data?.error_description || `Error ${res.status}`);
    err.status = res.status;
    throw err;
  }

  const data = await res.json();
  const fullName = `${payload.firstName} ${payload.lastName}`;

  saveSession({
    token: data.access_token || 'supabase_dummy',
    email: payload.email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  });

  return {
    token: data.access_token || 'supabase_dummy',
    email: payload.email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  };
}

export const authApi = {
  login,
  register,
};