import { createSupabaseClient } from '@/services/supabase';

// Inicializamos y exportamos el cliente de Supabase usando el servicio transversal del Core.
// Esto garantiza que el "storageKey" y la sesión se compartan con toda la aplicación,
// y que no haya llaves quemadas (hardcoded) en el código.
export const supabase = createSupabaseClient();
