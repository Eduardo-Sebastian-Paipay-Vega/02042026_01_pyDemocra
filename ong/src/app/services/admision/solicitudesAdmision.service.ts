import { supabase } from "../../../supabaseClient";
import {
  loadCatalogRows,
  normalizeText,
  publicSchema,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
  resolveActorId,
} from "../recursos/shared";
import type {
  AdmissionConvertInput,
  AdmissionConvertResult,
  AdmissionCreateInput,
  AdmissionDetailCapabilities,
  AdmissionDocumentRow,
  AdmissionFilters,
  AdmissionGenerateRegistrationCodeInput,
  AdmissionHistoryItem,
  AdmissionInterviewRow,
  AdmissionKpis,
  AdmissionListData,
  AdmissionOnboardingStepRow,
  AdmissionRegistrationCodeRow,
  AdmissionRequestDetailData,
  AdmissionRequestRow,
  AdmissionReferenceCatalogs,
  AdmissionStateChangeInput,
  AdmissionStateCode,
  AdmissionStateKind,
  AdmissionStateOption,
  AdmissionUpdateInput,
  AdmissionVolunteerSummary,
} from "../../modules/admission/types";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const ADMISSION_STATE_OPTIONS: AdmissionStateOption[] = [
  { value: "nueva", label: "Nueva", kind: "received", variant: "secondary" },
  { value: "en_entrevista", label: "En entrevista", kind: "interview", variant: "warning" },
  { value: "aprobada", label: "Aprobada", kind: "approved", variant: "success" },
  { value: "rechazada", label: "Rechazada", kind: "rejected", variant: "destructive" },
];

const REQUEST_SELECT =
  "id, tenant_id, nombres, apellidos, email, estado, fecha_solicitud, notas, id_voluntario_vinculado, created_at, updated_at, created_by, updated_by";
const DOCUMENT_SELECT =
  "id, tenant_id, id_solicitud, tipo_documento, archivo_url, verificado, verified_by, verified_at, created_at, updated_at, created_by, updated_by";
const INTERVIEW_SELECT =
  "id, tenant_id, id_solicitud, entrevistador_id, fecha_entrevista, comentarios, resultado, puntaje, created_at, updated_at, created_by, updated_by";
const ONBOARDING_SELECT =
  "id, tenant_id, id_voluntario, id_paso, completado, fecha_completado, evidencia_url, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by";

interface TenantRow {
  tenant_id: string;
}

