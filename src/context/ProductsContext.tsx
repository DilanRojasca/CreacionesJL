import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { toast } from 'react-toastify';
import { supabase } from '../database/supabase';
import { type Product } from '../types/product';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetchProducts: () => void;
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined);

export const ProductsProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_all_products');
      
      if (rpcError) {
        console.error('Error al cargar productos:', rpcError);
        toast.error('Error al cargar los productos');
        setError('Error al cargar productos');
        return;
      }
      
      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Error inesperado:', err);
      toast.error('Error inesperado al cargar productos');
      setError('Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading, error, refetchProducts: fetchProducts }}>
      {children}
    </ProductsContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) throw new Error('useProducts must be used within ProductsProvider');
  return context;
};