// src/components/Catalog/ProductCard.jsx
import './ProductCard.css'

export const ProductCard = ({ producto, onClick }) => {

  const tieneMini = producto.precio_mini !== null && producto.precio_mini !== undefined;
  const precioAExhibir = tieneMini ? producto.precio_mini : producto.precio;
  
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
          {tieneMini && <span className="desde-text">Desde </span>}
          {new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            maximumFractionDigits: 0
          }).format(precioAExhibir)}
        </p>
      </div>

    </article>
  );
};