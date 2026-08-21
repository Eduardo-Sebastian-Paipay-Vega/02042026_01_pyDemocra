import express from "express";
import { resolveAuthContext, serviceClient } from "../supabase.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";
import { requireTenantWriteAccess } from "../security/tenant-guards.js";

const router = express.Router();

router.use(requireTenantWriteAccess());

// Antes de este router no existia NINGUN camino (ni Express ni Supabase
// directo desde el frontend) para crear/editar/desactivar sedes de un tenant
// ya existente — solo se creaba una sede "Principal" como efecto colateral
// de fn_bootstrap_tenant. Ver reporte de cobertura funcional.
async function resolveSedesContext(req, res) {
  const accessToken = getBearerToken(req);
  if (!accessToken) {
    sendError(res, 401, "IAM-004", { error_type: "auth" });
    return null;
  }

  const authContext = await resolveAuthContext(accessToken);
  if (authContext.error || !authContext.user) {
    sendError(res, 401, "IAM-004", { error_type: "auth" });
    return null;
  }

  const tenantId = authContext.profile?.tenant_id;
  if (!tenantId) {
    sendError(res, 409, "TEN-003", { error_type: "tenant" });
    return null;
  }

  try {
    assertTenantScope(tenantId, "sedes");
  } catch {
    sendError(res, 409, "TEN-003", { error_type: "tenant" });
    return null;
  }

  const { data: isTenantAdmin } = await authContext.userClient.rpc("fn_is_tenant_admin");

  return {
    userId: authContext.user.id,
    tenantId,
    isTenantAdmin: Boolean(isTenantAdmin),
  };
}

router.get("/", async (req, res) => {
  try {
    const ctx = await resolveSedesContext(req, res);
    if (!ctx) return;

    const { data, error } = await applyTenantScope(
      serviceClient.from("sedes").select("id, name, is_active, created_at, updated_at"),
      ctx.tenantId,
      "tenant_id",
      "sedes.list"
    ).order("name", { ascending: true });

    if (error) return sendUnexpectedError(res, error, "TEN-001");
    return res.status(200).json({ sedes: data ?? [] });
  } catch (error) {
    return sendUnexpectedError(res, error, "TEN-001");
  }
});

router.post("/", async (req, res) => {
  try {
    const ctx = await resolveSedesContext(req, res);
    if (!ctx) return;

    if (!ctx.isTenantAdmin) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const name = String(req.body?.name || "").trim();
    if (!name) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "name es requerido.",
      });
    }

    const { data, error } = await serviceClient
      .from("sedes")
      .insert({
        tenant_id: assertTenantScope(ctx.tenantId, "sedes.create"),
        name,
        is_active: true,
      })
      .select("id, name, is_active, created_at, updated_at")
      .single();

    if (error) return sendUnexpectedError(res, error, "TEN-001");
    return res.status(201).json({ sede: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "TEN-001");
  }
});

router.put("/:sedeId", async (req, res) => {
  try {
    const ctx = await resolveSedesContext(req, res);
    if (!ctx) return;

    if (!ctx.isTenantAdmin) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const patch = {};
    if (typeof req.body?.name === "string") {
      const name = req.body.name.trim();
      if (!name) {
        return sendError(res, 400, "TEN-001", {
          error_type: "validation",
          message: "name no puede quedar vacio.",
        });
      }
      patch.name = name;
    }
    if (typeof req.body?.is_active === "boolean") {
      patch.is_active = req.body.is_active;
    }

    if (Object.keys(patch).length === 0) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "No hay campos para actualizar.",
      });
    }

    const { data, error } = await applyTenantScope(
      serviceClient.from("sedes").update(patch).eq("id", req.params.sedeId),
      ctx.tenantId,
      "tenant_id",
      "sedes.update"
    )
      .select("id, name, is_active, created_at, updated_at")
      .single();

    if (error) return sendUnexpectedError(res, error, "TEN-001");
    if (!data) return sendError(res, 404, "TEN-001", { error_type: "validation" });
    return res.status(200).json({ sede: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "TEN-001");
  }
});

// DELETE es un soft-delete (is_active = false), no un DELETE fisico: varias
// tablas referencian sedes con ON DELETE CASCADE (user_roles_sedes, etc.) —
// un hard delete expuesto por API borraria en cascada asignaciones de IAM
// sin ninguna confirmacion intermedia. Consistente con el patron is_active
// ya usado en el resto del esquema (roles, cat_*, etc.).
router.delete("/:sedeId", async (req, res) => {
  try {
    const ctx = await resolveSedesContext(req, res);
    if (!ctx) return;

    if (!ctx.isTenantAdmin) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { data, error } = await applyTenantScope(
      serviceClient.from("sedes").update({ is_active: false }).eq("id", req.params.sedeId),
      ctx.tenantId,
      "tenant_id",
      "sedes.deactivate"
    )
      .select("id")
      .single();

    if (error) return sendUnexpectedError(res, error, "TEN-001");
    if (!data) return sendError(res, 404, "TEN-001", { error_type: "validation" });
    return res.status(204).send();
  } catch (error) {
    return sendUnexpectedError(res, error, "TEN-001");
  }
});

export default router;
