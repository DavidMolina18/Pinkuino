import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Static guardrails, not a SQL parser or proof of deployed RLS enforcement.
test('SQL retains the authenticated-only contract and scoped restrictive guards', async () => {
  const sql = await readFile(new URL('../supabase/admin-security.sql', import.meta.url), 'utf8');
  for (const table of ['productos', 'marcas', 'categorias']) {
    assert.ok(sql.includes(`alter table public.${table} enable row level security`));
  }
  assert.match(sql, /auth\.role\(\)\) = ''authenticated''/);
  assert.match(sql, /as restrictive/);
  assert.match(sql, /bucket_id <> ''imagenes'' or/);
  assert.match(sql, /using \('\s*\|\| predicate \|\| '\) with check/);
  assert.match(sql, /pg_get_serial_sequence\('public.productos', 'id'\)/);
  assert.doesNotMatch(sql, /disable row level security|service_role|create table|auth\.jwt/i);
});

test('route wiring preserves public catalog and guards admin without changing catalog code', async () => {
  const routes = await readFile(new URL('../src/Routes.jsx', import.meta.url), 'utf8');
  assert.ok(routes.includes('<Route path="/" element={<App />} />'));
  assert.ok(routes.includes('<Route path="/login" element={<LoginPage />} />'));
  assert.ok(routes.includes('<Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />'));
  const guard = await readFile(new URL('../src/auth/ProtectedRoute.jsx', import.meta.url), 'utf8');
  assert.ok(guard.indexOf('if (loading)') < guard.indexOf('return session ?'));
  assert.ok(guard.indexOf('if (error)') < guard.indexOf('return session ?'));
  assert.ok(guard.includes('<Navigate to="/login" replace />'));
});
