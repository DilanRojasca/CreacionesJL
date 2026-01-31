import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useProducts } from '../../context/ProductsContext';
import { FaArrowLeft, FaMinus, FaPlus, FaXmark } from 'react-icons/fa6';
import './CartView.css';

const CartView: React.FC = () => {
  const { cartItems, removeFromCart, updateQuantity } = useCart();
  const { products } = useProducts();

  // Obtener productos completos desde el contexto basándose en los IDs del carrito
  const cartItemsWithProducts = cartItems.map(item => {
    const product = products.find(p => p.product_id === item.productId);
    return { ...item, product };
  }).filter(item => item.product); // Filtrar items sin producto (por si acaso)

  // Calcular subtotal desde los items con productos
  const subtotal = cartItemsWithProducts.reduce(
    (acc, item) => acc + (item.product!.price * item.quantity), 
    0
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="cart-view-container">
      <div className="cart-card">
        <header className="cart-header">
          <div className="cart-header-top">
            <h1 className="cart-title-main">TU CARRITO</h1>
            <Link to="/" className="close-cart-btn"><FaXmark /></Link>
          </div>
          <p className="shipping-info">Tu pedido cumple los requisitos de envío gratuito.</p>
        </header>

        {cartItems.length === 0 ? (
          <div className="cart-empty">
            <h2>Tu carrito está vacío</h2>
            <p>Parece que aún no has añadido ninguna prenda increíble a tu colección.</p>
            <Link to="/catalog" className="btn-continue-shopping">
              Ver Catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="cart-items-list">
              {cartItemsWithProducts.map((item) => (
                <div key={item.cartItemId} className="cart-item">
                  <div className="cart-item-image">
                    <img src={item.product!.image_urls[0]} alt={item.product!.name} />
                  </div>
                  <div className="cart-item-details">
                    <div className="cart-item-info-row">
                      <h3 className="cart-item-name">{item.product!.name.toUpperCase()}</h3>
                      <span className="cart-item-price">{formatPrice(item.product!.price * item.quantity)}</span>
                    </div>
                    {item.selectedSize && (
                      <p className="cart-item-size">TALLA {item.selectedSize.toUpperCase()}</p>
                    )}
                    <div className="cart-item-actions">
                      <div className="quantity-controls">
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <FaMinus />
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button 
                          className="qty-btn"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        >
                          <FaPlus />
                        </button>
                      </div>
                      <button className="remove-item-link" onClick={() => removeFromCart(item.cartItemId)}>
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <footer className="cart-view-footer">
              <div className="subtotal-row">
                <span>Subtotal:</span>
                <span className="subtotal-amount">{formatPrice(subtotal)}</span>
              </div>
              <button className="btn-checkout-primary">FINALIZAR COMPRA</button>
            </footer>
          </>
        )}

        <div className="cart-view-navigation">
          <Link to="/" className="btn-back-home">
             <FaArrowLeft /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CartView;
