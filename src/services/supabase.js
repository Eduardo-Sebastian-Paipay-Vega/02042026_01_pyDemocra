import { createClient } from "@supabase/supabase-js";

// Compartido con ONG (ver ONG/src/lib/db/ong/client.ts) para que ambos módulos
// lean la misma sesión de localStorage bajo el mismo origen (democra.pro).
// Si cambia aquí, debe cambiar también ahí, o la sesión deja de propagarse.
export const AUTH_STORAGE_KEY = "sb-democra-auth-token";

let browserClient = null;

export const getSupabaseConfig = () => ({
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",
});

export const hasSupabaseConfig = () => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(url && anonKey);
};

export const createSupabaseClient = () => {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    throw new Error(
      "Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY."
    );
  }

  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // No usamos OAuth/magic-link propios: no hace falta parsear tokens
        // desde el hash de la URL, y desactivarlo cierra esa superficie.
        detectSessionInUrl: false,
        storageKey: AUTH_STORAGE_KEY,
      },
    });
  }

  return browserClient;
};
