import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { AppDatabase } from "./lib/db/ong/app-database";
import { getSupabaseConfig } from "../../services/supabase.js";

let cachedClient: SupabaseClient<AppDatabase> | null = null;

function getOngSupabaseClient(): SupabaseClient<AppDatabase> {
  if (!cachedClient) {
    const { url, anonKey } = getSupabaseConfig();
    if (!url || !anonKey) {
      throw new Error(
        "Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY."
      );
    }
    cachedClient = createClient<AppDatabase>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-democra-auth-token'
      },
    });
  }
  return cachedClient;
}

export const supabase = getOngSupabaseClient();

export async function fetchOngVolunteersPreview(limit = 20) {
  const { data, error } = await supabase
    .schema("ong")
    .from("voluntarios")
    .select("id, nombre, apellido, email, telefono, codigo_estado, created_at")
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`ONG query failed: ${error.message}`);
  }

  return data ?? [];
}

export async function fetchOngVolunteerStates() {
  const { data, error } = await supabase
    .schema("ong")
    .from("estados_voluntario")
    .select("codigo, nombre_estado")
    .order("orden_visual", { ascending: true });

  if (error) {
    throw new Error(`ONG volunteer states query failed: ${error.message}`);
  }

  return data ?? [];
}

