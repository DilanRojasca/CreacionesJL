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
const CHUNK_SIZE = 2500; // Reducido para mayor seguridad con el encoding

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
    let value = '';
    let i = 0;
    while (true) {
      const chunkKey = i === 0 ? key : `${key}.${i}`;
      const search = `${chunkKey}=`;
      const cookie = cookies.find(row => row.trim().startsWith(search));
      if (!cookie) break;
      value += decodeURIComponent(cookie.trim().substring(search.length));
      i++;
    }
    return value || null;
  },
  setItem: (key: string, value: string): void => {
    if (typeof document === 'undefined') return;
    
    // 1. Limpiar todos los chunks posibles antes de guardar
    cookieStorage.removeItem(key);

    // 2. Dividir en pedazos
    const chunks = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.substring(i, i + CHUNK_SIZE));
    }

    // 3. Guardar cada pedazo como una cookie independiente
    chunks.forEach((chunk, i) => {
      const chunkKey = i === 0 ? key : `${key}.${i}`;
      // Usar SameSite=Lax y Secure. Path=/ para que esté en toda la web.
      document.cookie = `${chunkKey}=${encodeURIComponent(chunk)}; path=/; max-age=31536000; SameSite=Lax; Secure`;
    });
  },
  removeItem: (key: string): void => {
    if (typeof document === 'undefined') return;
    const cookies = document.cookie.split('; ');
    cookies.forEach(cookie => {
      const name = cookie.split('=')[0].trim();
      // Eliminar el principal y cualquier .1, .2, etc.
      if (name === key || name.startsWith(`${key}.`)) {
        document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax; Secure`;
      }
    });
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
