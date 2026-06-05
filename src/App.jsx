import { useState } from 'react';
import { Sidebar } from './components/Layout/Sidebar';
import { Header } from './components/Layout/Header';
import { ProductGrid } from './components/Catalog/ProductGrid';

import './styles/variables.css';
import './styles/layout.css';


function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // NUEVO: Estado para saber qué mostrar en la pantalla principal
  const [filtroActual, setFiltroActual] = useState({
    marcaId: null,
    categoriaId: null
  });

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // NUEVO: Función que ejecutará el Sidebar cuando el cliente elija una categoría
  const handleSeleccionCategoria = (marcaId, categoriaId) => {
    setFiltroActual({ marcaId, categoriaId });
    // Si estamos en celular, cerramos el menú automáticamente al elegir algo
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="app-container">
      <Header toggleSidebar={toggleSidebar} />
      
      {/* Le pasamos la nueva función al panel lateral */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onSelectCategory={handleSeleccionCategoria} 
      />
      
      {isSidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <main className="main-content">
        {/* Si aún no han seleccionado nada, mostramos un mensaje bonito */}
        {!filtroActual.categoriaId ? (
          <div className="welcome-message">
            <h1>Descubre tus favoritos</h1>
            <p>Selecciona una marca y categoría en el menú para empezar.</p>
          </div>
        ) : (     
          <ProductGrid 
            marcaId={filtroActual.marcaId} 
            categoriaId={filtroActual.categoriaId} 
          />
        )}
      </main>
    </div>
  );
}

export default App;