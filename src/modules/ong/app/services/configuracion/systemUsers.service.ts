import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  SettingsSelectOption,
  SystemUserAssignmentInput,
  SystemUserAssignmentRow,
  SystemUserProvisionInput,
  SystemUserProvisionResult,
  SystemUserRow,
  SystemUserSessionsRevokeInput,
  SystemUserSessionsRevokeResult,
  SystemUsersData,
} from "../../modules/settings/types";
import {
  getRequiredTenantId,
  invokeSettingsFunction,
  normalizeText,
  ongSchema,
  publicSchema,
  resolveSettingsCapabilities,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type PublicProfileRow = AppDatabase["public"]["Tables"]["profiles"]["Row"];
type PublicRoleRow = AppDatabase["public"]["Tables"]["roles"]["Row"];
type PublicSessionRow = AppDatabase["public"]["Tables"]["sessions"]["Row"];
type PublicSedeRow = AppDatabase["public"]["Tables"]["sedes"]["Row"];
type PublicUserRoleSedeRow = AppDatabase["public"]["Tables"]["user_roles_sedes"]["Row"];
type OngVolunteerRow = AppDatabase["ong"]["Tables"]["voluntarios"]["Row"];

const MAX_PROFILE_ROWS = 500;
const MAX_ASSIGNMENT_ROWS = 4_000;
const MAX_SESSION_ROWS = 2_000;
const MAX_VOLUNTEER_ROWS = 1_000;

const SYSTEM_USERS_UNSUPPORTED_FLOWS = [
  "Crear `auth.users` y provisionar `public.profiles` iniciales requiere backend seguro/Edge Function/API con service-role y auditorÃ­a; el frontend solo habilita acceso institucional sobre perfiles ya existentes del tenant.",
  "public.profiles y public.user_roles_sedes no documentan soft delete; la baja operativa revoca filas de public.user_roles_sedes.",
];

const SYSTEM_USERS_SUPPORTED_FLOWS = [
  "La provision de credenciales se ejecuta via la Edge Function `admin-provision-user`; la asignacion institucional se sigue gestionando aparte sobre `public.user_roles_sedes`.",
  "La revocacion masiva de sesiones por usuario se ejecuta via la Edge Function `admin-revoke-user-sessions`, que revoca `public.sessions` con `public.fn_remote_revoke_app_session` y solo invalida refresh tokens de Supabase Auth cuando el backend dispone del JWT objetivo.",
  "public.profiles y public.user_roles_sedes no documentan soft delete; la baja operativa revoca filas de public.user_roles_sedes.",
];

const SYSTEM_USERS_FLOW_NOTES = [
  "Crear o invitar usuarios se ejecuta via la Edge Function `admin-provision-user`; requiere `settings.users.manage` o tenant admin y el frontend no crea `auth.users` directamente.",
  "La lectura del resumen de sesiones usa `settings.sessions.read`. La revocacion masiva por usuario usa la Edge Function `admin-revoke-user-sessions` y exige `settings.sessions.terminate`.",
  "La revocacion masiva de sesiones por usuario revoca `public.sessions` con `public.fn_remote_revoke_app_session` y solo invalida refresh tokens de Supabase Auth cuando el backend dispone del JWT objetivo.",
  "public.profiles y public.user_roles_sedes no documentan soft delete; la baja operativa revoca filas de public.user_roles_sedes.",
];

function buildProfileLabel(
  row: Pick<PublicProfileRow, "id" | "full_name" | "tipo_documento" | "numero_documento">
): string {
  const name = sanitizeText(row.full_name ?? null, 180) || row.id;
  const document = [row.tipo_documento ?? "", row.numero_documento ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  return document ? `${name} Â· ${document}` : name;
}

function buildAssignmentKey(roleId: string, sedeId: string): string {
  return `${roleId}::${sedeId}`;
}

function buildVolunteerLabel(
  row: Pick<
    OngVolunteerRow,
    "id" | "nombre" | "apellido" | "tipo_documento" | "numero_documento" | "email"
  >
): string {
  const name = `${row.nombre} ${row.apellido}`.trim() || row.id;
  const document = [row.tipo_documento ?? "", row.numero_documento ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  const email = sanitizeText(row.email ?? null, 180);

  return [name, document, email].filter(Boolean).join(" Â· ");
}

function buildSearchValue(row: SystemUserRow): string {
  return normalizeText(
    [
      row.fullName,
      row.documentLabel,
      row.roleSummary,
      row.sedeSummary,
      row.accessStatusLabel,
      row.lastSessionAtLabel,
    ].join(" ")
  );
}

function resolvePinStatus(row: PublicProfileRow): string {
  if (row.is_blocked) {
    return "Bloqueado";
  }
  if (row.pin_blocked_until) {
    return "PIN bloqueado temporalmente";
  }
  if (row.pin_hash) {
    return "PIN configurado";
  }
  return "Sin PIN";
}

function sanitizeAssignmentInput(input: SystemUserAssignmentInput): {
  userId: string;
  assignments: Array<{ roleId: string; sedeId: string }>;
} {
  const userId = sanitizeOptionalId(input.userId);
  if (!userId) {
    throw new Error("Debes seleccionar un perfil real.");
  }

  const assignments = input.assignments.map((row) => {
    const roleId = sanitizeOptionalId(row.roleId);
    const sedeId = sanitizeOptionalId(row.sedeId);
    if (!roleId || !sedeId) {
      throw new Error("Cada fila debe seleccionar un rol y una sede.");
    }

    return { roleId, sedeId };
  });

  if (!assignments.length) {
    throw new Error("Debes registrar al menos una asignacion institucional.");
  }

  const seen = new Set<string>();
  for (const assignment of assignments) {
    const key = buildAssignmentKey(assignment.roleId, assignment.sedeId);
    if (seen.has(key)) {
      throw new Error("No repitas el mismo rol en la misma sede.");
    }
    seen.add(key);
  }

  return {
    userId,
    assignments,
  };
}

async function validateAssignmentReferences(
  tenantId: string,
  userId: string,
  assignments: Array<{ roleId: string; sedeId: string }>
): Promise<void> {
  const roleIds = uniqueNonEmpty(assignments.map((item) => item.roleId));
  const sedeIds = uniqueNonEmpty(assignments.map((item) => item.sedeId));

  const [profileResult, roleResult, sedeResult] = await Promise.all([
    publicSchema()
      .from("profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", userId)
      .limit(1),
    publicSchema()
      .from("roles")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("id", roleIds),
    publicSchema()
      .from("sedes")
      .select("id")
      .eq("tenant_id", tenantId)
      .in("id", sedeIds),
  ]);

  if (profileResult.error) {
    throw new Error(profileResult.error.message);
  }
  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }
  if (sedeResult.error) {
    throw new Error(sedeResult.error.message);
  }

  if (!profileResult.data?.length) {
    throw new Error("El perfil seleccionado no existe dentro del tenant actual.");
  }

  const foundRoleIds = new Set((roleResult.data ?? []).map((row) => row.id));
  const foundSedeIds = new Set((sedeResult.data ?? []).map((row) => row.id));

  for (const roleId of roleIds) {
    if (!foundRoleIds.has(roleId)) {
      throw new Error("Uno de los roles seleccionados no existe en public.roles.");
    }
  }

  for (const sedeId of sedeIds) {
    if (!foundSedeIds.has(sedeId)) {
      throw new Error("Una de las sedes seleccionadas no existe en public.sedes.");
    }
  }
}

async function ensureNotEditingCurrentUser(userId: string): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (access.currentUserId && access.currentUserId === userId) {
    throw new Error(
      "No se permite modificar o revocar tus propios accesos desde esta vista. Usa otro administrador para evitar romper la sesion actual."
    );
  }
}

export async function getSystemUsersData(): Promise<SystemUsersData> {
  const access = await resolveSettingsCapabilities();
  const warnings = access.warnings.slice();

  try {
    const tenantId = await getRequiredTenantId();

    const [
      profileResult,
      roleResult,
      sedeResult,
      assignmentResult,
      sessionResult,
      volunteerResult,
    ] =
      await Promise.all([
        access.canReadUsers
          ? publicSchema()
              .from("profiles")
              .select(
                "id, tenant_id, full_name, pin_hash, is_blocked, blocked_reason, pin_failed_attempts, pin_last_failed_at, pin_blocked_until, risk_blocked_until, tipo_documento, numero_documento, genero, created_at, updated_at"
              )
              .eq("tenant_id", tenantId)
              .order("full_name", { ascending: true })
              .limit(MAX_PROFILE_ROWS)
          : Promise.resolve({ data: [], error: null }),
        access.canReadRoles
          ? publicSchema()
              .from("roles")
              .select("id, tenant_id, name, hierarchy_level, is_system_role, created_at, updated_at")
              .eq("tenant_id", tenantId)
              .order("name", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        access.canReadUsers
          ? publicSchema()
              .from("sedes")
              .select("id, tenant_id, name, is_active, created_at, updated_at")
              .eq("tenant_id", tenantId)
              .order("name", { ascending: true })
          : Promise.resolve({ data: [], error: null }),
        access.canReadUsers
          ? publicSchema()
              .from("user_roles_sedes")
              .select("tenant_id, user_id, role_id, sede_id, created_at")
              .eq("tenant_id", tenantId)
              .limit(MAX_ASSIGNMENT_ROWS)
          : Promise.resolve({ data: [], error: null }),
        access.canReadSessions
          ? publicSchema()
              .from("sessions")
              .select("id, tenant_id, user_id, terminal_id, device_id, session_type, ip, user_agent, created_at, expires_at, revoked_at, revoke_reason")
              .eq("tenant_id", tenantId)
              .order("created_at", { ascending: false })
              .limit(MAX_SESSION_ROWS)
          : Promise.resolve({ data: [], error: null }),
        access.canManageUsers
          ? ongSchema()
              .from("voluntarios")
              .select(
                "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, ruta_foto, codigo_estado, observaciones, created_at, created_by, updated_at, updated_by"
              )
              .eq("tenant_id", tenantId)
              .order("nombre", { ascending: true })
              .limit(MAX_VOLUNTEER_ROWS)
          : Promise.resolve({ data: [], error: null }),
      ]);

    if (profileResult.error) {
      throw new Error(profileResult.error.message);
    }
    if (roleResult.error) {
      throw new Error(roleResult.error.message);
    }
    if (sedeResult.error) {
      throw new Error(sedeResult.error.message);
    }
    if (assignmentResult.error) {
      throw new Error(assignmentResult.error.message);
    }
    if (sessionResult.error) {
      throw new Error(sessionResult.error.message);
    }
    if (volunteerResult.error) {
      throw new Error(volunteerResult.error.message);
    }

    const profiles = (profileResult.data ?? []) as PublicProfileRow[];
    const roles = (roleResult.data ?? []) as PublicRoleRow[];
    const sedes = (sedeResult.data ?? []) as PublicSedeRow[];
    const assignments = (assignmentResult.data ?? []) as PublicUserRoleSedeRow[];
    const sessions = (sessionResult.data ?? []) as PublicSessionRow[];
    const volunteers = (volunteerResult.data ?? []) as OngVolunteerRow[];

    if (access.canReadSessions && sessions.length >= MAX_SESSION_ROWS) {
      warnings.push(
        "La vista de usuarios resume hasta 2000 sesiones recientes del tenant; si el volumen crece, el conteo puede quedar truncado."
      );
    }

    const roleById = new Map(roles.map((row): [string, string] => [row.id, row.name]));
    const sedeById = new Map(sedes.map((row): [string, string] => [row.id, row.name]));
    const assignmentsByUserId = new Map<string, SystemUserAssignmentRow[]>();

    for (const row of assignments) {
      const current = assignmentsByUserId.get(row.user_id) ?? [];
      current.push({
        id: buildAssignmentKey(row.role_id, row.sede_id),
        roleId: row.role_id,
        roleName: roleById.get(row.role_id) ?? row.role_id,
        sedeId: row.sede_id,
        sedeName: sedeById.get(row.sede_id) ?? row.sede_id,
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
      });
      assignmentsByUserId.set(row.user_id, current);
    }

    const sessionSummaryByUserId = new Map<
      string,
      { total: number; active: number; lastAt: string | null }
    >();

    for (const row of sessions) {
      if (!row.user_id) {
        continue;
      }

      const current = sessionSummaryByUserId.get(row.user_id) ?? {
        total: 0,
        active: 0,
        lastAt: null,
      };

      current.total += 1;
      if (!row.revoked_at && new Date(row.expires_at).getTime() > Date.now()) {
        current.active += 1;
      }
      if (
        !current.lastAt ||
        new Date(row.created_at).getTime() > new Date(current.lastAt).getTime()
      ) {
        current.lastAt = row.created_at;
      }

      sessionSummaryByUserId.set(row.user_id, current);
    }

    const rows = profiles.map((row): SystemUserRow => {
      const roleAssignments = (assignmentsByUserId.get(row.id) ?? []).sort((left, right) =>
        `${left.roleName} ${left.sedeName}`.localeCompare(`${right.roleName} ${right.sedeName}`, "es")
      );
      const roleSummary = uniqueNonEmpty(roleAssignments.map((item) => item.roleName)).join(", ");
      const sedeSummary = uniqueNonEmpty(roleAssignments.map((item) => item.sedeName)).join(", ");
      const sessionSummary = sessionSummaryByUserId.get(row.id) ?? {
        total: 0,
        active: 0,
        lastAt: null,
      };
      const systemUserRow: SystemUserRow = {
        id: row.id,
        fullName: sanitizeText(row.full_name ?? null, 180) || row.id,
        documentLabel:
          [row.tipo_documento ?? "", row.numero_documento ?? ""].filter(Boolean).join(" ").trim() ||
          "Sin documento",
        tipoDocumento: row.tipo_documento ?? "-",
        numeroDocumento: row.numero_documento ?? "-",
        genero: row.genero ?? "-",
        isBlocked: row.is_blocked,
        blockedReason: sanitizeText(row.blocked_reason ?? null, 240) || "-",
        pinStatusLabel: resolvePinStatus(row),
        pinFailedAttempts: row.pin_failed_attempts,
        pinBlockedUntilLabel: toDateTimeLabel(row.pin_blocked_until),
        riskBlockedUntilLabel: toDateTimeLabel(row.risk_blocked_until),
        createdAt: row.created_at,
        createdAtLabel: toDateTimeLabel(row.created_at),
        updatedAt: row.updated_at,
        updatedAtLabel: toDateTimeLabel(row.updated_at),
        isSystemUser: roleAssignments.length > 0,
        accessStatusLabel:
          roleAssignments.length > 0 ? "Con acceso institucional" : "Sin acceso institucional",
        roleAssignments,
        roleSummary: roleSummary || "Sin roles institucionales",
        sedeSummary: sedeSummary || "Sin sedes asignadas",
        totalSessionCount: access.canReadSessions ? sessionSummary.total : null,
        activeSessionCount: access.canReadSessions ? sessionSummary.active : null,
        lastSessionAt: access.canReadSessions ? sessionSummary.lastAt : null,
        lastSessionAtLabel: access.canReadSessions
          ? sessionSummary.lastAt
            ? toDateTimeLabel(sessionSummary.lastAt)
            : "Sin sesiones"
          : "Sin permiso de sesion",
        searchValue: "",
      };

      return {
        ...systemUserRow,
        searchValue: buildSearchValue(systemUserRow),
      };
    });

    const profileOptions: SettingsSelectOption[] = profiles.map((row) => ({
      value: row.id,
      label: buildProfileLabel(row),
    }));
    const roleOptions: SettingsSelectOption[] = roles.map((row) => ({
      value: row.id,
      label: row.name,
    }));
    const sedeOptions: SettingsSelectOption[] = sedes.map((row) => ({
      value: row.id,
      label: row.is_active ? row.name : `${row.name} (inactiva)`,
    }));
    const volunteerOptions: SettingsSelectOption[] = volunteers.map((row) => ({
      value: row.id,
      label: buildVolunteerLabel(row),
    }));

    return {
      access,
      rows,
      profileOptions,
      roleOptions,
      sedeOptions,
      volunteerOptions,
      warnings,
      unsupportedFlows: SYSTEM_USERS_FLOW_NOTES,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar los usuarios del sistema reales.")
    );
  }
}

export async function upsertSystemUserAssignments(
  input: SystemUserAssignmentInput
): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageUserAssignments) {
    throw new Error("No tienes permisos para gestionar accesos institucionales.");
  }

  const sanitized = sanitizeAssignmentInput(input);

  try {
    await ensureNotEditingCurrentUser(sanitized.userId);

    const tenantId = await getRequiredTenantId();
    await validateAssignmentReferences(tenantId, sanitized.userId, sanitized.assignments);

    const existingResult = await publicSchema()
      .from("user_roles_sedes")
      .select("tenant_id, user_id, role_id, sede_id, created_at")
      .eq("tenant_id", tenantId)
      .eq("user_id", sanitized.userId)
      .limit(MAX_ASSIGNMENT_ROWS);

    if (existingResult.error) {
      throw new Error(existingResult.error.message);
    }

    const existingAssignments = (existingResult.data ?? []) as PublicUserRoleSedeRow[];
    const existingKeys = new Set(
      existingAssignments.map((row) => buildAssignmentKey(row.role_id, row.sede_id))
    );
    const targetKeys = new Set(
      sanitized.assignments.map((row) => buildAssignmentKey(row.roleId, row.sedeId))
    );

    const rowsToInsert = sanitized.assignments
      .filter((row) => !existingKeys.has(buildAssignmentKey(row.roleId, row.sedeId)))
      .map((row) => ({
        tenant_id: tenantId,
        user_id: sanitized.userId,
        role_id: row.roleId,
        sede_id: row.sedeId,
      }));

    if (rowsToInsert.length) {
      const { error } = await publicSchema().from("user_roles_sedes").insert(rowsToInsert);
      if (error) {
        throw new Error(error.message);
      }
    }

    const rowsToDelete = existingAssignments.filter(
      (row) => !targetKeys.has(buildAssignmentKey(row.role_id, row.sede_id))
    );

    for (const row of rowsToDelete) {
      const { error } = await publicSchema()
        .from("user_roles_sedes")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("user_id", row.user_id)
        .eq("role_id", row.role_id)
        .eq("sede_id", row.sede_id);

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron guardar los accesos institucionales.")
    );
  }
}

