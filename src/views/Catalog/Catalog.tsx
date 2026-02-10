import { useState, useMemo, useEffect } from 'react';
import type { Product } from '../../types/product';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import { ProductModal } from '../../components/ProductModal/ProductModal';
import './Catalog.css';
import { useProducts } from '../../context/ProductsContext';

export const Catalog: React.FC = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { products, loading, error, refreshProducts } = useProducts();

  // Recargar productos al montar el componente
  useEffect(() => {
    refreshProducts();
  }, []);

  // Estados para filtros
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSize, setSelectedSize] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({ min: 0, max: Infinity });
  const [showFilters, setShowFilters] = useState(false);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    price: true,
    size: true,
    category: true
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Bloquear scroll del body cuando los filtros están abiertos (solo mobile)
  useEffect(() => {
    if (showFilters) {
      document.body.classList.add('catalog-filters-open');
    } else {
      document.body.classList.remove('catalog-filters-open');
    }

    // Cleanup al desmontar
    return () => {
      document.body.classList.remove('catalog-filters-open');
    };
  }, [showFilters]);

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

  // Verificar si hay filtros aplicados
  const hasActiveFilters = useMemo(() => {
    return selectedCategory !== 'all' || 
           selectedSize !== 'all' || 
           priceRange.min !== 0 || 
           priceRange.max !== Infinity;
  }, [selectedCategory, selectedSize, priceRange]);

  // Limpiar todos los filtros
  const handleClearFilters = () => {
    setSelectedCategory('all');
    setSelectedSize('all');
    setPriceRange({ min: 0, max: Infinity });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedProduct(null), 200);
  };

  // ESTOS RETURNS DEBEN ESTAR DESPUÉS DE TODOS LOS HOOKS
  if (loading) return <div>Cargando productos...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="catalog">
      <div className="catalog__header">
        <h1 className="catalog__title">Catálogo de Productos</h1>
        
        {/* Botones de Filtros */}
        <div className="catalog__filters-controls">
          <div className="catalog__active-filters">
            {selectedCategory !== 'all' && (
              <span className="catalog__filter-chip">
                {selectedCategory}
                <button onClick={() => setSelectedCategory('all')} className="catalog__filter-chip-remove">✕</button>
              </span>
            )}
            {selectedSize !== 'all' && (
              <span className="catalog__filter-chip">
                Talla: {selectedSize}
                <button onClick={() => setSelectedSize('all')} className="catalog__filter-chip-remove">✕</button>
              </span>
            )}
            {(priceRange.min !== 0 || priceRange.max !== Infinity) && (
              <span className="catalog__filter-chip">
                ${priceRange.min} - ${priceRange.max === Infinity ? 'Max' : priceRange.max}
                <button onClick={() => setPriceRange({ min: 0, max: Infinity })} className="catalog__filter-chip-remove">✕</button>
              </span>
            )}
          </div>
          <button 
            className="catalog__filters-toggle"
            onClick={() => setShowFilters(true)}
          >
            FILTROS
          </button>
        </div>

        {/* Overlay */}
        <div 
          className={`catalog__overlay ${showFilters ? 'catalog__overlay--visible' : ''}`}
          onClick={() => setShowFilters(false)}
        />

        {/* Drawer de Filtros */}
        <div className={`catalog__drawer ${showFilters ? 'catalog__drawer--open' : ''}`}>
          <div className="catalog__drawer-header">
            <h2 className="catalog__drawer-title">FILTROS</h2>
            <button 
              className="catalog__drawer-close"
              onClick={() => setShowFilters(false)}
            >
              ✕
            </button>
          </div>

          <div className="catalog__drawer-content">
            {/* Accordion Precio */}
            <div className="catalog__accordion">
              <button 
                className={`catalog__accordion-header ${openSections.price ? 'active' : ''}`}
                onClick={() => toggleSection('price')}
              >
                <span>PRECIO</span>
                <span className="catalog__chevron">›</span>
              </button>
              
              <div className={`catalog__accordion-body ${openSections.price ? 'open' : ''}`}>
                 <div className="catalog__filter catalog__filter--price">
                  <div className="catalog__range-slider">
                    <input 
                      type="range" 
                      min={priceInfo.min} 
                      max={priceInfo.max} 
                      value={priceRange.min} 
                      onChange={(e) => {
                        const val = Math.min(Number(e.target.value), priceRange.max - 1);
                        setPriceRange(prev => ({ ...prev, min: val }));
                      }}
                      className="catalog__range-input catalog__range-input--min"
                    />
                    <input 
                      type="range" 
                      min={priceInfo.min} 
                      max={priceInfo.max} 
                      value={priceRange.max === Infinity ? priceInfo.max : priceRange.max} 
                      onChange={(e) => {
                        const val = Math.max(Number(e.target.value), priceRange.min + 1);
                        setPriceRange(prev => ({ ...prev, max: val }));
                      }}
                      className="catalog__range-input catalog__range-input--max"
                    />
                    <div className="catalog__range-track"></div>
                  </div>

                  <div className="catalog__price-inputs">
                    <div className="catalog__price-field">
                      <span className="catalog__price-symbol">$</span>
                      <input
                        type="number"
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
                    <span className="catalog__price-separator">a</span>
                    <div className="catalog__price-field">
                      <span className="catalog__price-symbol">$</span>
                      <input
                        type="number"
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
            </div>

            {/* Accordion Categoría (simulando Disponibilidad o estructura similar) */}
            <div className="catalog__accordion">
              <button 
                className={`catalog__accordion-header ${openSections.category ? 'active' : ''}`}
                onClick={() => toggleSection('category')}
              >
                <span>CATEGORÍA</span>
                <span className="catalog__chevron">›</span>
              </button>
              
              <div className={`catalog__accordion-body ${openSections.category ? 'open' : ''}`}>
                <div className="catalog__filter">
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
              </div>

            {/* Accordion Talla */}
            <div className="catalog__accordion">
              <button 
                className={`catalog__accordion-header ${openSections.size ? 'active' : ''}`}
                onClick={() => toggleSection('size')}
              >
                <span>TALLA</span>
                <span className="catalog__chevron">›</span>
              </button>
              
              <div className={`catalog__accordion-body ${openSections.size ? 'open' : ''}`}>
                <div className="catalog__filter">
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
              </div>
            </div>

            </div>

             {hasActiveFilters && (
              <button 
                className="catalog__filters-clear"
                onClick={handleClearFilters}
                style={{ marginTop: '1rem', width: '100%' }}
              >
                Limpiar Filtros
              </button>
            )}
          </div>

          <div className="catalog__drawer-footer">
            <button 
              className="catalog__apply-btn"
              onClick={() => setShowFilters(false)}
            >
              APLICAR
            </button>
          </div>
        </div>

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
              onProductDeleted={() => {
                refreshProducts();
              }}
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
