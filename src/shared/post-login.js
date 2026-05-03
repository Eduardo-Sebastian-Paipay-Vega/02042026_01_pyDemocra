const INTEGRATED_APP_BASE_PATH = "/app/";

function normalizeIndustry(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

export async function resolvePostLoginDestination({ auth, user, profile }) {
  const sessionUser = user || (await auth.getCurrentUser());
  if (!sessionUser) {
    return "/login.html";
  }

  const userProfile = profile || (await auth.getProfile(sessionUser.id));
  if (!userProfile?.tenant_id) {
    return "/onboarding.html";
  }

  const { data: tenant, error: tenantError } = await auth.supabase
    .schema("public")
    .from("tenants")
    .select("id, industry_type_id")
    .eq("id", userProfile.tenant_id)
    .maybeSingle();

  if (tenantError || !tenant) {
    return "/onboarding.html";
  }

  const industryTypeId = normalizeIndustry(tenant.industry_type_id);
  if (!industryTypeId) {
    return INTEGRATED_APP_BASE_PATH;
  }

  return INTEGRATED_APP_BASE_PATH;
}

export async function redirectAfterPostLogin(input) {
  const destination = await resolvePostLoginDestination(input);
  window.location.href = destination;
}
