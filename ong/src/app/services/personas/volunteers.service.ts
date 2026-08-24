import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  PeopleRecordStatusKind,
  PeopleStatusOption,
  VolunteerCatalogData,
  VolunteerCoordinatorProfile,
  VolunteerDetailData,
  VolunteerDocumentInput,
  VolunteerListData,
  VolunteerListRow,
  VolunteerRoleInput,
  VolunteerSkillInput,
  VolunteerUpsertInput,
} from "../../modules/people/types";
import type { SelectOption } from "../../modules/operation/types";
import {
  createTenantScopedQuery,
  getRequiredTenantId,
  normalizeDateValue,
  normalizeText,
  ongSchema,
  publicSchema,
  resolveActorId,
  resolveInstitutionalRolesByUserIds,
  resolvePeopleStatusVariant,
  resolveProfileLabels,
  rrhhSchema,
  sanitizeEmail,
  sanitizeOptionalId,
  sanitizePhone,
  sanitizeText,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type VolunteerRow = AppDatabase["ong"]["Tables"]["voluntarios"]["Row"];
type VolunteerStateRow = AppDatabase["ong"]["Tables"]["estados_voluntario"]["Row"];
type HoursRow = AppDatabase["ong"]["Tables"]["horas_actividad"]["Row"];
type ProjectAssignmentRow = AppDatabase["ong"]["Tables"]["asignaciones_proyecto"]["Row"];
type ActivityAssignmentRow = AppDatabase["ong"]["Tables"]["asignaciones_actividad"]["Row"];
type SkillCatalogRow = AppDatabase["rrhh"]["Tables"]["habilidades"]["Row"];
type VolunteerSkillRow = AppDatabase["rrhh"]["Tables"]["voluntario_habilidades"]["Row"];
type VolunteerRoleRow = AppDatabase["rrhh"]["Tables"]["asignaciones_rol"]["Row"];
type RoleCatalogRow = AppDatabase["rrhh"]["Tables"]["roles_operativos"]["Row"];
type VolunteerDocumentRow = AppDatabase["rrhh"]["Tables"]["documentos_voluntario"]["Row"];
type CoordinatorProfileRow = AppDatabase["rrhh"]["Tables"]["perfil_coordinador"]["Row"];
type DocumentTypeRow = AppDatabase["public"]["Tables"]["cat_tipos_documento"]["Row"];
type GenderRow = AppDatabase["public"]["Tables"]["cat_generos"]["Row"];
type CountryRow = AppDatabase["public"]["Tables"]["cat_paises"]["Row"];

const SKILL_LEVELS = new Set(["basico", "intermedio", "avanzado", "experto"]);

function detectStatusKind(
  row: Pick<VolunteerStateRow, "codigo" | "nombre_estado">
): PeopleRecordStatusKind {
  const normalized = `${normalizeText(row.codigo)} ${normalizeText(row.nombre_estado)}`;

  if (normalized.includes("inact") || normalized.includes("baja") || normalized.includes("susp")) {
    return "inactive";
  }
  if (normalized.includes("pend")) {
    return "pending";
  }
  if (normalized.includes("act")) {
    return "active";
  }
  return "other";
}

function mapStatusOptions(rows: VolunteerStateRow[]): PeopleStatusOption[] {
  return rows.map((row) => ({
    value: row.codigo,
    label: sanitizeText(row.nombre_estado, 100) || row.codigo,
    kind: detectStatusKind(row),
  }));
}

function mapCatalogOptions<TValue extends string>(
  rows: Array<{ codigo: TValue; nombre: string }>
): SelectOption[] {
  return rows.map((row) => ({
    value: row.codigo,
    label: row.nombre,
  }));
}

function resolveStatusOption(
  stateCode: string,
  stateOptions: PeopleStatusOption[]
): PeopleStatusOption {
  return (
    stateOptions.find((option) => option.value === stateCode) ?? {
      value: stateCode,
      label: stateCode || "Sin estado",
      kind: "other",
    }
  );
}

function buildDocumentLabel(
  documentNumber: string,
  documentTypeCode: string | null,
  documentTypeByCode: Map<string, string>
): string {
  const number = sanitizeText(documentNumber, 60);
  const typeLabel =
    (documentTypeCode ? documentTypeByCode.get(documentTypeCode) : null) ??
    documentTypeCode ??
    "";

  return typeLabel ? `${number} · ${typeLabel}` : number;
}

function buildDisplayLabel(
  code: string | null,
  labelMap: Map<string, string>
): string {
  if (!code) {
    return "Sin dato";
  }

  return labelMap.get(code) ?? code;
}

function sanitizeSkillLevel(value: string | null | undefined): string | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  return SKILL_LEVELS.has(normalized) ? normalized : null;
}

