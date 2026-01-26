import { useState } from 'react';
import type { Product } from '../../types/product';
import './ProductCard.css';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === product.image_urls.length - 1 ? 0 : prev + 1
    );
    setImageLoading(true);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.image_urls.length - 1 : prev - 1
    );
    setImageLoading(true);
  };

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(index);
    setImageLoading(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="product-card" onClick={() => onProductClick(product)}>
      <div className="product-card__image-container">
        {imageLoading && <div className="product-card__image-loader">Cargando...</div>}
        
        <img
          src={product.image_urls[currentImageIndex]}
          alt={product.name}
          className="product-card__image"
          onLoad={() => setImageLoading(false)}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />

        {product.image_urls.length > 1 && (
          <>
            <button
              className="product-card__nav product-card__nav--prev"
              onClick={prevImage}
              aria-label="Imagen anterior"
            >
              ‹
            </button>
            <button
              className="product-card__nav product-card__nav--next"
              onClick={nextImage}
              aria-label="Siguiente imagen"
            >
              ›
            </button>

            <div className="product-card__dots">
              {product.image_urls.map((_, index) => (
                <button
                  key={index}
                  className={`product-card__dot ${
                    index === currentImageIndex ? 'product-card__dot--active' : ''
                  }`}
                  onClick={(e) => goToImage(index, e)}
                  aria-label={`Ir a imagen ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-card__content">
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.price)}</p>
      </div>
    </div>
  );
};
