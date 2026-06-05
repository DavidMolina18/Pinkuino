// src/components/Catalog/ProductCard.jsx
import './ProductCard.css'

export const ProductCard = ({ producto, onClick }) => {
  
  const handleWhatsAppClick = () => {
    console.log("Se pedirá el producto:", producto.nombre_producto);
   
  };

  return (
    <article className="product-card" onClick={onClick}>
      <div className="product-image-container">
        <img 
          src={producto.imagen_url} 
          alt={producto.nombre_producto} 
          className="product-image" 
        />
      </div>

      <div className="product-info">
        <span className="product-brand">{producto.marca_nombre}</span>
        <h3 className="product-name">{producto.nombre_producto}</h3>
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