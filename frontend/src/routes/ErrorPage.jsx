import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';

export default function ErrorPage() {
  const error = useRouteError();

  let title = 'Algo salió mal';
  let message = error?.message || 'Ocurrió un error inesperado.';

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    message = error.statusText || message;
  }

  return (
    <div className="page">
      <div className="alert alert-error" style={{ maxWidth: 480 }}>
        <h2 style={{ marginTop: 0 }}>{title}</h2>
        <p>{message}</p>
        <Link to="/">Volver al dashboard</Link>
      </div>
    </div>
  );
}
