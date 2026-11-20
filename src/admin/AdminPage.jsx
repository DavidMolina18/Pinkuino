import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { createProductService } from './productService';
import { filterProducts, formatCOP } from './productModel';
import { ProductForm } from './ProductForm';
import './admin.css';

const service = createProductService(supabase, import.meta.env.VITE_SUPABASE_URL);

export function AdminPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [warning, setWarning] = useState('');
  const [data, setData] = useState({ products: [], brands: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filters, setFilters] = useState({ name: '', brand: '', category: '' });
  const [editor, setEditor] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const lock = useRef(false);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    let active = true;
    service.load().then((next) => {
      if (active) { setData(next); setLoadError(''); }
    }).catch((failure) => {
      if (active) setLoadError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  function reload() {
    setLoading(true);
    setRefresh((value) => value + 1);
  }

  async function mutate(operation, success) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError(''); setNotice(''); setWarning('');
    try {
      const result = await operation();
      if (!mounted.current) return;
      setNotice(success);
      setWarning(result.warning);
      setEditor(null);
      reload();
    } catch (failure) {
      if (mounted.current) setError(failure.message);
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  async function logout() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      const result = await supabase.auth.signOut();
      if (result.error) throw result.error;
    } catch {
      if (mounted.current) setError('No se pudo cerrar sesión. Intenta de nuevo.');
    } finally {
      lock.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return (
    <main className="admin-page">
      <h1>Administrar productos</h1>
      <Link to="/">Ver catálogo</Link>
      <button disabled={busy} onClick={logout}>Cerrar sesión</button>
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
      {warning && <p className="admin-warning" role="status">{warning}</p>}
      <div className="admin-actions">
        <button disabled={busy || loading || Boolean(loadError)} onClick={() => setEditor({ product: null })}>Crear producto</button>
        <button disabled={busy || loading} onClick={reload}>Actualizar lista</button>
      </div>
      {editor && <ProductForm key={editor.product?.id ?? 'create'} product={editor.product}
        brands={data.brands} categories={data.categories} busy={busy || loading || Boolean(loadError)}
        onCancel={() => setEditor(null)} onSave={(values, file) => mutate(() => service.save({
          values, file, existing: editor.product, brands: data.brands, categories: data.categories,
        }), editor.product ? 'Producto actualizado.' : 'Producto creado.')} />}
      <fieldset className="admin-filters" disabled={busy}>
        <legend>Buscar y filtrar</legend>
        <label>Nombre<input value={filters.name} onChange={(event) => setFilters({ ...filters, name: event.target.value })} /></label>
        <label>Marca<select value={filters.brand} onChange={(event) => setFilters({ ...filters, brand: event.target.value })}>
          <option value="">Todas las marcas</option>
          {data.brands.map((brand) => <option key={brand.id} value={brand.id}>{brand.nombre}</option>)}
        </select></label>
        <label>Categoría<select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}>
          <option value="">Todas las categorías</option>
          {data.categories.map((category) => <option key={category.id} value={category.id}>{category.nombre}</option>)}
        </select></label>
      </fieldset>
      {loading ? <p role="status">Cargando productos…</p> : loadError ? <p role="alert">{loadError}
        <button disabled={busy} onClick={reload}>Reintentar carga</button>
      </p> : <>
        <p>{filterProducts(data.products, filters).length} productos</p>
        {filterProducts(data.products, filters).length === 0 ? <p>No hay productos para estos filtros.</p> :
          <div className="admin-table-scroll"><table className="admin-table">
            <caption>Productos del catálogo</caption>
            <thead><tr>{['Imagen', 'Nombre', 'Marca', 'Categoría', 'Precio', 'Precio mini', 'Acciones'].map((title) => <th scope="col" key={title}>{title}</th>)}</tr></thead>
            <tbody>{filterProducts(data.products, filters).map((product) => <tr key={product.id}>
              <td><img src={product.imagen_url} alt={product.nombre_producto} loading="lazy" /></td>
              <td>{product.nombre_producto}</td><td>{product.marcas?.nombre ?? 'Sin marca'}</td>
              <td>{product.categorias?.nombre ?? 'Sin categoría'}</td>
              <td>{formatCOP(product.precio)}</td><td>{product.precio_mini == null ? '—' : formatCOP(product.precio_mini)}</td>
              <td><div className="admin-actions">
                <button disabled={busy} aria-label={`Editar ${product.nombre_producto}`} onClick={() => setEditor({ product })}>Editar</button>
                <button disabled={busy} aria-label={`Eliminar ${product.nombre_producto}`} onClick={() => {
                  if (window.confirm(`¿Eliminar “${product.nombre_producto}”? Esta acción no se puede deshacer.`)) {
                    void mutate(() => service.remove(product), 'Producto eliminado.');
                  }
                }}>Eliminar</button>
              </div></td>
            </tr>)}</tbody>
          </table></div>}
      </>}
    </main>
  );
}
