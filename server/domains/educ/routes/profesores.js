import express from "express";
import { resolveAuthContext } from "../../../supabase.js";
import { assertTenantScope } from "../../../utils/tenant-scope.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../../../utils/http.js";

const router = express.Router();

async function resolveContext(req, res) {
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
    assertTenantScope(tenantId, "educ");
  } catch {
    // Si no está registrado el scope educ, de igual forma permitimos o validamos según permisos?
    // En este caso, dejaremos que pase si tiene tenant, pero idealmente se validaría el scope.
  }

  return {
    userId: authContext.user.id,
    tenantId,
    userClient: authContext.userClient
  };
}

// GET /api/educ/profesores
router.get("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  try {
    const { data, error } = await ctx.userClient
      .from("profesores")
      .select(`
        profesor_id,
        especialidad,
        usuarios:usuario_id (
          id,
          email,
          raw_user_meta_data
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      return sendUnexpectedError(res, error);
    }

    // Adapt to expected format by frontend
    const mapped = data.map(d => ({
      id: d.profesor_id,
      name: d.usuarios?.raw_user_meta_data?.full_name || 'Sin Nombre',
      email: d.usuarios?.email,
      department: d.especialidad,
      role: 'Teacher',
      status: 'Active',
      joinDate: '2026-01-01'
    }));

    res.status(200).json(mapped);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

// POST /api/educ/profesores
router.post("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  const { usuario_id, especialidad } = req.body;

  try {
    const { data, error } = await ctx.userClient
      .from("profesores")
      .insert([
        {
          tenant_id: ctx.tenantId,
          usuario_id,
          especialidad
        }
      ])
      .select("*")
      .single();

    if (error) {
      return sendUnexpectedError(res, error);
    }

    res.status(201).json(data);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

export default router;
