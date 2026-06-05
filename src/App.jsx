import { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ProductGrid } from './components/Catalog/ProductGrid';
import { FloatingWhatsApp } from './components/Layout/FloatingWhatsApp';
import { Footer } from "./components/Layout/Footer";

import './styles/variables.css';
import './styles/layout.css';


// src/App.jsx

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // 1. Añadimos el estado para la palabra buscada
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  
  const [filtroActual, setFiltroActual] = useState({
    marcaId: null,
    categoriaId: null
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleSeleccionCategoria = (marcaId, categoriaId) => {
    setFiltroActual({ marcaId, categoriaId });
    setTerminoBusqueda(''); 
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  // 2. Creamos la función exclusiva para el buscador
  const handleBuscar = (palabra) => {
    setTerminoBusqueda(palabra);
    setFiltroActual({ marcaId: null, categoriaId: null }); 
    if (window.innerWidth <= 768) setIsSidebarOpen(false);
  };

  return (
    <div className="app-container">
      <Header toggleSidebar={toggleSidebar} />
      
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        onSelectCategory={handleSeleccionCategoria} 
        onSearch={handleBuscar} 
      />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <main className="main-content">
        {!filtroActual.categoriaId && !terminoBusqueda ? (
          <div className="welcome-message">
            <h1>Descubre tus favoritos</h1>
            <p>Selecciona una marca o busca un producto para empezar.</p>
          </div>
        ) : (
          
          <ProductGrid 
            marcaId={filtroActual.marcaId} 
            categoriaId={filtroActual.categoriaId} 
            busqueda={terminoBusqueda}
          />
        )}
        <Footer/>
      </main>

      <FloatingWhatsApp />
    </div>
  );
}

export default App;