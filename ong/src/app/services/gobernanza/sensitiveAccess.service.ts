import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  GovernanceSensitiveAccessData,
  GovernanceSelectOption,
  RoleAccessConstraintFormInput,
  RoleAccessConstraintMutationInput,
  RoleAccessConstraintRow,
  SensitiveAccessLogFilters,
  SensitiveAccessLogRow,
} from "../../modules/governance/types";
import {
  clinicoSchema,
  createTenantScopedQuery,
  getRequiredTenantId,
  normalizeDateValue,
  normalizeText,
  normalizeTimeValue,
  ongSchema,
  publicSchema,
  resolveGovernanceCapabilities,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type SensitiveAccessDbRow = AppDatabase["clinico"]["Tables"]["accesos_sensibles_log"]["Row"];
type SensitiveVolunteerAccessDbRow =
  AppDatabase["clinico"]["Tables"]["accesos_sensibles_voluntario_log"]["Row"];
type MedicalRecordRow = AppDatabase["clinico"]["Tables"]["fichas_medicas"]["Row"];
type SensitiveVolunteerRecordRow =
  AppDatabase["clinico"]["Tables"]["ficha_sensible_voluntario"]["Row"];
type BeneficiaryRow = AppDatabase["ong"]["Tables"]["beneficiarios"]["Row"];
type VolunteerRow = AppDatabase["ong"]["Tables"]["voluntarios"]["Row"];
type RoleConstraintDbRow =
  AppDatabase["public"]["Tables"]["role_access_constraints"]["Row"];
type PublicRoleRow = AppDatabase["public"]["Tables"]["roles"]["Row"];
type PublicSedeRow = AppDatabase["public"]["Tables"]["sedes"]["Row"];

const DEFAULT_LIMIT = 120;

const SENSITIVE_FLOW_NOTES = [
  "La vista consolida `clinico.accesos_sensibles_log` y `clinico.accesos_sensibles_voluntario_log`; Gobernanza expone solo la bitacora, no el contenido de las fichas.",
  "Las filas historicas de `clinico.accesos_sensibles_log` no documentan `ip` ni `user_agent`; cuando el contrato origen no los trae, la UI muestra `-`.",
];

function resolveLimit(limit: number | undefined): number {
  if (!limit || Number.isNaN(limit) || limit < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(300, Math.floor(limit));
}

function matchesSensitiveSearch(row: SensitiveAccessLogRow, searchTerm: string): boolean {
  if (!searchTerm) {
    return true;
  }

  const normalized = searchTerm.toLowerCase();
  return [
    row.subjectName,
    row.subjectDocument,
    row.actorLabel,
    row.reason,
    row.resourceTypeLabel,
    row.ip,
    row.userAgent,
  ].some((value) => value.toLowerCase().includes(normalized));
}

function sortSensitiveRows(rows: SensitiveAccessLogRow[]): SensitiveAccessLogRow[] {
  return rows.slice().sort((left, right) => right.accessedAt.localeCompare(left.accessedAt));
}

function buildActorOptions(rows: SensitiveAccessLogRow[]): GovernanceSelectOption[] {
  return [{ value: "all", label: "Actor: Todos" }].concat(
    uniqueNonEmpty(rows.map((row) => `${row.actorId}::${row.actorLabel}`)).map((value) => {
      const [actorId, actorLabel] = value.split("::");
      return {
        value: actorId,
        label: actorLabel,
      };
    })
  );
}

async function fetchBeneficiarySensitiveAccessRows(
  tenantId: string,
  filters: SensitiveAccessLogFilters
): Promise<SensitiveAccessLogRow[]> {
  const limit = resolveLimit(filters.limit);
  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);

  let query = createTenantScopedQuery(
    clinicoSchema()
      .from("accesos_sensibles_log")
      .select("id, tenant_id, id_ficha, usuario_id, motivo, fecha_acceso, created_at"),
    tenantId
  )
    .order("fecha_acceso", { ascending: false })
    .limit(limit);

  if (filters.actorId !== "all") {
    query = query.eq("usuario_id", filters.actorId);
  }
  if (dateFrom) {
    query = query.gte("fecha_acceso", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("fecha_acceso", `${dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const logRows = (data ?? []) as SensitiveAccessDbRow[];
  if (!logRows.length) {
    return [];
  }

  const [medicalResult, actorLabels] = await Promise.all([
    createTenantScopedQuery(
      clinicoSchema().from("fichas_medicas").select("id, id_beneficiario"),
      tenantId
    ).in(
      "id",
      uniqueNonEmpty(logRows.map((row) => row.id_ficha))
    ),
    resolveProfileLabels(uniqueNonEmpty(logRows.map((row) => row.usuario_id)), tenantId).catch(
      () => new Map<string, string>()
    ),
  ]);

  if (medicalResult.error) {
    throw new Error(medicalResult.error.message);
  }

  const medicalRows = (medicalResult.data ?? []) as Array<
    Pick<MedicalRecordRow, "id" | "id_beneficiario">
  >;
  const beneficiaryIds = uniqueNonEmpty(medicalRows.map((row) => row.id_beneficiario));

  const beneficiaryResult = beneficiaryIds.length
    ? await createTenantScopedQuery(
        ongSchema().from("beneficiarios").select("id, numero_documento, nombre, apellido"),
        tenantId
      ).in("id", beneficiaryIds)
    : { data: [], error: null };

  if (beneficiaryResult.error) {
    throw new Error(beneficiaryResult.error.message);
  }

  const beneficiaryRows = (beneficiaryResult.data ?? []) as Array<
    Pick<BeneficiaryRow, "id" | "numero_documento" | "nombre" | "apellido">
  >;
  const beneficiaryById = new Map(
    beneficiaryRows.map((row): [string, string] => [row.id, `${row.nombre} ${row.apellido}`.trim()])
  );
  const documentById = new Map(
    beneficiaryRows.map((row): [string, string] => [row.id, row.numero_documento ?? "Sin documento"])
  );
  const beneficiaryIdByMedicalRecordId = new Map(
    medicalRows.map((row): [string, string] => [row.id, row.id_beneficiario])
  );

  return logRows.map((row): SensitiveAccessLogRow => {
    const subjectId = beneficiaryIdByMedicalRecordId.get(row.id_ficha) ?? row.id_ficha;
    return {
      id: row.id,
      recordId: row.id_ficha,
      sourceTable: "clinico.accesos_sensibles_log",
      resourceType: "beneficiario",
      resourceTypeLabel: "Beneficiario",
      subjectId,
      subjectName: beneficiaryById.get(subjectId) ?? subjectId,
      subjectDocument: documentById.get(subjectId) ?? "Sin documento",
      actorId: row.usuario_id,
      actorLabel: actorLabels.get(row.usuario_id) ?? row.usuario_id,
      reason: sanitizeText(row.motivo ?? null, 300) || "Sin motivo registrado",
      ip: "-",
      userAgent: "-",
      // @ts-ignore
      // @ts-ignore
      accessedAt: row.fecha_acceso ?? row.created_at,
      accessedAtLabel: toDateTimeLabel(row.fecha_acceso ?? row.created_at),
    };
  });
}

async function fetchVolunteerSensitiveAccessRows(
  tenantId: string,
  filters: SensitiveAccessLogFilters
): Promise<SensitiveAccessLogRow[]> {
  const limit = resolveLimit(filters.limit);
  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);

  let query = createTenantScopedQuery(
    clinicoSchema()
      .from("accesos_sensibles_voluntario_log")
      .select(
        "id, tenant_id, id_ficha_voluntario, usuario_id, motivo, ip, user_agent, fecha_acceso, created_at"
      ),
    tenantId
  )
    .order("fecha_acceso", { ascending: false })
    .limit(limit);

  if (filters.actorId !== "all") {
    query = query.eq("usuario_id", filters.actorId);
  }
  if (dateFrom) {
    query = query.gte("fecha_acceso", `${dateFrom}T00:00:00`);
  }
  if (dateTo) {
    query = query.lte("fecha_acceso", `${dateTo}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const logRows = (data ?? []) as SensitiveVolunteerAccessDbRow[];
  if (!logRows.length) {
    return [];
  }

  const [fichaResult, actorLabels] = await Promise.all([
    createTenantScopedQuery(
      clinicoSchema().from("ficha_sensible_voluntario").select("id, id_voluntario"),
      tenantId
    ).in(
      "id",
      uniqueNonEmpty(logRows.map((row) => row.id_ficha_voluntario))
    ),
    resolveProfileLabels(uniqueNonEmpty(logRows.map((row) => row.usuario_id)), tenantId).catch(
      () => new Map<string, string>()
    ),
  ]);

  if (fichaResult.error) {
    throw new Error(fichaResult.error.message);
  }

  const fichaRows = (fichaResult.data ?? []) as Array<
    Pick<SensitiveVolunteerRecordRow, "id" | "id_voluntario">
  >;
  const volunteerIds = uniqueNonEmpty(fichaRows.map((row) => row.id_voluntario));

  const volunteerResult = volunteerIds.length
    ? await createTenantScopedQuery(
        ongSchema().from("voluntarios").select("id, numero_documento, nombre, apellido"),
        tenantId
      ).in("id", volunteerIds)
    : { data: [], error: null };

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }

  const volunteerRows = (volunteerResult.data ?? []) as Array<
    Pick<VolunteerRow, "id" | "numero_documento" | "nombre" | "apellido">
  >;
  const volunteerById = new Map(
    volunteerRows.map((row): [string, string] => [row.id, `${row.nombre} ${row.apellido}`.trim()])
  );
  const documentById = new Map(
    volunteerRows.map((row): [string, string] => [row.id, row.numero_documento ?? "Sin documento"])
  );
  const volunteerIdByFichaId = new Map(
    fichaRows.map((row): [string, string] => [row.id, row.id_voluntario])
  );

  return logRows.map((row): SensitiveAccessLogRow => {
    const subjectId = volunteerIdByFichaId.get(row.id_ficha_voluntario) ?? row.id_ficha_voluntario;
    return {
      id: row.id,
      recordId: row.id_ficha_voluntario,
      sourceTable: "clinico.accesos_sensibles_voluntario_log",
      resourceType: "voluntario",
      resourceTypeLabel: "Voluntario",
      subjectId,
      subjectName: volunteerById.get(subjectId) ?? subjectId,
      subjectDocument: documentById.get(subjectId) ?? "Sin documento",
      actorId: row.usuario_id,
      actorLabel: actorLabels.get(row.usuario_id) ?? row.usuario_id,
      // @ts-ignore
      reason: sanitizeText(row.motivo ?? null, 300) || "Sin motivo registrado",
      // @ts-ignore
      ip: sanitizeText(row.ip ?? null, 120) || "-",
      userAgent: sanitizeText(row.user_agent ?? null, 220) || "-",
      accessedAt: row.fecha_acceso,
      accessedAtLabel: toDateTimeLabel(row.fecha_acceso),
    };
  });
}

async function fetchConstraintReferenceData(tenantId: string): Promise<{
  roleRows: PublicRoleRow[];
  sedeRows: PublicSedeRow[];
}> {
  const [roleResult, sedeResult] = await Promise.all([
    publicSchema()
      .from("roles")
      .select("id, tenant_id, name, hierarchy_level, is_system_role, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true }),
    publicSchema()
      .from("sedes")
      .select("id, tenant_id, name, is_active, created_at, updated_at")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true }),
  ]);

  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }
  if (sedeResult.error) {
    throw new Error(sedeResult.error.message);
  }

  return {
    roleRows: (roleResult.data ?? []) as PublicRoleRow[],
    sedeRows: (sedeResult.data ?? []) as PublicSedeRow[],
  };
}

async function fetchRoleAccessConstraints(tenantId: string): Promise<{
  rows: RoleAccessConstraintRow[];
  roleOptions: GovernanceSelectOption[];
  sedeOptions: GovernanceSelectOption[];
}> {
  const [constraintResult, references] = await Promise.all([
    publicSchema()
      .from("role_access_constraints")
      .select(
        "id, tenant_id, role_id, sede_id, ip_cidr, time_start, time_end, require_trusted_device, created_at"
      )
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    fetchConstraintReferenceData(tenantId),
  ]);

  if (constraintResult.error) {
    throw new Error(constraintResult.error.message);
  }

  const roleById = new Map(references.roleRows.map((row): [string, string] => [row.id, row.name]));
  const sedeById = new Map(references.sedeRows.map((row): [string, string] => [row.id, row.name]));
  const rows = ((constraintResult.data ?? []) as RoleConstraintDbRow[]).map((row) => ({
    id: row.id,
    roleId: row.role_id,
    roleName: roleById.get(row.role_id) ?? row.role_id,
    sedeId: row.sede_id,
    sedeName: row.sede_id ? sedeById.get(row.sede_id) ?? row.sede_id : "Todas las sedes",
    ipCidr: row.ip_cidr ?? "",
    timeStart: row.time_start ?? "",
    timeEnd: row.time_end ?? "",
    requireTrustedDevice: row.require_trusted_device,
    createdAt: row.created_at,
    createdAtLabel: toDateTimeLabel(row.created_at),
  }));
      // @ts-ignore

  return {
      // @ts-ignore
    rows,
    roleOptions: references.roleRows.map((row) => ({
      value: row.id,
      label: row.name,
    })),
    sedeOptions: [{ value: "all", label: "Todas las sedes" }].concat(
      references.sedeRows.map((row) => ({
        value: row.id,
        label: row.name,
      }))
    ),
  };
}

export async function getGovernanceSensitiveAccessData(
  filters: SensitiveAccessLogFilters
): Promise<GovernanceSensitiveAccessData> {
  const access = await resolveGovernanceCapabilities();
  const warnings = access.warnings.slice();

  try {
    const tenantId = await getRequiredTenantId();
    const limit = resolveLimit(filters.limit);

    const [beneficiaryRows, volunteerRows, constraintData] = await Promise.all([
      access.canReadSensitiveAccess
        ? fetchBeneficiarySensitiveAccessRows(tenantId, filters).catch((error) => {
            warnings.push(
              toFriendlyError(error, "No se pudo consultar clinico.accesos_sensibles_log.")
            );
            return [] as SensitiveAccessLogRow[];
          })
        : Promise.resolve([] as SensitiveAccessLogRow[]),
      access.canReadSensitiveAccess
        ? fetchVolunteerSensitiveAccessRows(tenantId, filters).catch((error) => {
            warnings.push(
              toFriendlyError(
                error,
                "No se pudo consultar clinico.accesos_sensibles_voluntario_log."
              )
            );
            return [] as SensitiveAccessLogRow[];
          })
        : Promise.resolve([] as SensitiveAccessLogRow[]),
      access.canReadConstraints
        ? fetchRoleAccessConstraints(tenantId).catch((error) => {
            warnings.push(
              toFriendlyError(
                error,
                "No se pudo consultar public.role_access_constraints."
              )
            );
            return {
              rows: [] as RoleAccessConstraintRow[],
              roleOptions: [] as GovernanceSelectOption[],
              sedeOptions: [{ value: "all", label: "Todas las sedes" }],
            };
          })
        : Promise.resolve({
            rows: [] as RoleAccessConstraintRow[],
            roleOptions: [] as GovernanceSelectOption[],
            sedeOptions: [{ value: "all", label: "Todas las sedes" }],
          }),
    ]);

    const searchTerm = sanitizeSearchTerm(filters.searchTerm).toLowerCase();
    const logRows = sortSensitiveRows(beneficiaryRows.concat(volunteerRows))
      .filter((row) => matchesSensitiveSearch(row, searchTerm))
      .slice(0, limit);

    return {
      access,
      logRows,
      actorOptions: buildActorOptions(logRows),
      constraints: constraintData.rows,
      roleOptions: constraintData.roleOptions,
      sedeOptions: constraintData.sedeOptions,
      warnings,
      unsupportedFlows: SENSITIVE_FLOW_NOTES,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar los accesos sensibles reales.")
    );
  }
}

function sanitizeConstraintInput(input: RoleAccessConstraintFormInput) {
  const roleId = sanitizeOptionalId(input.roleId);
  if (!roleId) {
    throw new Error("El rol es obligatorio.");
  }

  const sedeId = input.sedeId === "all" ? null : sanitizeOptionalId(input.sedeId);
  const ipCidr = sanitizeText(input.ipCidr ?? null, 80);
  const timeStart = normalizeTimeValue(input.timeStart);
  const timeEnd = normalizeTimeValue(input.timeEnd);

  if ((timeStart && !timeEnd) || (!timeStart && timeEnd)) {
    throw new Error("Debes completar tanto la hora de inicio como la de fin.");
  }
  if (timeStart && timeEnd && timeEnd <= timeStart) {
    throw new Error("La hora fin debe ser mayor que la hora inicio.");
  }
  if (ipCidr && !/^[0-9a-fA-F.:/]+$/.test(ipCidr)) {
    throw new Error("El CIDR/IP contiene caracteres no validos.");
  }

  return {
    role_id: roleId,
    sede_id: sedeId,
    ip_cidr: ipCidr,
    time_start: timeStart,
    time_end: timeEnd,
    require_trusted_device: Boolean(input.requireTrustedDevice),
  };
}

export async function createRoleAccessConstraint(
  input: RoleAccessConstraintFormInput
): Promise<void> {
  const access = await resolveGovernanceCapabilities();
  if (!access.canManageConstraints) {
    throw new Error("No tienes permisos para registrar restricciones de acceso.");
  }

  try {
    const tenantId = await getRequiredTenantId();
    const payload = sanitizeConstraintInput(input);

    const { error } = await publicSchema().from("role_access_constraints").insert({
      tenant_id: tenantId,
      ...payload,
    });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo registrar la restriccion de acceso.")
    );
  }
}