async function fetchVolunteerReferenceCatalogs(tenantId: string) {
  const [stateResult, documentTypeResult, genderResult, countryResult, skillResult, roleResult] =
    await Promise.all([
      ongSchema()
        .from("estados_voluntario")
        .select("codigo, nombre_estado, descripcion, orden_visual")
        .order("orden_visual", { ascending: true }),
      publicSchema().from("cat_tipos_documento").select("codigo, nombre").order("nombre", {
        ascending: true,
      }),
      publicSchema().from("cat_generos").select("codigo, nombre").order("nombre", {
        ascending: true,
      }),
      publicSchema().from("cat_paises").select("codigo, nombre").order("nombre", {
        ascending: true,
      }),
      rrhhSchema().from("habilidades").select("codigo, nombre").order("nombre", {
        ascending: true,
      }),
      createTenantScopedQuery(
        rrhhSchema().from("roles_operativos").select("id, nombre_rol"),
        tenantId
      ).order("nombre_rol", { ascending: true }),
    ]);

  if (stateResult.error) {
    throw new Error(stateResult.error.message);
  }
  if (documentTypeResult.error) {
    throw new Error(documentTypeResult.error.message);
  }
  if (genderResult.error) {
    throw new Error(genderResult.error.message);
  }
  if (countryResult.error) {
    throw new Error(countryResult.error.message);
  }
  if (skillResult.error) {
    throw new Error(skillResult.error.message);
  }
  if (roleResult.error) {
    throw new Error(roleResult.error.message);
  }

  const stateOptions = mapStatusOptions((stateResult.data ?? []) as VolunteerStateRow[]);
  const documentTypeRows = (documentTypeResult.data ?? []) as DocumentTypeRow[];
  const genderRows = (genderResult.data ?? []) as GenderRow[];
  const countryRows = (countryResult.data ?? []) as CountryRow[];
  const skillRows = (skillResult.data ?? []) as SkillCatalogRow[];
  const roleRows = (roleResult.data ?? []) as Array<Pick<RoleCatalogRow, "id" | "nombre_rol">>;

  return {
    stateOptions,
    documentTypeRows,
    genderRows,
    countryRows,
    skillRows,
    roleRows,
  };
}

async function fetchApprovedHoursByVolunteerId(tenantId: string): Promise<Map<string, number>> {
  const { data, error } = await createTenantScopedQuery(
    ongSchema().from("horas_actividad").select("id_voluntario, horas_registradas, estado_aprobacion"),
    tenantId
  ).eq("estado_aprobacion", "aprobada");

  if (error) {
    throw new Error(error.message);
  }

  const totals = new Map<string, number>();
  for (const row of (data ?? []) as Array<
    Pick<HoursRow, "id_voluntario" | "horas_registradas" | "estado_aprobacion">
  >) {
    totals.set(
      row.id_voluntario,
      (totals.get(row.id_voluntario) ?? 0) + Number(row.horas_registradas ?? 0)
    );
  }

  return totals;
}

function mapCountByVolunteerId<TValue extends { id_voluntario: string }>(
  rows: TValue[],
  options?: { onlyTruthyFlag?: keyof TValue }
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (options?.onlyTruthyFlag && !Boolean(row[options.onlyTruthyFlag])) {
      continue;
    }

    counts.set(row.id_voluntario, (counts.get(row.id_voluntario) ?? 0) + 1);
  }

  return counts;
}

