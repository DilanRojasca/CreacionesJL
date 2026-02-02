import { useState, useMemo } from 'react';
import type { Product } from '../../types/product';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import { ProductModal } from '../../components/ProductModal/ProductModal';
import './Catalog.css';
import { useProducts } from '../../context/ProductsContext';

export const Catalog: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { products, loading, error } = useProducts();

  // Estados para filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
  const [showFilters, setShowFilters] = useState(false);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const cats = new Set(products.flatMap(p => p.tags || []));
    return Array.from(cats).sort();
  }, [products]);

  // Obtener tallas disponibles para la categoría seleccionada
  const availableSizes = useMemo(() => {
    if (selectedCategory === 'all') return [];
    
    const productsInCategory = products.filter(p => 
      p.tags?.includes(selectedCategory)
    );
    
    const sizes = new Set(productsInCategory.flatMap(p => p.sizes || []));
    return Array.from(sizes).sort();
  }, [products, selectedCategory]);

  // Limpiar talla cuando cambia la categoría
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedSize('all');
  };

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || 
                             product.tags?.includes(selectedCategory);
      
      const matchesSize = selectedSize === 'all' || 
                         product.sizes?.includes(selectedSize);
      
      const matchesPrice = product.price >= priceRange.min && 
                          product.price <= priceRange.max;
      
      return matchesCategory && matchesSize && matchesPrice;
    });
  }, [products, selectedCategory, selectedSize, priceRange]);

  // Calcular rango de precios disponibles
  const priceInfo = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 1000 };
    const prices = products.map(p => p.price);
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 200);
  };

  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h1 className="catalog__title">Catálogo de Productos</h1>
        
        {/* Botón de Filtros */}
        <button 
          className="catalog__filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? '✕ Ocultar Filtros' : '⚙ Mostrar Filtros'}
        </button>

        {/* Filtros - Colapsables */}
        {showFilters && (
          <div className="catalog__filters">
            {/* Filtro de Categoría */}
            <div className="catalog__filter">
              <label htmlFor="category-filter">Categoría:</label>
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="catalog__select"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Filtro de Talla - Solo visible si hay categoría seleccionada */}
            {selectedCategory !== 'all' && availableSizes.length > 0 && (
              <div className="catalog__filter">
                <label htmlFor="size-filter">Talla:</label>
                <select
                  id="size-filter"
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="catalog__select"
                >
                  <option value="all">Todas las tallas</option>
                  {availableSizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Filtro de Precio */}
            <div className="catalog__filter catalog__filter--price">
              <label>Precio: ${priceRange.min.toLocaleString()} - ${priceRange.max === Infinity ? priceInfo.max.toLocaleString() : priceRange.max.toLocaleString()}</label>
              <div className="catalog__price-inputs">
                <div className="catalog__price-field">
                  <span className="catalog__price-symbol">$</span>
                  <input
                    type="number"
                    placeholder="Mínimo"
                    min={priceInfo.min}
                    max={priceInfo.max}
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ 
                      ...prev, 
                      min: Number(e.target.value) || 0 
                    }))}
                    className="catalog__price-input"
                  />
                </div>
                <span>-</span>
                <div className="catalog__price-field">
                  <span className="catalog__price-symbol">$</span>
                  <input
                    type="number"
                    placeholder="Máximo"
                    min={priceInfo.min}
                    max={priceInfo.max}
                    value={priceRange.max === Infinity ? '' : priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ 
                      ...prev, 
                      max: Number(e.target.value) || Infinity 
                    }))}
                    className="catalog__price-input"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="catalog__subtitle">
          {filteredProducts.length} {filteredProducts.length === 1 ? 'producto disponible' : 'productos disponibles'}
        </p>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="catalog__empty">
          <p>No se encontraron productos con los filtros seleccionados.</p>
        </div>
      ) : (
        <div className="catalog__grid">
          {filteredProducts.map((product) => (
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
