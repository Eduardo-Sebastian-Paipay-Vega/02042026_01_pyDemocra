import express from "express";
import { resolveAuthContext } from "../supabase.js";
import { assertTenantScope } from "../utils/tenant-scope.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";

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
    assertTenantScope(tenantId, "settings");
  } catch {
    sendError(res, 409, "TEN-003", { error_type: "tenant" });
    return null;
  }

  return {
    userId: authContext.user.id,
    tenantId,
    userClient: authContext.userClient
  };
}

// GET /api/tenant/settings
router.get("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  try {
    const { data, error } = await ctx.userClient
      .from("tenant_settings")
      .select("*")
      .maybeSingle();

    if (error) {
      return sendUnexpectedError(res, error);
    }

    if (!data) {
      // Default si no hay guardados
      return res.status(200).json({
        language: 'es',
        timezone: 'America/Lima',
        date_format: 'DD/MM/AAAA',
        initial_view: 'dashboard',
        colors: {},
        logo_url: null
      });
    }

    res.status(200).json(data);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

// POST /api/tenant/settings
router.post("/", async (req, res) => {
  const ctx = await resolveContext(req, res);
  if (!ctx) return;

  // Ideally we check if user is admin here
  const { data: isTenantAdmin } = await ctx.userClient.rpc("fn_is_tenant_admin");
  if (!isTenantAdmin) {
    return sendError(res, 403, "IAM-002", { error_type: "permissions" });
  }

  const { language, timezone, date_format, initial_view, colors, logo_url } = req.body;

  try {
    const { data, error } = await ctx.userClient
      .from("tenant_settings")
      .upsert(
        { 
          tenant_id: ctx.tenantId, 
          language, 
          timezone, 
          date_format, 
          initial_view, 
          colors, 
          logo_url 
        }, 
        { onConflict: "tenant_id" }
      )
      .select("*")
      .single();

    if (error) {
      return sendUnexpectedError(res, error);
    }

    res.status(200).json(data);
  } catch (err) {
    sendUnexpectedError(res, err);
  }
});

export default router;
