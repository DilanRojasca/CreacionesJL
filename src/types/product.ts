// Interfaz para el producto basada en la estructura de la base de datos
export interface Product {
  product_id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  tags: string[];
}

export interface CartItem {
  productId: string;
  addedAt: string;
  priceAtAdd: number;
}