export async function updateRoleAccessConstraint(
  input: RoleAccessConstraintMutationInput
): Promise<void> {
  const access = await resolveGovernanceCapabilities();
  if (!access.canManageConstraints) {
    throw new Error("No tienes permisos para editar restricciones de acceso.");
  }

  const constraintId = sanitizeOptionalId(input.constraintId);
  if (!constraintId) {
    throw new Error("No se encontro la restriccion a editar.");
  }

  try {
    const payload = sanitizeConstraintInput(input);
    const { error } = await publicSchema()
      .from("role_access_constraints")
      .update(payload)
      .eq("id", constraintId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo actualizar la restriccion de acceso.")
    );
  }
}

export async function deleteRoleAccessConstraint(constraintId: string): Promise<void> {
  const access = await resolveGovernanceCapabilities();
  if (!access.canManageConstraints) {
    throw new Error("No tienes permisos para eliminar restricciones de acceso.");
  }

  const sanitizedId = sanitizeOptionalId(constraintId);
  if (!sanitizedId) {
    throw new Error("No se encontro la restriccion a eliminar.");
  }

  try {
    const { error } = await publicSchema()
      .from("role_access_constraints")
      .delete()
      .eq("id", sanitizedId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo eliminar la restriccion de acceso.")
    );
  }
}

export function getConstraintScopeLabel(row: RoleAccessConstraintRow): string {
  const timeRange =
    row.timeStart && row.timeEnd ? `${row.timeStart} - ${row.timeEnd}` : "Horario libre";
  const trustedDevice = row.requireTrustedDevice ? "Dispositivo confiable" : "Sin device trust";
  return [row.sedeName, timeRange, trustedDevice].filter(Boolean).join(" | ");
}

export function getConstraintSearchValue(row: RoleAccessConstraintRow): string {
  return normalizeText(
    `${row.roleName} ${row.sedeName} ${row.ipCidr} ${row.timeStart} ${row.timeEnd}`
  );
}
