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
  const [imageLoading, setImageLoading] = useState(true);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { addToCart } = useCart();
  const { productAdded, warning } = useNotifications();

  // Reset cuando cambia el producto
  useEffect(() => {
    if (product) {
      setCurrentImageIndex(0);
      setSelectedSize('');
      setImageLoading(true);
    }
  }, [product]);

  // Precargar todas las imágenes cuando se abre el modal
  useEffect(() => {
    if (isOpen && product) {
      product.image_urls.forEach((url) => {
        if (!loadedImages.has(url)) {
          const img = new Image();
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, url]));
          };
          img.onerror = () => {
            console.error('Error loading image:', url);
            setLoadedImages(prev => new Set([...prev, url])); // Marcamos como "cargada" para evitar spinner infinito
          };
          img.src = url;
        }
      });

      // Timeout de seguridad: si después de 5 segundos no carga, forzar mostrar imagen
      const timeout = setTimeout(() => {
        setImageLoading(false);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isOpen, product]);

  // Verificar si la imagen actual ya está cargada
  useEffect(() => {
    if (product && loadedImages.has(product.image_urls[currentImageIndex])) {
      setImageLoading(false);
    } else {
      setImageLoading(true);
    }
  }, [currentImageIndex, loadedImages, product]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

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

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    console.error('Error loading image');
    setImageLoading(false); // Mostrar imagen aunque haya error
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
              {imageLoading && (
                <div className="product-modal__image-loader">
                  <div className="spinner"></div>
                </div>
              )}
              <img
                src={product.image_urls[currentImageIndex]}
                alt={product.name}
                className="product-modal__image"
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="eager"
                decoding="async"
                style={{ display: imageLoading ? 'none' : 'block' }}
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
                    <img src={url} alt={`${product.name} ${index + 1}`} loading="lazy" />
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
