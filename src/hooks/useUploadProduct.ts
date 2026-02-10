import { useState, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../database/supabase';

interface UploadProductData {
  name: string;
  description: string;
  price: number;
  images: File[];
  tags: string[];
  sizes: string[];
}

interface UploadProductResult {
  success: boolean;
  productId?: string;
  error?: string;
}

export const useUploadProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  /**
   * Sanitizar nombre del producto para uso como nombre de carpeta en S3
   * - Reemplaza espacios con guiones
   * - Elimina caracteres especiales
   * - Convierte ñ a n, acentos, etc.
   * - Convierte a minúsculas
   */
  const sanitizeProductName = (name: string): string => {
    return name
      .toLowerCase()
      .normalize('NFD') // Descomponer caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '') // Eliminar marcas diacríticas
      .replace(/ñ/g, 'n') // Reemplazar ñ
      .replace(/[^a-z0-9\s-]/g, '') // Mantener solo letras, números, espacios y guiones
      .trim()
      .replace(/\s+/g, '-') // Reemplazar espacios con guiones
      .replace(/-+/g, '-'); // Eliminar guiones duplicados
  };

  /**
   * Optimizar y convertir imagen a WebP
   */
  const optimizeImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1, // Tamaño máximo 1MB
      maxWidthOrHeight: 1920, // Máximo 1920px de ancho o alto
      useWebWorker: true,
      fileType: 'image/webp', // Convertir a WebP
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
      // Crear un nuevo archivo con extensión .webp
      const webpFile = new File(
        [compressedFile],
        file.name.replace(/\.[^/.]+$/, '.webp'),
        { type: 'image/webp' }
      );
      
      return webpFile;
    } catch (err) {
      console.error('Error optimizing image:', err);
      throw new Error('Error al optimizar la imagen');
    }
  };

  /**
   * Subir una imagen a Supabase Storage
   */
  const uploadImage = async (
    file: File,
    productFolderName: string
  ): Promise<string> => {
    try {
      // Optimizar imagen
      const optimizedFile = await optimizeImage(file);
      
      // Generar nombre único para el archivo
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 9);
      const fileName = `${timestamp}-${randomString}.webp`;
      
      // Ruta completa en el storage
      const filePath = `Catalog Images/${productFolderName}/${fileName}`;

      // Subir a Supabase Storage
      const { data, error } = await supabase.storage
        .from('products_images')
        .upload(filePath, optimizedFile, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw new Error(`Error al subir imagen: ${error.message}`);
      }

      // Obtener URL pública
      const { data: publicData } = supabase.storage
        .from('products_images')
        .getPublicUrl(data.path);

      return publicData.publicUrl;
    } catch (err) {
      console.error('Error uploading image:', err);
      throw err;
    }
  };

  /**
   * Cargar tags existentes de la base de datos
   */
  const loadExistingTags = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_product_tags');

      if (error) {
        console.error('Error loading tags:', error);
        return;
      }

      if (data) {
        const tags = data.map((item: { tag: string }) => item.tag);
        setExistingTags(tags);
      }
    } catch (err) {
      console.error('Error loading existing tags:', err);
    }
  }, []);

  /**
   * Subir producto completo
   */
  const uploadProduct = async (
    productData: UploadProductData
  ): Promise<UploadProductResult> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Sanitizar nombre del producto para la carpeta
      const productFolderName = sanitizeProductName(productData.name);
      const folderPath = `Catalog Images/${productFolderName}`; // ✅ Ruta completa de la carpeta

      // 2. Subir todas las imágenes
      const imageUrls: string[] = [];
      for (const image of productData.images) {
        try {
          const url = await uploadImage(image, productFolderName);
          imageUrls.push(url);
        } catch (err) {
          console.error('Error uploading individual image:', err);
        }
      }

      if (imageUrls.length === 0) {
        throw new Error('No se pudo subir ninguna imagen');
      }

      // 3. Llamar a la RPC con el folder_path
      const { data, error: rpcError } = await supabase.rpc('upload_product', {
        p_name: productData.name,
        p_description: productData.description,
        p_price: productData.price,
        p_image_urls: imageUrls,
        p_tags: productData.tags,
        p_sizes: productData.sizes,
        p_folder_path: folderPath, // ✅ Pasar la ruta de la carpeta
      });

      if (rpcError) {
        console.error('RPC Error:', rpcError);
        throw new Error(`Error al crear producto: ${rpcError.message}`);
      }

      setLoading(false);
      return {
        success: true,
        productId: data,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  return {
    uploadProduct,
    loading,
    error,
    existingTags,
    loadExistingTags,
  };
};
