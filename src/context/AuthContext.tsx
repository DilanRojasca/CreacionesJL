/**
 * Contexto de Autenticación
 * 
 * Este contexto proporciona el estado de autenticación y funciones relacionadas
 * a todos los componentes de la aplicación mediante React Context API.
 * 
 * Funcionalidades:
 * - Manejo del estado de autenticación (isAuthenticated, isLoading, user)
 * - Sincronización automática con Supabase Auth
 * - Escucha de cambios en la sesión (login, logout, token refresh)
 * - Proveedor de contexto para envolver la aplicación
 * 
 * Uso:
 * ```typescript
 * // En App.tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * 
 * // En cualquier componente
 * const { isAuthenticated, user, login, logout } = useAuth();
 * ```
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../database/supabase';
import { loginUser, registerUser, logoutUser } from '../database/authService';
import type { User, Session } from '@supabase/supabase-js';

/**
 * Interfaz del contexto de autenticación
 */
interface AuthContextType {
  // Estado
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Funciones
  login: (email: string, password: string) => Promise<{ error: any }>;
  register: (email: string, password: string, firstName?: string, lastName?: string, phone?: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

/**
 * Crear el contexto con valores por defecto
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Props del proveedor de autenticación
 */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Proveedor de contexto de autenticación
 * 
 * Este componente debe envolver toda la aplicación para proporcionar
 * el estado de autenticación a todos los componentes hijos.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Función para actualizar el estado de autenticación
   */
  const updateAuthState = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setIsLoading(false);
  };

  /**
   * Efecto para inicializar y escuchar cambios en la sesión de Supabase
   * 
   * Este efecto:
   * 1. Obtiene la sesión actual al cargar la app
   * 2. Escucha cambios en la sesión (login, logout, token refresh)
   * 3. Actualiza el estado de autenticación automáticamente
   */
  useEffect(() => {
    // Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

    // Escuchar cambios en la sesión de autenticación
    // Esto se dispara cuando:
    // - Un usuario inicia sesión
    // - Un usuario cierra sesión
    // - El token se refresca
    // - La sesión expira
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    // Limpiar la suscripción cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Función para iniciar sesión
   */
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await loginUser(email, password);
    setIsLoading(false);
    return { error };
  };

  /**
   * Función para registrar un nuevo usuario
   */
  const register = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string,
    phone?: string
  ) => {
    setIsLoading(true);
    const { error } = await registerUser(email, password, firstName, lastName, phone);
    setIsLoading(false);
    return { error };
  };

  /**
   * Función para cerrar sesión
   */
  const logout = async () => {
    setIsLoading(true);
    await logoutUser();
    // El estado se actualizará automáticamente por el listener de onAuthStateChange
    setIsLoading(false);
  };

  // Valor del contexto
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * Hook personalizado para usar el contexto de autenticación
 * 
 * @returns El contexto de autenticación
 * @throws Error si se usa fuera del AuthProvider
 * 
 * @example
 * ```typescript
 * const { isAuthenticated, user, login, logout } = useAuth();
 * ```
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error(
      '❌ useAuth debe ser usado dentro de un AuthProvider. ' +
      'Asegúrate de envolver tu aplicación con <AuthProvider>'
    );
  }
  
  return context;
};
