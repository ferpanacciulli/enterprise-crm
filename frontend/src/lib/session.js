import { redirect } from 'react-router-dom';

const TOKEN_KEY = 'crm_token';
const USER_KEY = 'crm_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveSession(authResponse) {
  localStorage.setItem(TOKEN_KEY, authResponse.token);
  localStorage.setItem(
    USER_KEY,
    JSON.stringify({
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    })
  );
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Guard para loaders de rutas protegidas. Los loaders corren ANTES de
 * renderizar el componente, asi que si no hay token, redirige a /login
 * sin llegar a pintar la pantalla protegida ni un solo frame.
 */
export function requireAuth() {
  const token = getToken();
  if (!token) {
    throw redirect('/login');
  }
  return { user: getStoredUser() };
}