interface SolicitudRow extends TenantRow {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  estado: string;
  fecha_solicitud: string | null;
  notas: string | null;
  id_voluntario_vinculado: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface DocumentoRow extends TenantRow {
  id: string;
  id_solicitud: string;
  tipo_documento: string;
  archivo_url: string;
  verificado: boolean | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface EntrevistaRow extends TenantRow {
  id: string;
  id_solicitud: string;
  entrevistador_id: string;
  fecha_entrevista: string;
  comentarios: string | null;
  resultado: string | null;
  puntaje: number | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface OnboardingPasoRow extends TenantRow {
  id: string;
  nombre_paso: string;
  orden: number;
  obligatorio: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface OnboardingVoluntarioRow extends TenantRow {
  id: string;
  id_voluntario: string;
  id_paso: string;
  completado: boolean | null;
  fecha_completado: string | null;
  evidencia_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

interface HistorialRow extends TenantRow {
  id: string;
  id_solicitud: string;
  estado_anterior: string | null;
  estado_nuevo: string;
  comentario: string | null;
  cambiado_por: string;
  fecha_cambio: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface VolunteerRow extends TenantRow {
  id: string;
  numero_documento: string;
  tipo_documento: string | null;
  genero: string | null;
  codigo_pais: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  email: string | null;
  telefono: string | null;
  ruta_foto: string | null;
  codigo_estado: string;
  observaciones: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  updated_by: string | null;
}

interface CatalogRow {
  codigo: string;
  nombre: string;
}

interface VolunteerStateCatalogRow {
  codigo: string;
  nombre_estado: string;
}

interface RegistrationCodeRow extends TenantRow {
  id: string;
  codigo: string;
  email_objetivo: string | null;
  numero_documento_objetivo: string | null;
  nombres_objetivo: string | null;
  apellidos_objetivo: string | null;
  id_solicitud: string | null;
  id_voluntario: string | null;
  expires_at: string;
  max_uses: number;
  use_count: number;
  estado: string;
  created_at: string;
  updated_at: string;
}

function rrhhSchema() {
  return supabase.schema("rrhh");
}

function ongSchema() {
  return supabase.schema("ong");
}

async function resolveCurrentTenantId(): Promise<string> {
  const { data, error } = await supabase.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(`No se pudo resolver el tenant actual: ${error.message}`);
  }

  const tenantId = typeof data === "string" ? data.trim() : "";
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  return tenantId;
}

function resolvePage(value: number | null | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }
  return Math.floor(value);
}

function resolvePageSize(value: number | null | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

function isFiniteDate(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }
  return !Number.isNaN(new Date(value).getTime());
}

function normalizeAdmissionState(value: string | null | undefined): AdmissionStateKind {
  const normalized = normalizeText(value).replace(/\s+/g, "");
  if (!normalized) {
    return "other";
  }
  if (
    normalized.includes("enentrevista") ||
    normalized.includes("entrevista") ||
    normalized.includes("evaluacion")
  ) {
    return "interview";
  }
  if (normalized.includes("aprob")) {
    return "approved";
  }
  if (normalized.includes("rechaz")) {
    return "rejected";
  }
  if (normalized.includes("onboard") || normalized.includes("incorp") || normalized.includes("inducc")) {
    return "onboarding";
  }
  if (normalized.includes("revis") || normalized.includes("observ") || normalized.includes("pend")) {
    return "review";
  }
  if (normalized.includes("nueva") || normalized.includes("recib") || normalized.includes("registr")) {
    return "received";
  }
  return "other";
}

function mapAdmissionStateVariant(kind: AdmissionStateKind) {
  if (kind === "approved") return "success";
  if (kind === "rejected") return "destructive";
  if (kind === "interview") return "warning";
  if (kind === "review") return "info";
  if (kind === "onboarding") return "info";
  if (kind === "received") return "secondary";
  return "default";
}

function mapAdmissionStateLabel(stateCode: string): string {
  return ADMISSION_STATE_OPTIONS.find((item) => item.value === stateCode)?.label ?? stateCode;
}

function resolveStatusCodesForFilter(status: AdmissionStateKind): string[] | null {
  if (status === "all") {
    return null;
  }
  if (status === "received") {
    return ["nueva"];
  }
  if (status === "interview") {
    return ["en_entrevista"];
  }
  if (status === "approved") {
    return ["aprobada"];
  }
  if (status === "rejected") {
    return ["rechazada"];
  }
  if (status === "review") {
    return ["nueva"];
  }
  if (status === "onboarding") {
    return ["aprobada"];
  }
  return null;
}

function mapRequestRow(
  row: SolicitudRow,
  linkedVolunteer: AdmissionVolunteerSummary | null,
  volunteer: AdmissionVolunteerSummary | null
): AdmissionRequestRow {
  const stateCode = row.estado as AdmissionStateCode;
  const stateKind = normalizeAdmissionState(row.estado);
  const resolvedVolunteer = linkedVolunteer ?? volunteer;
  const resolvedVolunteerSource = linkedVolunteer
    ? "direct"
    : volunteer
      ? "email"
      : "none";
  return {
    id: row.id,
    nombres: row.nombres,
    apellidos: row.apellidos,
    fullName: `${row.nombres} ${row.apellidos}`.trim(),
    email: row.email,
    stateCode,
    stateName: mapAdmissionStateLabel(stateCode),
    stateKind,
    stateVariant: mapAdmissionStateVariant(stateKind),
    notes: row.notas ?? "",
    submittedAt: toDateTimeLabel(row.fecha_solicitud),
    rawSubmittedAt: row.fecha_solicitud ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
    linkedVolunteerId: row.id_voluntario_vinculado ?? null,
    linkedVolunteerName: linkedVolunteer?.fullName ?? null,
    resolvedVolunteerId: resolvedVolunteer?.id ?? null,
    resolvedVolunteerName: resolvedVolunteer?.fullName ?? null,
    resolvedVolunteerSource,
  };
}

function mapRegistrationCodeRow(row: RegistrationCodeRow): AdmissionRegistrationCodeRow {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    code: row.codigo,
    targetEmail: row.email_objetivo,
    targetDocumentNumber: row.numero_documento_objetivo,
    targetFullName: [row.nombres_objetivo ?? "", row.apellidos_objetivo ?? ""]
      .filter(Boolean)
      .join(" ")
      .trim(),
    requestId: row.id_solicitud,
    volunteerId: row.id_voluntario,
    status: row.estado,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usesLabel: `${row.use_count}/${row.max_uses}`,
  };
}

async function fetchVolunteerMatchesByEmail(
  tenantId: string,
  emails: string[]
): Promise<Map<string, AdmissionVolunteerSummary>> {
  const uniqueEmails = Array.from(
    new Set(emails.map((email) => sanitizeText(email, 255).toLowerCase()).filter(Boolean))
  );

  if (!uniqueEmails.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select(
      "id, numero_documento, tipo_documento, nombre, apellido, email, telefono, codigo_estado, tenant_id"
    )
    .eq("tenant_id", tenantId)
    .in("email", uniqueEmails);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as VolunteerRow[];
  const result = new Map<string, AdmissionVolunteerSummary>();

  for (const row of rows) {
    if (!row.email) {
      continue;
    }

    result.set(row.email.toLowerCase(), {
      id: row.id,
      fullName: `${row.nombre} ${row.apellido}`.trim(),
      email: row.email,
      phone: row.telefono,
      documentNumber: row.numero_documento,
      documentType: row.tipo_documento,
      stateCode: row.codigo_estado,
    });
  }

  return result;
}

async function fetchVolunteersByIds(
  tenantId: string,
  volunteerIds: Array<string | null | undefined>
): Promise<Map<string, AdmissionVolunteerSummary>> {
  const uniqueIds = Array.from(
    new Set(volunteerIds.map((value) => sanitizeOptionalId(value)).filter(Boolean))
  );

  if (!uniqueIds.length) {
    return new Map();
  }

  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select(
      "id, numero_documento, tipo_documento, nombre, apellido, email, telefono, codigo_estado, tenant_id"
    )
    .eq("tenant_id", tenantId)
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as VolunteerRow[];
  return new Map(
    rows.map((row) => [
      row.id,
      {
        id: row.id,
        fullName: `${row.nombre} ${row.apellido}`.trim(),
        email: row.email,
        phone: row.telefono,
        documentNumber: row.numero_documento,
        documentType: row.tipo_documento,
        stateCode: row.codigo_estado,
      },
    ])
  );
}

async function fetchProfileLabelsByIds(
  tenantId: string,
  userIds: string[]
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(
    new Set(userIds.map((value) => sanitizeOptionalId(value)).filter(Boolean))
  );

  if (!uniqueIds.length) {
    return new Map();
  }

  const { data, error } = await publicSchema()
    .from("profiles")
    .select("id, full_name, tenant_id")
    .eq("tenant_id", tenantId)
    .in("id", uniqueIds);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Array<{ id: string; full_name: string | null }>;
  return new Map(rows.map((row) => [row.id, row.full_name?.trim() || row.id]));
}

async function fetchRequestById(
  tenantId: string,
  requestId: string
): Promise<SolicitudRow | null> {
  const { data, error } = await rrhhSchema()
    .from("solicitudes_admision")
    .select(REQUEST_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id", requestId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? [])[0] as SolicitudRow | undefined) ?? null;
}

async function fetchVolunteerById(
  tenantId: string,
  volunteerId: string
): Promise<AdmissionVolunteerSummary | null> {
  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select(
      "id, numero_documento, tipo_documento, nombre, apellido, email, telefono, codigo_estado, tenant_id"
    )
    .eq("tenant_id", tenantId)
    .eq("id", volunteerId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const row = ((data ?? [])[0] as VolunteerRow | undefined) ?? null;
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    fullName: `${row.nombre} ${row.apellido}`.trim(),
    email: row.email,
    phone: row.telefono,
    documentNumber: row.numero_documento,
    documentType: row.tipo_documento,
    stateCode: row.codigo_estado,
  };
}

async function fetchDocumentRows(
  tenantId: string,
  requestId: string
): Promise<DocumentoRow[]> {
  const { data, error } = await rrhhSchema()
    .from("documentos_admision")
    .select(DOCUMENT_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id_solicitud", requestId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DocumentoRow[];
}

async function fetchInterviewRows(
  tenantId: string,
  requestId: string
): Promise<EntrevistaRow[]> {
  const { data, error } = await rrhhSchema()
    .from("entrevistas_admision")
    .select(INTERVIEW_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id_solicitud", requestId)
    .order("fecha_entrevista", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as EntrevistaRow[];
}

async function fetchOnboardingSteps(tenantId: string): Promise<OnboardingPasoRow[]> {
  const { data, error } = await rrhhSchema()
    .from("onboarding_pasos")
    .select(
      "id, tenant_id, nombre_paso, orden, obligatorio, created_at, updated_at, created_by, updated_by"
    )
    .eq("tenant_id", tenantId)
    .order("orden", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OnboardingPasoRow[];
}

async function fetchOnboardingRows(
  tenantId: string,
  volunteerId: string,
  options?: {
    includeDeleted?: boolean;
  }
): Promise<OnboardingVoluntarioRow[]> {
  let query = rrhhSchema()
    .from("onboarding_voluntario")
    .select(ONBOARDING_SELECT)
    .eq("tenant_id", tenantId)
    .eq("id_voluntario", volunteerId);

  if (!options?.includeDeleted) {
    query = query.eq("is_deleted", false);
  }

  const { data, error } = await query.order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as OnboardingVoluntarioRow[];
}

async function fetchHistoryRows(
  tenantId: string,
  requestId: string
): Promise<HistorialRow[]> {
  const { data, error } = await rrhhSchema()
    .from("admision_estado_historial")
    .select(
      "id, tenant_id, id_solicitud, estado_anterior, estado_nuevo, comentario, cambiado_por, fecha_cambio, created_at, updated_at"
    )
    .eq("tenant_id", tenantId)
    .eq("id_solicitud", requestId)
    .order("fecha_cambio", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as HistorialRow[];
}

function mapDocumentRow(
  row: DocumentoRow,
  requestName: string,
  documentTypeLabels: Map<string, string>,
  profileLabels: Map<string, string>
): AdmissionDocumentRow {
  return {
    id: row.id,
    requestId: row.id_solicitud,
    requestName,
    type: documentTypeLabels.get(row.tipo_documento) ?? row.tipo_documento,
    fileUrl: row.archivo_url,
    verified: Boolean(row.verificado),
    verifiedById: row.verified_by ?? null,
    verifiedByLabel: row.verified_by ? profileLabels.get(row.verified_by) ?? row.verified_by : null,
    verifiedAt: row.verified_at ?? null,
    verifiedAtLabel: toDateTimeLabel(row.verified_at),
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? "",
  };
}

function mapInterviewRow(
  row: EntrevistaRow,
  requestName: string,
  interviewerLabel: string
): AdmissionInterviewRow {
  return {
    id: row.id,
    requestId: row.id_solicitud,
    requestName,
    scheduledAt: toDateTimeLabel(row.fecha_entrevista),
    scheduledAtRaw: row.fecha_entrevista,
    interviewerId: row.entrevistador_id,
    interviewerLabel,
    result: row.resultado ?? "pendiente",
    comment: row.comentarios ?? "",
    score: row.puntaje ?? null,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? row.created_at ?? "",
  };
}

function mapOnboardingRow(
  step: OnboardingPasoRow,
  volunteer: AdmissionVolunteerSummary,
  onboardingRow: OnboardingVoluntarioRow | undefined
): AdmissionOnboardingStepRow {
  return {
    id: onboardingRow?.id ?? step.id,
    volunteerId: volunteer.id,
    volunteerName: volunteer.fullName,
    stepId: step.id,
    stepName: step.nombre_paso,
    order: step.orden,
    mandatory: Boolean(step.obligatorio),
    completed: Boolean(onboardingRow?.completado),
    completedAt: onboardingRow?.fecha_completado ?? null,
    evidenceUrl: onboardingRow?.evidencia_url ?? null,
    createdAt: onboardingRow?.created_at ?? step.created_at ?? "",
    updatedAt: onboardingRow?.updated_at ?? step.updated_at ?? step.created_at ?? "",
    isLocked: false,
  };
}

function applyOnboardingStepLocking(
  steps: AdmissionOnboardingStepRow[]
): AdmissionOnboardingStepRow[] {
  const sorted = [...steps].sort((a, b) => a.order - b.order);
  return sorted.map((step, index) => {
    if (index === 0) {
      return step;
    }
    const prevMandatoryIncomplete = sorted
      .slice(0, index)
      .some((prev) => prev.mandatory && !prev.completed);
    if (!prevMandatoryIncomplete) {
      return step;
    }
    const blocker = sorted.slice(0, index).find((prev) => prev.mandatory && !prev.completed);
    return {
      ...step,
      isLocked: true,
      blockReason: blocker
        ? `Completa "${blocker.stepName}" primero.`
        : "Hay pasos obligatorios anteriores sin completar.",
    };
  });
}

function summarizeStateCounts(rows: SolicitudRow[]) {
  const counts: AdmissionKpis = {
    total: rows.length,
    pending: 0,
    review: 0,
    interview: 0,
    onboarding: 0,
    approved: 0,
    rejected: 0,
    converted: 0,
    pendingConversion: 0,
  };

  for (const row of rows) {
    const kind = normalizeAdmissionState(row.estado);
    if (kind === "received") {
      counts.pending += 1;
    } else if (kind === "review") {
      counts.review += 1;
      counts.pending += 1;
    } else if (kind === "interview") {
      counts.interview += 1;
    } else if (kind === "onboarding") {
      counts.onboarding += 1;
    } else if (kind === "approved") {
      counts.approved += 1;
    } else if (kind === "rejected") {
      counts.rejected += 1;
    }
  }

  return counts;
}

async function fetchDocumentTypeLabels(): Promise<Map<string, string>> {
  const documentTypes = await loadCatalogRows<CatalogRow>(
    () =>
      publicSchema()
        .from("cat_tipos_documento")
        .select("codigo, nombre")
        .order("nombre", { ascending: true }),
    [],
    "No se pudo cargar el catalogo de tipos de documento."
  );

  return new Map(documentTypes.map((item) => [item.codigo, item.nombre]));
}

export async function getAdmissionReferenceCatalogs(): Promise<AdmissionReferenceCatalogs> {
  const [documentTypes, genders, countries, volunteerStates] = await Promise.all([
    loadCatalogRows<CatalogRow>(
      () =>
        publicSchema()
          .from("cat_tipos_documento")
          .select("codigo, nombre")
          .order("nombre", { ascending: true }),
      [],
      "No se pudo cargar el catalogo de tipos de documento."
    ),
    loadCatalogRows<CatalogRow>(
      () =>
        publicSchema()
          .from("cat_generos")
          .select("codigo, nombre")
          .order("nombre", { ascending: true }),
      [],
      "No se pudo cargar el catalogo de generos."
    ),
    loadCatalogRows<CatalogRow>(
      () =>
        publicSchema()
          .from("cat_paises")
          .select("codigo, nombre")
          .order("nombre", { ascending: true }),
      [],
      "No se pudo cargar el catalogo de paises."
    ),
    loadCatalogRows<CatalogRow>(
      () =>
        ongSchema()
          .from("estados_voluntario")
          .select("codigo, nombre_estado")
          .order("orden_visual", { ascending: true }),
      [],
      "No se pudo cargar el catalogo de estados de voluntario."
    ),
  ]);

  return {
    documentTypes: documentTypes.map((item) => ({ value: item.codigo, label: item.nombre })),
    genders: genders.map((item) => ({ value: item.codigo, label: item.nombre })),
    countries: countries.map((item) => ({ value: item.codigo, label: item.nombre })),
    volunteerStates: (volunteerStates as VolunteerStateCatalogRow[]).map((item) => ({
      value: item.codigo,
      label: item.nombre_estado,
    })),
  };
}

export async function listSolicitudes(
  filters: Partial<AdmissionFilters> = {}
): Promise<AdmissionListData> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const searchPattern = sanitizeSearchTerm(filters.searchTerm);

    let baseQuery = rrhhSchema()
      .from("solicitudes_admision")
      .select(REQUEST_SELECT, { count: "exact" })
      .eq("tenant_id", tenantId);

    if (filters.dateFrom && isFiniteDate(filters.dateFrom)) {
      baseQuery = baseQuery.gte("fecha_solicitud", filters.dateFrom);
    }
    if (filters.dateTo && isFiniteDate(filters.dateTo)) {
      baseQuery = baseQuery.lte("fecha_solicitud", filters.dateTo);
    }
    if (searchPattern) {
      baseQuery = baseQuery.or(
        `nombres.ilike.%${searchPattern}%,apellidos.ilike.%${searchPattern}%,email.ilike.%${searchPattern}%,notas.ilike.%${searchPattern}%`
      );
    }
    const statusCodes = resolveStatusCodesForFilter(filters.status ?? "all");
    if (statusCodes && statusCodes.length > 0) {
      baseQuery = baseQuery.in("estado", statusCodes);
    }

    const { data: summaryData, error: summaryError } = await baseQuery;
    if (summaryError) {
      throw new Error(summaryError.message);
    }

    const summaryRows = (summaryData ?? []) as SolicitudRow[];
    const linkedVolunteerById = await fetchVolunteersByIds(
      tenantId,
      summaryRows.map((row) => row.id_voluntario_vinculado)
    );
    const volunteerByEmail = await fetchVolunteerMatchesByEmail(
      tenantId,
      summaryRows
        .filter((row) => !sanitizeOptionalId(row.id_voluntario_vinculado))
        .map((row) => row.email)
    );
    const kpis = summarizeStateCounts(summaryRows);
    kpis.converted = summaryRows.filter((row) => {
      const linkedVolunteerId = sanitizeOptionalId(row.id_voluntario_vinculado);
      if (linkedVolunteerId && linkedVolunteerById.has(linkedVolunteerId)) {
        return true;
      }
      return volunteerByEmail.has(row.email.toLowerCase());
    }).length;
    kpis.pendingConversion = Math.max(0, kpis.approved - kpis.converted);

    let pageQuery = rrhhSchema()
      .from("solicitudes_admision")
      .select(REQUEST_SELECT, { count: "exact" })
      .eq("tenant_id", tenantId);

    if (filters.dateFrom && isFiniteDate(filters.dateFrom)) {
      pageQuery = pageQuery.gte("fecha_solicitud", filters.dateFrom);
    }
    if (filters.dateTo && isFiniteDate(filters.dateTo)) {
      pageQuery = pageQuery.lte("fecha_solicitud", filters.dateTo);
    }
    if (searchPattern) {
      pageQuery = pageQuery.or(
        `nombres.ilike.%${searchPattern}%,apellidos.ilike.%${searchPattern}%,email.ilike.%${searchPattern}%,notas.ilike.%${searchPattern}%`
      );
    }
    if (statusCodes && statusCodes.length > 0) {
      pageQuery = pageQuery.in("estado", statusCodes);
    }

    const { data, error, count } = await pageQuery
      .order("fecha_solicitud", { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(error.message);
    }

    const rows = (data ?? []).map((row) => {
      const requestRow = row as SolicitudRow;
      const linkedVolunteerId = sanitizeOptionalId(requestRow.id_voluntario_vinculado);
      const linkedVolunteer = linkedVolunteerId
        ? linkedVolunteerById.get(linkedVolunteerId) ?? null
        : null;
      const matchedVolunteer =
        linkedVolunteer ?? volunteerByEmail.get(requestRow.email.toLowerCase()) ?? null;

      return mapRequestRow(requestRow, linkedVolunteer, matchedVolunteer);
    });

    return {
      rows,
      total: count ?? summaryRows.length,
      page,
      pageSize,
      stateOptions: ADMISSION_STATE_OPTIONS,
      kpis,
      warnings: [],
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las solicitudes de admision.");
  }
}

export async function getSolicitudAdmisionDetail(
  requestId: string
): Promise<AdmissionRequestDetailData> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(requestId);
    if (!id) {
      throw new Error("No se encontro la solicitud solicitada.");
    }

    const request = await fetchRequestById(tenantId, id);
    if (!request) {
      throw new Error("La solicitud ya no existe.");
    }

    const linkedVolunteerId = sanitizeOptionalId(request.id_voluntario_vinculado);
    const linkedVolunteer = linkedVolunteerId
      ? await fetchVolunteerById(tenantId, linkedVolunteerId)
      : null;
    const relatedVolunteer =
      linkedVolunteer ??
      (await fetchVolunteerMatchesByEmail(tenantId, [request.email])).get(request.email.toLowerCase()) ??
      null;

    const [documents, interviews, history, documentTypeLabels, onboardingStepsCatalog, onboardingRows] =
      await Promise.all([
        fetchDocumentRows(tenantId, id),
        fetchInterviewRows(tenantId, id),
        fetchHistoryRows(tenantId, id),
        fetchDocumentTypeLabels(),
        relatedVolunteer ? fetchOnboardingSteps(tenantId) : Promise.resolve([] as OnboardingPasoRow[]),
        relatedVolunteer
          ? fetchOnboardingRows(tenantId, relatedVolunteer.id)
          : Promise.resolve([] as OnboardingVoluntarioRow[]),
      ]);

    const interviewerLabels = await fetchProfileLabelsByIds(
      tenantId,
      interviews.map((item) => item.entrevistador_id)
    );
    const historyUserLabels = await fetchProfileLabelsByIds(
      tenantId,
      history.map((item) => item.cambiado_por)
    );
    const verifierLabels = await fetchProfileLabelsByIds(
      tenantId,
      documents.map((item) => item.verified_by)
    );

    const onboardingByStepId = new Map(onboardingRows.map((item) => [item.id_paso, item]));
    const onboardingSteps = relatedVolunteer
      ? applyOnboardingStepLocking(
          onboardingStepsCatalog.map((step) =>
            mapOnboardingRow(step, relatedVolunteer, onboardingByStepId.get(step.id))
          )
        )
      : [];

    return {
      request: mapRequestRow(request, linkedVolunteer, relatedVolunteer),
      relatedVolunteer,
      documents: documents.map((row) =>
        mapDocumentRow(
          row,
          `${request.nombres} ${request.apellidos}`.trim(),
          documentTypeLabels,
          verifierLabels
        )
      ),
      interviews: interviews.map((row) =>
        mapInterviewRow(
          row,
          `${request.nombres} ${request.apellidos}`.trim(),
          interviewerLabels.get(row.entrevistador_id) ?? row.entrevistador_id
        )
      ),
      onboardingSteps,
      history: history.map((row) => ({
        id: row.id,
        title: `${mapAdmissionStateLabel(row.estado_anterior ?? "nueva")} -> ${mapAdmissionStateLabel(row.estado_nuevo)}`,
        subtitle: [row.comentario, historyUserLabels.get(row.cambiado_por) ?? row.cambiado_por]
          .filter(Boolean)
          .join(" | "),
        time: toDateTimeLabel(row.fecha_cambio ?? row.created_at),
        variant: mapAdmissionStateVariant(normalizeAdmissionState(row.estado_nuevo)),
      })),
      capabilities: {
        documents: true,
        interviews: true,
        onboarding: Boolean(relatedVolunteer),
        history: true,
        conversion: !linkedVolunteer && request.estado !== "rechazada",
      },
      warnings: linkedVolunteer
        ? []
        : relatedVolunteer
          ? [
              "La solicitud todavia no guarda id_voluntario_vinculado. Se resolvio el voluntario por coincidencia de email hasta sincronizar el vinculo directo.",
            ]
          : [
              "No hay un voluntario vinculado. El onboarding solo se puede resolver cuando la solicitud se convierte o se enlaza a un voluntario real.",
            ],
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el expediente de admision.");
  }
}

export async function createSolicitud(
  input: AdmissionCreateInput
): Promise<AdmissionRequestRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const nombres = sanitizeText(input.nombres, 150);
    const apellidos = sanitizeText(input.apellidos, 150);
    const email = sanitizeText(input.email, 255);
    const notes = sanitizeText(input.notes ?? null, 2000);
    const stateCode = (input.stateCode ?? "nueva") as AdmissionStateCode;

    if (!nombres) {
      throw new Error("Los nombres son obligatorios.");
    }
    if (!apellidos) {
      throw new Error("Los apellidos son obligatorios.");
    }
    if (!email) {
      throw new Error("El correo es obligatorio.");
    }

    const { data, error } = await rrhhSchema()
      .from("solicitudes_admision")
      .insert({
        tenant_id: tenantId,
        nombres,
        apellidos,
        email,
        estado: stateCode,
        fecha_solicitud: new Date().toISOString(),
        notas: notes || "",
        created_by: actorId,
        updated_by: actorId,
      })
      .select(REQUEST_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const volunteerByEmail = await fetchVolunteerMatchesByEmail(tenantId, [email]);
    return mapRequestRow(
      data as SolicitudRow,
      null,
      volunteerByEmail.get(email.toLowerCase()) ?? null
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo crear la solicitud de admision.");
  }
}

export async function updateSolicitud(
  input: AdmissionUpdateInput
): Promise<AdmissionRequestRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const id = sanitizeOptionalId(input.requestId);
    if (!id) {
      throw new Error("No se encontro la solicitud solicitada.");
    }

    const payload: Record<string, string | number | null> = {
      updated_by: actorId,
    };

    if (typeof input.nombres === "string") {
      payload.nombres = sanitizeText(input.nombres, 150);
    }
    if (typeof input.apellidos === "string") {
      payload.apellidos = sanitizeText(input.apellidos, 150);
    }
    if (typeof input.email === "string") {
      payload.email = sanitizeText(input.email, 255);
    }
    if (typeof input.notes !== "undefined") {
      payload.notas = sanitizeText(input.notes ?? null, 2000);
    }

    const { data, error } = await rrhhSchema()
      .from("solicitudes_admision")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select(REQUEST_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const request = data as SolicitudRow;
    const linkedVolunteer = request.id_voluntario_vinculado
      ? await fetchVolunteerById(tenantId, request.id_voluntario_vinculado)
      : null;
    const volunteerByEmail = await fetchVolunteerMatchesByEmail(
      tenantId,
      linkedVolunteer ? [] : [request.email]
    );
    return mapRequestRow(
      request,
      linkedVolunteer,
      linkedVolunteer ? linkedVolunteer : volunteerByEmail.get(request.email.toLowerCase()) ?? null
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la solicitud de admision.");
  }
}

export async function changeEstadoAdmision(
  input: AdmissionStateChangeInput
): Promise<AdmissionRequestRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const id = sanitizeOptionalId(input.requestId);
    if (!id) {
      throw new Error("No se encontro la solicitud solicitada.");
    }

    const previous = await fetchRequestById(tenantId, id);
    if (!previous) {
      throw new Error("La solicitud ya no existe.");
    }

    const nextState = input.stateCode;
    const comment = sanitizeText(input.comment ?? null, 2000);

    const { data, error } = await rrhhSchema()
      .from("solicitudes_admision")
      .update({
        estado: nextState,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select(REQUEST_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const { error: historyError } = await rrhhSchema().from("admision_estado_historial").insert({
      tenant_id: tenantId,
      id_solicitud: id,
      estado_anterior: previous.estado,
      estado_nuevo: nextState,
      comentario: comment || "",
      cambiado_por: actorId,
      fecha_cambio: new Date().toISOString(),
    });

    if (historyError) {
      throw new Error(historyError.message);
    }

    const request = data as SolicitudRow;
    const linkedVolunteer = request.id_voluntario_vinculado
      ? await fetchVolunteerById(tenantId, request.id_voluntario_vinculado)
      : null;
    const volunteerByEmail = await fetchVolunteerMatchesByEmail(
      tenantId,
      linkedVolunteer ? [] : [request.email]
    );
    return mapRequestRow(
      request,
      linkedVolunteer,
      linkedVolunteer ? linkedVolunteer : volunteerByEmail.get(request.email.toLowerCase()) ?? null
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo cambiar el estado de admision.");
  }
}

export async function convertSolicitudToVoluntario(
  input: AdmissionConvertInput
): Promise<AdmissionConvertResult> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const requestId = sanitizeOptionalId(input.requestId);
    if (!requestId) {
      throw new Error("No se encontro la solicitud solicitada.");
    }

    const request = await fetchRequestById(tenantId, requestId);
    if (!request) {
      throw new Error("La solicitud ya no existe.");
    }

    const numeroDocumento = sanitizeText(input.numeroDocumento, 50);
    const tipoDocumento = sanitizeText(input.tipoDocumento ?? null, 10);
    const genero = sanitizeText(input.genero ?? null, 10);
    const codigoPais = sanitizeText(input.codigoPais ?? null, 2) || "PE";
    const telefono = sanitizeText(input.telefono ?? null, 50);
    const fechaNacimiento = sanitizeText(input.fechaNacimiento ?? null, 50);
    const observaciones = sanitizeText(input.observaciones ?? null, 2000);
    const codigoEstado = sanitizeText(input.codigoEstado ?? null, 50) || "activo";

    if (!numeroDocumento) {
      throw new Error("El numero de documento es obligatorio.");
    }
    if (!tipoDocumento) {
      throw new Error("El tipo de documento es obligatorio.");
    }

    const byDocument = await ongSchema()
      .from("voluntarios")
      .select(
        "id, tenant_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, ruta_foto, codigo_estado, observaciones, created_at, updated_at, created_by, updated_by"
      )
      .eq("tenant_id", tenantId)
      .eq("tipo_documento", tipoDocumento)
      .eq("numero_documento", numeroDocumento)
      .limit(1);

    if (byDocument.error) {
      throw new Error(byDocument.error.message);
    }

    const documentMatch = ((byDocument.data ?? [])[0] as VolunteerRow | undefined) ?? null;
    const byEmail = documentMatch
      ? { data: [], error: null }
      : await ongSchema()
          .from("voluntarios")
          .select(
            "id, tenant_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, ruta_foto, codigo_estado, observaciones, created_at, updated_at, created_by, updated_by"
          )
          .eq("tenant_id", tenantId)
          .eq("email", request.email)
          .limit(1);

    if (byEmail.error) {
      throw new Error(byEmail.error.message);
    }

    const emailMatch = ((byEmail.data ?? [])[0] as VolunteerRow | undefined) ?? null;
    const matchedVolunteer = documentMatch ?? emailMatch;

    const payload = {
      tenant_id: tenantId,
      numero_documento: numeroDocumento,
      tipo_documento: tipoDocumento,
      genero,
      codigo_pais: codigoPais,
      nombre: request.nombres,
      apellido: request.apellidos,
      fecha_nacimiento: fechaNacimiento,
      email: request.email,
      telefono,
      ruta_foto: null,
      codigo_estado: codigoEstado,
      observaciones,
      created_by: matchedVolunteer?.created_by ?? actorId,
      updated_by: actorId,
    };

    const volunteerMutation = matchedVolunteer
      ? await ongSchema()
          .from("voluntarios")
          .update(payload)
          .eq("tenant_id", tenantId)
          .eq("id", matchedVolunteer.id)
          .select("id")
          .single()
      : await ongSchema().from("voluntarios").insert(payload).select("id").single();

    if (volunteerMutation.error) {
      throw new Error(volunteerMutation.error.message);
    }

    const volunteerId = (volunteerMutation.data as { id: string } | null)?.id;
    if (!volunteerId) {
      throw new Error("No se pudo resolver el voluntario convertido.");
    }

    const { error: linkError } = await rrhhSchema()
      .from("solicitudes_admision")
      .update({
        id_voluntario_vinculado: volunteerId,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", request.id);

    if (linkError) {
      throw new Error(linkError.message);
    }

    if (request.estado !== "aprobada") {
      await changeEstadoAdmision({
        requestId: request.id,
        stateCode: "aprobada",
        comment: "Conversión a voluntario ejecutada desde admisión.",
        actorId,
      });
    }

    return {
      requestId: request.id,
      volunteerId,
      created: !matchedVolunteer,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo convertir la solicitud a voluntario.");
  }
}

export async function generateRegistrationCodeBySolicitud(
  input: AdmissionGenerateRegistrationCodeInput
): Promise<AdmissionRegistrationCodeRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const requestId = sanitizeOptionalId(input.requestId);
    if (!requestId) {
      throw new Error("No se encontro la solicitud para generar el codigo.");
    }

    const request = await fetchRequestById(tenantId, requestId);
    if (!request) {
      throw new Error("La solicitud ya no existe en el tenant actual.");
    }

    const email =
      sanitizeText(input.email ?? null, 255) || sanitizeText(request.email, 255);
    const numeroDocumento = sanitizeText(input.numeroDocumento ?? null, 50);
    const nombres =
      sanitizeText(input.nombres ?? null, 120) || sanitizeText(request.nombres, 120);
    const apellidos =
      sanitizeText(input.apellidos ?? null, 120) || sanitizeText(request.apellidos, 120);
    const expiresInMinutes = Math.max(
      15,
      Math.min(10_080, Math.floor(input.expiresInMinutes ?? 1_440))
    );

    if (!email && !numeroDocumento) {
      throw new Error(
        "Debes registrar al menos un correo o numero de documento para emitir el codigo."
      );
    }

    const { data, error } = await rrhhSchema().rpc("fn_generate_registration_code", {
      p_email: email,
      p_numero_documento: numeroDocumento,
      p_nombres: nombres,
      p_apellidos: apellidos,
      p_id_solicitud: requestId,
      p_expires_in_minutes: expiresInMinutes,
    });

    if (error) {
      throw new Error(error.message);
    }

    const row = data as RegistrationCodeRow | null;
    if (!row) {
      throw new Error("La RPC no devolvio el codigo de registro generado.");
    }

    return mapRegistrationCodeRow(row);
  } catch (error) {
    throw toOperationError(error, "No se pudo generar el codigo de registro.");
  }
}

export async function listDocumentosBySolicitud(
  requestId: string
): Promise<AdmissionDocumentRow[]> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(requestId);
    if (!id) {
      return [];
    }

    const [documents, request, documentTypeLabels] = await Promise.all([
      fetchDocumentRows(tenantId, id),
      fetchRequestById(tenantId, id),
      fetchDocumentTypeLabels(),
    ]);
    const verifierLabels = await fetchProfileLabelsByIds(
      tenantId,
      documents.map((row) => row.verified_by)
    );

    const requestName = request ? `${request.nombres} ${request.apellidos}`.trim() : id;
    return documents.map((row) =>
      mapDocumentRow(row, requestName, documentTypeLabels, verifierLabels)
    );
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar los documentos de admision.");
  }
}

export async function createDocumentoAdmision(
  input: {
    requestId: string;
    type: string;
    fileUrl: string;
    verified?: boolean;
    actorId?: string | null;
  }
): Promise<AdmissionDocumentRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const requestId = sanitizeOptionalId(input.requestId);
    const type = sanitizeText(input.type, 50);
    const fileUrl = sanitizeText(input.fileUrl, 2000);
    if (!requestId) {
      throw new Error("No se encontro la solicitud solicitada.");
    }
    if (!type) {
      throw new Error("El tipo de documento es obligatorio.");
    }
    if (!fileUrl) {
      throw new Error("La ruta del archivo es obligatoria.");
    }

    const { data, error } = await rrhhSchema()
      .from("documentos_admision")
      .insert({
        tenant_id: tenantId,
        id_solicitud: requestId,
        tipo_documento: type,
        archivo_url: fileUrl,
        verificado: input.verified ?? false,
        verified_by: input.verified ? actorId : null,
        verified_at: input.verified ? new Date().toISOString() : null,
        created_by: actorId,
        updated_by: actorId,
      })
      .select(DOCUMENT_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const request = await fetchRequestById(tenantId, requestId);
    const documentTypeLabels = await fetchDocumentTypeLabels();
    const verifierLabels = await fetchProfileLabelsByIds(
      tenantId,
      [(data as DocumentoRow).verified_by]
    );
    return mapDocumentRow(
      data as DocumentoRow,
      request ? `${request.nombres} ${request.apellidos}`.trim() : requestId,
      documentTypeLabels,
      verifierLabels
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar el documento de admision.");
  }
}

export async function updateDocumentoAdmision(input: {
  documentId: string;
  type?: string;
  fileUrl?: string;
  verified?: boolean;
  actorId?: string | null;
}): Promise<AdmissionDocumentRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const id = sanitizeOptionalId(input.documentId);
    if (!id) {
      throw new Error("No se encontro el documento solicitado.");
    }

    const existing = await rrhhSchema()
      .from("documentos_admision")
      .select(DOCUMENT_SELECT)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single();

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    const existingRow = existing.data as DocumentoRow | null;
    if (!existingRow) {
      throw new Error("El documento ya no existe.");
    }

    const payload: Record<string, string | boolean | null> = {
      updated_by: actorId,
    };
    if (typeof input.type === "string") {
      payload.tipo_documento = sanitizeText(input.type, 50);
    }
    if (typeof input.fileUrl === "string") {
      payload.archivo_url = sanitizeText(input.fileUrl, 2000);
    }
    if (typeof input.verified === "boolean") {
      payload.verificado = input.verified;
      if (input.verified && !existingRow.verificado) {
        payload.verified_by = actorId;
        payload.verified_at = new Date().toISOString();
      } else if (!input.verified) {
        payload.verified_by = null;
        payload.verified_at = null;
      }
    }

    const { data, error } = await rrhhSchema()
      .from("documentos_admision")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select(DOCUMENT_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const request = await fetchRequestById(tenantId, (data as DocumentoRow).id_solicitud);
    const documentTypeLabels = await fetchDocumentTypeLabels();
    const verifierLabels = await fetchProfileLabelsByIds(
      tenantId,
      [(data as DocumentoRow).verified_by]
    );
    return mapDocumentRow(
      data as DocumentoRow,
      request ? `${request.nombres} ${request.apellidos}`.trim() : (data as DocumentoRow).id_solicitud,
      documentTypeLabels,
      verifierLabels
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar el documento de admision.");
  }
}

export async function removeDocumentoAdmision(
  documentId: string
): Promise<{ id: string; message: string }> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(documentId);
    if (!id) {
      throw new Error("No se encontro el documento solicitado.");
    }

    const { error } = await rrhhSchema()
      .from("documentos_admision")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      id,
      message: "Documento de admision eliminado correctamente.",
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar el documento de admision.");
  }
}

export async function listEntrevistasBySolicitud(
  requestId: string
): Promise<AdmissionInterviewRow[]> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(requestId);
    if (!id) {
      return [];
    }

    const interviews = await fetchInterviewRows(tenantId, id);
    const request = await fetchRequestById(tenantId, id);
    const interviewerLabels = await fetchProfileLabelsByIds(
      tenantId,
      interviews.map((item) => item.entrevistador_id)
    );

    const requestName = request ? `${request.nombres} ${request.apellidos}`.trim() : id;
    return interviews.map((row) =>
      mapInterviewRow(row, requestName, interviewerLabels.get(row.entrevistador_id) ?? row.entrevistador_id)
    );
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las entrevistas de admision.");
  }
}

export async function createEntrevistaAdmision(input: {
  requestId: string;
  scheduledAt: string;
  result?: string | null;
  comment?: string | null;
  score?: number | null;
  interviewerId?: string | null;
  actorId?: string | null;
}): Promise<AdmissionInterviewRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const requestId = sanitizeOptionalId(input.requestId);
    const scheduledAt = sanitizeText(input.scheduledAt, 50);
    const comment = sanitizeText(input.comment ?? null, 2000);
    const result = sanitizeText(input.result ?? null, 50) || "pendiente";
    const score =
      typeof input.score === "number" && Number.isFinite(input.score) ? input.score : null;
    const interviewerId = sanitizeText(input.interviewerId ?? null, 80) || actorId;

    if (!requestId) {
      throw new Error("No se encontro la solicitud solicitada.");
    }
    if (!scheduledAt) {
      throw new Error("La fecha de entrevista es obligatoria.");
    }
    if (score !== null && (score < 0 || score > 100)) {
      throw new Error("El puntaje debe estar entre 0 y 100.");
    }

    const { data, error } = await rrhhSchema()
      .from("entrevistas_admision")
      .insert({
        tenant_id: tenantId,
        id_solicitud: requestId,
        entrevistador_id: interviewerId,
        fecha_entrevista: scheduledAt,
        comentarios: comment || "",
        resultado: result,
        puntaje: score,
        created_by: actorId,
        updated_by: actorId,
      })
      .select(INTERVIEW_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const request = await fetchRequestById(tenantId, requestId);
    const interviewerLabels = await fetchProfileLabelsByIds(tenantId, [interviewerId]);
    return mapInterviewRow(
      data as EntrevistaRow,
      request ? `${request.nombres} ${request.apellidos}`.trim() : requestId,
      interviewerLabels.get(interviewerId) ?? interviewerId
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar la entrevista de admision.");
  }
}

export async function updateEntrevistaAdmision(input: {
  interviewId: string;
  scheduledAt?: string;
  result?: string | null;
  comment?: string | null;
  score?: number | null;
  interviewerId?: string | null;
  actorId?: string | null;
}): Promise<AdmissionInterviewRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const id = sanitizeOptionalId(input.interviewId);
    if (!id) {
      throw new Error("No se encontro la entrevista solicitada.");
    }

    const payload: Record<string, string | null> = {
      updated_by: actorId,
    };
    if (typeof input.scheduledAt === "string") {
      payload.fecha_entrevista = sanitizeText(input.scheduledAt, 50);
    }
    if (typeof input.result === "string") {
      payload.resultado = sanitizeText(input.result, 50);
    }
    if (typeof input.comment === "string") {
      payload.comentarios = sanitizeText(input.comment, 2000);
    }
    if (typeof input.score === "number" && Number.isFinite(input.score)) {
      if (input.score < 0 || input.score > 100) {
        throw new Error("El puntaje debe estar entre 0 y 100.");
      }
      payload.puntaje = input.score;
    }
    if (input.score === null) {
      payload.puntaje = null;
    }
    if (typeof input.interviewerId === "string") {
      payload.entrevistador_id = sanitizeText(input.interviewerId, 80);
    }

    const { data, error } = await rrhhSchema()
      .from("entrevistas_admision")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select(INTERVIEW_SELECT)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    const request = await fetchRequestById(tenantId, (data as EntrevistaRow).id_solicitud);
    const interviewerLabels = await fetchProfileLabelsByIds(
      tenantId,
      [(data as EntrevistaRow).entrevistador_id]
    );
    return mapInterviewRow(
      data as EntrevistaRow,
      request ? `${request.nombres} ${request.apellidos}`.trim() : (data as EntrevistaRow).id_solicitud,
      interviewerLabels.get((data as EntrevistaRow).entrevistador_id) ??
        (data as EntrevistaRow).entrevistador_id
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la entrevista de admision.");
  }
}

export async function removeEntrevistaAdmision(
  interviewId: string
): Promise<{ id: string; message: string }> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(interviewId);
    if (!id) {
      throw new Error("No se encontro la entrevista solicitada.");
    }

    const { error } = await rrhhSchema()
      .from("entrevistas_admision")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      id,
      message: "Entrevista de admision eliminada correctamente.",
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar la entrevista de admision.");
  }
}

export async function listOnboardingBySolicitud(
  requestId: string
): Promise<AdmissionOnboardingStepRow[]> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const id = sanitizeOptionalId(requestId);
    if (!id) {
      return [];
    }

