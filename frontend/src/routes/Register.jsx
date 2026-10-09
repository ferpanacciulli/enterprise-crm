import { Form, Link, redirect, useActionData, useNavigation } from 'react-router-dom';
import { authApi } from '../lib/api';
import { saveSession } from '../lib/session';

export async function registerAction({ request }) {
  const formData = await request.formData();
  const payload = {
    firstName: formData.get('firstName'),
    lastName: formData.get('lastName'),
    email: formData.get('email'),
    password: formData.get('password'),
  };

  try {
    const result = await authApi.register(payload);
    saveSession(result);
    return redirect('/');
  } catch (err) {
    return { error: err.message, fieldErrors: err.fieldErrors || {} };
  }
}

export default function Register() {
  const actionData = useActionData();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const fieldErrors = actionData?.fieldErrors || {};

  return (
    <div className="auth-page">
      <Form method="post" className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark">E</span>
          Enterprise CRM
        </div>
        <h1>Crear cuenta</h1>
        <p className="auth-sub">Empezá a gestionar tu negocio en minutos.</p>

        {actionData?.error && <div className="alert alert-error">{actionData.error}</div>}

        <label>
          Nombre
          <input name="firstName" required />
          {fieldErrors.firstName && <span className="field-error">{fieldErrors.firstName}</span>}
        </label>

        <label>
          Apellido
          <input name="lastName" required />
          {fieldErrors.lastName && <span className="field-error">{fieldErrors.lastName}</span>}
        </label>

        <label>
          Email
          <input type="email" name="email" required />
          {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
        </label>

        <label>
          Contraseña
          <input type="password" name="password" required />
          {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
        </label>

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <p className="auth-switch">
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </Form>
    </div>
  );
}
