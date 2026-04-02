import express from "express";
import { resolveAuthContext, serviceClient } from "../supabase.js";
import { summarizeForensicEvent } from "../security/ai-client.js";
import { insertAuditLog } from "../security/audit.js";
import { applyTenantScope, assertTenantScope } from "../utils/tenant-scope.js";
import { getClientIp, sanitizeUserAgent } from "../utils/security.js";
import { getBearerToken, sendError, sendUnexpectedError } from "../utils/http.js";

const router = express.Router();

const ensureTenantScopeOrReply = (res, tenantId, context) => {
  try {
    assertTenantScope(tenantId, context);
    return true;
  } catch {
    sendError(res, 409, "TEN-003", {
      error_type: "tenant",
    });
    return false;
  }
};

router.post("/summary", async (req, res) => {
  try {
    const token = getBearerToken(req);
    const authContext = await resolveAuthContext(token);

    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", {
        error_type: "auth",
      });
    }

    const tenantId = req.body?.tenant_id || authContext.profile?.tenant_id;
    if (!tenantId || tenantId !== authContext.profile?.tenant_id) {
      return sendError(res, 409, "TEN-003", {
        error_type: "tenant",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "audit.summary")) return;

    const eventPayload = {
      event_type: req.body?.event_type || "FORENSIC_SUMMARY",
      resource_name: req.body?.resource_name || "audit.manual_summary",
      result: req.body?.result || "success",
      error_code: req.body?.error_code || null,
      criticality: req.body?.criticality || "medium",
      payload_before: req.body?.payload_before || null,
      payload_after: req.body?.payload_after || null,
      actor_id: authContext.user.id,
      tenant_id: tenantId,
    };

    const summary = await summarizeForensicEvent({
      event: eventPayload,
      constraints: {
        avoid_sensitive_disclosure: true,
      },
    });

    const ip = getClientIp(req);
    const userAgent = sanitizeUserAgent(req.headers["user-agent"]);

    const audit = await insertAuditLog({
      tenantId,
      actorId: authContext.user.id,
      eventType: "FORENSIC_SUMMARY",
      resourceName: "audit.summary",
      result: "success",
      errorCode: null,
      criticality: req.body?.criticality || "medium",
      ip,
      userAgent,
      payloadBefore: req.body?.payload_before || null,
      payloadAfter: {
        source_event: eventPayload,
        forensic_summary: summary.summary,
        forensic_reasoning: summary.reasoning,
        forensic_confidence: summary.confidence,
      },
      includeAiSummary: false,
    });

    return res.status(200).json({
      ok: true,
      summary: summary.summary,
      reasoning: summary.reasoning,
      confidence: summary.confidence,
      audit_log_id: audit?.id || null,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const token = getBearerToken(req);
    const authContext = await resolveAuthContext(token);

    if (authContext.error || !authContext.user) {
      return sendError(res, 401, "IAM-004", {
        error_type: "auth",
      });
    }

    const tenantId = authContext.profile?.tenant_id;
    if (!tenantId) {
      return sendError(res, 409, "TEN-003", {
        error_type: "tenant",
      });
    }
    if (!ensureTenantScopeOrReply(res, tenantId, "audit.metrics")) return;

    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 7);
    const sinceIso = since.toISOString();

    const [authEventsRes, paymentRes, sessionsRes] = await Promise.all([
      applyTenantScope(
        serviceClient
          .from("auth_events")
          .select("event_type, result", { count: "exact" })
          .gte("created_at", sinceIso),
        tenantId,
        "tenant_id",
        "audit.metrics.auth_events"
      ),
      applyTenantScope(
        serviceClient
          .from("payment_transactions")
          .select("status_id", { count: "exact" })
          .gte("created_at", sinceIso),
        tenantId,
        "tenant_id",
        "audit.metrics.payment_transactions"
      ),
      applyTenantScope(
        serviceClient
          .from("sessions")
          .select("id", { count: "exact", head: true })
          .is("revoked_at", null)
          .gt("expires_at", new Date().toISOString()),
        tenantId,
        "tenant_id",
        "audit.metrics.sessions"
      ),
    ]);

    const authEvents = authEventsRes.data || [];
    const loginEvents = authEvents.filter(
      (event) => event.event_type === "LOGIN_OK" || event.event_type === "LOGIN_BLOCKED"
    );

    const loginSuccess = loginEvents.filter((event) => event.result === "success").length;
    const loginTotal = loginEvents.length || 1;

    const pinEvents = authEvents.filter(
      (event) => event.event_type === "PIN_FAIL" || event.event_type === "PIN_BLOCKED"
    );

    const overrides = authEvents.filter((event) => event.event_type?.includes("OVERRIDE"));
    const suspicious = authEvents.filter(
      (event) => event.event_type === "LOGIN_BLOCKED" || event.event_type === "PIN_BLOCKED"
    );

    const payments = paymentRes.data || [];
    const paymentFailures = payments.filter((payment) => payment.status_id === "FAILED").length;

    return res.status(200).json({
      login_success_rate: Number((loginSuccess / loginTotal).toFixed(4)),
      PIN_failure_rate: pinEvents.length,
      override_frequency: overrides.length,
      concurrent_sessions_usage: sessionsRes.count || 0,
      payment_failure_rate: Number(
        ((paymentFailures || 0) / (payments.length || 1)).toFixed(4)
      ),
      suspicious_activity_flags: suspicious.length,
      window_days: 7,
    });
  } catch (error) {
    return sendUnexpectedError(res, error, "IAM-004");
  }
});

export default router;
