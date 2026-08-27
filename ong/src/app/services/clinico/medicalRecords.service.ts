import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  BeneficiaryMedicalDetail,
  BeneficiaryMedicalRecordInput,
  BeneficiaryMedicalRecordRow,
  BeneficiaryProfileKind,
  SensitiveAccessState,
  SensitiveMedicalDetail,
  SensitiveMedicalListRow,
  SensitiveRecordScope,
  VolunteerSensitiveDetail,
  VolunteerSensitiveRecordInput,
  VolunteerSensitiveRecordRow,
} from "../../modules/people/types";
import {
  clinicoSchema,
  createTenantScopedQuery,
  ensureSensitiveAccess,
  getRequiredTenantId,
  ongSchema,
  resolveProfileLabels,
  resolveSensitiveAccessState,
  sanitizeOptionalId,
  sanitizePhone,
  sanitizeText,
  toFriendlyError,
  uniqueNonEmpty,
} from "../personas/shared";

type BeneficiaryRow = AppDatabase["ong"]["Tables"]["beneficiarios"]["Row"];
type VolunteerRow = AppDatabase["ong"]["Tables"]["voluntarios"]["Row"];
type BeneficiaryMedicalRow = AppDatabase["clinico"]["Tables"]["fichas_medicas"]["Row"];
type VolunteerSensitiveRow = AppDatabase["clinico"]["Tables"]["ficha_sensible_voluntario"]["Row"];
type ChildProfileRow = AppDatabase["clinico"]["Tables"]["perfil_nino"]["Row"];
type SeniorProfileRow = AppDatabase["clinico"]["Tables"]["perfil_adulto_mayor"]["Row"];

function resolveProfileKind(
  hasChildProfile: boolean,
  hasSeniorProfile: boolean
): BeneficiaryProfileKind {
  if (hasChildProfile) {
    return "child";
  }
  if (hasSeniorProfile) {
    return "senior";
  }
  return "general";
}

function resolveProfileLabel(profileKind: BeneficiaryProfileKind): string {
  if (profileKind === "child") {
    return "Nino";
  }
  if (profileKind === "senior") {
    return "Adulto mayor";
  }
  return "General";
}

function ensureAccessReason(reason: string): string {
  const cleaned = sanitizeText(reason, 250);
  if (!cleaned) {
    throw new Error("Debes indicar un motivo de acceso para abrir la ficha sensible.");
  }
  return cleaned;
}

function buildBeneficiaryMedicalSummary(options: {
  beneficiary: BeneficiaryRow;
  record: BeneficiaryMedicalRow | null;
  profileKind: BeneficiaryProfileKind;
}): BeneficiaryMedicalRecordRow {
  return {
    id: options.beneficiary.id,
    scope: "beneficiaries",
    personId: options.beneficiary.id,
    recordId: options.record?.id ?? null,
    personName: `${options.beneficiary.nombre} ${options.beneficiary.apellido}`.trim(),
    documentLabel: sanitizeText(options.beneficiary.numero_documento ?? null, 60) || "Sin documento",
    profileKind: options.profileKind,
    profileLabel: resolveProfileLabel(options.profileKind),
    hasRecord: Boolean(options.record),
    summary: options.record ? "Ficha médica registrada" : "Pendiente de creación",
    createdAt: options.record?.created_at ?? null,
    updatedAt: options.record?.updated_at ?? null,
    loggable: Boolean(options.record?.id),
  };
}

function buildVolunteerSensitiveSummary(options: {
  volunteer: VolunteerRow;
  record: VolunteerSensitiveRow | null;
}): VolunteerSensitiveRecordRow {
  return {
    id: options.volunteer.id,
    scope: "volunteers",
    personId: options.volunteer.id,
    recordId: options.record?.id ?? null,
    personName: `${options.volunteer.nombre} ${options.volunteer.apellido}`.trim(),
    documentLabel: sanitizeText(options.volunteer.numero_documento, 60),
    stateLabel: options.volunteer.codigo_estado,
    hasRecord: Boolean(options.record),
    summary: options.record ? "Ficha médica registrada" : "Pendiente de creación",
    createdAt: options.record?.created_at ?? null,
    updatedAt: options.record?.updated_at ?? null,
    loggable: false,
  };
}

