import { supabase } from './supabase';
import type { User, AuthError, Session } from '@supabase/supabase-js';

export interface RegisterResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

export interface LoginResponse {
  user: User | null;
  session: Session | null;
  error: AuthError | null;
}

/**
 * Verifica si un usuario ya existe en Supabase
 * Esta función ya no se utiliza porque Supabase maneja la validación automáticamente
 * al intentar registrar un usuario duplicado.
 * 
 * @deprecated Use directamente el método signUp de Supabase
/**
 * Registra un nuevo usuario en Supabase
 * 
 * @param email - Correo electrónico del usuario
 * @param password - Contraseña del usuario (mínimo 6 caracteres)
 * @param firstName - Nombre del usuario (opcional, se guarda en metadata)
 * @param lastName - Apellido del usuario (opcional, se guarda en metadata)
 * @param phone - Teléfono del usuario (opcional, se guarda en metadata)
 * @param Country - País del usuario (opcional, se guarda en metadata)
 * @param Department - Departamento del usuario (opcional, se guarda en metadata)
 * @param municipality - Municipio del usuario (opcional, se guarda en metadata)
 * @param addressJson - Dirección del usuario (opcional, se guarda en metadata)
 * @param address - Dirección del usuario (opcional, se guarda en metadata)
 * @param addressdetails - Detalles de la dirección del usuario (opcional, se guarda en metadata)
 * 
 * @returns Promise con el usuario creado, sesión y posibles errores
 * 
 * @example
 * ```typescript
 * const { user, session, error } = await registerUser(
 *   'usuario@ejemplo.com',
 *   'password123',
 *   'Juan',
 *   'Pérez',
 *   '1234567890',
 *   'Calle 123',
 *   'Detalles de la dirección'
 * );
 * 
 * if (error) {
 *   console.error('Error al registrar:', error.message);
 * } else {
 *   console.log('Usuario registrado:', user);
 * }
 * ```
 */
export const registerUser = async (
  email: string,
  password: string,
  firstName?: string,
  lastName?: string,
  phone?: string,
  country?: string,
  department?: string,
  city?: string,
  address?: string,
  addressDetails?: string,
  addressJson?: object
): Promise<RegisterResponse> => {
  try {
    // Registrar usuario en Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Metadata adicional que se guarda en el perfil del usuario
        data: {
          first_name: firstName || '',
          last_name: lastName || '',
          full_name: `${firstName || ''} ${lastName || ''}`.trim(),
          phone: phone || '',
          country: country || '',
          department: department || '',
          city: city || '',
          address_text: address || '',
          address_details: addressDetails || '',
          address_json: addressJson || {},
        },
        // Configuración de email (si tienes email templates personalizados)
        emailRedirectTo: `${window.location.origin}/login`,
      }
    });

    // DETECCIÓN DE USUARIO DUPLICADO:
    // Cuando Supabase tiene email confirmation habilitado y se intenta registrar
    // un email duplicado, retorna el usuario existente pero con identities vacío
    const isDuplicateUser = data.user && data.user.identities && data.user.identities.length === 0;
    
    if (isDuplicateUser) {
      return {
        user: null,
        session: null,
        error: {
          name: 'UserAlreadyExists',
          message: 'Este correo electrónico ya está registrado',
        } as AuthError,
      };
    }

    // Verificar otros tipos de errores
    if (error) {
      // Supabase retorna diferentes mensajes dependiendo de la configuración
      if (
        error.message.includes('User already registered') ||
        error.message.includes('already been registered') ||
        error.message.includes('duplicate')
      ) {
        return {
          user: null,
          session: null,
          error: {
            name: 'UserAlreadyExists',
            message: 'Este correo electrónico ya está registrado',
          } as AuthError,
        };
      }
      
      // Devolver el error tal cual viene de Supabase para otros casos
      return { user: null, session: null, error };
    }

    // --- REFUERZO FRONTEND: Inserción manual en public.users ---
    // Si el registro fue exitoso, intentamos insertar manualmente por si el trigger falla
    if (data.user) {
      try {
        const { error: insertError } = await supabase
          .from('users')
          .upsert({
            user_id: data.user.id,
            email: email,
            first_name: firstName || '',
            last_name: lastName || '',
            full_name: `${firstName || ''} ${lastName || ''}`.trim(),
            phone: phone || '',
            country: country || '',
            department: department || '',
            city: city || '',
            address_text: address || '',
            address_details: addressDetails || '',
          }, { onConflict: 'user_id' });

        if (insertError) {
          console.warn('Advertencia: El trigger falló y la inserción manual también:', insertError.message);
          // No retornamos error aquí porque el usuario ya se creó en Auth
          // y podrá intentar actualizar su perfil después.
        }
      } catch (e) {
        console.error('Error al intentar insertar en public.users:', e);
      }
    }

    return {
      user: data.user,
      session: data.session,
      error: null,
    };
  } catch (error) {
    // Manejo de errores inesperados
    console.error('Error inesperado al registrar usuario:', error);
    return {
      user: null,
      session: null,
      error: {
        name: 'UnexpectedError',
        message: 'Ocurrió un error inesperado al registrar el usuario',
      } as AuthError,
    };
  }
};

