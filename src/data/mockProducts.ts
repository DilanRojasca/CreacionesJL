import type { Product } from '../types/product';

// Datos de ejemplo de productos (placeholder)
export const mockProducts: Product[] = [
  {
    product_id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Collar Artesanal de Plata',
    description: 'Hermoso collar artesanal hecho a mano con plata de ley 925. Diseño único e irrepetible. Perfecto para ocasiones especiales o uso diario. Incluye cadena ajustable y cierre de seguridad.',
    price: 150000,
    sizes: ['Única'],
    image_urls: [
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    ],
    tags: ['Joyería', 'Plata', 'Artesanal', 'Collar'],
  },
  {
    product_id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Aretes de Perla Cultivada',
    description: 'Elegantes aretes con perlas cultivadas naturales. Base de plata 925. Diseño clásico que nunca pasa de moda. Ideales para eventos formales.',
    price: 95000,
    sizes: ['S', 'M', 'L'],
    image_urls: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800',
      'https://images.unsplash.com/photo-1591722767187-6cb1c0d8db37?w=800',
    ],
    tags: ['Joyería', 'Perlas', 'Aretes', 'Elegante'],
  },
  {
    product_id: '550e8400-e29b-41d4-a716-446655440003',
    name: 'Pulsera Tejida con Piedras',
    description: 'Pulsera artesanal tejida a mano con piedras naturales de colores. Diseño bohemio y versátil. Tamaño ajustable para cualquier muñeca.',
    price: 45000,
    sizes: ['Ajustable'],
    image_urls: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    ],
    tags: ['Bisutería', 'Artesanal', 'Pulsera', 'Bohemio'],
  },
  {
    product_id: '550e8400-e29b-41d4-a716-446655440004',
    name: 'Anillo de Oro con Zirconia',
    description: 'Anillo de oro de 14K con zirconia cúbica brillante. Diseño moderno y sofisticado. Disponible en diferentes tallas. Perfecto como regalo especial o anillo de compromiso alternativo.',
    price: 280000,
    sizes: ['6', '7', '8', '9'],
    image_urls: [
      'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800',
      'https://images.unsplash.com/photo-1603561596112-0a132b757442?w=800',
      'https://images.unsplash.com/photo-1588444837495-c6c1a1a15f8f?w=800',
    ],
    tags: ['Joyería', 'Oro', 'Anillo', 'Lujo'],
  },
  {
    product_id: '550e8400-e29b-41d4-a716-446655440005',
    name: 'Set de Joyería Cristal',
    description: 'Set completo que incluye collar y aretes con cristales de alta calidad. Base de plata. Perfecto para bodas y eventos especiales. Viene en caja de regalo.',
    price: 180000,
    image_urls: [
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800',
    ],
    tags: ['Joyería', 'Set', 'Cristal', 'Evento', 'Regalo'],
  },
  {
    product_id: '550e8400-e29b-41d4-a716-446655440006',
    name: 'Tobillera de Plata Minimalista',
    description: 'Delicada tobillera de plata con diseño minimalista. Perfecta para el verano y la playa. Cadena fina y resistente con cierre ajustable.',
    price: 65000,
    image_urls: [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800',
    ],
    tags: ['Joyería', 'Plata', 'Tobillera', 'Minimalista', 'Verano'],
  },
];