function buildVolunteerListRow(options: {
  volunteer: VolunteerRow;
  stateOptions: PeopleStatusOption[];
  approvedHoursByVolunteerId: Map<string, number>;
  skillCountByVolunteerId: Map<string, number>;
  roleCountByVolunteerId: Map<string, number>;
  documentCountByVolunteerId: Map<string, number>;
  projectCountByVolunteerId: Map<string, number>;
  activityCountByVolunteerId: Map<string, number>;
  documentTypeByCode: Map<string, string>;
  genderByCode: Map<string, string>;
  countryByCode: Map<string, string>;
}): VolunteerListRow {
  const state = resolveStatusOption(options.volunteer.codigo_estado, options.stateOptions);

  return {
    id: options.volunteer.id,
    iamUserId: options.volunteer.iam_user_id,
    fullName: `${options.volunteer.nombre} ${options.volunteer.apellido}`.trim(),
    firstName: options.volunteer.nombre,
    lastName: options.volunteer.apellido,
    documentNumber: options.volunteer.numero_documento,
    documentType: options.volunteer.tipo_documento,
    documentLabel: buildDocumentLabel(
      options.volunteer.numero_documento,
      options.volunteer.tipo_documento,
      options.documentTypeByCode
    ),
    genderCode: options.volunteer.genero,
    genderLabel: buildDisplayLabel(options.volunteer.genero, options.genderByCode),
    countryCode: options.volunteer.codigo_pais,
    countryLabel: buildDisplayLabel(options.volunteer.codigo_pais, options.countryByCode),
    birthDate: options.volunteer.fecha_nacimiento,
    email: sanitizeText(options.volunteer.email ?? null, 255),
    phone: sanitizeText(options.volunteer.telefono ?? null, 50),
    photoUrl: options.volunteer.ruta_foto,
    stateCode: options.volunteer.codigo_estado,
    stateLabel: state.label,
    stateKind: state.kind,
    stateVariant: resolvePeopleStatusVariant(state.kind),
    notes: sanitizeText(options.volunteer.observaciones ?? null, 500),
    approvedHours:
      Math.round((options.approvedHoursByVolunteerId.get(options.volunteer.id) ?? 0) * 10) / 10,
    skillCount: options.skillCountByVolunteerId.get(options.volunteer.id) ?? 0,
    roleCount: options.roleCountByVolunteerId.get(options.volunteer.id) ?? 0,
    documentCount: options.documentCountByVolunteerId.get(options.volunteer.id) ?? 0,
    projectCount: options.projectCountByVolunteerId.get(options.volunteer.id) ?? 0,
    activityCount: options.activityCountByVolunteerId.get(options.volunteer.id) ?? 0,
    createdAt: options.volunteer.created_at,
    updatedAt: options.volunteer.updated_at,
  };
}

async function ensureVolunteerUniqueFields(options: {
  tenantId: string;
  volunteerId?: string | null;
  documentType: string | null;
  documentNumber: string;
  email: string | null;
}) {
  let documentQuery = createTenantScopedQuery(
    ongSchema().from("voluntarios").select("id"),
    options.tenantId
  )
    .eq("numero_documento", options.documentNumber)
    .eq("tipo_documento", options.documentType);

  if (options.volunteerId) {
    documentQuery = documentQuery.neq("id", options.volunteerId);
  }

  const { data: documentRows, error: documentError } = await documentQuery.limit(1);
  if (documentError) {
    throw new Error(documentError.message);
  }
  if ((documentRows ?? []).length > 0) {
    throw new Error("Ya existe un voluntario con el mismo tipo y numero de documento.");
  }

  if (!options.email) {
    return;
  }

  let emailQuery = createTenantScopedQuery(
    ongSchema().from("voluntarios").select("id"),
    options.tenantId
  ).eq("email", options.email);

  if (options.volunteerId) {
    emailQuery = emailQuery.neq("id", options.volunteerId);
  }

  const { data: emailRows, error: emailError } = await emailQuery.limit(1);
  if (emailError) {
    throw new Error(emailError.message);
  }
  if ((emailRows ?? []).length > 0) {
    throw new Error("Ya existe un voluntario con el mismo correo.");
  }
}

async function ensureVolunteerInputValid(
  tenantId: string,
  input: VolunteerUpsertInput
): Promise<void> {
  const catalogs = await fetchVolunteerCatalogs();

  if (!sanitizeText(input.firstName, 150)) {
    throw new Error("El nombre del voluntario es obligatorio.");
  }
  if (!sanitizeText(input.lastName, 150)) {
    throw new Error("El apellido del voluntario es obligatorio.");
  }
  if (!sanitizeText(input.documentNumber, 50)) {
    throw new Error("El numero de documento es obligatorio.");
  }
  if (!catalogs.stateOptions.some((option) => option.value === input.stateCode)) {
    throw new Error("El estado del voluntario no existe en el catalogo real.");
  }
  if (
    input.documentType &&
    !catalogs.documentTypeOptions.some((option) => option.value === input.documentType)
  ) {
    throw new Error("El tipo de documento no existe en el catalogo real.");
  }
  if (
    input.genderCode &&
    !catalogs.genderOptions.some((option) => option.value === input.genderCode)
  ) {
    throw new Error("El genero no existe en el catalogo real.");
  }
  if (
    input.countryCode &&
    !catalogs.countryOptions.some((option) => option.value === input.countryCode)
  ) {
    throw new Error("El pais no existe en el catalogo real.");
  }

  const skillCodes = new Set(catalogs.skillOptions.map((option) => option.value));
  const roleIds = new Set(catalogs.operationalRoleOptions.map((option) => option.value));

  for (const skill of input.skills) {
    if (!skillCodes.has(skill.code)) {
      throw new Error("Se detecto una habilidad inexistente en el catalogo real.");
    }
    if (skill.level && !SKILL_LEVELS.has(skill.level)) {
      throw new Error("El nivel de habilidad no es valido.");
    }
  }

  for (const role of input.operationalRoles) {
    if (!roleIds.has(role.roleId)) {
      throw new Error("Se detecto un rol operativo inexistente.");
    }
  }

  for (const document of input.documents) {
    if (!sanitizeText(document.type, 50)) {
      throw new Error("Cada documento del voluntario debe indicar un tipo.");
    }
    if (!sanitizeText(document.url, 400)) {
      throw new Error("Cada documento del voluntario debe indicar una URL o ruta.");
    }
  }

  if (input.iamUserId) {
    const { data, error } = await publicSchema()
      .from("profiles")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("id", input.iamUserId)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }
    if (!(data ?? []).length) {
      throw new Error("El usuario institucional enlazado no existe en public.profiles.");
    }
  }
}

