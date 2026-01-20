/**
 * Configuración del Cliente de Supabase
 * 
 * Este archivo inicializa y exporta el cliente de Supabase que se utilizará
 * en toda la aplicación para interactuar con la base de datos y servicios de autenticación.
 * 
 * IMPORTANTE: Este cliente usa la ANON KEY que es segura para usar en el frontend.
 * La ANON KEY respeta las políticas de Row Level Security (RLS) configuradas en Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Obtener las variables de entorno configuradas en .env o .env.local
// Vite requiere el prefijo VITE_ para exponer variables al cliente
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validar que las variables de entorno estén configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Error: Las variables de entorno de Supabase no están configuradas.\n' +
    'Por favor, verifica que .env contenga:\n' +
    '- VITE_SUPABASE_URL\n' +
    '- VITE_SUPABASE_ANON_KEY'
  );
}

/**
 * Almacenamiento personalizado usando Cookies con soporte para CHUNKING
 * Las cookies tienen un límite de 4096 bytes. Las sesiones de Supabase pueden excederlo.
 */

// Función auxiliar para limpiar localStorage de restos de sesiones anteriores
if (typeof window !== 'undefined') {
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      localStorage.removeItem(key);
    }
  });
}

const cookieStorage = {
  getItem: (key: string): string | null => {
    if (typeof document === 'undefined') return null;
    const cookies = document.cookie.split('; ');
    const search = `${key}=`;
    const cookie = cookies.find(row => row.trim().startsWith(search));
    
    if (!cookie) return null;
    
    try {
      // Extraemos el valor y lo decodificamos
      const value = cookie.trim().substring(search.length);
      return decodeURIComponent(value);
    } catch (e) {
      console.error('Error reading cookie:', key, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;

    let finalValue = value;
    try {
      // Supabase envía el objeto de sesión completo como string.
      // Lo parseamos para reducir su tamaño eliminando metadata pesada.
      const session = JSON.parse(value);
      
      // Es CRUCIAL mantener la estructura que espera el SDK { access_token, user, ... }
      if (session && session.access_token && session.user) {
        const minimalSession = {
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          expires_at: session.expires_at,
          expires_in: session.expires_in,
          token_type: session.token_type,
          user: {
            id: session.user.id,
            email: session.user.email,
            aud: session.user.aud,
            role: session.user.role
            // ❌ ELIMINAMOS metadata, identites y otros campos gigantes (+4KB)
          }
        };
        finalValue = JSON.stringify(minimalSession);
      }
    } catch (e) {
      // Si no es un JSON válido de sesión, guardamos el original
      finalValue = value;
    }

    // Guardar en cookie (ahora siempre medirá < 1.5KB)
    document.cookie = `${key}=${encodeURIComponent(finalValue)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    document.cookie = `${key}=; path=/; max-age=0; SameSite=Lax; Secure`;
  },
};

/**
 * Cliente de Supabase configurado y listo para usar
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: cookieStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});
