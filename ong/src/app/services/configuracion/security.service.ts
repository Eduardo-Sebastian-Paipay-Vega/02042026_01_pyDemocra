import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  AuthEventRow,
  DeviceRow,
  DeviceTrustInput,
  SecuritySettingsData,
  SessionRow,
  SessionTerminationInput,
  TerminalFormInput,
  TerminalMutationInput,
  TerminalRow,
} from "../../modules/settings/types";
import {
  createTenantScopedQuery,
  getRequiredTenantId,
  normalizeText,
  publicSchema,
  resolveSettingsCapabilities,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type PublicAuthEventRow = AppDatabase["public"]["Tables"]["auth_events"]["Row"];
type PublicDeviceRow = AppDatabase["public"]["Tables"]["devices"]["Row"];
type PublicSessionRow = AppDatabase["public"]["Tables"]["sessions"]["Row"];
type PublicTerminalRow = AppDatabase["public"]["Tables"]["terminals"]["Row"];

const MAX_SECURITY_ROWS = 250;

const SECURITY_UNSUPPORTED_FLOWS = [
  "Parte 4 ya publica `settings.sessions.read` y `settings.sessions.terminate`; `public.devices` y `public.terminals` siguen admitiendo compatibilidad con permisos legacy `devices.*` / `terminals.*` mientras no exista un permiso nuevo dedicado.",
  "El cierre remoto por sesion usa `public.fn_remote_revoke_app_session`; la invalidacion global de refresh tokens en Supabase Auth sigue limitada porque la API admin disponible en `@supabase/auth-js` 2.97.0 requiere un JWT valido del usuario objetivo (`auth.admin.signOut(jwt)`).",
];

function getSessionStatus(
  row: Pick<PublicSessionRow, "expires_at" | "revoked_at">
): SessionRow["statusKind"] {
  if (row.revoked_at) {
    return "revoked";
  }
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return "expired";
  }
  return "active";
}

function getSessionStatusLabel(status: SessionRow["statusKind"]): string {
  if (status === "active") {
    return "Activa";
  }
  if (status === "expired") {
    return "Expirada";
  }
  return "Revocada";
}

function buildDeviceLabel(
  row: Pick<PublicDeviceRow, "id" | "device_fingerprint" | "is_trusted">
): string {
  const fingerprint = sanitizeText(row.device_fingerprint, 48) || row.id;
  return row.is_trusted ? `${fingerprint} · confiable` : fingerprint;
}

function buildSecuritySearchValue(values: Array<string | null | undefined>): string {
  return normalizeText(values.filter(Boolean).join(" "));
}

function sanitizeTerminalInput(input: TerminalFormInput | TerminalMutationInput): {
  terminalId: string | null;
  name: string;
} {
  const terminalId =
    "terminalId" in input ? sanitizeOptionalId(input.terminalId ?? null) : null;
  const name = sanitizeText(input.name, 120);

  if (!name) {
    throw new Error("El nombre del terminal es obligatorio.");
  }

  return {
    terminalId,
    name,
  };
}

