import { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import './Sidebar.css'

export const Sidebar = ({ isOpen, onSelectCategory, onSearch, onLogoCick}) => {
  const [marcas, setMarcas] = useState([]);
  
  // Nuevos estados para el menú desplegable
  const [marcaExpandida, setMarcaExpandida] = useState(null);
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault(); 
    const palabra = e.target.busqueda.value.trim();
    if (palabra) {
      onSearch(palabra);
    }
  };

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


  const handleClickMarca = async (marcaId) => {

    if (marcaExpandida === marcaId) {
      setMarcaExpandida(null);
      return;
    }


    setMarcaExpandida(marcaId);
    setCargandoCategorias(true);


    const { data, error } = await supabase
      .from('productos')
      .select('categorias(id, nombre)')
      .eq('marca_id', marcaId);

    if (!error && data) {
      const categoriasUnicas = [];
      const idsVistos = new Set();
      
      data.forEach(item => {
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
      <div className="sidebar-brand" onClick={onLogoCick} style={{cursor :'pointer'}}>
        <img 
          src="https://fninpfidganvxofuqbeg.supabase.co/storage/v1/object/public/imagenes/logos/LOGO-PINKUINO.jpeg" /* Asegúrate de usar la misma ruta que en tu Header */
          alt="Logo Pinküino" 
          className="sidebar-logo" 
          
        />
        <h1 className="sidebar-title-brand">PINKÜINO</h1>
      </div>

      <form className="sidebar-search" onSubmit={handleSearchSubmit}>
        <input 
          type="text" 
          name="busqueda" 
          placeholder="Buscar un producto..." 
          autoComplete="off"
        />
        <button type="submit" aria-label="Buscar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
        </form>
      
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
              <span className="arrow-icon">
                {marcaExpandida === marca.id ? '▲' : '▼'}
              </span>
            </button>

            {marcaExpandida === marca.id && (
              <div className="categories-dropdown">
                {cargandoCategorias ? (
                  <span className="loading-text">Cargando...</span>
                ) : categorias.length > 0 ? (
                  categorias.map(cat => (
                  <button 
                    key={cat.id} 
                    className="category-btn"
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