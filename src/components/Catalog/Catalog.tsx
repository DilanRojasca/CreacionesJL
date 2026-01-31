import { useState } from 'react';
import type { Product } from '../../types/product';
import { ProductCard } from '../ProductCard/ProductCard';
import { ProductModal } from '../ProductModal/ProductModal';
import './Catalog.css';
import { useProducts } from '../../context/ProductsContext';

export const Catalog: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { products, loading, error } = useProducts();

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Pequeño delay antes de limpiar el producto seleccionado para la animación
    setTimeout(() => setSelectedProduct(null), 200);
  };

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h1 className="catalog__title">Catálogo de Productos</h1>
        <p className="catalog__subtitle">
          {products.length} {products.length === 1 ? 'producto disponible' : 'productos disponibles'}
        </p>
      </div>

      {products.length === 0 ? (
        <div className="catalog__empty">
          <p>No hay productos disponibles en este momento.</p>
        </div>
      ) : (
        <div className="catalog__grid">
          {products.map((product) => (
            <ProductCard
              key={product.product_id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      )}

      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};
