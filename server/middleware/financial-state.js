import { resolveAuthContext, serviceClient } from "../supabase.js";
import { getBearerToken, sendError } from "../utils/http.js";
import { assertTenantScope } from "../utils/tenant-scope.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function resolveTenantFinancialStatus(tenantId) {
  const { data, error } = await serviceClient
    .from("tenants")
    .select("status_financial_id")
    .eq("id", tenantId)
    .single();

  if (error || !data) return null;
  return String(data.status_financial_id || "").toUpperCase();
}

export function requireFinancialWriteAccess() {
  return async (req, res, next) => {
    if (!WRITE_METHODS.has(req.method)) return next();

    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return sendError(res, 401, "IAM-004", { error_type: "auth" });
    }

    const authContext = await resolveAuthContext(accessToken);
    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", { error_type: "auth" });
    }

    const tenantId = authContext.profile?.tenant_id;
    if (!tenantId) return next();

    try {
      assertTenantScope(tenantId, "financial-state.requireFinancialWriteAccess");
    } catch {
      return sendError(res, 409, "TEN-003", { error_type: "tenant" });
    }

    const status = await resolveTenantFinancialStatus(tenantId);

    if (status === "FIN-SUSPENDED") {
      return res.status(403).json({
        error_code: "FIN-001",
        error_type: "financial",
        message:
          "El tenant está suspendido financieramente. No se permiten operaciones de escritura.",
        severity: "high",
        retry_allowed: false,
      });
    }

    if (status === "FIN-READONLY" || status === "FIN-INCONSISTENT" || status === "FIN-PENDING") {
      return res.status(403).json({
        error_code: "FIN-002",
        error_type: "financial",
        message:
          "El tenant está en modo de solo lectura por estado financiero. No se permiten escrituras en este momento.",
        severity: "medium",
        retry_allowed: true,
      });
    }

    next();
  };
}
