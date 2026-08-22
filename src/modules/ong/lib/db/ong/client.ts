import type { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseModuleManager } from "../core";
import type { AppDatabase } from "./app-database";

const ONG_MODULE_PREFIX = "ONG_DB";
const ongModule = createSupabaseModuleManager(ONG_MODULE_PREFIX);

/**
 * Client with ANON key.
 * Safe for frontend usage and expected to work under RLS policies.
 */
export const ongClient = ongModule.getPublicClient<AppDatabase>();

function createServerOnlyClientGuard<TClient extends object>(clientName: string): TClient {
  return new Proxy({} as TClient, {
    get() {
      throw new Error(
        `${clientName} is server-only and must never be consumed in frontend code.`
      );
    },
  });
}

/**
 * Client with SERVICE_ROLE key.
 * Server-only: use only in trusted backend/server functions.
 */
export const ongAdminClient: SupabaseClient<AppDatabase> =
  typeof window === "undefined"
    ? ongModule.getServiceClient<AppDatabase>()
    : createServerOnlyClientGuard<SupabaseClient<AppDatabase>>("ongAdminClient");

/**
 * Example query (read-only) using the ONG module with RLS-safe client.
 */
export async function fetchOngVolunteersPreview(limit = 20) {
  const { data, error } = await ongClient
    .schema("ong")
    .from("voluntarios")
    .select(
      "id, nombre, apellido, email, telefono, codigo_estado, created_at"
    )
    .order("apellido", { ascending: true })
    .order("nombre", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`ONG query failed: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Catalog query for volunteer states.
 */
export async function fetchOngVolunteerStates() {
  const { data, error } = await ongClient
    .schema("ong")
    .from("estados_voluntario")
    .select("codigo, nombre_estado")
    .order("orden_visual", { ascending: true });

  if (error) {
    throw new Error(`ONG volunteer states query failed: ${error.message}`);
  }

  return data ?? [];
}

