import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="page">
      <h1>404</h1>
      <p>La página que buscás no existe.</p>
      <Link to="/">Volver al dashboard</Link>
    </div>
  );
}
