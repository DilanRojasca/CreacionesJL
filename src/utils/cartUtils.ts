// Tipos para el carrito
export interface CartItem {
  productId: string;
  addedAt: string; // ISO date string
}

const CART_KEY = 'creacionesJL_cart';

// Obtener todos los items del carrito
export const getCartItems = (): CartItem[] => {
  try {
    const cartData = localStorage.getItem(CART_KEY);
    return cartData ? JSON.parse(cartData) : [];
  } catch (error) {
    console.error('Error al obtener el carrito:', error);
    return [];
  }
};

// Agregar un producto al carrito
export const addToCart = (productId: string): void => {
  try {
    const cart = getCartItems();
    
    // Verificar si el producto ya está en el carrito
    const existingItem = cart.find(item => item.productId === productId);
    
    if (!existingItem) {
      const newItem: CartItem = {
        productId,
        addedAt: new Date().toISOString(),
      };
      
      cart.push(newItem);
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }
  } catch (error) {
    console.error('Error al agregar al carrito:', error);
  }
};

// Eliminar un producto del carrito
export const removeFromCart = (productId: string): void => {
  try {
    const cart = getCartItems();
    const updatedCart = cart.filter(item => item.productId !== productId);
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
  } catch (error) {
    console.error('Error al eliminar del carrito:', error);
  }
};

// Verificar si un producto está en el carrito
export const isInCart = (productId: string): boolean => {
  const cart = getCartItems();
  return cart.some(item => item.productId === productId);
};

// Limpiar el carrito
export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Error al limpiar el carrito:', error);
  }
};

// Obtener cantidad de items en el carrito
export const getCartCount = (): number => {
  return getCartItems().length;
};
