import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2.97.0";
import { HttpError } from "./http.ts";

const supabaseUrl =
  Deno.env.get("SUPABASE_URL") ?? Deno.env.get("ONG_DB_SUPABASE_URL") ?? "";
const supabaseAnonKey =
  Deno.env.get("SUPABASE_ANON_KEY") ??
  Deno.env.get("ONG_DB_SUPABASE_ANON_KEY") ??
  Deno.env.get("VITE_ONG_DB_SUPABASE_ANON_KEY") ??
  "";
const supabaseServiceRoleKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("ONG_DB_SUPABASE_SERVICE_ROLE_KEY") ??
  "";

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing Supabase runtime variables. Required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY."
  );
}

type RpcClient = Pick<SupabaseClient, "rpc" | "auth">;

export interface RequestContext {
  authHeader: string;
  authedClient: SupabaseClient;
  adminClient: SupabaseClient;
  user: User;
  tenantId: string;
}

function createAuthedClient(authHeader: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
}

export function createAdminClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function requireRequestContext(request: Request): Promise<RequestContext> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    throw new HttpError(401, "Falta el token de autorizacion.");
  }

  const authedClient = createAuthedClient(authHeader);
  const adminClient = createAdminClient();
  const {
    data: { user },
    error,
  } = await authedClient.auth.getUser();

  if (error || !user) {
    throw new HttpError(401, "No se pudo validar el usuario autenticado.", error);
  }

  const tenantId = await resolveTenantId(authedClient);

  return {
    authHeader,
    authedClient,
    adminClient,
    user,
    tenantId,
  };
}

export async function resolveTenantId(client: RpcClient): Promise<string> {
  const { data, error } = await client.rpc("fn_current_tenant_id");
  if (error) {
    throw new HttpError(403, "No se pudo resolver el tenant actual.", error);
  }

  const tenantId = typeof data === "string" ? data.trim() : "";
  if (!tenantId) {
    throw new HttpError(403, "No se pudo resolver el tenant actual.");
  }

  return tenantId;
}

export async function isTenantAdmin(client: RpcClient): Promise<boolean> {
  const { data, error } = await client.rpc("fn_is_tenant_admin");
  if (error) {
    throw new HttpError(403, "No se pudo validar tenant admin.", error);
  }

  return data === true;
}

export async function hasPermission(
  client: RpcClient,
  permission: string
): Promise<boolean> {
  const { data, error } = await client.rpc("fn_has_permission", {
    p_permission: permission,
  });

  if (error) {
    throw new HttpError(
      403,
      `No se pudo validar el permiso ${permission}.`,
      error
    );
  }

  return data === true;
}

export async function ensureAnyPermission(
  client: RpcClient,
  permissions: string[]
): Promise<void> {
  const admin = await isTenantAdmin(client);
  if (admin) {
    return;
  }

  for (const permission of permissions) {
    if (await hasPermission(client, permission)) {
      return;
    }
  }

  throw new HttpError(403, "No autorizado.");
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength = 500
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function sanitizeEmail(value: string | null | undefined): string {
  return sanitizeText(value, 255).toLowerCase();
}

export function sanitizeRedirectUrl(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 2000);
  if (!cleaned) {
    return null;
  }

  if (!/^https?:\/\/\S+$/i.test(cleaned)) {
    throw new HttpError(400, "El redirectTo debe ser una URL absoluta valida.");
  }

  return cleaned;
}