export async function getSecuritySettingsData(): Promise<SecuritySettingsData> {
  const access = await resolveSettingsCapabilities();
  const warnings = access.warnings.slice();

  try {
    const tenantId = await getRequiredTenantId();

    const [sessionsResult, devicesResult, terminalsResult, authEventsResult] =
      await Promise.all([
        access.canReadSessions
          ? createTenantScopedQuery(
              publicSchema()
                .from("sessions")
                .select("id, tenant_id, user_id, terminal_id, device_id, session_type, ip, user_agent, created_at, expires_at, revoked_at, revoke_reason")
                .order("created_at", { ascending: false })
                .limit(MAX_SECURITY_ROWS),
              tenantId
            )
          : Promise.resolve({ data: [], error: null }),
        access.canReadDevices
          ? createTenantScopedQuery(
              publicSchema()
                .from("devices")
                .select("id, tenant_id, user_id, device_fingerprint, is_trusted, last_ip, last_user_agent, last_seen_at, created_at")
                .order("last_seen_at", { ascending: false })
                .limit(MAX_SECURITY_ROWS),
              tenantId
            )
          : Promise.resolve({ data: [], error: null }),
        access.canReadTerminals
          ? createTenantScopedQuery(
              publicSchema()
                .from("terminals")
                .select("id, tenant_id, name, created_at")
                .order("name", { ascending: true })
                .limit(MAX_SECURITY_ROWS),
              tenantId
            )
          : Promise.resolve({ data: [], error: null }),
        access.canReadAuthEvents
          ? createTenantScopedQuery(
              publicSchema()
                .from("auth_events")
                .select("id, tenant_id, user_id, session_id, terminal_id, device_id, event_type, result, ip, user_agent, error_code, created_at")
                .order("created_at", { ascending: false })
                .limit(MAX_SECURITY_ROWS),
              tenantId
            )
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (sessionsResult.error) {
      throw new Error(sessionsResult.error.message);
    }
    if (devicesResult.error) {
      throw new Error(devicesResult.error.message);
    }
    if (terminalsResult.error) {
      throw new Error(terminalsResult.error.message);
    }
    if (authEventsResult.error) {
      throw new Error(authEventsResult.error.message);
    }

    const sessions = (sessionsResult.data ?? []) as PublicSessionRow[];
    const devices = (devicesResult.data ?? []) as PublicDeviceRow[];
    const terminals = (terminalsResult.data ?? []) as PublicTerminalRow[];
    const authEvents = (authEventsResult.data ?? []) as PublicAuthEventRow[];

    const userLabels = await resolveProfileLabels(
      uniqueNonEmpty([
        ...sessions.map((row) => row.user_id),
        ...devices.map((row) => row.user_id),
        ...authEvents.map((row) => row.user_id),
      ]),
      tenantId
    ).catch(() => new Map<string, string>());

    const terminalNameById = new Map(
      terminals.map((row): [string, string] => [row.id, row.name])
    );
    const deviceLabelById = new Map(
      devices.map((row): [string, string] => [row.id, buildDeviceLabel(row)])
    );

    const activeSessionCountByDeviceId = new Map<string, number>();
    const sessionCountByTerminalId = new Map<string, number>();
    const activeSessionCountByTerminalId = new Map<string, number>();

    for (const row of sessions) {
      const status = getSessionStatus(row);

      if (row.device_id && status === "active") {
        activeSessionCountByDeviceId.set(
          row.device_id,
          (activeSessionCountByDeviceId.get(row.device_id) ?? 0) + 1
        );
      }

      if (row.terminal_id) {
        sessionCountByTerminalId.set(
          row.terminal_id,
          (sessionCountByTerminalId.get(row.terminal_id) ?? 0) + 1
        );
        if (status === "active") {
          activeSessionCountByTerminalId.set(
            row.terminal_id,
            (activeSessionCountByTerminalId.get(row.terminal_id) ?? 0) + 1
          );
        }
      }
    }

      // @ts-ignore
      // @ts-ignore
    const sessionRows: SessionRow[] = sessions.map((row) => {
      const statusKind = getSessionStatus(row);
      const terminalName = row.terminal_id
        ? terminalNameById.get(row.terminal_id) ?? row.terminal_id
        : "Sin terminal";
      const deviceLabel = row.device_id
        ? deviceLabelById.get(row.device_id) ?? row.device_id
        : "Sin dispositivo";
      return {
        id: row.id,
        userId: row.user_id,
        userLabel: row.user_id ? userLabels.get(row.user_id) ?? row.user_id : "Sesion sin usuario",
        terminalId: row.terminal_id,
        terminalName,
        deviceId: row.device_id,
        deviceLabel,
        sessionType: row.session_type,
        statusKind,
        statusLabel: getSessionStatusLabel(statusKind),
        ip: row.ip ?? "-",
        userAgent: sanitizeText(row.user_agent ?? null, 200) || "-",
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
        expiresAt: row.expires_at,
        expiresAtLabel: toDateTimeLabel(row.expires_at),
        revokedAt: row.revoked_at,
        revokedAtLabel: toDateTimeLabel(row.revoked_at),
        revokeReason: sanitizeText(row.revoke_reason ?? null, 240) || "-",
        searchValue: buildSecuritySearchValue([
          row.user_id ? userLabels.get(row.user_id) ?? row.user_id : "Sesion sin usuario",
          row.session_type,
          terminalName,
      // @ts-ignore
          deviceLabel,
      // @ts-ignore
          row.ip ?? "",
          row.user_agent ?? "",
          getSessionStatusLabel(statusKind),
        ]),
      };
      // @ts-ignore
    });

      // @ts-ignore
    const deviceRows: DeviceRow[] = devices.map((row) => ({
      id: row.id,
      userId: row.user_id,
      // @ts-ignore
      userLabel: userLabels.get(row.user_id) ?? row.user_id,
      deviceFingerprint: sanitizeText(row.device_fingerprint, 120) || row.id,
      isTrusted: row.is_trusted,
      lastIp: row.last_ip ?? "-",
      lastUserAgent: sanitizeText(row.last_user_agent ?? null, 200) || "-",
      lastSeenAt: row.last_seen_at,
      lastSeenAtLabel: toDateTimeLabel(row.last_seen_at),
      // @ts-ignore
      createdAt: row.created_at,
      createdAtLabel: toDateTimeLabel(row.created_at),
      // @ts-ignore
      activeSessionCount: activeSessionCountByDeviceId.get(row.id) ?? 0,
      searchValue: buildSecuritySearchValue([
      // @ts-ignore
        userLabels.get(row.user_id) ?? row.user_id,
        row.device_fingerprint,
      // @ts-ignore
        row.last_ip ?? "",
        row.last_user_agent ?? "",
        row.is_trusted ? "confiable" : "no confiable",
      ]),
    }));

    const terminalRows: TerminalRow[] = terminals.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      createdAtLabel: toDateTimeLabel(row.created_at),
      sessionCount: sessionCountByTerminalId.get(row.id) ?? 0,
      activeSessionCount: activeSessionCountByTerminalId.get(row.id) ?? 0,
      searchValue: buildSecuritySearchValue([
        row.name,
        String(sessionCountByTerminalId.get(row.id) ?? 0),
      ]),
      // @ts-ignore
    }));

    const sessionLabelById = new Map(
      sessionRows.map((row): [string, string] => [row.id, `${row.sessionType} · ${row.createdAtLabel}`])
    );

      // @ts-ignore
    const authEventRows: AuthEventRow[] = authEvents.map((row) => ({
      id: row.id,
      userId: row.user_id,
      userLabel: row.user_id ? userLabels.get(row.user_id) ?? row.user_id : "Evento sin usuario",
      sessionId: row.session_id,
      sessionLabel: row.session_id
        ? sessionLabelById.get(row.session_id) ?? row.session_id
        : "Sin sesion",
      terminalId: row.terminal_id,
      terminalName: row.terminal_id
        ? terminalNameById.get(row.terminal_id) ?? row.terminal_id
        : "Sin terminal",
      deviceId: row.device_id,
      deviceLabel: row.device_id
        ? deviceLabelById.get(row.device_id) ?? row.device_id
        : "Sin dispositivo",
      eventType: sanitizeText(row.event_type, 120) || "Evento",
      result: row.result,
      resultLabel: row.result === "success" ? "Correcto" : "Error",
      ip: row.ip ?? "-",
      userAgent: sanitizeText(row.user_agent ?? null, 200) || "-",
      // @ts-ignore
      errorCode: sanitizeText(row.error_code ?? null, 120) || "-",
      createdAt: row.created_at,
      createdAtLabel: toDateTimeLabel(row.created_at),
      searchValue: buildSecuritySearchValue([
        row.user_id ? userLabels.get(row.user_id) ?? row.user_id : "Evento sin usuario",
        row.event_type,
        row.result,
      // @ts-ignore
        row.ip ?? "",
        row.error_code ?? "",
      ]),
    }));

    return {
      access,
      sessions: sessionRows,
      devices: deviceRows,
      terminals: terminalRows,
      authEvents: authEventRows,
      warnings,
      unsupportedFlows: SECURITY_UNSUPPORTED_FLOWS,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar la seguridad de sesion real.")
    );
  }
}

