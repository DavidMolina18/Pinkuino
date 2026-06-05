import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import './Sidebar.css'

export const Sidebar = ({ isOpen, onSelectCategory }) => {
  const [marcas, setMarcas] = useState([]);
  
  // Nuevos estados para el menú desplegable
  const [marcaExpandida, setMarcaExpandida] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);

  useEffect(() => {
    const obtenerMarcas = async () => {
      const { data, error } = await supabase
        .from('marcas')
        .select('*')
        .order('nombre', { ascending: true });

      if (!error) setMarcas(data);
    };
    obtenerMarcas();
  }, []);

  // Función que se ejecuta al hacer clic en una marca
  const handleClickMarca = async (marcaId) => {
    // Si la marca ya está abierta, la cerramos y terminamos
    if (marcaExpandida === marcaId) {
      setMarcaExpandida(null);
      return;
    }

    // Si es una marca nueva, la abrimos y mostramos estado de carga
    setMarcaExpandida(marcaId);
    setCargandoCategorias(true);

    // Magia de Supabase: Buscamos en la tabla productos las categorías asociadas a esta marca
    const { data, error } = await supabase
      .from('productos')
      .select('categorias(id, nombre)')
      .eq('marca_id', marcaId);

    if (!error && data) {
      // Como pueden haber 10 correctores, la categoría "Rostro" saldría 10 veces.
      // Aquí filtramos para guardar solo las categorías únicas.
      const categoriasUnicas = [];
      const idsVistos = new Set();
      
      data.forEach(item => {
        // Asegurarnos de que el producto tenga categoría y no la hayamos agregado ya
        if (item.categorias && !idsVistos.has(item.categorias.id)) {
          idsVistos.add(item.categorias.id);
          categoriasUnicas.push(item.categorias);
        }
      });
      
      setCategorias(categoriasUnicas);
    }
    
    setCargandoCategorias(false);
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <img 
          src="https://fninpfidganvxofuqbeg.supabase.co/storage/v1/object/public/imagenes/logos/LOGO-PINKUINO.jpeg" /* Asegúrate de usar la misma ruta que en tu Header */
          alt="Logo Pinküino" 
          className="sidebar-logo" 
        />
        <h1 className="sidebar-title-brand">PINKÜINO</h1>
      </div>
      <h2 className="sidebar-subtitle">Nuestras Marcas</h2>
      <div className="brand-list">
        {marcas.map((marca) => (
          <div key={marca.id} className="brand-accordion">
            
            <button 
              className={`brand-btn ${marcaExpandida === marca.id ? 'active' : ''}`}
              onClick={() => handleClickMarca(marca.id)}
            >
              {marca.logo_url ? (
                <img src={marca.logo_url} alt={marca.nombre} className="brand-logo" />
              ) : (
                <span className="brand-name">{marca.nombre}</span>
              )}
              {/* Pequeña flecha indicadora */}
              <span className="arrow-icon">
                {marcaExpandida === marca.id ? '▲' : '▼'}
              </span>
            </button>

            {/* Submenú de categorías (Solo se muestra si la marca está expandida) */}
            {marcaExpandida === marca.id && (
              <div className="categories-dropdown">
                {cargandoCategorias ? (
                  <span className="loading-text">Cargando...</span>
                ) : categorias.length > 0 ? (
                  categorias.map(cat => (
                  <button 
                    key={cat.id} 
                    className="category-btn"
                    // Al hacer clic, enviamos el ID de la marca y de la categoría a App.jsx
                    onClick={() => onSelectCategory(marca.id, cat.id)}
                  >
                    {cat.nombre}
                  </button>
                ))
                ) : (
                  <span className="empty-text">Próximamente...</span>
                )}
              </div>
            )}
            
          </div>
        ))}
      </div>
    </aside>
  );
};