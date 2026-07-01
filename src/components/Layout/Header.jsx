// src/components/Layout/Header.jsx
import './Header.css'



export const Header = ({ toggleSidebar, onLogoClick }) => {
  return (
    <header className="mobile-header">
      <button className="menu-btn" onClick={toggleSidebar}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      
      <div className="header-brand" onClick={onLogoClick}>   
        <img 
          src="https://fninpfidganvxofuqbeg.supabase.co/storage/v1/object/public/imagenes/logos/LOGO-PINKUINO.jpeg" 
          alt="Logo Pinküino" 
          className="header-logo" 
          style={{cursor:'pointer'}}
        />
        <h1 className="header-title">PINKÜINO</h1>
      </div>
      
      <div style={{ width: 24 }}></div> 
    </header>
  );
};