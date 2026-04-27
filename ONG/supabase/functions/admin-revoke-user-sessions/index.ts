import {
  ensureAnyPermission,
  requireRequestContext,
  sanitizeOptionalId,
  sanitizeText,
} from "../_shared/supabase.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from "../_shared/http.ts";

interface RevokeUserSessionsRequest {
  userId: string;
  reason: string;
  sessionIds?: string[] | null;
  targetAccessToken?: string | null;
}

interface SessionRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  revoked_at: string | null;
}

function normalizeSessionIds(values: string[] | null | undefined): string[] {
  const unique = new Set<string>();

  for (const value of values ?? []) {
    const cleaned = sanitizeOptionalId(value);
    if (cleaned) {
      unique.add(cleaned);
    }
  }

  return Array.from(unique);
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Metodo no permitido.");
    }

    const context = await requireRequestContext(request);
    await ensureAnyPermission(context.authedClient, ["settings.sessions.terminate"]);

    const body = await parseJsonBody<RevokeUserSessionsRequest>(request);
    const userId = sanitizeOptionalId(body.userId);
    const reason = sanitizeText(body.reason, 240);
    const requestedSessionIds = normalizeSessionIds(body.sessionIds);
    const targetAccessToken = sanitizeText(body.targetAccessToken ?? null, 4096);

    if (!userId) {
      throw new HttpError(400, "Debes indicar el userId a revocar.");
    }
    if (!reason) {
      throw new HttpError(400, "Debes indicar un motivo de revocacion.");
    }

    let query = context.adminClient
      .schema("public")
      .from("sessions")
      .select("id, tenant_id, user_id, revoked_at")
      .eq("tenant_id", context.tenantId)
      .eq("user_id", userId)
      .is("revoked_at", null);

    if (requestedSessionIds.length > 0) {
      query = query.in("id", requestedSessionIds);
    }

    const { data, error } = await query;
    if (error) {
      throw new HttpError(500, "No se pudieron cargar las sesiones del usuario.", error);
    }

    const sessions = (data ?? []) as SessionRow[];
    if (!sessions.length) {
      throw new HttpError(404, "No hay sesiones activas para el usuario dentro del tenant actual.");
    }

    const revokedSessionIds: string[] = [];
    for (const session of sessions) {
      const { data: revoked, error: revokeError } = await context.authedClient
        .schema("public")
        .rpc("fn_remote_revoke_app_session", {
          p_session_id: session.id,
          p_reason: reason,
        });

      if (revokeError) {
        throw new HttpError(
          500,
          `No se pudo revocar la sesion ${session.id}.`,
          revokeError
        );
      }

      const revokedId =
        revoked && typeof revoked === "object" && "id" in revoked
          ? String((revoked as { id: unknown }).id)
          : session.id;
      revokedSessionIds.push(revokedId);
    }

    let authRevocationApplied = false;
    let authRevocationWarning: string | null = null;

    if (targetAccessToken) {
      const { error: authError } = await context.adminClient.auth.admin.signOut(
        targetAccessToken,
        "global"
      );

      if (authError) {
        throw new HttpError(
          500,
          "Las filas de public.sessions se revocaron, pero no se pudo invalidar Supabase Auth.",
          authError
        );
      }

      authRevocationApplied = true;
    } else {
      authRevocationWarning =
        "No se revocaron refresh tokens de Supabase Auth porque la API admin disponible en @supabase/auth-js 2.97.0 requiere un JWT valido del usuario objetivo (auth.admin.signOut(jwt)) y el repositorio no persiste ese JWT por sesion en public.sessions.";
    }

    return jsonResponse({
      userId,
      revokedSessionIds,
      revokedCount: revokedSessionIds.length,
      authRevocationApplied,
      authRevocationWarning,
    });
  } catch (error) {
    return errorResponse(error, "No se pudieron revocar las sesiones del usuario.");
  }
});
