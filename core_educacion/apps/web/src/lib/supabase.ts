import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
// @ts-ignore
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_kY2EPgrTXFkYyYizY9YRRg_IY9Tr2D5';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Faltan variables de entorno de Supabase. Revisa el archivo .env.local');
}

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
