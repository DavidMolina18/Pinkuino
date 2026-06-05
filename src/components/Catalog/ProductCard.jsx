// src/components/Catalog/ProductCard.jsx
import './ProductCard.css'

export const ProductCard = ({ producto }) => {
  // Función temporal para el botón de WhatsApp
  const handleWhatsAppClick = () => {
    console.log("Se pedirá el producto:", producto.nombre_producto);
    // Más adelante conectaremos esto con tu número real
  };

  return (
    <article className="product-card">
      {/* 1. Contenedor de la imagen */}
      <div className="product-image-container">
        <img 
          src={producto.imagen_url} 
          alt={producto.nombre_producto} 
          className="product-image" 
        />
      </div>

      {/* 2. Información del producto (Sin descripción) */}
      <div className="product-info">
        {/* Aquí aplicaremos la clase especial de CSS para respetar marcas como 'montoc' */}
        <span className="product-brand">{producto.marca_nombre}</span>
        
        <h3 className="product-name">{producto.nombre_producto}</h3>
        
        {/* Usamos Intl.NumberFormat para que el precio se vea como moneda ($35.000) */}
        <p className="product-price">
          {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(producto.precio)}
        </p>
      </div>

    </article>
  );
};