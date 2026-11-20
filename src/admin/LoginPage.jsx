import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../services/supabase';
import './admin.css';

export function LoginPage() {
  const { session, loading, error: sessionError, retry } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      const result = await supabase.auth.signInWithPassword({
        email: String(values.get('email')).trim(), password: String(values.get('password')),
      });
      if (result.error || !result.data?.session) throw new Error('Sign-in failed');
      navigate('/admin', { replace: true });
    } catch {
      setError('No se pudo iniciar sesión. Revisa tus credenciales o intenta de nuevo.');
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <main className="admin-page" role="status">Verificando sesión…</main>;
  if (session && !sessionError) return <Navigate to="/admin" replace />;
  return (
    <main className="admin-page admin-login">
      <h1>Iniciar sesión</h1>
      <Link to="/">Volver al catálogo</Link>
      {sessionError && <p role="alert">{sessionError} <button onClick={retry}>Reintentar</button></p>}
      <form onSubmit={submit}>
        <fieldset disabled={busy || Boolean(sessionError)}>
          <legend>Acceso de administración</legend>
          <label>Correo electrónico<input name="email" type="email" autoComplete="username" required /></label>
          <label>Contraseña<input name="password" type="password" autoComplete="current-password" required /></label>
          <button type="submit">{busy ? 'Ingresando…' : 'Ingresar'}</button>
        </fieldset>
      </form>
      {error && <p role="alert">{error}</p>}
    </main>
  );
}
