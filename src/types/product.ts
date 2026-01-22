// Interfaz para el producto basada en la estructura de la base de datos
export interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  tags: string[];
  sizes?: string[]; // Opcional, para productos con tallas
}

export interface CartItem {
  cartItemId: string; // ID único para el item en el carrito (permite mismo producto con diferentes tallas)
  productId: string; // Solo guardamos el ID del producto
  quantity: number;
  selectedSize?: string;
  addedAt: string;
}
