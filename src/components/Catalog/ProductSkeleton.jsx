// src/components/Catalog/ProductSkeleton.jsx
import './ProductSkeleton.css';

export const ProductSkeleton = () => {
  return (
    <article className="product-skeleton">
      {/* 1. La caja de la foto */}
      <div className="skeleton-image"></div>

      {/* 2. Las cajas del texto */}
      <div className="skeleton-info">
        <div className="skeleton-brand"></div>
        <div className="skeleton-name"></div>
        <div className="skeleton-price"></div>
      </div>
    </article>
  );
};