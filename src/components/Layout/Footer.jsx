import './Footer.css';

export const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="social-links">
        <a 
          href="https://www.instagram.com/pinkuino.cosmetics?igsh=MWUwbzg4NDR5Nm9iMg%3D%3D&utm_source=qr" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="Instagram de Pinküino"
          className="social-icon"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
          </svg>
        </a>

        <a 
          href="https://www.tiktok.com/@pinkuino.cosmetics?_r=1&_t=ZS-96y2NZ0hxfm" 
          target="_blank" 
          rel="noopener noreferrer" 
          aria-label="TikTok de Pinküino"
          className="social-icon"
        >
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
            viewBox="0 0 24 24"
            fill="currentColor">

            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.35h-3.14v12.98a2.89 2.89 0 1 1-2.89-2.89c.22 0 .43.02.64.07V9.31a6.03 6.03 0 0 0-.64-.03A6.03 6.03 0 1 0 15.82 15V8.38a8.04 8.04 0 0 0 4.71 1.52V6.69h-.94z"/>
        </svg>
        </a>
      </div>
      
      <p className="copyright-text">
        © {new Date().getFullYear()} Pinküino Cosmetics. Todos los derechos reservados.
      </p>
    </footer>
  );
};