async function fetchLatestBeneficiaryMedicalRecords(
  tenantId: string
): Promise<Map<string, BeneficiaryMedicalRow>> {
  const { data, error } = await createTenantScopedQuery(
    clinicoSchema()
      .from("fichas_medicas")
      .select(
        "id, id_beneficiario, created_at, updated_at"
      ),
    tenantId
  ).order("updated_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as BeneficiaryMedicalRow[];
  const latestByBeneficiaryId = new Map<string, BeneficiaryMedicalRow>();
  for (const row of rows) {
    if (!latestByBeneficiaryId.has(row.id_beneficiario)) {
      latestByBeneficiaryId.set(row.id_beneficiario, row);
    }
  }

  return latestByBeneficiaryId;
}

async function fetchLatestBeneficiaryMedicalRecordByBeneficiaryId(
  tenantId: string,
  beneficiaryId: string
): Promise<BeneficiaryMedicalRow | null> {
  const { data, error } = await createTenantScopedQuery(
    clinicoSchema()
      .from("fichas_medicas")
      .select(
        "id, id_beneficiario, tipos_sangre, alergias, condiciones_preexistentes, medicacion_actual, created_at, updated_at, created_by, updated_by"
      ),
    tenantId
  )
    .eq("id_beneficiario", beneficiaryId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as BeneficiaryMedicalRow[])[0] ?? null;
}

async function recordBeneficiarySensitiveAccess(options: {
  tenantId: string;
  recordId: string;
  actorId: string;
  reason: string;
}): Promise<void> {
  const { error } = await clinicoSchema().from("accesos_sensibles_log").insert({
    tenant_id: options.tenantId,
    id_ficha: options.recordId,
    usuario_id: options.actorId,
    motivo: options.reason,
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function recordVolunteerSensitiveAccess(options: {
  tenantId: string;
  recordId: string;
  actorId: string;
  reason: string;
}): Promise<void> {
  const { error } = await clinicoSchema()
    .from("accesos_sensibles_voluntario_log")
    .insert({
      tenant_id: options.tenantId,
      id_ficha_voluntario: options.recordId,
      usuario_id: options.actorId,
      motivo: options.reason,
    });

  if (error) {
    throw new Error(error.message);
  }
}

export async function getSensitiveAccessContext(): Promise<SensitiveAccessState> {
  return resolveSensitiveAccessState();
}

export async function listSensitiveMedicalRecords(
  scope: SensitiveRecordScope
): Promise<SensitiveMedicalListRow[]> {
  const accessState = await ensureSensitiveAccess();
  const tenantId = await getRequiredTenantId();

  void accessState;

  if (scope === "beneficiaries") {
    const [
      beneficiaryResult,
      childResult,
      seniorResult,
      latestMedicalByBeneficiaryId,
    ] = await Promise.all([
      createTenantScopedQuery(
        ongSchema()
          .from("beneficiarios")
          .select("id, numero_documento, nombre, apellido"),
        tenantId
      )
        .order("apellido", { ascending: true })
        .order("nombre", { ascending: true }),
      createTenantScopedQuery(
        clinicoSchema().from("perfil_nino").select("id_beneficiario"),
        tenantId
      ),
      createTenantScopedQuery(
        clinicoSchema().from("perfil_adulto_mayor").select("id_beneficiario"),
        tenantId
      ),
      fetchLatestBeneficiaryMedicalRecords(tenantId),
    ]);

    if (beneficiaryResult.error) {
      throw new Error(beneficiaryResult.error.message);
    }
    if (childResult.error) {
      throw new Error(childResult.error.message);
    }
    if (seniorResult.error) {
      throw new Error(seniorResult.error.message);
    }

    const childProfileIds = new Set(
      ((childResult.data ?? []) as Array<Pick<ChildProfileRow, "id_beneficiario">>).map(
        (row) => row.id_beneficiario
      )
    );
    const seniorProfileIds = new Set(
      ((seniorResult.data ?? []) as Array<Pick<SeniorProfileRow, "id_beneficiario">>).map(
        (row) => row.id_beneficiario
      )
    );

    return ((beneficiaryResult.data ?? []) as BeneficiaryRow[]).map((beneficiary) =>
      buildBeneficiaryMedicalSummary({
        beneficiary,
        record: latestMedicalByBeneficiaryId.get(beneficiary.id) ?? null,
        profileKind: resolveProfileKind(
          childProfileIds.has(beneficiary.id),
          seniorProfileIds.has(beneficiary.id)
        ),
      })
    );
  }

  const [volunteerResult, recordResult] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("voluntarios")
        .select("id, numero_documento, nombre, apellido, codigo_estado"),
      tenantId
    )
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    createTenantScopedQuery(
      clinicoSchema()
        .from("ficha_sensible_voluntario")
        .select(
          "id, id_voluntario, created_at, updated_at"
        ),
      tenantId
    ),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (recordResult.error) {
    throw new Error(recordResult.error.message);
  }

  const recordByVolunteerId = new Map(
    ((recordResult.data ?? []) as VolunteerSensitiveRow[]).map((row) => [row.id_voluntario, row])
  );

  return ((volunteerResult.data ?? []) as VolunteerRow[]).map((volunteer) =>
    buildVolunteerSensitiveSummary({
      volunteer,
      record: recordByVolunteerId.get(volunteer.id) ?? null,
    })
  );
}

export async function getSensitiveMedicalDetail(options: {
  scope: SensitiveRecordScope;
  personId: string;
  accessReason: string;
}): Promise<SensitiveMedicalDetail | null> {
  const accessState = await ensureSensitiveAccess();
  const tenantId = await getRequiredTenantId();
  const personId = sanitizeOptionalId(options.personId);
  if (!personId) {
    return null;
  }

  const accessReason = ensureAccessReason(options.accessReason);

  if (options.scope === "beneficiaries") {
    const [beneficiaryResult, record, childResult, seniorResult] = await Promise.all([
      createTenantScopedQuery(
        ongSchema()
          .from("beneficiarios")
          .select("id, numero_documento, nombre, apellido"),
        tenantId
      )
        .eq("id", personId)
        .maybeSingle(),
      fetchLatestBeneficiaryMedicalRecordByBeneficiaryId(tenantId, personId),
      createTenantScopedQuery(
        clinicoSchema()
          .from("perfil_nino")
          .select("id, nombre_tutor, telefono_tutor, colegio, grado_escolar"),
        tenantId
      )
        .eq("id_beneficiario", personId)
        .maybeSingle(),
      createTenantScopedQuery(
        clinicoSchema()
          .from("perfil_adulto_mayor")
          .select("id, movilidad_reducida, vive_solo, contacto_emergencia"),
        tenantId
      )
        .eq("id_beneficiario", personId)
        .maybeSingle(),
    ]);

    if (beneficiaryResult.error) {
      throw new Error(beneficiaryResult.error.message);
    }
    if (childResult.error) {
      throw new Error(childResult.error.message);
    }
    if (seniorResult.error) {
      throw new Error(seniorResult.error.message);
    }

    const beneficiary = beneficiaryResult.data as BeneficiaryRow | null;
    if (!beneficiary) {
      return null;
    }

    let accessLogged = false;
    let accessWarning: string | null = null;
    if (record?.id && accessState.currentUserId) {
      try {
        await recordBeneficiarySensitiveAccess({
          tenantId,
          recordId: record.id,
          actorId: accessState.currentUserId,
          reason: accessReason,
        });
        accessLogged = true;
      } catch (error) {
        accessWarning = toFriendlyError(
          error,
          "La ficha se abrio, pero no se pudo registrar el acceso sensible."
        );
      }
    }

    const ownerLabels = await resolveProfileLabels(
      uniqueNonEmpty([record?.created_by, record?.updated_by]),
      tenantId
    ).catch(() => new Map<string, string>());

    const profileKind = resolveProfileKind(Boolean(childResult.data), Boolean(seniorResult.data));

    const detail: BeneficiaryMedicalDetail = {
      scope: "beneficiaries",
      personId: beneficiary.id,
      recordId: record?.id ?? null,
      personName: `${beneficiary.nombre} ${beneficiary.apellido}`.trim(),
      documentLabel: sanitizeText(beneficiary.numero_documento ?? null, 60) || "Sin documento",
      profileKind,
      profileLabel: resolveProfileLabel(profileKind),
      hasRecord: Boolean(record),
      bloodType: sanitizeText(record?.tipos_sangre ?? null, 20),
      allergies: sanitizeText(record?.alergias ?? null, 500),
      preexistingConditions: sanitizeText(record?.condiciones_preexistentes ?? null, 500),
      currentMedication: sanitizeText(record?.medicacion_actual ?? null, 500),
      childProfile: childResult.data
        ? {
            id: childResult.data.id,
            tutorName: sanitizeText(childResult.data.nombre_tutor, 200),
            tutorPhone: sanitizeText(childResult.data.telefono_tutor ?? null, 50),
            school: sanitizeText(childResult.data.colegio ?? null, 200),
            schoolGrade: sanitizeText(childResult.data.grado_escolar ?? null, 50),
          }
        : null,
      seniorProfile: seniorResult.data
        ? {
            id: seniorResult.data.id,
            limitedMobility: Boolean(seniorResult.data.movilidad_reducida),
            livesAlone: Boolean(seniorResult.data.vive_solo),
            emergencyContact: sanitizeText(
              seniorResult.data.contacto_emergencia ?? null,
              200
            ),
          }
        : null,
      createdBy: ownerLabels.get(record?.created_by ?? "") ?? record?.created_by ?? "Sin dato",
      updatedBy: ownerLabels.get(record?.updated_by ?? "") ?? record?.updated_by ?? "Sin dato",
      updatedAt: record?.updated_at ?? null,
      accessLogged,
      accessWarning,
    };

    return detail;
  }

  const [volunteerResult, recordResult] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("voluntarios")
        .select("id, numero_documento, nombre, apellido, codigo_estado"),
      tenantId
    )
      .eq("id", personId)
      .maybeSingle(),
    createTenantScopedQuery(
      clinicoSchema()
        .from("ficha_sensible_voluntario")
        .select(
          "id, id_voluntario, condiciones_medicas, contacto_emergencia, telefono_emergencia, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    )
      .eq("id_voluntario", personId)
      .maybeSingle(),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (recordResult.error) {
    throw new Error(recordResult.error.message);
  }

  const volunteer = volunteerResult.data as VolunteerRow | null;
  if (!volunteer) {
    return null;
  }

  const record = recordResult.data as VolunteerSensitiveRow | null;
  const ownerLabels = await resolveProfileLabels(
    uniqueNonEmpty([record?.created_by, record?.updated_by]),
    tenantId
  ).catch(() => new Map<string, string>());

  let accessLogged = false;
  let accessWarning: string | null = null;
  if (record?.id && accessState.currentUserId) {
    try {
      await recordVolunteerSensitiveAccess({
        tenantId,
        recordId: record.id,
        actorId: accessState.currentUserId,
        reason: accessReason,
      });
      accessLogged = true;
    } catch (error) {
      accessWarning = toFriendlyError(
        error,
        "La ficha se abrio, pero no se pudo registrar el acceso sensible."
      );
    }
  }

  const detail: VolunteerSensitiveDetail = {
    scope: "volunteers",
    personId: volunteer.id,
    recordId: record?.id ?? null,
    personName: `${volunteer.nombre} ${volunteer.apellido}`.trim(),
    documentLabel: sanitizeText(volunteer.numero_documento, 60),
    hasRecord: Boolean(record),
    stateLabel: volunteer.codigo_estado,
    medicalConditions: sanitizeText(record?.condiciones_medicas ?? null, 500),
    emergencyContact: sanitizeText(record?.contacto_emergencia ?? null, 200),
    emergencyPhone: sanitizeText(record?.telefono_emergencia ?? null, 50),
    createdBy: ownerLabels.get(record?.created_by ?? "") ?? record?.created_by ?? "Sin dato",
    updatedBy: ownerLabels.get(record?.updated_by ?? "") ?? record?.updated_by ?? "Sin dato",
    updatedAt: record?.updated_at ?? null,
    accessLogged,
    accessWarning,
  };

  return detail;
}

export async function saveBeneficiaryMedicalRecord(options: {
  beneficiaryId: string;
  input: BeneficiaryMedicalRecordInput;
}): Promise<BeneficiaryMedicalDetail> {
  const accessState = await ensureSensitiveAccess();
  const tenantId = await getRequiredTenantId();
  const beneficiaryId = sanitizeOptionalId(options.beneficiaryId);
  if (!beneficiaryId) {
    throw new Error("No se encontro el beneficiario para guardar la ficha medica.");
  }

  const actorId = accessState.currentUserId;
  const input = options.input;
  const existing = await fetchLatestBeneficiaryMedicalRecordByBeneficiaryId(tenantId, beneficiaryId);

  const payload = {
    tenant_id: tenantId,
    id_beneficiario: beneficiaryId,
    tipos_sangre: sanitizeText(input.bloodType ?? null, 20),
    alergias: sanitizeText(input.allergies ?? null, 500),
    condiciones_preexistentes: sanitizeText(input.preexistingConditions ?? null, 500),
    medicacion_actual: sanitizeText(input.currentMedication ?? null, 500),
    updated_by: actorId,
  };

  if (existing) {
    const { error } = await clinicoSchema()
      .from("fichas_medicas")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", existing.id);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { error } = await clinicoSchema()
      .from("fichas_medicas")
      .insert({
        ...payload,
        created_by: actorId,
      });

    if (error) {
      throw new Error(error.message);
    }
  }

  const detail = await getSensitiveMedicalDetail({
    scope: "beneficiaries",
    personId: beneficiaryId,
    accessReason: input.accessReason,
  });

  if (!detail || detail.scope !== "beneficiaries") {
    throw new Error("No se pudo recuperar la ficha medica actualizada.");
  }

  return detail;
}

export async function saveVolunteerSensitiveRecord(options: {
  volunteerId: string;
  input: VolunteerSensitiveRecordInput;
}): Promise<VolunteerSensitiveDetail> {
  const accessState = await ensureSensitiveAccess();
  const tenantId = await getRequiredTenantId();
  const volunteerId = sanitizeOptionalId(options.volunteerId);
  if (!volunteerId) {
    throw new Error("No se encontro el voluntario para guardar la ficha sensible.");
  }

  const actorId = accessState.currentUserId;
  const input = options.input;

  const { data, error } = await createTenantScopedQuery(
    clinicoSchema().from("ficha_sensible_voluntario").select("id"),
    tenantId
  )
    .eq("id_voluntario", volunteerId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const payload = {
    tenant_id: tenantId,
    id_voluntario: volunteerId,
    condiciones_medicas: sanitizeText(input.medicalConditions ?? null, 500),
    contacto_emergencia: sanitizeText(input.emergencyContact ?? null, 200),
    telefono_emergencia: sanitizePhone(input.emergencyPhone),
    updated_by: actorId,
  };

  if (data?.id) {
    const { error: updateError } = await clinicoSchema()
      .from("ficha_sensible_voluntario")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", data.id);

    if (updateError) {
      throw new Error(updateError.message);
    }
  } else {
    const { error: insertError } = await clinicoSchema()
      .from("ficha_sensible_voluntario")
      .insert({
        ...payload,
        created_by: actorId,
      });

    if (insertError) {
      throw new Error(insertError.message);
    }
  }

  const detail = await getSensitiveMedicalDetail({
    scope: "volunteers",
    personId: volunteerId,
    accessReason: input.accessReason,
  });

  if (!detail || detail.scope !== "volunteers") {
    throw new Error("No se pudo recuperar la ficha sensible actualizada.");
  }

  return detail;
}

export interface MedicalRecordListItem {
  id_voluntario: string;
  volunteerName: string;
  volunteerDocument: string;
  hasRecord: boolean;
  conditions: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  updated_at: string | null;
}

export interface MedicalRecordDetail {
  id_voluntario: string;
  volunteerName: string;
  volunteerDocument: string;
  record_id: string | null;
  hasRecord: boolean;
  conditions: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

export async function listMedicalRecords(): Promise<MedicalRecordListItem[]> {
  const rows = await listSensitiveMedicalRecords("volunteers");

  return rows
    .filter(
      (
        row
      ): row is Extract<SensitiveMedicalListRow, { scope: "volunteers" }> =>
        row.scope === "volunteers"
    )
    .map((row) => ({
      id_voluntario: row.personId,
      volunteerName: row.personName,
      volunteerDocument: row.documentLabel,
      hasRecord: row.hasRecord,
      conditions: row.summary !== "Sin ficha sensible registrada" ? row.summary : null,
      emergencyContact: null,
      emergencyPhone: null,
      updated_at: row.updatedAt,
    }));
}

export async function getMedicalRecordDetailByVolunteerId(
  volunteerId: string
): Promise<MedicalRecordDetail | null> {
  const detail = await getSensitiveMedicalDetail({
    scope: "volunteers",
    personId: volunteerId,
    accessReason: "Consulta operativa de ficha sensible",
  });

  if (!detail || detail.scope !== "volunteers") {
    return null;
  }

  return {
    id_voluntario: detail.personId,
    volunteerName: detail.personName,
    volunteerDocument: detail.documentLabel,
    record_id: detail.recordId,
    hasRecord: detail.hasRecord,
    conditions: detail.medicalConditions || null,
    emergencyContact: detail.emergencyContact || null,
    emergencyPhone: detail.emergencyPhone || null,
    updated_at: detail.updatedAt,
    created_by: detail.createdBy || null,
    updated_by: detail.updatedBy || null,
  };
}

export interface ClinicalAgendaItem {
  id: string;
  titulo: string;
  fecha_inicio: string;
  fecha_fin: string;
  codigo_estado: string;
}

export async function getTodayClinicalAgenda(): Promise<ClinicalAgendaItem[]> {
  const tenantId = await getRequiredTenantId();
  // Using the general actividades table for today's agenda in the clinical dashboard.
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  
  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id, titulo, fecha_inicio, fecha_fin, codigo_estado")
    .eq("tenant_id", tenantId)
    // Basic prefix matching for today's date in timestamp fields
    .like("fecha_inicio", `${today}%`)
    .order("fecha_inicio", { ascending: true })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  return data as ClinicalAgendaItem[];
}
