import { useState } from 'react';
import { supabase } from '../database/supabase';

interface ChangePasswordResult {
  success: boolean;
  error?: string;
  message?: string;
}

export const useChangePassword = () => {
  const [loading, setLoading] = useState(false);

  const changePassword = async (currentPassword: string, newPassword: string): Promise<ChangePasswordResult> => {
    setLoading(true);
    try {
      // 1. Verify current password by re-authenticating
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (!user || authError) {
        return { success: false, error: 'No hay sesión activa.' };
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword,
      });

      if (signInError) {
        return { 
          success: false, 
          error: 'La contraseña actual es incorrecta.' 
        };
      }

      // 2. Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        return { 
          success: false, 
          error: updateError.message 
        };
      }

      return { 
        success: true, 
        message: 'Contraseña actualizada correctamente.' 
      };

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      console.error('Error changing password:', errorMessage);
      return { 
        success: false, 
        error: 'Ocurrió un error inesperado.' 
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    changePassword,
    loading
  };
};
