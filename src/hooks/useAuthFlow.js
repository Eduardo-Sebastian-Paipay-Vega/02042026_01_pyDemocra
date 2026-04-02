import { createSupabaseClient, hasSupabaseConfig } from "../services/supabase.js";
import { requestJson } from "../services/api.js";

const assertSupabase = () => {
  if (!hasSupabaseConfig()) {
    throw new Error(
      "Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY para usar autenticacion."
    );
  }

  return createSupabaseClient();
};

const mapAuthError = (error) => {
  if (!error) return "No se pudo completar la autenticacion.";

  const normalized = String(error.message || "").toLowerCase();
  if (
    normalized.includes("invalid login credentials") ||
    normalized.includes("invalid_credentials")
  ) {
    return "No pudimos validar tus credenciales.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesion.";
  }

  return error.message || "No se pudo completar la autenticacion.";
};

export const useAuthFlow = () => {
  const supabase = assertSupabase();

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || null,
        },
      },
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  };

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(mapAuthError(error));
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(mapAuthError(error));
  };

  const getSession = async () => {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw new Error(mapAuthError(error));
    return session;
  };

  const getCurrentUser = async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) throw new Error(mapAuthError(error));
    return user;
  };

  const getProfile = async (userId) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name")
      .eq("id", userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  };

  const bootstrapTenant = async ({
    tenantName,
    taxId,
    industryTypeId,
    planId,
    billingDay,
  }) => {
    const { data, error } = await supabase.rpc("fn_bootstrap_tenant", {
      p_tenant_name: tenantName,
      p_tax_id: taxId,
      p_industry_type_id: industryTypeId,
      p_plan_id: planId,
      p_billing_day: billingDay,
    });

    if (error) {
      throw new Error(error.message || "No se pudo completar el onboarding.");
    }

    return data;
  };

  const validateRuc = async (ruc) => {
    const cleanRuc = String(ruc || "").trim();
    return requestJson(`/api/onboarding/validate-ruc/${encodeURIComponent(cleanRuc)}`);
  };

  return {
    supabase,
    signUp,
    signIn,
    signOut,
    getSession,
    getCurrentUser,
    getProfile,
    bootstrapTenant,
    validateRuc,
  };
};
