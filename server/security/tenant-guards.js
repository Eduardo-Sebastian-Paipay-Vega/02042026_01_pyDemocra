// Motor de Guards dinámicos para operaciones de escritura del Tenant (Fase 2)
import { resolveAuthContext } from "../supabase.js";
import { getBearerToken, sendError } from "../utils/http.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const writeGuards = [];

/**
 * Registra un middleware/guard que verificará el acceso de escritura de un tenant
 * @param {Function} guardFn - Función async (req, res, tenantId, authContext) que devuelve true si bloqueó el request.
 */
export function registerTenantWriteGuard(guardFn) {
  writeGuards.push(guardFn);
}

export function requireTenantWriteAccess() {
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

    // Ejecutar Guards inyectados dinámicamente
    for (const guard of writeGuards) {
      const blocked = await guard(req, res, tenantId, authContext);
      if (blocked) return; 
    }

    next();
  };
}