    const request = await fetchRequestById(tenantId, id);
    if (!request) {
      return [];
    }

    const linkedVolunteer = request.id_voluntario_vinculado
      ? await fetchVolunteerById(tenantId, request.id_voluntario_vinculado)
      : null;
    const relatedVolunteer =
      linkedVolunteer ??
      (await fetchVolunteerMatchesByEmail(tenantId, [request.email])).get(request.email.toLowerCase()) ??
      null;
    if (!relatedVolunteer) {
      return [];
    }

    const [steps, onboardingRows] = await Promise.all([
      fetchOnboardingSteps(tenantId),
      fetchOnboardingRows(tenantId, relatedVolunteer.id),
    ]);
    const onboardingByStepId = new Map(onboardingRows.map((item) => [item.id_paso, item]));
    return applyOnboardingStepLocking(
      steps.map((step) => mapOnboardingRow(step, relatedVolunteer, onboardingByStepId.get(step.id)))
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el onboarding de admision.");
  }
}

export async function startOnboardingForVolunteer(input: {
  volunteerId: string;
  stepIds?: string[];
  actorId?: string | null;
}): Promise<AdmissionOnboardingStepRow[]> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    if (!volunteerId) {
      throw new Error("No se encontro el voluntario solicitado.");
    }

    const steps = await fetchOnboardingSteps(tenantId);
    const selectedSteps =
      input.stepIds && input.stepIds.length > 0
        ? steps.filter((step) => input.stepIds?.includes(step.id))
        : steps;

    if (!selectedSteps.length) {
      return [];
    }

    const existingRows = await fetchOnboardingRows(tenantId, volunteerId, {
      includeDeleted: true,
    });
    const activeStepIds = new Set(
      existingRows.filter((row) => !row.is_deleted).map((row) => row.id_paso)
    );
    const deletedRowsByStepId = new Map(
      existingRows.filter((row) => row.is_deleted).map((row) => [row.id_paso, row])
    );
    const missingSteps = selectedSteps.filter(
      (step) => !activeStepIds.has(step.id) && !deletedRowsByStepId.has(step.id)
    );
    const deletedSteps = selectedSteps.filter((step) => deletedRowsByStepId.has(step.id));

    if (missingSteps.length > 0) {
      const { error } = await rrhhSchema().from("onboarding_voluntario").insert(
        missingSteps.map((step) => ({
          tenant_id: tenantId,
          id_voluntario: volunteerId,
          id_paso: step.id,
          completado: false,
          evidencia_url: null,
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          created_by: actorId,
          updated_by: actorId,
        }))
      );
      if (error) {
        throw new Error(error.message);
      }
    }

    for (const step of deletedSteps) {
      const deletedRow = deletedRowsByStepId.get(step.id);
      if (!deletedRow) {
        continue;
      }

      const { error } = await rrhhSchema()
        .from("onboarding_voluntario")
        .update({
          is_deleted: false,
          deleted_at: null,
          deleted_by: null,
          updated_by: actorId,
        })
        .eq("tenant_id", tenantId)
        .eq("id", deletedRow.id);

      if (error) {
        throw new Error(error.message);
      }
    }

    const refreshed = await fetchOnboardingRows(tenantId, volunteerId);
    const volunteerSummary =
      (await fetchVolunteerById(tenantId, volunteerId)) ?? {
        id: volunteerId,
        fullName: volunteerId,
        email: null,
        phone: null,
        documentNumber: "",
        documentType: null,
        stateCode: null,
      };
    const rowByStepId = new Map(refreshed.map((row) => [row.id_paso, row]));
    return applyOnboardingStepLocking(
      steps
        .filter((step) => selectedSteps.some((candidate) => candidate.id === step.id))
        .map((step) => mapOnboardingRow(step, volunteerSummary, rowByStepId.get(step.id)))
    );
  } catch (error) {
    throw toOperationError(error, "No se pudo iniciar el onboarding.");
  }
}

