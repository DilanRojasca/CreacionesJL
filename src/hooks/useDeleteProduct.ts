import { useState } from 'react';
import { supabase } from '../database/supabase';

interface DeleteProductResult {
  success: boolean;
  error?: string;
}

export const useDeleteProduct = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Eliminar todos los archivos de una carpeta en Supabase Storage
   */
  const deleteFolderFromStorage = async (folderPath: string): Promise<void> => {
    try {
      // Listar todos los archivos en la carpeta
      const { data: files, error: listError } = await supabase.storage
        .from('products_images')
        .list(folderPath);

      if (listError) {
        console.error('Error listing files:', listError);
        throw new Error(`Error al listar archivos: ${listError.message}`);
      }

      if (!files || files.length === 0) {
        console.log('No files found in folder');
        return;
      }

      // Crear array de rutas completas
      const filePaths = files.map(file => `${folderPath}/${file.name}`);

      // Eliminar todos los archivos
      const { error: deleteError } = await supabase.storage
        .from('products_images')
        .remove(filePaths);

      if (deleteError) {
        console.error('Error deleting files:', deleteError);
        throw new Error(`Error al eliminar archivos: ${deleteError.message}`);
      }
    } catch (err) {
      console.error('Error in deleteFolderFromStorage:', err);
      throw err;
    }
  };

  /**
   * Eliminar producto completo (BD + Storage)
   */
  const deleteProduct = async (productId: string): Promise<DeleteProductResult> => {
    setLoading(true);
    setError(null);

    try {
      // 1. Llamar a la RPC para eliminar de la BD y obtener folder_path
      const { data, error: rpcError } = await supabase.rpc('delete_product', {
        p_product_id: productId
      });

      if (rpcError) {
        throw new Error(`Error al eliminar producto: ${rpcError.message}`);
      }

      const folderPath = data;

      // 2. Eliminar carpeta de imágenes si existe
      if (folderPath) {
        await deleteFolderFromStorage(folderPath);
      } else {
        console.warn('No folder_path found for product:', productId);
      }

      setLoading(false);
      return { success: true };
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
    deleteProduct,
    loading,
    error,
  };
};