export async function revokeSystemUserAccess(userId: string): Promise<void> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageUserAssignments) {
    throw new Error("No tienes permisos para revocar accesos institucionales.");
  }

  const sanitizedUserId = sanitizeOptionalId(userId);
  if (!sanitizedUserId) {
    throw new Error("No se encontro el usuario a revocar.");
  }

  try {
    await ensureNotEditingCurrentUser(sanitizedUserId);

    const tenantId = await getRequiredTenantId();
    const { error } = await publicSchema()
      .from("user_roles_sedes")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("user_id", sanitizedUserId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron revocar los accesos institucionales.")
    );
  }
}

export async function provisionSystemUser(
  input: SystemUserProvisionInput
): Promise<SystemUserProvisionResult> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageUsers) {
    throw new Error("No tienes permisos para provisionar credenciales.");
  }

  const email = sanitizeText(input.email, 255).toLowerCase();
  const mode = input.mode === "create" ? "create" : "invite";
  const temporaryPassword = sanitizeText(input.temporaryPassword ?? null, 128) || null;

  if (!email) {
    throw new Error("El correo es obligatorio para provisionar el usuario.");
  }
  if (mode === "create" && (!temporaryPassword || temporaryPassword.length < 8)) {
    throw new Error(
      "La contrasena temporal debe tener al menos 8 caracteres en modo create."
    );
  }

  try {
    return await invokeSettingsFunction<SystemUserProvisionResult>(
      "admin-provision-user",
      {
        email,
        fullName: sanitizeText(input.fullName ?? null, 180) || null,
        tipoDocumento: sanitizeText(input.tipoDocumento ?? null, 10) || null,
        numeroDocumento: sanitizeText(input.numeroDocumento ?? null, 50) || null,
        genero: sanitizeText(input.genero ?? null, 10) || null,
        volunteerId: sanitizeOptionalId(input.volunteerId ?? null),
        mode,
        temporaryPassword,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("No se pudo provisionar la credencial del usuario.");
  }
}

export async function revokeSystemUserSessions(
  input: SystemUserSessionsRevokeInput
): Promise<SystemUserSessionsRevokeResult> {
  const access = await resolveSettingsCapabilities();
  if (!access.canManageSessions) {
    throw new Error("No tienes permisos para revocar sesiones.");
  }

  const userId = sanitizeOptionalId(input.userId);
  const reason = sanitizeText(input.reason, 240);
  if (!userId) {
    throw new Error("No se encontro el usuario para revocar sesiones.");
  }
  if (!reason) {
    throw new Error("Debes registrar un motivo de revocacion.");
  }

  try {
    return await invokeSettingsFunction<SystemUserSessionsRevokeResult>(
      "admin-revoke-user-sessions",
      {
        userId,
        reason,
        sessionIds: uniqueNonEmpty(
          (input.sessionIds ?? [])
            .map((value) => sanitizeOptionalId(value))
            .filter(Boolean)
        ),
        targetAccessToken: sanitizeText(input.targetAccessToken ?? null, 4096) || null,
      }
    );
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("No se pudieron revocar las sesiones del usuario.");
  }
}