async function syncVolunteerSkills(
  tenantId: string,
  volunteerId: string,
  skills: VolunteerSkillInput[],
  actorId: string | null
) {
  const { data, error } = await createTenantScopedQuery(
    rrhhSchema()
      .from("voluntario_habilidades")
      .select("id, codigo_habilidad, nivel"),
    tenantId
  ).eq("id_voluntario", volunteerId);

  if (error) {
    throw new Error(error.message);
  }

  const existingRows = (data ?? []) as Array<
    Pick<VolunteerSkillRow, "id" | "codigo_habilidad" | "nivel">
  >;
  const existingByCode = new Map(existingRows.map((row) => [row.codigo_habilidad, row]));
  const nextCodes = new Set<string>();

  for (const skill of skills) {
    const code = sanitizeText(skill.code, 50);
    if (!code || nextCodes.has(code)) {
      continue;
    }
    nextCodes.add(code);

    const existing = existingByCode.get(code);
    const payload = {
      tenant_id: tenantId,
      id_voluntario: volunteerId,
      codigo_habilidad: code,
      nivel: sanitizeSkillLevel(skill.level),
      updated_by: actorId,
    };

    if (existing) {
      const { error: updateError } = await rrhhSchema()
        .from("voluntario_habilidades")
        .update(payload)
        .eq("id", existing.id)
        .eq("tenant_id", tenantId);

      if (updateError) {
        throw new Error(updateError.message);
      }
      continue;
    }

    const { error: insertError } = await rrhhSchema()
      .from("voluntario_habilidades")
      .insert({
        ...payload,
        created_by: actorId,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const rowsToDelete = existingRows.filter((row) => !nextCodes.has(row.codigo_habilidad));
  if (rowsToDelete.length) {
    const { error: deleteError } = await rrhhSchema()
      .from("voluntario_habilidades")
      .delete()
      .eq("tenant_id", tenantId)
      .in(
        "id",
        rowsToDelete.map((row) => row.id)
      );

    if (deleteError) {
      throw new Error(deleteError.message);
    }
  }
}

async function syncVolunteerRoles(
  tenantId: string,
  volunteerId: string,
  roles: VolunteerRoleInput[],
  actorId: string | null
) {
  const { data, error } = await createTenantScopedQuery(
    rrhhSchema()
      .from("asignaciones_rol")
      .select("id, id_rol_operativo, fecha_asignacion, activo"),
    tenantId
  ).eq("id_voluntario", volunteerId);

  if (error) {
    throw new Error(error.message);
  }

  const existingRows = (data ?? []) as Array<
    Pick<VolunteerRoleRow, "id" | "id_rol_operativo" | "fecha_asignacion" | "activo">
  >;
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const existingByRoleId = new Map(existingRows.map((row) => [row.id_rol_operativo, row]));
  const touchedRowIds = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);

  for (const role of roles) {
    const roleId = sanitizeOptionalId(role.roleId);
    if (!roleId) {
      continue;
    }

    const targetDate = normalizeDateValue(role.assignedAt) ?? today;
    const existing =
      (role.id ? existingById.get(role.id) : null) ?? existingByRoleId.get(roleId) ?? null;

    if (existing) {
      touchedRowIds.add(existing.id);
      const { error: updateError } = await rrhhSchema()
        .from("asignaciones_rol")
        .update({
          id_rol_operativo: roleId,
          fecha_asignacion: targetDate,
          activo: role.active,
          updated_by: actorId,
        })
        .eq("id", existing.id)
        .eq("tenant_id", tenantId);

      if (updateError) {
        throw new Error(updateError.message);
      }
      continue;
    }

    const { error: insertError } = await rrhhSchema()
      .from("asignaciones_rol")
      .insert({
        tenant_id: tenantId,
        id_voluntario: volunteerId,
        id_rol_operativo: roleId,
        fecha_asignacion: targetDate,
        activo: role.active,
        created_by: actorId,
        updated_by: actorId,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const rowsToDeactivate = existingRows.filter(
    (row) => row.activo && !touchedRowIds.has(row.id)
  );
  if (rowsToDeactivate.length) {
    const { error: updateError } = await rrhhSchema()
      .from("asignaciones_rol")
      .update({
        activo: false,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .in(
        "id",
        rowsToDeactivate.map((row) => row.id)
      );

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

async function syncVolunteerDocuments(
  tenantId: string,
  volunteerId: string,
  documents: VolunteerDocumentInput[],
  actorId: string | null
) {
  const { data, error } = await createTenantScopedQuery(
    rrhhSchema()
      .from("documentos_voluntario")
      .select("id, vigente"),
    tenantId
  ).eq("id_voluntario", volunteerId);

  if (error) {
    throw new Error(error.message);
  }

  const existingRows = (data ?? []) as Array<Pick<VolunteerDocumentRow, "id" | "vigente">>;
  const existingById = new Map(existingRows.map((row) => [row.id, row]));
  const touchedIds = new Set<string>();

  for (const document of documents) {
    const documentId = sanitizeOptionalId(document.id);
    const payload = {
      tipo_documento: sanitizeText(document.type, 50),
      url_archivo: sanitizeText(document.url, 400),
      fecha_vencimiento: normalizeDateValue(document.expirationDate),
      vigente: document.isCurrent,
      updated_by: actorId,
    };

    if (documentId && existingById.has(documentId)) {
      touchedIds.add(documentId);
      const { error: updateError } = await rrhhSchema()
        .from("documentos_voluntario")
        .update(payload)
        .eq("tenant_id", tenantId)
        .eq("id", documentId);

      if (updateError) {
        throw new Error(updateError.message);
      }
      continue;
    }

    const { error: insertError } = await rrhhSchema()
      .from("documentos_voluntario")
      .insert({
        tenant_id: tenantId,
        id_voluntario: volunteerId,
        ...payload,
        created_by: actorId,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const rowsToArchive = existingRows.filter(
    (row) => row.vigente && !touchedIds.has(row.id)
  );
  if (rowsToArchive.length) {
    const { error: updateError } = await rrhhSchema()
      .from("documentos_voluntario")
      .update({
        vigente: false,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .in(
        "id",
        rowsToArchive.map((row) => row.id)
      );

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}

async function syncCoordinatorProfile(
  tenantId: string,
  volunteerId: string,
  profile: VolunteerUpsertInput["coordinatorProfile"],
  actorId: string | null
) {
  const { data, error } = await createTenantScopedQuery(
    rrhhSchema()
      .from("perfil_coordinador")
      .select("id"),
    tenantId
  ).eq("id_voluntario", volunteerId).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const yearsExperience = Math.max(0, Math.round(Number(profile?.yearsExperience ?? 0)));
  const department = sanitizeText(profile?.department ?? null, 150);

  if (data) {
    const { error: updateError } = await rrhhSchema()
      .from("perfil_coordinador")
      .update({
        anios_experiencia: yearsExperience,
        departamento_asignado: department,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
    return;
  }

  if (!profile) {
    return;
  }

  const { error: insertError } = await rrhhSchema()
    .from("perfil_coordinador")
    .insert({
      tenant_id: tenantId,
      id_voluntario: volunteerId,
      anios_experiencia: yearsExperience,
      departamento_asignado: department,
      created_by: actorId,
      updated_by: actorId,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function upsertVolunteerBase(
  tenantId: string,
  volunteerId: string | null,
  input: VolunteerUpsertInput,
  actorId: string | null
): Promise<string> {
  await ensureVolunteerUniqueFields({
    tenantId,
    volunteerId,
    documentType: input.documentType,
    documentNumber: sanitizeText(input.documentNumber, 50),
    email: sanitizeEmail(input.email),
  });

  const payload = {
    tenant_id: tenantId,
    iam_user_id: sanitizeOptionalId(input.iamUserId ?? null),
    numero_documento: sanitizeText(input.documentNumber, 50),
    tipo_documento: sanitizeOptionalId(input.documentType ?? null),
    genero: sanitizeOptionalId(input.genderCode ?? null),
    codigo_pais: sanitizeOptionalId(input.countryCode ?? null) ?? "PE",
    nombre: sanitizeText(input.firstName, 150),
    apellido: sanitizeText(input.lastName, 150),
    fecha_nacimiento: normalizeDateValue(input.birthDate),
    email: sanitizeEmail(input.email),
    telefono: sanitizePhone(input.phone),
    ruta_foto: sanitizeText(input.photoUrl ?? null, 400),
    codigo_estado: sanitizeText(input.stateCode, 50),
    observaciones: sanitizeText(input.notes ?? null, 500),
    updated_by: actorId,
  };

  if (volunteerId) {
    const { error } = await ongSchema()
      .from("voluntarios")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", volunteerId);

    if (error) {
      throw new Error(error.message);
    }
    return volunteerId;
  }

  const { data, error } = await ongSchema()
    .from("voluntarios")
    .insert({
      ...payload,
      created_by: actorId,
    })
    .select("id")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const createdId = data?.[0]?.id ?? null;
  if (!createdId) {
    throw new Error("No se pudo recuperar el voluntario creado.");
  }

  return createdId;
}

async function upsertVolunteer(
  volunteerId: string | null,
  input: VolunteerUpsertInput
): Promise<VolunteerDetailData> {
  const tenantId = await getRequiredTenantId();
  const actorId = await resolveActorId();

  await ensureVolunteerInputValid(tenantId, input);

  const targetVolunteerId = await upsertVolunteerBase(tenantId, volunteerId, input, actorId);

  await syncVolunteerSkills(tenantId, targetVolunteerId, input.skills, actorId);
  await syncVolunteerRoles(tenantId, targetVolunteerId, input.operationalRoles, actorId);
  await syncVolunteerDocuments(tenantId, targetVolunteerId, input.documents, actorId);
  await syncCoordinatorProfile(tenantId, targetVolunteerId, input.coordinatorProfile, actorId);

  const detail = await getVolunteerDetail(targetVolunteerId);
  if (!detail) {
    throw new Error("No se pudo recuperar el detalle del voluntario guardado.");
  }

  return detail;
}

export async function fetchVolunteerCatalogs(): Promise<VolunteerCatalogData> {
  const tenantId = await getRequiredTenantId();
  const catalogs = await fetchVolunteerReferenceCatalogs(tenantId);

  return {
    stateOptions: catalogs.stateOptions,
    documentTypeOptions: mapCatalogOptions(catalogs.documentTypeRows),
    genderOptions: mapCatalogOptions(catalogs.genderRows),
    countryOptions: mapCatalogOptions(catalogs.countryRows),
    skillOptions: catalogs.skillRows.map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
    operationalRoleOptions: catalogs.roleRows.map((row) => ({
      value: row.id,
      label: row.nombre_rol,
    })),
  };
}

export async function listVolunteers(): Promise<VolunteerListData> {
  const tenantId = await getRequiredTenantId();

  const [
    volunteerResult,
    catalogs,
    approvedHoursByVolunteerId,
    skillRowsResult,
    roleRowsResult,
    documentRowsResult,
    projectRowsResult,
    activityRowsResult,
  ] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("voluntarios")
        .select(
          "id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, ruta_foto, codigo_estado, observaciones, created_at, updated_at"
        ),
      tenantId
    )
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    fetchVolunteerReferenceCatalogs(tenantId),
    fetchApprovedHoursByVolunteerId(tenantId),
    createTenantScopedQuery(
      rrhhSchema().from("voluntario_habilidades").select("id_voluntario"),
      tenantId
    ),
    createTenantScopedQuery(
      rrhhSchema().from("asignaciones_rol").select("id_voluntario, activo"),
      tenantId
    ),
    createTenantScopedQuery(
      rrhhSchema().from("documentos_voluntario").select("id_voluntario, vigente"),
      tenantId
    ),
    createTenantScopedQuery(
      ongSchema().from("asignaciones_proyecto").select("id_voluntario, activo"),
      tenantId
    ),
    createTenantScopedQuery(
      ongSchema().from("asignaciones_actividad").select("id_voluntario"),
      tenantId
    ),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (skillRowsResult.error) {
    throw new Error(skillRowsResult.error.message);
  }
  if (roleRowsResult.error) {
    throw new Error(roleRowsResult.error.message);
  }
  if (documentRowsResult.error) {
    throw new Error(documentRowsResult.error.message);
  }
  if (projectRowsResult.error) {
    throw new Error(projectRowsResult.error.message);
  }
  if (activityRowsResult.error) {
    throw new Error(activityRowsResult.error.message);
  }

  const documentTypeByCode = new Map(
    catalogs.documentTypeRows.map((row): [string, string] => [row.codigo, row.nombre])
  );
  const genderByCode = new Map(
    catalogs.genderRows.map((row): [string, string] => [row.codigo, row.nombre])
  );
  const countryByCode = new Map(
    catalogs.countryRows.map((row): [string, string] => [row.codigo, row.nombre])
  );

  const skillCountByVolunteerId = mapCountByVolunteerId(
    ((skillRowsResult.data ?? []) as Array<Pick<VolunteerSkillRow, "id_voluntario">>)
  );
  const roleCountByVolunteerId = mapCountByVolunteerId(
    ((roleRowsResult.data ?? []) as Array<Pick<VolunteerRoleRow, "id_voluntario" | "activo">>),
    { onlyTruthyFlag: "activo" }
  );
  const documentCountByVolunteerId = mapCountByVolunteerId(
    ((documentRowsResult.data ?? []) as Array<
      Pick<VolunteerDocumentRow, "id_voluntario" | "vigente">
    >),
    { onlyTruthyFlag: "vigente" }
  );
  const projectCountByVolunteerId = mapCountByVolunteerId(
    ((projectRowsResult.data ?? []) as Array<
      Pick<ProjectAssignmentRow, "id_voluntario" | "activo">
    >),
    { onlyTruthyFlag: "activo" }
  );
  const activityCountByVolunteerId = mapCountByVolunteerId(
    ((activityRowsResult.data ?? []) as Array<Pick<ActivityAssignmentRow, "id_voluntario">>)
  );

  return {
    rows: ((volunteerResult.data ?? []) as VolunteerRow[]).map((volunteer) =>
      buildVolunteerListRow({
        volunteer,
        stateOptions: catalogs.stateOptions,
        approvedHoursByVolunteerId,
        skillCountByVolunteerId,
        roleCountByVolunteerId,
        documentCountByVolunteerId,
        projectCountByVolunteerId,
        activityCountByVolunteerId,
        documentTypeByCode,
        genderByCode,
        countryByCode,
      })
    ),
    stateOptions: catalogs.stateOptions,
  };
}

export async function getVolunteerDetail(
  volunteerId: string
): Promise<VolunteerDetailData | null> {
  const tenantId = await getRequiredTenantId();
  const targetId = sanitizeOptionalId(volunteerId);
  if (!targetId) {
    return null;
  }

  const [
    volunteerResult,
    listData,
    skillRowsResult,
    skillCatalogResult,
    roleRowsResult,
    roleCatalogResult,
    documentRowsResult,
    coordinatorResult,
  ] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("voluntarios")
        .select(
          "id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, ruta_foto, codigo_estado, observaciones, created_at, created_by, updated_at, updated_by"
        ),
      tenantId
    )
      .eq("id", targetId)
      .maybeSingle(),
    listVolunteers(),
    createTenantScopedQuery(
      rrhhSchema()
        .from("voluntario_habilidades")
        .select("id, codigo_habilidad, nivel"),
      tenantId
    ).eq("id_voluntario", targetId),
    rrhhSchema().from("habilidades").select("codigo, nombre"),
    createTenantScopedQuery(
      rrhhSchema()
        .from("asignaciones_rol")
        .select("id, id_rol_operativo, fecha_asignacion, activo"),
      tenantId
    ).eq("id_voluntario", targetId),
    createTenantScopedQuery(
      rrhhSchema().from("roles_operativos").select("id, nombre_rol"),
      tenantId
    ),
    createTenantScopedQuery(
      rrhhSchema()
        .from("documentos_voluntario")
        .select("id, tipo_documento, url_archivo, fecha_vencimiento, vigente"),
      tenantId
    )
      .eq("id_voluntario", targetId)
      .order("created_at", { ascending: false }),
    createTenantScopedQuery(
      rrhhSchema()
        .from("perfil_coordinador")
        .select("id, anios_experiencia, departamento_asignado"),
      tenantId
    )
      .eq("id_voluntario", targetId)
      .maybeSingle(),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (skillRowsResult.error) {
    throw new Error(skillRowsResult.error.message);
  }
  if (skillCatalogResult.error) {
    throw new Error(skillCatalogResult.error.message);
  }
  if (roleRowsResult.error) {
    throw new Error(roleRowsResult.error.message);
  }
  if (roleCatalogResult.error) {
    throw new Error(roleCatalogResult.error.message);
  }
  if (documentRowsResult.error) {
    throw new Error(documentRowsResult.error.message);
  }
  if (coordinatorResult.error) {
    throw new Error(coordinatorResult.error.message);
  }

  const volunteerRow = volunteerResult.data as
    | (VolunteerRow & { created_by: string | null; updated_by: string | null })
    | null;
  if (!volunteerRow) {
    return null;
  }

  const summaryRow = listData.rows.find((row) => row.id === volunteerRow.id);
  if (!summaryRow) {
    throw new Error("No se pudo reconstruir el resumen del voluntario.");
  }

  const skillLabelByCode = new Map(
    ((skillCatalogResult.data ?? []) as SkillCatalogRow[]).map((row): [string, string] => [
      row.codigo,
      row.nombre,
    ])
  );
  const roleLabelById = new Map(
    ((roleCatalogResult.data ?? []) as Array<Pick<RoleCatalogRow, "id" | "nombre_rol">>).map(
      (row): [string, string] => [row.id, row.nombre_rol]
    )
  );

  const createdUpdatedIds = uniqueNonEmpty([
    volunteerRow.created_by,
    volunteerRow.updated_by,
  ]);
  const [profileLabels, institutionalRolesByUserId] = await Promise.all([
    resolveProfileLabels(createdUpdatedIds, tenantId).catch(() => new Map<string, string>()),
    volunteerRow.iam_user_id
      ? resolveInstitutionalRolesByUserIds([volunteerRow.iam_user_id], tenantId).catch(
          () =>
            new Map<
              string,
              Array<{ roleId: string; roleName: string; sedeId: string; sedeName: string }>
            >()
        )
      : Promise.resolve(
          new Map<
            string,
            Array<{ roleId: string; roleName: string; sedeId: string; sedeName: string }>
          >()
        ),
  ]);

  const coordinatorProfileRow = coordinatorResult.data as Pick<
    CoordinatorProfileRow,
    "id" | "anios_experiencia" | "departamento_asignado"
  > | null;
  const coordinatorProfile: VolunteerCoordinatorProfile | null = coordinatorProfileRow
    ? {
        id: coordinatorProfileRow.id,
        yearsExperience: Number(coordinatorProfileRow.anios_experiencia ?? 0),
        department: sanitizeText(coordinatorProfileRow.departamento_asignado ?? null, 150),
      }
    : null;

  return {
    volunteer: summaryRow,
    createdBy:
      profileLabels.get(volunteerRow.created_by ?? "") ?? volunteerRow.created_by ?? "Sin dato",
    updatedBy:
      profileLabels.get(volunteerRow.updated_by ?? "") ?? volunteerRow.updated_by ?? "Sin dato",
    skills: ((skillRowsResult.data ?? []) as Array<
      Pick<VolunteerSkillRow, "id" | "codigo_habilidad" | "nivel">
    >).map((row) => ({
      id: row.id,
      code: row.codigo_habilidad,
      label: skillLabelByCode.get(row.codigo_habilidad) ?? row.codigo_habilidad,
      level: row.nivel,
    })),
      // @ts-ignore
      // @ts-ignore
    operationalRoles: ((roleRowsResult.data ?? []) as Array<
      Pick<VolunteerRoleRow, "id" | "id_rol_operativo" | "fecha_asignacion" | "activo">
    >).map((row) => ({
      id: row.id,
      roleId: row.id_rol_operativo,
      roleName: roleLabelById.get(row.id_rol_operativo) ?? row.id_rol_operativo,
      assignedAt: row.fecha_asignacion,
      active: Boolean(row.activo),
    })),
    institutionalRoles:
      institutionalRolesByUserId.get(volunteerRow.iam_user_id ?? "")?.map((row) => ({
        roleId: row.roleId,
        roleName: row.roleName,
        sedeId: row.sedeId,
        sedeName: row.sedeName,
      })) ?? [],
    documents: ((documentRowsResult.data ?? []) as Array<
      Pick<
        VolunteerDocumentRow,
        "id" | "tipo_documento" | "url_archivo" | "fecha_vencimiento" | "vigente"
      >
    >).map((row) => ({
      id: row.id,
      type: row.tipo_documento,
      url: row.url_archivo,
      expirationDate: row.fecha_vencimiento,
      isCurrent: Boolean(row.vigente),
    })),
    coordinatorProfile,
  };
}

export async function createVolunteer(
  input: VolunteerUpsertInput
): Promise<VolunteerDetailData> {
  try {
    return await upsertVolunteer(null, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear el voluntario."));
  }
}

export async function updateVolunteer(
  volunteerId: string,
  input: VolunteerUpsertInput
): Promise<VolunteerDetailData> {
  const targetId = sanitizeOptionalId(volunteerId);
  if (!targetId) {
    throw new Error("No se encontro el voluntario a editar.");
  }

  try {
    return await upsertVolunteer(targetId, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el voluntario."));
  }
}

export async function deactivateVolunteer(
  volunteerId: string
): Promise<VolunteerDetailData> {
  const tenantId = await getRequiredTenantId();
  const targetId = sanitizeOptionalId(volunteerId);
  if (!targetId) {
    throw new Error("No se encontro el voluntario a desactivar.");
  }

  const actorId = await resolveActorId();
  const catalogs = await fetchVolunteerCatalogs();
  const inactiveState =
    catalogs.stateOptions.find((option) => option.kind === "inactive") ??
    catalogs.stateOptions.find((option) => option.kind === "other") ??
    null;

  if (!inactiveState) {
    throw new Error("No existe un estado inactivo real en ong.estados_voluntario.");
  }

  const { error } = await ongSchema()
    .from("voluntarios")
    .update({
      codigo_estado: inactiveState.value,
      updated_by: actorId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", targetId);

  if (error) {
    throw new Error(error.message);
  }

  const detail = await getVolunteerDetail(targetId);
  if (!detail) {
    throw new Error("El voluntario fue actualizado, pero su detalle ya no esta disponible.");
  }

  return detail;
}
