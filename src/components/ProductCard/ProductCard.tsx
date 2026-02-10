import { useState, useEffect, useRef } from 'react';
import type { Product } from '../../types/product';
import './ProductCard.css';
import { useAuth } from '../../context/AuthContext';
import { useDeleteProduct } from '../../hooks/useDeleteProduct';
import { useNotifications } from '../../hooks/useNotifications';

interface ProductCardProps {
  product: Product;
  onProductClick: (product: Product) => void;
  onProductDeleted?: () => void;
}

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 segundo

export const ProductCard: React.FC<ProductCardProps> = ({ product, onProductClick, onProductDeleted }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shouldLoad, setShouldLoad] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const retryTimeoutRef = useRef<number | undefined>(undefined);
  const { isStaff } = useAuth();

  // Lazy loading con IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // Empieza a cargar 100px antes de que sea visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      observer.disconnect();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Precargar imagen con reintentos
  useEffect(() => {
    if (!shouldLoad || !product.image_urls[currentImageIndex]) return;

    const loadImage = () => {
      const img = new Image();

      img.onload = () => {
        setImageLoading(false);
        setImageError(false);
        setRetryCount(0);
      };

      img.onerror = () => {
        if (retryCount < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = INITIAL_DELAY * Math.pow(2, retryCount);

          console.log(`Reintento ${retryCount + 1}/${MAX_RETRIES} en ${delay}ms para: ${product.name}`);

          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, delay);
        } else {
          setImageLoading(false);
          setImageError(true);
          console.error(`Error al cargar imagen después de ${MAX_RETRIES} intentos:`, product.name);
        }
      };

      img.src = product.image_urls[currentImageIndex];
    };

    loadImage();

    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [shouldLoad, currentImageIndex, retryCount, product.image_urls, product.name]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(0);
    setCurrentImageIndex((prev) => 
      prev === product.image_urls.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(0);
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.image_urls.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setRetryCount(0);
    setCurrentImageIndex(index);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const { deleteProduct, loading: deleteLoading } = useDeleteProduct();
  const notifications = useNotifications();

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción es irreversible.`)) {
      return;
    }

    const result = await deleteProduct(product.product_id);

    if (result.success) {
      notifications.success('Producto eliminado correctamente');
      onProductDeleted?.(); // Notificar al padre para refrescar la lista
    } else {
      notifications.error(result.error || 'Error al eliminar producto');
    }
  };

  return (
    <div className="product-card" onClick={() => onProductClick(product)} ref={cardRef}>
      <div className="product-card__image-container">
        {imageLoading && shouldLoad && !imageError && (
          <div className="product-card__image-loader">
            {retryCount > 0 ? `Reintentando (${retryCount}/${MAX_RETRIES})...` : 'Cargando...'}
          </div>
        )}
        
        {imageError && (
          <div className="product-card__image-error">
            <p>No se pudo cargar la imagen</p>
          </div>
        )}
        
        {shouldLoad ? (
          <img
            src={product.image_urls[currentImageIndex]}
            alt={product.name}
            className="product-card__image"
            loading="lazy"
            decoding="async"
            style={{ display: imageLoading || imageError ? 'none' : 'block' }}
          />
        ) : (
          <div className="product-card__image-placeholder" />
        )}

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
        
        {/* ✅ Botón de eliminar solo para staff */}
        {isStaff && (
          <button
            className="product-card__delete-btn"
            onClick={handleDelete}
            disabled={deleteLoading}
            aria-label={`Eliminar ${product.name}`}
            title="Eliminar producto"
          >
            {deleteLoading ? (
              <span className="product-card__delete-spinner">⏳</span>
            ) : (
              <span className="product-card__delete-icon">🗑️</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
