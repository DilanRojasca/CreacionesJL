import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../database/supabase';
import { loginUser, registerUser, logoutUser, resetPassword as authResetPassword } from '../database/authService';
import type { User, Session } from '@supabase/supabase-js';


//Interfaz del contexto de autenticación
interface AuthContextType {
  // Estado
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isStaff: boolean;

  // Funciones
  login: (email: string, password: string) => Promise<{ error: unknown }>;
  register: (
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
  ) => Promise<{ error: unknown }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: unknown }>;
}

/**
 * Crear el contexto con valores por defecto
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);


//Props del proveedor de autenticación

interface AuthProviderProps {
  children: ReactNode;
}


//Proveedor de contexto de autenticación

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStaff, setIsStaff] = useState<boolean>(false);

  useEffect(() => {
      const checkStaff = async () => {
        if (user?.id) {
          try {
            const { data, error } = await supabase.rpc('is_staff');
            if (error) {
              console.error('Error checking staff status:', error);
              setIsStaff(false);
            } else {
              setIsStaff(data || false);
            }
          } catch (error) {
            console.error('Error calling is_staff:', error);
            setIsStaff(false);
          }
        }
      };
      checkStaff();
    }, [user?.id]);

  //Función para actualizar el estado de autenticación
  const updateAuthState = (session: Session | null) => {
    setSession(session);
    setUser(session?.user ?? null);
    setIsLoading(false);
  };

  useEffect(() => {
    // Obtener la sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateAuthState(session);
    });

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

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await loginUser(email, password);
    setIsLoading(false);
    return { error };
  };


  const register = async (
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
  ) => {
    setIsLoading(true);
    const { error } = await registerUser(email, password, firstName, lastName, phone, country, department, city, address, addressDetails, addressJson);
    setIsLoading(false);
    return { error };
  };

  const logout = async () => {
    setIsLoading(true);
    await logoutUser();
    // El estado se actualizará automáticamente por el listener de onAuthStateChange
    setIsLoading(false);
  };

  const resetPassword = async (email: string) => {
    setIsLoading(true);
    const { error } = await authResetPassword(email);
    setIsLoading(false);
    return { error };
  };

  // Valor del contexto
  const value: AuthContextType = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    isStaff,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth debe ser usado dentro de un AuthProvider.' +
      'Asegúrate de envolver tu aplicación con <AuthProvider>'
    );
  }

  return context;
};
