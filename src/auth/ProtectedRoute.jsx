import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute({ children }) {
  const { session, loading, error, retry } = useAuth();
  if (loading) return <main className="admin-page" role="status">Verificando sesión…</main>;
  if (error) return (
    <main className="admin-page">
      <p role="alert">{error}</p>
      <button onClick={retry}>Reintentar</button>
    </main>
  );
  return session ? children : <Navigate to="/login" replace />;
}
