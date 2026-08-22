import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  BeneficiaryCatalogData,
  BeneficiaryDetailData,
  BeneficiaryListData,
  BeneficiaryListRow,
  BeneficiaryProfileKind,
  BeneficiaryUpsertInput,
} from "../../modules/people/types";
import {
  clinicoSchema,
  createTenantScopedQuery,
  getRequiredTenantId,
  normalizeDateValue,
  ongSchema,
  publicSchema,
  resolveActorId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizePhone,
  sanitizeText,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type BeneficiaryRow = AppDatabase["ong"]["Tables"]["beneficiarios"]["Row"];
type BeneficiaryInsertPayload = AppDatabase["ong"]["Tables"]["beneficiarios"]["Insert"];
type BeneficiaryUpdatePayload = AppDatabase["ong"]["Tables"]["beneficiarios"]["Update"];
type ParticipationRow = AppDatabase["ong"]["Tables"]["participaciones_proyecto"]["Row"];
type ProjectRow = AppDatabase["ong"]["Tables"]["proyectos"]["Row"];
type MedicalRecordRow = AppDatabase["clinico"]["Tables"]["fichas_medicas"]["Row"];
type ChildProfileRow = AppDatabase["clinico"]["Tables"]["perfil_nino"]["Row"];
type SeniorProfileRow = AppDatabase["clinico"]["Tables"]["perfil_adulto_mayor"]["Row"];
type DocumentTypeRow = AppDatabase["public"]["Tables"]["cat_tipos_documento"]["Row"];
type GenderRow = AppDatabase["public"]["Tables"]["cat_generos"]["Row"];
type CountryRow = AppDatabase["public"]["Tables"]["cat_paises"]["Row"];

function mapCatalogOptions<TValue extends string>(
  rows: Array<{ codigo: TValue; nombre: string }>
) {
  return rows.map((row) => ({
    value: row.codigo,
    label: row.nombre,
  }));
}

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

function buildDocumentLabel(
  number: string | null,
  typeCode: string | null,
  documentTypeByCode: Map<string, string>
): string {
  const documentNumber = sanitizeText(number ?? null, 60);
  const typeLabel =
    (typeCode ? documentTypeByCode.get(typeCode) : null) ?? typeCode ?? "Sin documento";

  if (!documentNumber) {
    return typeLabel;
  }

  return `${documentNumber} Â· ${typeLabel}`;
}

function buildDisplayLabel(code: string | null, labelMap: Map<string, string>): string {
  if (!code) {
    return "Sin dato";
  }

  return labelMap.get(code) ?? code;
}

async function fetchBeneficiaryReferenceCatalogs() {
  const [documentTypeResult, genderResult, countryResult] = await Promise.all([
    publicSchema().from("cat_tipos_documento").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
    publicSchema().from("cat_generos").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
    publicSchema().from("cat_paises").select("codigo, nombre").order("nombre", {
      ascending: true,
    }),
  ]);

  if (documentTypeResult.error) {
    throw new Error(documentTypeResult.error.message);
  }
  if (genderResult.error) {
    throw new Error(genderResult.error.message);
  }
  if (countryResult.error) {
    throw new Error(countryResult.error.message);
  }

  return {
    documentTypeRows: (documentTypeResult.data ?? []) as DocumentTypeRow[],
    genderRows: (genderResult.data ?? []) as GenderRow[],
    countryRows: (countryResult.data ?? []) as CountryRow[],
  };
}

function buildBeneficiaryRow(options: {
  beneficiary: BeneficiaryRow;
  documentTypeByCode: Map<string, string>;
  genderByCode: Map<string, string>;
  countryByCode: Map<string, string>;
  childProfileIds: Set<string>;
  seniorProfileIds: Set<string>;
  projectCountByBeneficiaryId: Map<string, number>;
  latestMedicalByBeneficiaryId: Map<string, MedicalRecordRow>;
  medicalRecordCountByBeneficiaryId: Map<string, number>;
}): BeneficiaryListRow {
  const profileKind = resolveProfileKind(
    options.childProfileIds.has(options.beneficiary.id),
    options.seniorProfileIds.has(options.beneficiary.id)
  );
  const latestMedical = options.latestMedicalByBeneficiaryId.get(options.beneficiary.id) ?? null;
  const medicalRecordCount = options.medicalRecordCountByBeneficiaryId.get(options.beneficiary.id) ?? 0;

  return {
    id: options.beneficiary.id,
    fullName: `${options.beneficiary.nombre} ${options.beneficiary.apellido}`.trim(),
    firstName: options.beneficiary.nombre,
    lastName: options.beneficiary.apellido,
    documentNumber: sanitizeText(options.beneficiary.numero_documento ?? null, 60),
    documentType: options.beneficiary.tipo_documento,
    documentLabel: buildDocumentLabel(
      options.beneficiary.numero_documento,
      options.beneficiary.tipo_documento,
      options.documentTypeByCode
    ),
    countryCode: options.beneficiary.codigo_pais,
    countryLabel: buildDisplayLabel(options.beneficiary.codigo_pais, options.countryByCode),
    genderCode: options.beneficiary.genero,
    genderLabel: buildDisplayLabel(options.beneficiary.genero, options.genderByCode),
    birthDate: options.beneficiary.fecha_nacimiento,
    phone: sanitizeText(options.beneficiary.telefono ?? null, 50),
    address: sanitizeText(options.beneficiary.direccion ?? null, 250),
    photoUrl: options.beneficiary.foto_url,
    notes: sanitizeText(options.beneficiary.observaciones ?? null, 500),
    profileKind,
    profileLabel: resolveProfileLabel(profileKind),
    hasMedicalRecord: medicalRecordCount > 0,
    medicalRecordCount,
    projectCount: options.projectCountByBeneficiaryId.get(options.beneficiary.id) ?? 0,
    latestMedicalUpdateAt: latestMedical?.updated_at ?? null,
    createdAt: options.beneficiary.created_at,
    updatedAt: options.beneficiary.updated_at,
  };
}

async function ensureBeneficiaryUniqueFields(options: {
  tenantId: string;
  beneficiaryId?: string | null;
  documentType: string | null;
  documentNumber: string | null;
}) {
  const number = sanitizeText(options.documentNumber ?? null, 50);
  if (!number) {
    return;
  }

  let query = createTenantScopedQuery(
    ongSchema().from("beneficiarios").select("id"),
    options.tenantId
  )
    .eq("numero_documento", number)
    .eq("tipo_documento", options.documentType ?? "");

  if (options.beneficiaryId) {
    query = query.neq("id", options.beneficiaryId);
  }

  const { data, error } = await query.limit(1);
  if (error) {
    throw new Error(error.message);
  }
  if ((data ?? []).length > 0) {
    throw new Error("Ya existe un beneficiario con el mismo tipo y numero de documento.");
  }
}

async function ensureBeneficiaryInputValid(
  input: BeneficiaryUpsertInput
): Promise<void> {
  const catalogs = await fetchBeneficiaryCatalogs();

  if (!sanitizeText(input.firstName, 150)) {
    throw new Error("El nombre del beneficiario es obligatorio.");
  }
  if (!sanitizeText(input.lastName, 150)) {
    throw new Error("El apellido del beneficiario es obligatorio.");
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

  if (input.profileKind === "child" && !sanitizeText(input.childProfile?.tutorName ?? null, 200)) {
    throw new Error("El perfil de nino requiere nombre del tutor.");
  }
}

async function upsertBeneficiaryBase(
  tenantId: string,
  beneficiaryId: string | null,
  input: BeneficiaryUpsertInput,
  actorId: string | null
): Promise<string> {
  await ensureBeneficiaryUniqueFields({
    tenantId,
    beneficiaryId,
    documentType: input.documentType,
    documentNumber: input.documentNumber,
  });

  const payload: BeneficiaryUpdatePayload = {
    tenant_id: tenantId,
    numero_documento: sanitizeText(input.documentNumber ?? null, 50) || null,
    tipo_documento: sanitizeOptionalId(input.documentType ?? null),
    codigo_pais: sanitizeOptionalId(input.countryCode ?? null) ?? "PE",
    nombre: sanitizeText(input.firstName, 150),
    apellido: sanitizeText(input.lastName, 150),
    fecha_nacimiento: normalizeDateValue(input.birthDate),
    genero: sanitizeOptionalId(input.genderCode ?? null),
    telefono: sanitizePhone(input.phone),
    direccion: sanitizeText(input.address ?? null, 250) || null,
    foto_url: sanitizeText(input.photoUrl ?? null, 400) || null,
    observaciones: sanitizeText(input.notes ?? null, 500) || null,
    updated_by: actorId,
  };

  if (beneficiaryId) {
    const { error } = await ongSchema()
      .from("beneficiarios")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", beneficiaryId);

    if (error) {
      throw new Error(error.message);
    }
    return beneficiaryId;
  }

  const { data, error } = await ongSchema()
    .from("beneficiarios")
    .insert({
      ...payload,
      created_by: actorId,
    } satisfies BeneficiaryInsertPayload)
    .select("id")
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const createdId = data?.[0]?.id ?? null;
  if (!createdId) {
    throw new Error("No se pudo recuperar el beneficiario creado.");
  }

  return createdId;
}

async function syncBeneficiaryProfiles(
  tenantId: string,
  beneficiaryId: string,
  input: BeneficiaryUpsertInput,
  actorId: string | null
) {
  const [childResult, seniorResult] = await Promise.all([
    createTenantScopedQuery(
      clinicoSchema().from("perfil_nino").select("id"),
      tenantId
    )
      .eq("id_beneficiario", beneficiaryId)
      .maybeSingle(),
    createTenantScopedQuery(
      clinicoSchema().from("perfil_adulto_mayor").select("id"),
      tenantId
    )
      .eq("id_beneficiario", beneficiaryId)
      .maybeSingle(),
  ]);

  if (childResult.error) {
    throw new Error(childResult.error.message);
  }
  if (seniorResult.error) {
    throw new Error(seniorResult.error.message);
  }

  const currentChildId = childResult.data?.id ?? null;
  const currentSeniorId = seniorResult.data?.id ?? null;

  if (input.profileKind === "child") {
    const payload = {
      tenant_id: tenantId,
      id_beneficiario: beneficiaryId,
      nombre_tutor: sanitizeText(input.childProfile?.tutorName ?? null, 200),
      telefono_tutor: sanitizePhone(input.childProfile?.tutorPhone ?? null),
      colegio: sanitizeText(input.childProfile?.school ?? null, 200) || null,
      grado_escolar: sanitizeText(input.childProfile?.schoolGrade ?? null, 50) || null,
      updated_by: actorId,
    };

    if (currentChildId) {
      const { error } = await clinicoSchema()
        .from("perfil_nino")
        .update(payload)
        .eq("tenant_id", tenantId)
        .eq("id", currentChildId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await clinicoSchema()
        .from("perfil_nino")
        .insert({
          ...payload,
          created_by: actorId,
        });

      if (error) {
        throw new Error(error.message);
      }
    }

    if (currentSeniorId) {
      const { error } = await clinicoSchema()
        .from("perfil_adulto_mayor")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", currentSeniorId);

      if (error) {
        throw new Error(error.message);
      }
    }
    return;
  }

  if (input.profileKind === "senior") {
    const payload = {
      tenant_id: tenantId,
      id_beneficiario: beneficiaryId,
      movilidad_reducida: input.seniorProfile?.limitedMobility ?? false,
      vive_solo: input.seniorProfile?.livesAlone ?? false,
      contacto_emergencia:
        sanitizeText(input.seniorProfile?.emergencyContact ?? null, 200) || null,
      updated_by: actorId,
    };

    if (currentSeniorId) {
      const { error } = await clinicoSchema()
        .from("perfil_adulto_mayor")
        .update(payload)
        .eq("tenant_id", tenantId)
        .eq("id", currentSeniorId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { error } = await clinicoSchema()
        .from("perfil_adulto_mayor")
        .insert({
          ...payload,
          created_by: actorId,
        });

      if (error) {
        throw new Error(error.message);
      }
    }

    if (currentChildId) {
      const { error } = await clinicoSchema()
        .from("perfil_nino")
        .delete()
        .eq("tenant_id", tenantId)
        .eq("id", currentChildId);

      if (error) {
        throw new Error(error.message);
      }
    }
    return;
  }

  if (currentChildId) {
    const { error } = await clinicoSchema()
      .from("perfil_nino")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", currentChildId);

    if (error) {
      throw new Error(error.message);
    }
  }
  if (currentSeniorId) {
    const { error } = await clinicoSchema()
      .from("perfil_adulto_mayor")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", currentSeniorId);

    if (error) {
      throw new Error(error.message);
    }
  }
}

async function upsertBeneficiary(
  beneficiaryId: string | null,
  input: BeneficiaryUpsertInput
): Promise<BeneficiaryDetailData> {
  const tenantId = await getRequiredTenantId();
  const actorId = await resolveActorId();

  await ensureBeneficiaryInputValid(input);
  const targetBeneficiaryId = await upsertBeneficiaryBase(
    tenantId,
    beneficiaryId,
    input,
    actorId
  );

  await syncBeneficiaryProfiles(tenantId, targetBeneficiaryId, input, actorId);

  const detail = await getBeneficiaryDetail(targetBeneficiaryId);
  if (!detail) {
    throw new Error("No se pudo recuperar el detalle del beneficiario guardado.");
  }

  return detail;
}

export async function fetchBeneficiaryCatalogs(): Promise<BeneficiaryCatalogData> {
  const catalogs = await fetchBeneficiaryReferenceCatalogs();

  return {
    documentTypeOptions: mapCatalogOptions(catalogs.documentTypeRows),
    genderOptions: mapCatalogOptions(catalogs.genderRows),
    countryOptions: mapCatalogOptions(catalogs.countryRows),
  };
}

export async function listBeneficiaries(): Promise<BeneficiaryListData> {
  const tenantId = await getRequiredTenantId();
  const [beneficiaryResult, catalogs, childResult, seniorResult, medicalResult, participationResult] =
    await Promise.all([
      createTenantScopedQuery(
        ongSchema()
          .from("beneficiarios")
          .select(
            "id, numero_documento, tipo_documento, codigo_pais, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, foto_url, observaciones, created_at, updated_at"
          ),
        tenantId
      )
        .order("apellido", { ascending: true })
        .order("nombre", { ascending: true }),
      fetchBeneficiaryReferenceCatalogs(),
      createTenantScopedQuery(
        clinicoSchema().from("perfil_nino").select("id_beneficiario"),
        tenantId
      ),
      createTenantScopedQuery(
        clinicoSchema().from("perfil_adulto_mayor").select("id_beneficiario"),
        tenantId
      ),
      createTenantScopedQuery(
        clinicoSchema().from("fichas_medicas").select("id, id_beneficiario, updated_at"),
        tenantId
      ).order("updated_at", { ascending: false }),
      createTenantScopedQuery(
        ongSchema().from("participaciones_proyecto").select("id_beneficiario"),
        tenantId
      ),
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
  if (medicalResult.error) {
    throw new Error(medicalResult.error.message);
  }
  if (participationResult.error) {
    throw new Error(participationResult.error.message);
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
  const projectCountByBeneficiaryId = new Map<string, number>();
  for (const row of (participationResult.data ?? []) as Array<
    Pick<ParticipationRow, "id_beneficiario">
  >) {
    projectCountByBeneficiaryId.set(
      row.id_beneficiario,
      (projectCountByBeneficiaryId.get(row.id_beneficiario) ?? 0) + 1
    );
  }

  const latestMedicalByBeneficiaryId = new Map<string, MedicalRecordRow>();
  const medicalRecordCountByBeneficiaryId = new Map<string, number>();
  for (const row of (medicalResult.data ?? []) as Array<
    Pick<MedicalRecordRow, "id" | "id_beneficiario" | "updated_at">
  >) {
    medicalRecordCountByBeneficiaryId.set(
      row.id_beneficiario,
      (medicalRecordCountByBeneficiaryId.get(row.id_beneficiario) ?? 0) + 1
    );
    if (!latestMedicalByBeneficiaryId.has(row.id_beneficiario)) {
      latestMedicalByBeneficiaryId.set(row.id_beneficiario, row as MedicalRecordRow);
    }
  }

  return {
    rows: ((beneficiaryResult.data ?? []) as BeneficiaryRow[]).map((beneficiary) =>
      buildBeneficiaryRow({
        beneficiary,
        documentTypeByCode,
        genderByCode,
        countryByCode,
        childProfileIds,
        seniorProfileIds,
        projectCountByBeneficiaryId,
        latestMedicalByBeneficiaryId,
        medicalRecordCountByBeneficiaryId,
      })
    ),
  };
}

export async function getBeneficiaryDetail(
  beneficiaryId: string
): Promise<BeneficiaryDetailData | null> {
  const tenantId = await getRequiredTenantId();
  const targetId = sanitizeOptionalId(beneficiaryId);
  if (!targetId) {
    return null;
  }

  const [listData, beneficiaryResult, childResult, seniorResult, participationResult] =
    await Promise.all([
      listBeneficiaries(),
      createTenantScopedQuery(
        ongSchema()
          .from("beneficiarios")
          .select(
            "id, numero_documento, tipo_documento, codigo_pais, nombre, apellido, fecha_nacimiento, genero, telefono, direccion, foto_url, observaciones, created_at, created_by, updated_at, updated_by"
          ),
        tenantId
      )
        .eq("id", targetId)
        .maybeSingle(),
      createTenantScopedQuery(
        clinicoSchema()
          .from("perfil_nino")
          .select("id, nombre_tutor, telefono_tutor, colegio, grado_escolar"),
        tenantId
      )
        .eq("id_beneficiario", targetId)
        .maybeSingle(),
      createTenantScopedQuery(
        clinicoSchema()
          .from("perfil_adulto_mayor")
          .select("id, movilidad_reducida, vive_solo, contacto_emergencia"),
        tenantId
      )
        .eq("id_beneficiario", targetId)
        .maybeSingle(),
      createTenantScopedQuery(
        ongSchema()
          .from("participaciones_proyecto")
          .select("id, id_proyecto, fecha_vinculacion, observaciones"),
        tenantId
      )
        .eq("id_beneficiario", targetId)
        .order("fecha_vinculacion", { ascending: false }),
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
  if (participationResult.error) {
    throw new Error(participationResult.error.message);
  }

  const beneficiaryRow = beneficiaryResult.data as
    | (BeneficiaryRow & { created_by: string | null; updated_by: string | null })
    | null;
  if (!beneficiaryRow) {
    return null;
  }

  const summaryRow = listData.rows.find((row) => row.id === targetId);
  if (!summaryRow) {
    throw new Error("No se pudo reconstruir el resumen del beneficiario.");
  }

  const participationRows = (participationResult.data ?? []) as Array<
    Pick<ParticipationRow, "id" | "id_proyecto" | "fecha_vinculacion" | "observaciones">
  >;
  const projectIds = uniqueNonEmpty(participationRows.map((row) => row.id_proyecto));
  const projectMap = new Map<string, string>();
  if (projectIds.length) {
    const { data, error } = await createTenantScopedQuery(
      ongSchema().from("proyectos").select("id, nombre_proyecto"),
      tenantId
    ).in("id", projectIds);

    if (error) {
      throw new Error(error.message);
    }

    for (const project of (data ?? []) as Array<Pick<ProjectRow, "id" | "nombre_proyecto">>) {
      projectMap.set(project.id, project.nombre_proyecto);
    }
  }

  const profileLabels = await resolveProfileLabels(
    uniqueNonEmpty([beneficiaryRow.created_by, beneficiaryRow.updated_by]),
    tenantId
  ).catch(() => new Map<string, string>());

  const childProfile = childResult.data
    ? {
        id: childResult.data.id,
        tutorName: sanitizeText(childResult.data.nombre_tutor, 200),
        tutorPhone: sanitizeText(childResult.data.telefono_tutor ?? null, 50),
        school: sanitizeText(childResult.data.colegio ?? null, 200),
        schoolGrade: sanitizeText(childResult.data.grado_escolar ?? null, 50),
      }
    : null;
  const seniorProfile = seniorResult.data
    ? {
        id: seniorResult.data.id,
        limitedMobility: Boolean(seniorResult.data.movilidad_reducida),
        livesAlone: Boolean(seniorResult.data.vive_solo),
        emergencyContact: sanitizeText(seniorResult.data.contacto_emergencia ?? null, 200),
      }
    : null;

  return {
    beneficiary: summaryRow,
    createdBy:
      profileLabels.get(beneficiaryRow.created_by ?? "") ?? beneficiaryRow.created_by ?? "Sin dato",
    updatedBy:
      profileLabels.get(beneficiaryRow.updated_by ?? "") ?? beneficiaryRow.updated_by ?? "Sin dato",
    childProfile,
    seniorProfile,
    projectLinks: participationRows.map((row) => ({
      id: row.id,
      projectId: row.id_proyecto,
      projectName: projectMap.get(row.id_proyecto) ?? row.id_proyecto,
      linkedAt: row.fecha_vinculacion ?? "",
      notes: sanitizeText(row.observaciones ?? null, 500),
    })),
  };
}

export async function createBeneficiary(
  input: BeneficiaryUpsertInput
): Promise<BeneficiaryDetailData> {
  try {
    return await upsertBeneficiary(null, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear el beneficiario."));
  }
}

export async function updateBeneficiary(
  beneficiaryId: string,
  input: BeneficiaryUpsertInput
): Promise<BeneficiaryDetailData> {
  const targetId = sanitizeOptionalId(beneficiaryId);
  if (!targetId) {
    throw new Error("No se encontro el beneficiario a editar.");
  }

  try {
    return await upsertBeneficiary(targetId, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el beneficiario."));
  }
}

