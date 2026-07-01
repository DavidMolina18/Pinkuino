// src/components/Catalog/ProductSkeleton.jsx
import './ProductSkeleton.css';

export const ProductSkeleton = () => {
  return (
    <article className="product-skeleton">
      <div className="skeleton-image"></div>
      <div className="skeleton-info">
        <div className="skeleton-brand"></div>
        <div className="skeleton-name"></div>
        <div className="skeleton-price"></div>
      </div>
    </article>
  );
};