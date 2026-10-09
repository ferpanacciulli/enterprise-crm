import { Form, Link, redirect, useActionData, useNavigation, useSearchParams } from 'react-router-dom';
import { authApi, DEMO_MODE } from '../lib/api';
import { saveSession, getToken } from '../lib/session';

export async function loginLoader() {
  // ya logueado -> no tiene sentido mostrar el login de nuevo
  if (getToken()) {
    return redirect('/');
  }
  return null;
}

export async function loginAction({ request }) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    const result = await authApi.login(email, password);
    saveSession(result);
    return redirect('/');
  } catch (err) {
    return { error: err.message };
  }
}

export default function Login() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const [searchParams] = useSearchParams();
  const isSubmitting = navigation.state === 'submitting';
  const sessionExpired = searchParams.get('sessionExpired') === '1';

  return (
    <div className="auth-page">
      <Form method="post" className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">E</span>
          Enterprise CRM
        </div>
        <h1>Iniciar sesión</h1>
        <p className="auth-sub">Gestioná clientes, oportunidades, stock y facturas.</p>
        {DEMO_MODE ? (
          <p className="demo-banner">
            Modo demo — entrá con cualquier email, sin contraseña real. Los datos se guardan en tu navegador.
          </p>
        ) : (
          <p className="auth-hint">
            Usuario de prueba: <code>admin@crm.com</code> / <code>Admin123!</code>
          </p>
        )}

        {sessionExpired && !actionData?.error && (
          <div className="alert alert-error">Tu sesión expiró. Iniciá sesión de nuevo para continuar.</div>
        )}
        {actionData?.error && <div className="alert alert-error">{actionData.error}</div>}

        <label>
          Email
          <input type="email" name="email" defaultValue="admin@crm.com" required />
        </label>

        <label>
          Contraseña
          <input type="password" name="password" defaultValue="Admin123!" required />
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Ingresando...' : 'Ingresar'}
        </button>

        <p className="auth-switch">
          ¿No tenés cuenta? <Link to="/register">Registrate</Link>
        </p>
      </Form>
    </div>
  );
}