export async function toggleOnboardingStep(input: {
  volunteerId: string;
  stepId: string;
  completed: boolean;
  evidenceUrl?: string | null;
  actorId?: string | null;
}): Promise<AdmissionOnboardingStepRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(input.actorId);
    const volunteerId = sanitizeOptionalId(input.volunteerId);
    const stepId = sanitizeOptionalId(input.stepId);
    if (!volunteerId || !stepId) {
      throw new Error("No se encontro el onboarding solicitado.");
    }

    if (input.completed) {
      const [allStepCatalog, allVolunteerRows] = await Promise.all([
        fetchOnboardingSteps(tenantId),
        fetchOnboardingRows(tenantId, volunteerId),
      ]);
      const dummyVolunteer = { id: volunteerId, fullName: "", email: null, phone: null, documentNumber: "", documentType: null, stateCode: null };
      const rowByStepId = new Map(allVolunteerRows.map((r) => [r.id_paso, r]));
      const lockedSteps = applyOnboardingStepLocking(
        allStepCatalog.map((s) => mapOnboardingRow(s, dummyVolunteer, rowByStepId.get(s.id)))
      );
      const targetLocked = lockedSteps.find((s) => s.stepId === stepId);
      if (targetLocked?.isLocked) {
        throw new Error(targetLocked.blockReason ?? "Este paso esta bloqueado hasta completar los pasos anteriores obligatorios.");
      }
    }

    const existing = await rrhhSchema()
      .from("onboarding_voluntario")
      .select(ONBOARDING_SELECT)
      .eq("tenant_id", tenantId)
      .eq("id_voluntario", volunteerId)
      .eq("id_paso", stepId)
      .limit(1);

    if (existing.error) {
      throw new Error(existing.error.message);
    }

    const existingRow = ((existing.data ?? [])[0] as OnboardingVoluntarioRow | undefined) ?? null;
    const payload: Record<string, string | boolean | null> = {
      completado: input.completed,
      fecha_completado: input.completed ? new Date().toISOString() : null,
      updated_by: actorId,
      is_deleted: false,
      deleted_at: null,
      deleted_by: null,
    };
    if (Object.prototype.hasOwnProperty.call(input, "evidenceUrl")) {
      payload.evidencia_url = sanitizeText(input.evidenceUrl ?? null, 2000);
    }

    let row: OnboardingVoluntarioRow | null = null;
    if (existingRow) {
      const { data, error } = await rrhhSchema()
        .from("onboarding_voluntario")
        .update(payload)
        .eq("tenant_id", tenantId)
        .eq("id", existingRow.id)
        .select(ONBOARDING_SELECT)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      row = data as OnboardingVoluntarioRow;
    } else {
      const { data, error } = await rrhhSchema()
        .from("onboarding_voluntario")
        .insert({
          tenant_id: tenantId,
          id_voluntario: volunteerId,
          id_paso: stepId,
          ...payload,
          created_by: actorId,
        })
        .select(ONBOARDING_SELECT)
        .single();
      if (error) {
        throw new Error(error.message);
      }
      row = data as OnboardingVoluntarioRow;
    }

    const [allSteps, refreshedRows, volunteerSummary] = await Promise.all([
      fetchOnboardingSteps(tenantId),
      fetchOnboardingRows(tenantId, volunteerId),
      fetchVolunteerById(tenantId, volunteerId),
    ]);
    const step = allSteps.find((candidate) => candidate.id === stepId);
    if (!step) {
      throw new Error("No se encontro el paso de onboarding.");
    }
    const resolvedSummary = volunteerSummary ?? {
      id: volunteerId,
      fullName: volunteerId,
      email: null,
      phone: null,
      documentNumber: "",
      documentType: null,
      stateCode: null,
    };
    const rowByStepId = new Map(refreshedRows.map((r) => [r.id_paso, r]));
    const lockedSteps = applyOnboardingStepLocking(
      allSteps.map((s) => mapOnboardingRow(s, resolvedSummary, rowByStepId.get(s.id)))
    );
    return lockedSteps.find((s) => s.stepId === stepId) ?? mapOnboardingRow(step, resolvedSummary, row ?? undefined);
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar el onboarding.");
  }
}
