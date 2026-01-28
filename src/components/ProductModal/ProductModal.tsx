import { useState, useEffect } from 'react';
import type { Product } from '../../types/product';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../hooks/useNotifications';
import './ProductModal.css';

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const { addToCart } = useCart();
  const { productAdded, warning } = useNotifications();

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar la posición actual del scroll
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // Restaurar el scroll al cerrar
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    // Cleanup al desmontar
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleAddToCart = () => {
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      warning('Por favor selecciona una talla');
      return;
    }
    addToCart(product, selectedSize);
    productAdded(product.name);
    onClose();
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.image_urls.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="product-modal-overlay" onClick={handleBackdropClick}>
      <div className="product-modal">
        <button className="product-modal__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        <div className="product-modal__content">
          <div className="product-modal__gallery">
            <div className="product-modal__image-container">
              <img
                src={product.image_urls[currentImageIndex]}
                alt={product.name}
                className="product-modal__image"
              />

              {product.image_urls.length > 1 && (
                <>
                  <button
                    className="product-modal__nav product-modal__nav--prev"
                    onClick={prevImage}
                    aria-label="Imagen anterior"
                  >
                    ‹
                  </button>
                  <button
                    className="product-modal__nav product-modal__nav--next"
                    onClick={nextImage}
                    aria-label="Siguiente imagen"
                  >
                    ›
                  </button>
                </>
              )}
            </div>

            {product.image_urls.length > 1 && (
              <div className="product-modal__thumbnails">
                {product.image_urls.map((url, index) => (
                  <button
                    key={index}
                    className={`product-modal__thumbnail ${
                      index === currentImageIndex ? 'product-modal__thumbnail--active' : ''
                    }`}
                    onClick={() => goToImage(index)}
                  >
                    <img src={url} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="product-modal__info">
            <h2 className="product-modal__title">{product.name}</h2>
            <p className="product-modal__price">{formatPrice(product.price)}</p>

            <div className="product-modal__section">
              <h3 className="product-modal__section-title">Descripción</h3>
              <p className="product-modal__description">{product.description}</p>
            </div>

            {product.sizes && product.sizes.length > 0 && (
              <div className="product-modal__section">
                <h3 className="product-modal__section-title">Seleccionar Talla</h3>
                <div className="product-modal__sizes">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`product-modal__size-btn ${selectedSize === size ? 'active' : ''}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.tags && product.tags.length > 0 && (
              <div className="product-modal__section">
                <h3 className="product-modal__section-title">Etiquetas</h3>
                <div className="product-modal__tags">
                  {product.tags.map((tag, index) => (
                    <span key={index} className="product-modal__tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              className="product-modal__add-to-cart"
              onClick={handleAddToCart}
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
