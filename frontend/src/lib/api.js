import { redirect } from 'react-router-dom';
import { clearSession, getToken } from './session';
import { isDemoMode, demoLogin, demoRegister, demoApi } from './demo';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
export const DEMO_MODE = isDemoMode();

// En modo demo (Vercel sin backend) todas las llamadas se resuelven en
// memoria con datos de ejemplo. En modo normal pegan al backend real.
async function request(path, options = {}) {
  if (DEMO_MODE) {
    const method = (options.method || 'GET').toUpperCase();
    const body = options.body ? JSON.parse(options.body) : undefined;
    await new Promise((r) => setTimeout(r, 200)); // latencia simulada
    return demoApi(method, path, body);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (response.status === 204) return null;

  // Un 401 con token adjunto significa "tu sesion ya no vale" (vencida,
  // invalida, etc). Solo mandamos al login en ese caso puntual: si NO habia
  // token (ej. el propio POST /auth/login con contraseña incorrecta), esto
  // se deja pasar como un error normal para que el formulario lo muestre inline.
  if (response.status === 401 && token) {
    clearSession();
    throw redirect('/login?sessionExpired=1');
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || `Error ${response.status}`);
    error.status = response.status;
    error.fieldErrors = data?.fieldErrors || null;
    throw error;
  }

  return data;
}

export const api = {
  get: (path) => request(path, { method: 'GET' }),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),
};

export const authApi = {
  login: (email, password) =>
    DEMO_MODE ? demoLogin(email, password) : api.post('/auth/login', { email, password }),
  register: (payload) =>
    DEMO_MODE ? demoRegister(payload) : api.post('/auth/register', payload),
};


