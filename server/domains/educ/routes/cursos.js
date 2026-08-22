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

// GET /api/educ/cursos
router.get("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  try {
    const { data, error } = await ctx.userClient
      .from("cursos")
      .select(`*`)
      .order("created_at", { ascending: false });

    if (error) {
      return sendUnexpectedError(res, error);
    }

    const mapped = data.map(d => ({
      id: d.curso_id,
      name: d.nombre,
      level: d.creditos ? `Créditos: ${d.creditos}` : 'N/A',
      students: 0,
      teacher: 'N/A',
      progress: 0,
      description: d.descripcion
    }));

    res.status(200).json(mapped);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

// POST /api/educ/cursos
router.post("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  const { nombre, descripcion, creditos } = req.body;

  try {
    const { data, error } = await ctx.userClient
      .from("cursos")
      .insert([
        {
          tenant_id: ctx.tenantId,
          nombre,
          descripcion,
          creditos
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
