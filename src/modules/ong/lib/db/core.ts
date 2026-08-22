import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from "@supabase/supabase-js";

type RuntimeEnv = Record<string, string | undefined>;

const cachedClients = new Map<string, SupabaseClient<any>>();
const cachedPublicCredentials = new Map<string, SupabaseModulePublicCredentials>();

const SERVICE_ROLE_DEFAULT_OPTIONS: SupabaseClientOptions<"public"> = {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
};

export interface SupabaseModuleEnvNames {
  urlVarName: string;
  anonKeyVarName: string;
  serviceRoleKeyVarName: string;
}

export interface SupabaseModulePublicCredentials {
  url: string;
  anonKey: string;
}

export interface SupabaseModuleManager {
  modulePrefix: string;
  envNames: SupabaseModuleEnvNames;
  getPublicClient<TDatabase = any>(
    options?: SupabaseClientOptions<"public">
  ): SupabaseClient<TDatabase>;
  getServiceClient<TDatabase = any>(
    options?: SupabaseClientOptions<"public">
  ): SupabaseClient<TDatabase>;
}

function getProcessEnv(): RuntimeEnv {
  return (globalThis as { process?: { env?: RuntimeEnv } }).process?.env ?? {};
}

function getViteEnv(): RuntimeEnv {
  return (import.meta as ImportMeta & { env?: RuntimeEnv }).env ?? {};
}

function normalizeModulePrefix(modulePrefix: string): string {
  const normalized = modulePrefix.trim().toUpperCase();
  if (!normalized) {
    throw new Error("Supabase module prefix cannot be empty.");
  }
  return normalized;
}

function readRequiredEnv(
  varName: string,
  options: { allowViteAlias?: boolean } = {}
): string {
  const processEnv = getProcessEnv();
  const viteEnv = getViteEnv();

  const processValue = processEnv[varName];
  const viteDirectValue = options.allowViteAlias ? viteEnv[varName] : undefined;
  const viteAliasedValue = options.allowViteAlias
    ? viteEnv[`VITE_${varName}`]
    : undefined;

  const resolvedValue = processValue ?? viteDirectValue ?? viteAliasedValue;

  if (!resolvedValue) {
    const aliasHint = options.allowViteAlias ? ` or VITE_${varName}` : "";
    throw new Error(
      `Missing environment variable: ${varName}${aliasHint}.`
    );
  }

  return resolvedValue;
}

function getOrCreateCachedClient<TDatabase>(
  cacheKey: string,
  factory: () => SupabaseClient<TDatabase>
): SupabaseClient<TDatabase> {
  const cached = cachedClients.get(cacheKey);
  if (cached) {
    return cached as SupabaseClient<TDatabase>;
  }

  const created = factory();
  cachedClients.set(cacheKey, created as SupabaseClient<any>);
  return created;
}

export function buildSupabaseModuleEnvNames(
  modulePrefix: string
): SupabaseModuleEnvNames {
  const prefix = normalizeModulePrefix(modulePrefix);
  return {
    urlVarName: `${prefix}_SUPABASE_URL`,
    anonKeyVarName: `${prefix}_SUPABASE_ANON_KEY`,
    serviceRoleKeyVarName: `${prefix}_SUPABASE_SERVICE_ROLE_KEY`,
  };
}

export function resolveSupabaseModulePublicCredentials(
  modulePrefix: string
): SupabaseModulePublicCredentials {
  const prefix = normalizeModulePrefix(modulePrefix);
  const cached = cachedPublicCredentials.get(prefix);
  if (cached) {
    return cached;
  }

  const envNames = buildSupabaseModuleEnvNames(prefix);
  const credentials = {
    url: readRequiredEnv(envNames.urlVarName, { allowViteAlias: true }),
    anonKey: readRequiredEnv(envNames.anonKeyVarName, { allowViteAlias: true }),
  };

  cachedPublicCredentials.set(prefix, credentials);
  return credentials;
}

export function resolveSupabaseModuleServiceRoleKey(modulePrefix: string): string {
  const envNames = buildSupabaseModuleEnvNames(modulePrefix);
  // Never resolve SERVICE_ROLE from VITE_* to avoid leaking privileged keys.
  return readRequiredEnv(envNames.serviceRoleKeyVarName);
}

export function assertServerOnlyClientUsage(clientName: string): void {
  if (typeof window !== "undefined") {
    throw new Error(
      `${clientName} is server-only. Use an anon/RLS client in frontend code.`
    );
  }
}

export function createSupabaseClient<TDatabase = any>(
  url: string,
  key: string,
  options?: SupabaseClientOptions<"public">
): SupabaseClient<TDatabase> {
  if (!url || !key) {
    throw new Error("Supabase client initialization requires both URL and key.");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<TDatabase>(url, key, options as any);
}

export function createSupabaseModuleManager(
  modulePrefix: string
): SupabaseModuleManager {
  const normalizedPrefix = normalizeModulePrefix(modulePrefix);
  const envNames = buildSupabaseModuleEnvNames(normalizedPrefix);
  const publicCredentials = resolveSupabaseModulePublicCredentials(normalizedPrefix);

  return {
    modulePrefix: normalizedPrefix,
    envNames,
    getPublicClient<TDatabase = any>(
      options?: SupabaseClientOptions<"public">
    ): SupabaseClient<TDatabase> {
      if (options) {
        return createSupabaseClient<TDatabase>(
          publicCredentials.url,
          publicCredentials.anonKey,
          options
        );
      }

      return getOrCreateCachedClient<TDatabase>(
        `${normalizedPrefix}:anon`,
        () =>
          createSupabaseClient<TDatabase>(
            publicCredentials.url,
            publicCredentials.anonKey
          )
      );
    },
    getServiceClient<TDatabase = any>(
      options?: SupabaseClientOptions<"public">
    ): SupabaseClient<TDatabase> {
      assertServerOnlyClientUsage(`${normalizedPrefix} service-role client`);

      const serviceRoleKey = resolveSupabaseModuleServiceRoleKey(normalizedPrefix);
      const mergedOptions = options ?? SERVICE_ROLE_DEFAULT_OPTIONS;

      if (options) {
        return createSupabaseClient<TDatabase>(
          publicCredentials.url,
          serviceRoleKey,
          mergedOptions
        );
      }

      return getOrCreateCachedClient<TDatabase>(
        `${normalizedPrefix}:service-role`,
        () =>
          createSupabaseClient<TDatabase>(
            publicCredentials.url,
            serviceRoleKey,
            mergedOptions
          )
      );
    },
  };
}

