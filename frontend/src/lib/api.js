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

  // Guardar el token y el refresh token en la sesión
  const token = data.access_token || 'supabase_token';
  const refreshToken = data.refresh_token || null;
  saveSession({
    token,
    refreshToken,
    email,
    fullName,
    role: 'SALES_REPRESENTATIVE',
  });

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
  saveSession({
    token,
    refreshToken,
    email,
    fullName,
    role: userRole,
  });

  return {
    token: data.access_token || 'supabase_token',
    email,
    fullName,
    role: userRole,
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

// Exportar las funciones y constantes