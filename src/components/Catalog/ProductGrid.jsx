// src/components/Catalog/ProductGrid.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ProductCard } from './ProductCard';
import { ProductSkeleton } from './ProductSkeleton';
import './ProductGrid.css';

export const ProductGrid = ({ marcaId, categoriaId, busqueda }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [orden, setOrden] = useState('defecto');
  const [tamanoElegido, setTamanoElegido] = useState('regular');

  const abrirModal = (producto) => {
    setTamanoElegido('regular');
    setProductoSeleccionado(producto);
  };

  useEffect(() => {
    if (!marcaId && !categoriaId && !busqueda) return;

    const obtenerProductos = async () => {
      setCargando(true);
      let peticionSupabase = supabase.from('productos').select(`*, marcas (nombre)`);

      if (busqueda) {
        peticionSupabase = peticionSupabase.ilike('nombre_producto', `%${busqueda}%`);
      } else {
        peticionSupabase = peticionSupabase.eq('marca_id', marcaId).eq('categoria_id', categoriaId);
      }

      const { data, error } = await peticionSupabase;

      if (error) {
        console.error("Error al cargar productos:", error);
      } else {
        const productosFormateados = data.map(prod => ({
          ...prod,
          marca_nombre: prod.marcas?.nombre || 'Marca desconocida'
        }));
        setProductos(productosFormateados);
      }
      setCargando(false);
    };

    obtenerProductos();
  }, [marcaId, categoriaId, busqueda]);

  if (cargando) {
    return (
      <div className="product-grid">
        {[1, 2, 3, 4, 5, 6].map((numero) => (
          <ProductSkeleton key={numero} />
        ))}
      </div>
    );
  }

  if (productos.length === 0) {
    return <div className="grid-message">No hay productos disponibles en esta categoría por ahora.</div>;
  }

  const productosOrdenados = [...productos].sort((a, b) => {
    if (orden === 'menor') return a.precio - b.precio;
    if (orden === 'mayor') return b.precio - a.precio;
    return 0; // Si es 'defecto', los deja como llegaron de la base de datos
  });

  return (
    <>
    {/* 3. NUEVO: Controles superiores minimalistas */}
      <div className="catalog-header">
        <span className="results-count">{productos.length} productos</span>
        
        <select 
          className="sort-select" 
          value={orden} 
          onChange={(e) => setOrden(e.target.value)}
        >
          <option value="defecto">Recomendados</option>
          <option value="menor">Precio: Menor a Mayor</option>
          <option value="mayor">Precio: Mayor a Menor</option>
        </select>
      </div>

      <div className="product-grid">
        {productosOrdenados.map(producto => (
          <ProductCard 
            key={producto.id} 
            producto={producto} 
            onClick={() => abrirModal(producto)} // Al hacer clic, abre el modal
          />
        ))}
      </div>

      {/* 2. ESTRUCTURA DEL MODAL (Solo se muestra si hay un producto seleccionado) */}
      {productoSeleccionado && (
        <div className="modal-overlay" onClick={() => setProductoSeleccionado(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setProductoSeleccionado(null)}>×</button>
            
            <div className="modal-image-container">
              <img src={productoSeleccionado.imagen_url} alt={productoSeleccionado.nombre_producto} />
            </div>
            
            <div className="modal-info">
              <span className="modal-brand">{productoSeleccionado.marca_nombre}</span>
              <h2 className="modal-name">{productoSeleccionado.nombre_producto}</h2>
              
             
              {productoSeleccionado.precio_mini && (
                <div className="size-selector-container">
                  <button 
                    className={`size-btn ${tamanoElegido === 'mini' ? 'active' : ''}`}
                    onClick={() => setTamanoElegido('mini')}
                  >
                    Mini
                  </button>
                  <button 
                    className={`size-btn ${tamanoElegido === 'regular' ? 'active' : ''}`}
                    onClick={() => setTamanoElegido('regular')}
                  >
                    Regular
                  </button>
                </div>
              )}

              {/* El precio cambia dinámicamente según el botón activo */}
              <p className="modal-price">
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  maximumFractionDigits: 0
                }).format(
                  tamanoElegido === 'mini' 
                    ? productoSeleccionado.precio_mini 
                    : productoSeleccionado.precio
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};