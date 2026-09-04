import { createContext, useContext, useState, useCallback } from 'react';
import { auth as authApi } from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  const raw = localStorage.getItem('crm_user');
  return raw ? JSON.parse(raw) : null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser());
  const [token, setToken] = useState(localStorage.getItem('crm_token'));

  const persist = useCallback((authResponse) => {
    localStorage.setItem('crm_token', authResponse.token);
    localStorage.setItem(
      'crm_user',
      JSON.stringify({
        email: authResponse.email,
        fullName: authResponse.fullName,
        role: authResponse.role,
      })
    );
    setToken(authResponse.token);
    setUser({
      email: authResponse.email,
      fullName: authResponse.fullName,
      role: authResponse.role,
    });
  }, []);

  const login = useCallback(
    async (email, password) => {
      const result = await authApi.login(email, password);
      persist(result);
      return result;
    },
    [persist]
  );

  const register = useCallback(
    async (payload) => {
      const result = await authApi.register(payload);
      persist(result);
      return result;
    },
    [persist]
  );

  const logout = useCallback(() => {
    localStorage.removeItem('crm_token');
    localStorage.removeItem('crm_user');
    setToken(null);
    setUser(null);
  }, []);

  const value = { user, token, login, register, logout, isAuthenticated: !!token };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