export async function terminateSession(input: SessionTerminationInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageSessions) {
    throw new Error("No tienes permisos para cerrar sesiones.");
  }

  const sessionId = sanitizeOptionalId(input.sessionId);
  const reason = sanitizeText(input.reason, 240);

  if (!sessionId) {
    throw new Error("No se encontro la sesion a cerrar.");
  }
  if (!reason) {
    throw new Error("Debes registrar un motivo de cierre.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const currentResult = await createTenantScopedQuery(
      publicSchema()
        .from("sessions")
        .select("id, tenant_id, user_id, terminal_id, device_id, session_type, ip, user_agent, created_at, expires_at, revoked_at, revoke_reason")
        .eq("id", sessionId)
        .limit(1),
      tenantId
    );

    if (currentResult.error) {
      throw new Error(currentResult.error.message);
    }

    const currentSession = ((currentResult.data ?? []) as PublicSessionRow[])[0];
    if (!currentSession) {
      throw new Error("La sesion no existe en el tenant actual.");
    }
    if (currentSession.revoked_at) {
      throw new Error("La sesion ya fue revocada previamente.");
    }

    const { error } = await publicSchema().rpc("fn_remote_revoke_app_session", {
      p_session_id: sessionId,
      p_reason: reason,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo cerrar la sesion."));
  }
}

export async function setDeviceTrust(input: DeviceTrustInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageDevices) {
    throw new Error("No tienes permisos para gestionar dispositivos.");
  }

  const deviceId = sanitizeOptionalId(input.deviceId);
  if (!deviceId) {
    throw new Error("No se encontro el dispositivo a actualizar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const { error } = await publicSchema()
      .from("devices")
      .update({ is_trusted: Boolean(input.isTrusted) })
      .eq("tenant_id", tenantId)
      .eq("id", deviceId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el dispositivo."));
  }
}

export async function createTerminal(input: TerminalFormInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageTerminals) {
    throw new Error("No tienes permisos para crear terminales.");
  }

  const sanitized = sanitizeTerminalInput(input);

  try {
    const tenantId = await getRequiredTenantId();
    const { error } = await publicSchema().from("terminals").insert({
      tenant_id: tenantId,
      name: sanitized.name,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear el terminal."));
  }
}

export async function updateTerminal(input: TerminalMutationInput): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageTerminals) {
    throw new Error("No tienes permisos para editar terminales.");
  }

  const sanitized = sanitizeTerminalInput(input);
  if (!sanitized.terminalId) {
    throw new Error("No se encontro el terminal a editar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const { error } = await publicSchema()
      .from("terminals")
      .update({ name: sanitized.name })
      .eq("tenant_id", tenantId)
      .eq("id", sanitized.terminalId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el terminal."));
  }
}

export async function deleteTerminal(terminalId: string): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageTerminals) {
    throw new Error("No tienes permisos para eliminar terminales.");
  }

  const sanitizedTerminalId = sanitizeOptionalId(terminalId);
  if (!sanitizedTerminalId) {
    throw new Error("No se encontro el terminal a eliminar.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const { error } = await publicSchema()
      .from("terminals")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", sanitizedTerminalId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo eliminar el terminal."));
  }
}
