import { BrowserRouter, Route, Routes } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './auth/AuthProvider';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { LoginPage } from './admin/LoginPage';
import { AdminPage } from './admin/AdminPage';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="*" element={<main className="admin-page"><h1>Página no encontrada</h1><a href="/">Volver al catálogo</a></main>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
