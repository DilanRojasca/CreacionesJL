import { toast, type ToastOptions } from 'react-toastify';
import { 
  FaCircleCheck, 
  FaCircleXmark, 
  FaCircleInfo, 
  FaCircleExclamation,
  FaCartShopping 
} from 'react-icons/fa6';

/**
 * Hook personalizado para gestionar notificaciones de forma centralizada.
 * Implementa el Patrón Facade para desacoplar la lógica de la UI de la librería react-toastify.
 */
export const useNotifications = () => {
  
  // Configuración por defecto para los toasts
  const defaultOptions: ToastOptions = {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: "colored",
  };

  /**
   * Muestra un mensaje de éxito
   */
  const success = (message: string, options?: ToastOptions) => {
    toast.success(message, { 
      ...defaultOptions, 
      icon: <FaCircleCheck />,
      ...options 
    });
  };

  /**
   * Muestra un mensaje de error
   */
  const error = (message: string, options?: ToastOptions) => {
    toast.error(message, { 
      ...defaultOptions, 
      icon: <FaCircleXmark />,
      ...options 
    });
  };

  /**
   * Muestra un mensaje de información
   */
  const info = (message: string, options?: ToastOptions) => {
    toast.info(message, { 
      ...defaultOptions, 
      icon: <FaCircleInfo />,
      ...options 
    });
  };

  /**
   * Muestra un mensaje de advertencia
   */
  const warning = (message: string, options?: ToastOptions) => {
    toast.warn(message, { 
      ...defaultOptions, 
      icon: <FaCircleExclamation />,
      ...options 
    });
  };

  /**
   * Gestiona promesas con toasts automáticos (loading -> success/error)
   */
  const promise = async <T,>(
    asyncFunction: Promise<T>,
    messages: { pending: string; success: string; error: string },
    options?: ToastOptions
  ) => {
    return toast.promise(
      asyncFunction,
      {
        pending: messages.pending,
        success: {
          render: messages.success,
          icon: <FaCircleCheck />,
        },
        error: {
          render: messages.error,
          icon: <FaCircleXmark />,
        },
      },
      { ...defaultOptions, ...options }
    );
  };

  // --- ATAJOS DE NEGOCIO (Domain-specific helpers) ---

  const productAdded = (productName: string) => {
    success(`¡${productName} añadido al carrito!`, {
      icon: <FaCartShopping />
    });
  };

  const loginSuccess = (userName?: string) => {
    success(userName ? `¡Bienvenido de nuevo, ${userName}!` : 'Sesión iniciada correctamente');
  };

  const authError = (err: string | Error) => {
    const message = typeof err === 'string' ? err : err.message;
    
    if (message.toLowerCase().includes('email rate limit exceeded')) {
      emailRateLimitError();
    } else {
      error(`Error de autenticación: ${message}`);
    }
  };

  const emailRateLimitError = () => {
    error('Se ha superado el límite de correos electrónicos. Por favor, intenta de nuevo más tarde.', {
      icon: <FaCircleExclamation />,
      autoClose: 6000
    });
  };

  const orderCreated = () => {
    success('¡Pedido realizado con éxito! Gracias por tu compra.', { autoClose: 5000 });
  };

  const profileUpdated = () => {
    success('¡Perfil actualizado correctamente!', {
      icon: <FaCircleCheck />
    });
  };

  return {
    success,
    error,
    info,
    warning,
    promise,
    // Helpers de negocio
    productAdded,
    loginSuccess,
    authError,
    orderCreated,
    profileUpdated,
    emailRateLimitError
  };
};
