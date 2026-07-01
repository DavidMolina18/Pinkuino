import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabase'
import './NuevosProductos.css';

export const NuevosProductos = () => {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  
  const carruselRef = useRef(null);

  useEffect(() => {
    const obtenerNuevosProductos = async () => {
      try {
        const { data, error } = await supabase
          .from('productos')
          .select('*')
          .order('id', { ascending: false }) 
          .limit(10);

        if (error) throw error;
        if (data) setProductos(data);
      } catch (error) {
        console.error('Error inesperado:', error);
      } finally {
        setCargando(false);
      }
    };

    obtenerNuevosProductos();
  }, []);

  const desplazar = (direccion) => {
    if (carruselRef.current) {
      const cantidad = direccion === 'izquierda' ? -350 : 350;
      carruselRef.current.scrollBy({ left: cantidad, behavior: 'smooth' });
    }
  };

  if (cargando || productos.length === 0) return null;

  return (
    <section className="seccion-nuevos">
      <div className="encabezado-nuevos">
        <h2>Lo más Nuevo</h2>
        <p>Descubre las últimas tendencias</p>
      </div>

      <div className="carrusel-contenedor">
        <button 
          className="flecha-carrusel izquierda" 
          onClick={() => desplazar('izquierda')}
          aria-label="Anterior"
        >
          &#10094;
        </button>

        <div className="scroll-horizontal" ref={carruselRef}>
          {productos.map((prod) => (
            <div key={prod.id} className="tarjeta-nuevo">
              <span className="badge-nuevo">¡NUEVO!</span>
              
              <div className="imagen-nuevo-contenedor">
                <img 
                  src={prod.imagen_url} 
                  alt={prod.nombre_producto} 
                  className="imagen-nuevo"
                  loading="lazy"
                />
              </div>

              <div className="info-nuevo">
                <h3 className="titulo-nuevo">{prod.nombre_producto}</h3>
                <p className="precio-nuevo">
                  ${prod.precio.toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          ))}
        </div>

        <button 
          className="flecha-carrusel derecha" 
          onClick={() => desplazar('derecha')}
          aria-label="Siguiente"
        >
          &#10095;
        </button>
      </div>
    </section>
  );
};