import express from "express";
import { resolveAuthContext, serviceClient } from "../supabase.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";
import { requireTenantWriteAccess } from "../security/tenant-guards.js";

const router = express.Router();

router.use(requireTenantWriteAccess());

async function resolveIamContext(req, res) {
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
    assertTenantScope(tenantId, "iam");
  } catch {
    sendError(res, 409, "TEN-003", { error_type: "tenant" });
    return null;
  }

  const { data: isTenantAdmin } = await authContext.userClient.rpc("fn_is_tenant_admin");
  const { data: canReadRoles } = await authContext.userClient.rpc("fn_has_permission", {
    p_permission: "settings.roles.read",
  });
  const { data: canManageRoles } = await authContext.userClient.rpc("fn_has_permission", {
    p_permission: "settings.roles.manage",
  });
  const { data: canManageUsers } = await authContext.userClient.rpc("fn_has_permission", {
    p_permission: "settings.users.manage",
  });

  return {
    userId: authContext.user.id,
    tenantId,
    isTenantAdmin: Boolean(isTenantAdmin),
    canReadRoles: Boolean(isTenantAdmin || canReadRoles || canManageRoles),
    canManageRoles: Boolean(isTenantAdmin || canManageRoles),
    canManageUsers: Boolean(isTenantAdmin || canManageUsers),
  };
}

// ─── Roles ───────────────────────────────────────────────────────────────────

router.get("/roles", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canReadRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { data, error } = await applyTenantScope(
      serviceClient.from("roles").select("id, name, hierarchy_level, is_system_role, created_at, updated_at"),
      ctx.tenantId,
      "tenant_id",
      "iam.roles.list"
    ).order("hierarchy_level", { ascending: true });

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(200).json({ roles: data ?? [] });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.post("/roles", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { name, hierarchy_level } = req.body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "IAM-001", { error_type: "validation" });
    }

    const { data, error } = await serviceClient
      .from("roles")
      .insert({
        tenant_id: ctx.tenantId,
        name: name.trim().slice(0, 120),
        hierarchy_level: Number.isInteger(hierarchy_level) ? hierarchy_level : 100,
        is_system_role: false,
        created_by: ctx.userId,
        updated_by: ctx.userId,
      })
      .select("id, name, hierarchy_level")
      .single();

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(201).json({ role: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.put("/roles/:roleId", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { roleId } = req.params;
    const { name, hierarchy_level } = req.body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return sendError(res, 400, "IAM-001", { error_type: "validation" });
    }

    const { data, error } = await applyTenantScope(
      serviceClient
        .from("roles")
        .update({
          name: name.trim().slice(0, 120),
          hierarchy_level: Number.isInteger(hierarchy_level) ? hierarchy_level : undefined,
          updated_by: ctx.userId,
        })
        .eq("id", roleId)
        .eq("is_system_role", false),
      ctx.tenantId,
      "tenant_id",
      "iam.roles.update"
    ).select("id, name, hierarchy_level").single();

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    if (!data) return sendError(res, 404, "IAM-001", { error_type: "not_found" });
    return res.status(200).json({ role: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.delete("/roles/:roleId", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { roleId } = req.params;

    const { error } = await applyTenantScope(
      serviceClient
        .from("roles")
        .delete()
        .eq("id", roleId)
        .eq("is_system_role", false),
      ctx.tenantId,
      "tenant_id",
      "iam.roles.delete"
    );

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(204).send();
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

// ─── Permisos de rol ─────────────────────────────────────────────────────────

router.get("/roles/:roleId/permissions", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canReadRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { roleId } = req.params;

    const { data, error } = await applyTenantScope(
      serviceClient
        .from("role_permissions")
        .select("id, role_id, permission")
        .eq("role_id", roleId),
      ctx.tenantId,
      "tenant_id",
      "iam.role-permissions.list"
    );

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(200).json({ permissions: data ?? [] });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.post("/roles/:roleId/permissions", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { roleId } = req.params;
    const { permission } = req.body ?? {};

    if (!permission || typeof permission !== "string" || !permission.trim()) {
      return sendError(res, 400, "IAM-001", { error_type: "validation" });
    }

    const { data, error } = await serviceClient
      .from("role_permissions")
      .insert({
        tenant_id: ctx.tenantId,
        role_id: roleId,
        permission: permission.trim().slice(0, 120),
      })
      .select("id, role_id, permission")
      .single();

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(201).json({ rolePermission: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.delete("/roles/:roleId/permissions/:permission", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { roleId, permission } = req.params;

    const { error } = await applyTenantScope(
      serviceClient
        .from("role_permissions")
        .delete()
        .eq("role_id", roleId)
        .eq("permission", decodeURIComponent(permission)),
      ctx.tenantId,
      "tenant_id",
      "iam.role-permissions.delete"
    );

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(204).send();
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

// ─── Asignaciones usuario-rol-sede ───────────────────────────────────────────

router.get("/user-roles", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canReadRoles && !ctx.canManageUsers) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { user_id } = req.query;

    let query = applyTenantScope(
      serviceClient
        .from("user_roles_sedes")
        .select("id, user_id, role_id, sede_id, created_at"),
      ctx.tenantId,
      "tenant_id",
      "iam.user-roles.list"
    ).order("created_at", { ascending: false });

    if (user_id && typeof user_id === "string" && user_id.trim()) {
      query = query.eq("user_id", user_id.trim());
    }

    const { data, error } = await query;
    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(200).json({ assignments: data ?? [] });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.post("/user-roles", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageUsers && !ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { user_id, role_id, sede_id } = req.body ?? {};

    if (!user_id || !role_id || !sede_id) {
      return sendError(res, 400, "IAM-001", { error_type: "validation" });
    }

    const { data, error } = await serviceClient
      .from("user_roles_sedes")
      .insert({
        tenant_id: ctx.tenantId,
        user_id,
        role_id,
        sede_id,
        created_by: ctx.userId,
      })
      .select("id, user_id, role_id, sede_id")
      .single();

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(201).json({ assignment: data });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.delete("/user-roles/:assignmentId", async (req, res) => {
  try {
    const ctx = await resolveIamContext(req, res);
    if (!ctx) return;

    if (!ctx.canManageUsers && !ctx.canManageRoles) {
      return sendError(res, 403, "IAM-003", { error_type: "auth" });
    }

    const { assignmentId } = req.params;

    const { error } = await applyTenantScope(
      serviceClient.from("user_roles_sedes").delete().eq("id", assignmentId),
      ctx.tenantId,
      "tenant_id",
      "iam.user-roles.delete"
    );

    if (error) return sendUnexpectedError(res, error, "IAM-004");
    return res.status(204).send();
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

export default router;
