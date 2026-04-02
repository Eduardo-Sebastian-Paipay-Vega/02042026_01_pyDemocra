import { summarizeForensicEvent } from "./ai-client.js";
import { serviceClient } from "../supabase.js";
import { buildRetentionUntil, maskIp } from "../utils/security.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";

const getRetentionDays = async (tenantId) => {
  const scopedTenantId = assertTenantScope(tenantId, "security.audit.retention");
  const { data, error } = await applyTenantScope(
    serviceClient.from("tenants").select("plan_id"),
    scopedTenantId,
    "id",
    "security.audit.retention.tenants"
  ).single();

  if (error || !data?.plan_id) return 180;

  const { data: policy, error: policyError } = await serviceClient
    .from("plan_policies")
    .select("retention_days")
    .eq("plan_id", data.plan_id)
    .single();

  if (policyError || !policy?.retention_days) return 180;
  return policy.retention_days;
};

export const insertAuthEvent = async ({
  tenantId,
  userId,
  sessionId,
  terminalId,
  deviceId,
  eventType,
  result,
  ip,
  userAgent,
  errorCode,
}) => {
  if (!tenantId) return null;
  const scopedTenantId = assertTenantScope(tenantId, "security.audit.insertAuthEvent");

  const payload = {
    tenant_id: scopedTenantId,
    user_id: userId || null,
    session_id: sessionId || null,
    terminal_id: terminalId || null,
    device_id: deviceId || null,
    event_type: eventType,
    result: result || "success",
    ip: ip || null,
    user_agent: userAgent || null,
    error_code: errorCode || null,
  };

  const { data, error } = await serviceClient
    .from("auth_events")
    .insert(payload)
    .select("id")
    .single();

  if (error) return null;
  return data;
};

export const insertAuditLog = async ({
  tenantId,
  actorId,
  sessionId,
  terminalId,
  deviceId,
  eventType,
  resourceName,
  result,
  errorCode,
  criticality,
  ip,
  userAgent,
  payloadBefore,
  payloadAfter,
  includeAiSummary,
}) => {
  if (!tenantId) return null;
  const scopedTenantId = assertTenantScope(tenantId, "security.audit.insertAuditLog");

  const retentionDays = await getRetentionDays(scopedTenantId);

  let enrichedPayloadAfter = payloadAfter || {};
  if (includeAiSummary) {
    const forensic = await summarizeForensicEvent({
      event: {
        tenantId: scopedTenantId,
        actorId,
        eventType,
        resourceName,
        result,
        errorCode,
        criticality,
        payloadBefore,
        payloadAfter,
      },
      constraints: {
        pii: "mask",
      },
    });

    enrichedPayloadAfter = {
      ...enrichedPayloadAfter,
      forensic_summary: forensic.summary,
      forensic_reasoning: forensic.reasoning,
      forensic_confidence: forensic.confidence,
    };
  }

  const payload = {
    tenant_id: scopedTenantId,
    actor_id: actorId || null,
    session_id: sessionId || null,
    terminal_id: terminalId || null,
    device_id: deviceId || null,
    event_type: eventType,
    resource_name: resourceName,
    result: result || "success",
    error_code: errorCode || null,
    criticality: criticality || "medium",
    ip: ip || null,
    user_agent: userAgent || null,
    payload_before: payloadBefore || null,
    payload_after: enrichedPayloadAfter,
    retention_until: buildRetentionUntil(retentionDays),
  };

  const { data, error } = await serviceClient
    .from("audit_logs")
    .insert(payload)
    .select("id, created_at")
    .single();

  if (error) {
    return null;
  }

  return data;
};

export const buildMaskedRequestContext = ({ ip, userAgent, geoCountry }) => ({
  ip_masked: maskIp(ip),
  user_agent: (userAgent || "").slice(0, 120),
  geo_country: geoCountry || null,
});
