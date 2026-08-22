import express from "express";
import { resolveAuthContext } from "../../../supabase.js";
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

  return {
    userId: authContext.user.id,
    tenantId,
    userClient: authContext.userClient
  };
}

// GET /api/educ/estudiantes
router.get("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  try {
    const { data, error } = await ctx.userClient
      .from("estudiantes")
      .select(`
        estudiante_id,
        matricula_codigo,
        grado_actual,
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

    const mapped = data.map(d => ({
      id: d.estudiante_id,
      name: d.usuarios?.raw_user_meta_data?.full_name || 'Sin Nombre',
      email: d.usuarios?.email,
      grade: d.grado_actual,
      attendance: 100, // mock fallback para UI
      status: 'Active'
    }));

    res.status(200).json(mapped);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

// POST /api/educ/estudiantes
router.post("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  const { usuario_id, matricula_codigo, grado_actual } = req.body;

  try {
    const { data, error } = await ctx.userClient
      .from("estudiantes")
      .insert([
        {
          tenant_id: ctx.tenantId,
          usuario_id,
          matricula_codigo,
          grado_actual
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
