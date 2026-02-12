import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../database/supabase';

interface EditProductData {
  name?: string;
  description?: string;
  price?: number;
  tags?: string[];
  sizes?: string[];
  imagesToDelete?: string[];      // URLs a eliminar de S3
  existingImages?: string[];       // URLs que se mantienen (ordenadas)
  newImages?: File[];             // Archivos nuevos a subir
}

interface EditProductResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export const useEditProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Extraer la key de S3 desde una URL completa de Supabase Storage
   * Ejemplo: https://[project].supabase.co/storage/v1/object/public/products_images/Catalog%20Images/... 
   * -> Catalog Images/...
   */
  const extractS3KeyFromUrl = (url: string): string => {
    try {
      // Para Supabase Storage, buscar después de /products_images/
      const bucketName = 'products_images';
      const bucketIndex = url.indexOf(`/${bucketName}/`);
      
      if (bucketIndex !== -1) {
        // Extraer todo después del nombre del bucket
        const key = url.substring(bucketIndex + `/${bucketName}/`.length);
        // Decodificar URL encoding (espacios, etc.)
        return decodeURIComponent(key);
      }
      
      // Fallback: si no encuentra el patrón de Supabase, intentar extracción genérica
      console.warn('No se encontró el patrón de Supabase en la URL:', url);
      const urlParts = url.split('.com/');
      if (urlParts.length > 1) {
        return decodeURIComponent(urlParts[1]);
      }
      
      return url;
    } catch (err) {
      console.error('Error extracting S3 key:', err, 'URL:', url);
      return url;
    }
  };

  /**
   * Eliminar archivos específicos de S3 Storage
   */
  const deleteFilesFromStorage = async (imageUrls: string[]): Promise<void> => {
    if (!imageUrls || imageUrls.length === 0) return;

    try {
      // Extraer las keys de las URLs
      const filePaths = imageUrls.map(url => extractS3KeyFromUrl(url));

      // Eliminar archivos
      const { data, error: deleteError } = await supabase.storage
        .from('products_images')
        .remove(filePaths);

      if (deleteError) {
        console.error('❌ Error deleting files from storage:', deleteError);
        throw new Error(`Error al eliminar archivos: ${deleteError.message}`);
      }
      
    } catch (err) {
      console.error('❌ Error in deleteFilesFromStorage:', err);
      throw err;
    }
  };

  /**
   * Optimizar y convertir imagen a WebP
   */
  const optimizeImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/webp',
    };

    try {
      const compressedFile = await imageCompression(file, options);
      
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
   * Subir nuevos archivos a S3 Storage
   */
  const uploadFilesToStorage = async (files: File[], folderPath: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        // Optimizar imagen a WebP
        const optimizedFile = await optimizeImage(file);
        
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 9);
        const fileName = `${timestamp}-${randomString}.webp`;
        const filePath = `${folderPath}/${fileName}`;

        // Subir archivo optimizado
        const { error: uploadError } = await supabase.storage
          .from('products_images')
          .upload(filePath, optimizedFile, {
            contentType: 'image/webp',
            upsert: false
          });

        if (uploadError) {
          throw new Error(`Error al subir ${file.name}: ${uploadError.message}`);
        }

        // Obtener URL pública
        const { data: urlData } = supabase.storage
          .from('products_images')
          .getPublicUrl(filePath);

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (err) {
      console.error('Error uploading files:', err);
      throw err;
    }
  };

  /**
   * Editar producto completo (DB + Storage)
   */
  const editProduct = async (
    productId: string,
    data: EditProductData
  ): Promise<EditProductResult> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Llamar a RPC para actualizar info plana y obtener folder_path
      const { data: folderPath, error: rpcError } = await supabase.rpc('update_product_info', {
        p_product_id: productId,
        p_name: data.name,
        p_description: data.description,
        p_price: data.price,
        p_tags: data.tags,
        p_sizes: data.sizes
      });

      if (rpcError) {
        throw new Error(`Error al actualizar producto: ${rpcError.message}`);
      }

      if (!folderPath) {
        throw new Error('No se pudo obtener la ruta de la carpeta del producto');
      }

      // 2. Gestión de imágenes (solo si hay cambios)
      const finalImageUrls: string[] = [];

      // 2a. Eliminar imágenes marcadas para borrar
      if (data.imagesToDelete && data.imagesToDelete.length > 0) {
        await deleteFilesFromStorage(data.imagesToDelete);
      }

      // 2b. Mantener imágenes existentes (respetando orden)
      if (data.existingImages && data.existingImages.length > 0) {
        finalImageUrls.push(...data.existingImages);
      }

      // 2c. Subir nuevas imágenes
      if (data.newImages && data.newImages.length > 0) {
        const newUrls = await uploadFilesToStorage(data.newImages, folderPath);
        finalImageUrls.push(...newUrls);
      }

      // 3. Actualizar image_urls en la BD (solo si hubo cambios en imágenes)
      const hasImageChanges = 
        (data.imagesToDelete && data.imagesToDelete.length > 0) ||
        (data.newImages && data.newImages.length > 0) ||
        (data.existingImages && data.existingImages.length > 0);

      if (hasImageChanges) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ image_urls: finalImageUrls })
          .eq('product_id', productId);

        if (updateError) {
          throw new Error(`Error al actualizar URLs de imágenes: ${updateError.message}`);
        }
      }

      setLoading(false);
      return { success: true, data: { folderPath, imageUrls: finalImageUrls } };
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
    editProduct,
    loading,
    error,
  };
};