/**
 * Inicia sesión con un usuario existente
 * 
 * @param email - Correo electrónico del usuario
 * @param password - Contraseña del usuario
 * 
 * @returns Promise con el usuario, sesión y posibles errores
 * 
 * @example
 * ```typescript
 * const { user, session, error } = await loginUser(
 *   'usuario@ejemplo.com',
 *   'password123'
 * );
 * 
 * if (error) {
 *   console.error('Error al iniciar sesión:', error.message);
 * } else {
 *   console.log('Sesión iniciada:', session);
 * }
 * ```
 */
export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResponse> => {
  try {
    // Iniciar sesión en Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return {
      user: data.user,
      session: data.session,
      error: error,
    };
  } catch (error) {
    // Manejo de errores inesperados
    console.error('Error inesperado al iniciar sesión:', error);
    return {
      user: null,
      session: null,
      error: {
        name: 'UnexpectedError',
        message: 'Ocurrió un error inesperado al iniciar sesión',
      } as AuthError,
    };
  }
};

/**
 * Cierra la sesión del usuario actual
 * 
 * @returns Promise con posibles errores
 * 
 * @example
 * ```typescript
 * const { error } = await logoutUser();
 * if (error) {
 *   console.error('Error al cerrar sesión:', error.message);
 * }
 * ```
 */
export const logoutUser = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.error('Error inesperado al cerrar sesión:', error);
    return {
      error: {
        name: 'UnexpectedError',
        message: 'Ocurrió un error inesperado al cerrar sesión',
      } as AuthError,
    };
  }
};

/**
 * Obtiene la sesión actual del usuario
 * 
 * @returns Promise con la sesión actual o null si no hay sesión activa
 * 
 * @example
 * ```typescript
 * const session = await getCurrentSession();
 * if (session) {
 *   console.log('Usuario autenticado:', session.user);
 * } else {
 *   console.log('No hay sesión activa');
 * }
 * ```
 */
export const getCurrentSession = async (): Promise<Session | null> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error al obtener sesión:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error inesperado al obtener sesión:', error);
    return null;
  }
};

/**
 * Obtiene el usuario actual autenticado
 * 
 * @returns Promise con el usuario actual o null si no hay usuario autenticado
 * 
 * @example
 * ```typescript
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log('Usuario:', user.email);
 * }
 * ```
 */
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error al obtener usuario:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error inesperado al obtener usuario:', error);
    return null;
  }
};

/**
 * Envía un email de recuperación de contraseña
 * 
 * @param email - Correo electrónico del usuario que quiere recuperar su contraseña
 * 
 * @returns Promise con posibles errores
 * 
 * @example
 * ```typescript
 * const { error } = await resetPassword('usuario@ejemplo.com');
 * if (error) {
 *   console.error('Error:', error.message);
 * } else {
 *   console.log('Email de recuperación enviado');
 * }
 * ```
 */
export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  try {
    const redirectTo = window.location.hostname === 'localhost'
      ? 'http://localhost:5173/update-password'
      : 'https://creaciones-jl.vercel.app/update-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    return { error };
  } catch (error) {
    console.error('Error inesperado al resetear contraseña:', error);
    return {
      error: {
        name: 'UnexpectedError',
        message: 'Ocurrió un error inesperado al resetear la contraseña',
      } as AuthError,
    };
  }
};
