import { serviceClient } from "../../../supabase.js";

async function resolveTenantFinancialStatus(tenantId) {
  const { data, error } = await serviceClient
    .from("tenants")
    .select("status_financial_id")
    .eq("id", tenantId)
    .single();

  if (error || !data) return null;
  return String(data.status_financial_id || "").toUpperCase();
}

/**
 * Guard financiero para operaciones de escritura.
 * Verifica si el tenant tiene deudas o esta suspendido.
 */
export async function financialWriteGuard(req, res, tenantId, authContext) {
  const status = await resolveTenantFinancialStatus(tenantId);

  if (status === "FIN-SUSPENDED") {
    res.status(403).json({
      error_code: "FIN-001",
      error_type: "financial",
      message:
        "El tenant está suspendido financieramente. No se permiten operaciones de escritura.",
      severity: "high",
      retry_allowed: false,
    });
    return true; // Bloqueado
  }

  if (status === "FIN-READONLY" || status === "FIN-INCONSISTENT" || status === "FIN-PENDING") {
    res.status(403).json({
      error_code: "FIN-002",
      error_type: "financial",
      message:
        "El tenant está en modo de solo lectura por estado financiero. No se permiten escrituras en este momento.",
      severity: "medium",
      retry_allowed: true,
    });
    return true; // Bloqueado
  }

  return false; // No bloqueado, continua
}
