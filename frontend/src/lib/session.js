// ============================================================
// ARCHIVO 1: src/lib/session.js
// ============================================================
import { redirect } from 'react-router-dom';

const TOKEN_KEY = 'crm_token';
const REFRESH_TOKEN_KEY = 'crm_refresh_token';
const USER_KEY = 'crm_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(authResponse) {
  if (authResponse.token) {
    localStorage.setItem(TOKEN_KEY, authResponse.token);
  }
  if (authResponse.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
  }
  if (authResponse.email || authResponse.fullName || authResponse.role) {
    const current = getStoredUser() || {};
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        email: authResponse.email ?? current.email,
        fullName: authResponse.fullName ?? current.fullName,
        role: authResponse.role ?? current.role,
      })
    );
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/** Decodifica el payload del JWT y devuelve la expiración en milisegundos (o null). */
export function getTokenExpiration(token) {
  if (!token) return null;
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    const payload = JSON.parse(
      atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'))
    );
    return payload.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** true si no hay token o si el token ya venció. */
export function isTokenExpired() {
  const exp = getTokenExpiration(getToken());
  return exp === null || Date.now() >= exp;
}

/**
 * Guard para loaders de rutas protegidas. Ahora valida que el token
 * exista Y que no esté vencido. Si está vencido pero hay refresh token,
 * lo dejamos pasar: la capa de api lo va a renovar en el próximo request.
 */
export function requireAuth() {
  const token = getToken();
  if (!token || (isTokenExpired() && !getRefreshToken())) {
    clearSession();
    throw redirect('/login');
  }
  return { user: getStoredUser() };
}