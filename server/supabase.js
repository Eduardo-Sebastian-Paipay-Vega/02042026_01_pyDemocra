import { createClient } from "@supabase/supabase-js";
import { config } from "./config.js";

const createBaseOptions = () => ({
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export const serviceClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  createBaseOptions()
);

export const createUserScopedClient = (accessToken) => {
  return createClient(config.supabaseUrl, config.supabaseAnonKey, {
    ...createBaseOptions(),
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
};

export const resolveAuthContext = async (accessToken) => {
  if (!accessToken) {
    return { error: new Error("Missing access token") };
  }

  const { data, error } = await serviceClient.auth.getUser(accessToken);
  if (error || !data?.user) {
    return { error: error || new Error("Invalid access token") };
  }

  const user = data.user;
  const { data: profile, error: profileError } = await serviceClient
    .from("profiles")
    .select(
      "id, tenant_id, is_blocked, blocked_reason, risk_blocked_until, pin_failed_attempts, pin_blocked_until"
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return { error: profileError };
  }

  return {
    user,
    profile,
    userClient: createUserScopedClient(accessToken),
  };
};
