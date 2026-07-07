import express from "express";
import { config } from "../config.js";
import { resolveAuthContext } from "../supabase.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";

const router = express.Router();

const normalizeApiText = (value) => {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
};

const buildRucUrl = (baseUrl, ruc, token) => {
  if (!baseUrl) return "";

  const sanitized = String(baseUrl).trim();
  const withPlaceholders = sanitized
    .replaceAll("{ruc}", encodeURIComponent(ruc))
    .replaceAll(":ruc", encodeURIComponent(ruc))
    .replaceAll("{token}", encodeURIComponent(token || ""))
    .replaceAll(":token", encodeURIComponent(token || ""));

  if (withPlaceholders !== sanitized) return withPlaceholders;
  return `${sanitized.replace(/\/$/, "")}/${encodeURIComponent(ruc)}`;
};

const pickRecord = (payload) => {
  if (!payload) return null;

  if (Array.isArray(payload)) {
    return payload[0] || null;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data[0] || null;
  }

  if (payload?.data && typeof payload.data === "object") {
    return payload.data;
  }

  if (payload?.result && typeof payload.result === "object") {
    return payload.result;
  }

  if (payload?.resultado && typeof payload.resultado === "object") {
    return payload.resultado;
  }

  if (typeof payload === "object") {
    return payload;
  }

  return null;
};

const normalizeRucPayload = (payload, expectedRuc) => {
  const record = pickRecord(payload);
  if (!record) return null;

  const taxId = String(
    record.tax_id ||
      record.ruc ||
      record.id ||
      record.numeroDocumento ||
      record.numero_documento ||
      expectedRuc ||
      ""
  ).trim();

  const tenantName = String(
    record.tenant_name ||
      record.razonSocial ||
      record.razon_social ||
      record.razonSocialComercial ||
      record.nombre ||
      record.nombre_o_razon_social ||
      ""
  ).trim();

  const estado = normalizeApiText(record.estado || record.status || record.estadoContribuyente);
  const condicion = normalizeApiText(record.condicion || record.condition || record.condicionDomicilio);

  if (!taxId || !tenantName) {
    return null;
  }

  return {
    tax_id: taxId,
    tenant_name: tenantName,
    estado,
    condicion,
  };
};

router.get("/validate-ruc/:ruc", async (req, res) => {
  try {
    const ruc = String(req.params?.ruc || "").trim();

    if (!/^\d{11}$/.test(ruc)) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "RUC no valido.",
      });
    }

    if (!config.rucApiUrl || !config.rucApiToken) {
      return sendError(res, 503, "TEN-001", {
        error_type: "configuration",
        message: "Servicio de validacion fiscal no configurado.",
        retry_allowed: false,
      });
    }

    const endpoint = buildRucUrl(config.rucApiUrl, ruc, config.rucApiToken);
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.rucApiToken}`,
        "x-api-key": config.rucApiToken,
        "x-api-token": config.rucApiToken,
      },
    });

    const rawPayload = await response.text();
    let payload = null;
    try {
      payload = rawPayload ? JSON.parse(rawPayload) : null;
    } catch {
      payload = null;
    }

    if (response.status === 404) {
      return sendError(res, 404, "TEN-001", {
        error_type: "validation",
        message: "RUC no existe.",
      });
    }

    if (!response.ok) {
      return sendError(res, 502, "TEN-001", {
        error_type: "external_service",
        message:
          String(payload?.mensaje || payload?.message || "").trim() ||
          "No se pudo validar el RUC con SUNAT.",
      });
    }

    const normalized = normalizeRucPayload(payload, ruc);

    if (!normalized && payload?.estado === false) {
      const message = String(payload?.mensaje || payload?.message || "").trim();
      const notFound =
        message.toLowerCase().includes("no encontrado") ||
        message.toLowerCase().includes("no existe");
      return sendError(res, notFound ? 404 : 422, "TEN-001", {
        error_type: "validation",
        message: notFound ? "RUC no existe." : message || "RUC no valido.",
      });
    }

    if (!normalized) {
      return sendError(res, 404, "TEN-001", {
        error_type: "validation",
        message: "RUC no existe.",
      });
    }

    if (normalized.estado !== "ACTIVO") {
      return sendError(res, 403, "TEN-002", {
        error_type: "validation",
        message: "Empresa inactiva.",
        retry_allowed: false,
      });
    }

    if (normalized.condicion !== "HABIDO") {
      return sendError(res, 403, "TEN-002", {
        error_type: "validation",
        message: "Empresa no habida.",
        retry_allowed: false,
      });
    }

    return res.status(200).json({
      tax_id: normalized.tax_id,
      tenant_name: normalized.tenant_name,
    });
  } catch (error) {
    console.error("[onboarding.validate-ruc] error", {
      message: error?.message,
    });
    return sendError(res, 502, "TEN-001", {
      error_type: "external_service",
      message: "Error al conectar con el servicio de validacion RUC.",
    });
  }
});

// POST /api/onboarding/bootstrap-tenant
// Envuelve public.fn_bootstrap_tenant (ver
// supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql):
// crea tenant + profile + sede "Principal" + rol Owner + asignacion, de forma
// idempotente (si el usuario ya tiene tenant, devuelve el existente). Antes
// de este endpoint no habia NINGUN camino (ni Express ni llamada directa a
// Supabase desde el frontend) para que una organizacion nueva se diera de
// alta — ver reporte de cobertura funcional.
router.post("/bootstrap-tenant", async (req, res) => {
  try {
    const accessToken = getBearerToken(req);
    if (!accessToken) {
      return sendError(res, 401, "IAM-004", { error_type: "auth" });
    }

    const authContext = await resolveAuthContext(accessToken);
    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", { error_type: "auth" });
    }

    const body = req.body || {};
    const tenantName = String(body.tenant_name || "").trim();
    const taxId = String(body.tax_id || "").trim();
    const industryTypeId = String(body.industry_type_id || "").trim();
    const planId = body.plan_id ? String(body.plan_id).trim() : undefined;
    const billingDay = Number.isInteger(body.billing_day) ? body.billing_day : undefined;

    if (!tenantName) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "tenant_name es requerido.",
      });
    }
    if (!/^\d{11}$/.test(taxId)) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "tax_id debe ser un RUC de 11 digitos.",
      });
    }
    if (!industryTypeId) {
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: "industry_type_id es requerido.",
      });
    }

    const { data: tenantId, error } = await authContext.userClient.rpc("fn_bootstrap_tenant", {
      p_tenant_name: tenantName,
      p_tax_id: taxId,
      p_industry_type_id: industryTypeId,
      ...(planId ? { p_plan_id: planId } : {}),
      ...(billingDay ? { p_billing_day: billingDay } : {}),
    });

    if (error) {
      // fn_bootstrap_tenant lanza RAISE EXCEPTION con mensajes de validacion
      // propios (RUC invalido, billing_day fuera de rango, no autenticado) —
      // se devuelven tal cual en vez de un 500 generico, son accionables por
      // el cliente.
      return sendError(res, 400, "TEN-001", {
        error_type: "validation",
        message: error.message,
      });
    }

    return res.status(201).json({ tenant_id: tenantId });
  } catch (error) {
    return sendUnexpectedError(res, error, "TEN-001");
  }
});

export default router;
