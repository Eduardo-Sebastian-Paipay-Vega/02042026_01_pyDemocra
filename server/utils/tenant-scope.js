const UUID_V4_LIKE_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const assertTenantScope = (tenantId, context = "tenant-scope") => {
  const normalized = String(tenantId || "").trim();
  if (!UUID_V4_LIKE_RE.test(normalized)) {
    const error = new Error(`Invalid tenant scope for ${context}`);
    error.errorCode = "TEN-003";
    error.errorType = "tenant";
    throw error;
  }

  return normalized;
};

export const applyTenantScope = (
  queryBuilder,
  tenantId,
  column = "tenant_id",
  context = "tenant-scope"
) => {
  const scopedTenantId = assertTenantScope(tenantId, context);
  return queryBuilder.eq(column, scopedTenantId);
};
