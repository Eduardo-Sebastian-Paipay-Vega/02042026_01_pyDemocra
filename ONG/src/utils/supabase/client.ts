import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton: crear una única instancia del cliente de Supabase
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);
