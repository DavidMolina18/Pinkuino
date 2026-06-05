// src/components/Catalog/ProductGrid.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { ProductCard } from './ProductCard';
import './ProductGrid.css'; // Importamos su propio diseño de inmediato

export const ProductGrid = ({ marcaId, categoriaId }) => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Si no hay filtros seleccionados, no hacemos nada
    if (!marcaId || !categoriaId) return;

    const obtenerProductos = async () => {
      setCargando(true);
      
      // Magia de Supabase: Buscamos productos que coincidan con ambos IDs
      // Y además pedimos el nombre de la marca para mostrarlo en la tarjeta
      const { data, error } = await supabase
        .from('productos')
        .select(`
          *,
          marcas (nombre)
        `)
        .eq('marca_id', marcaId)
        .eq('categoria_id', categoriaId);

      if (error) {
        console.error("Error al cargar productos:", error);
      } else {
        // Formateamos un poco los datos para que la tarjeta los lea fácil
        const productosFormateados = data.map(prod => ({
          ...prod,
          marca_nombre: prod.marcas.nombre
        }));
        setProductos(productosFormateados);
      }
      
      setCargando(false);
    };

    obtenerProductos();
  }, [marcaId, categoriaId]); // Este useEffect se vuelve a ejecutar cada vez que los filtros cambian

  if (cargando) {
    return <div className="grid-message">Buscando productos...</div>;
  }

  if (productos.length === 0) {
    return <div className="grid-message">No hay productos disponibles en esta categoría por ahora.</div>;
  }

  return (
    <div className="product-grid">
      {productos.map(producto => (
        <ProductCard key={producto.id} producto={producto} />
      ))}
    </div>
  );
};