import type { User } from "npm:@supabase/supabase-js@2.97.0";
import { createAdminClient, sanitizeEmail, sanitizeOptionalId, sanitizeText } from "../_shared/supabase.ts";
import {
  errorResponse,
  HttpError,
  jsonResponse,
  optionsResponse,
  parseJsonBody,
} from "../_shared/http.ts";

type RegistrationCodeStatus = "activo" | "consumido" | "expirado" | "revocado";

interface PreviewRequest {
  mode: "preview";
  code: string;
  tenantId?: string | null;
}

interface ConsumeDocumentPayload {
  type: string;
  manualUrl?: string | null;
  fileField?: string | null;
}

interface ConsumePayload {
  code: string;
  tenantId?: string | null;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType?: string | null;
  genderCode?: string | null;
  countryCode?: string | null;
  birthDate?: string | null;
  phone?: string | null;
  notes?: string | null;
  documents?: ConsumeDocumentPayload[];
}

interface RegistrationCodeRow {
  id: string;
  tenant_id: string;
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
  estado: RegistrationCodeStatus;
  created_by: string | null;
  updated_by: string | null;
}

interface RequestRow {
  id: string;
  tenant_id: string;
  nombres: string;
  apellidos: string;
  email: string;
  notas: string | null;
  id_voluntario_vinculado: string | null;
}

interface VolunteerRow {
  id: string;
  tenant_id: string;
  iam_user_id: string | null;
  numero_documento: string;
  tipo_documento: string | null;
  genero: string | null;
  codigo_pais: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  email: string | null;
  telefono: string | null;
  codigo_estado: string;
  observaciones: string | null;
}

interface ProfileRow {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  tipo_documento: string | null;
  numero_documento: string | null;
  genero: string | null;
}

interface VolunteerStateRow {
  codigo: string;
  nombre_estado: string;
}

interface RegistrationDocumentRow {
  id: string;
  tenant_id: string;
  id_codigo_registro: string;
  tipo_documento: string;
  archivo_url: string;
}

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const REGISTRATION_DOCUMENTS_BUCKET =
  Deno.env.get("REGISTRATION_DOCUMENTS_BUCKET") ??
  Deno.env.get("ONG_REGISTRATION_DOCUMENTS_BUCKET") ??
  Deno.env.get("ONG_EVIDENCE_BUCKET") ??
  Deno.env.get("VITE_ONG_EVIDENCE_BUCKET") ??
  "";

function sanitizeCode(value: string | null | undefined): string {
  return sanitizeText(value, 64).replace(/\s+/g, "");
}

function sanitizeDateValue(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 30);
  if (!cleaned) {
    return null;
  }

  const parsed = new Date(cleaned);
  if (Number.isNaN(parsed.getTime())) {
    throw new HttpError(400, "La fecha enviada no es valida.");
  }

  return cleaned.slice(0, 10);
}

function sanitizePhone(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 50);
  return cleaned || null;
}

function sanitizeFileName(value: string | null | undefined): string {
  const cleaned = sanitizeText(value, 120)
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "archivo";
}

function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return DATE_TIME_FORMAT.format(parsed);
}

function isCodeExpired(code: RegistrationCodeRow): boolean {
  return new Date(code.expires_at).getTime() <= Date.now();
}

function buildTargetFullName(code: RegistrationCodeRow, request: RequestRow | null): string {
  const byCode = [code.nombres_objetivo ?? "", code.apellidos_objetivo ?? ""]
    .filter(Boolean)
    .join(" ")
    .trim();
  if (byCode) {
    return byCode;
  }

  return request ? `${request.nombres} ${request.apellidos}`.trim() : "";
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const normalized = sanitizeText(fullName, 180);
  if (!normalized) {
    return {
      firstName: "",
      lastName: "",
    };
  }

  const parts = normalized.split(" ");
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.slice(-1).join(" "),
  };
}

async function loadRegistrationCode(
  code: string,
  tenantId?: string | null
): Promise<RegistrationCodeRow> {
  const adminClient = createAdminClient();
  let query = adminClient
    .schema("rrhh")
    .from("codigos_registro_voluntario")
    .select(
      "id, tenant_id, codigo, email_objetivo, numero_documento_objetivo, nombres_objetivo, apellidos_objetivo, id_solicitud, id_voluntario, expires_at, max_uses, use_count, estado, created_by, updated_by"
    )
    .eq("codigo", code);

  if (tenantId) {
    const { data, error } = await query.eq("tenant_id", tenantId).maybeSingle();

    if (error) {
      throw new HttpError(500, "No se pudo cargar rrhh.codigos_registro_voluntario.", error);
    }
    if (!data) {
      throw new HttpError(404, "El codigo indicado no existe para el tenant enviado.");
    }

    return data as RegistrationCodeRow;
  }

  const { data, error } = await query.limit(2);
  if (error) {
    throw new HttpError(500, "No se pudo cargar rrhh.codigos_registro_voluntario.", error);
  }

  const rows = (data ?? []) as RegistrationCodeRow[];
  if (!rows.length) {
    throw new HttpError(404, "El codigo indicado no existe.");
  }
  if (rows.length > 1) {
    throw new HttpError(
      409,
      "El codigo existe en mas de un tenant. Debes usar el enlace completo con tenant."
    );
  }

  return rows[0];
}

async function markCodeExpiredIfNeeded(code: RegistrationCodeRow): Promise<RegistrationCodeRow> {
  if (code.estado !== "activo" || !isCodeExpired(code)) {
    return code;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("rrhh")
    .from("codigos_registro_voluntario")
    .update({
      estado: "expirado",
      updated_by: code.updated_by ?? code.created_by,
    })
    .eq("tenant_id", code.tenant_id)
    .eq("id", code.id)
    .select(
      "id, tenant_id, codigo, email_objetivo, numero_documento_objetivo, nombres_objetivo, apellidos_objetivo, id_solicitud, id_voluntario, expires_at, max_uses, use_count, estado, created_by, updated_by"
    )
    .single();

  if (error) {
    throw new HttpError(500, "No se pudo actualizar el estado expirado del codigo.", error);
  }

  return data as RegistrationCodeRow;
}

async function loadRequest(
  tenantId: string,
  requestId: string | null
): Promise<RequestRow | null> {
  if (!requestId) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("rrhh")
    .from("solicitudes_admision")
    .select("id, tenant_id, nombres, apellidos, email, notas, id_voluntario_vinculado")
    .eq("tenant_id", tenantId)
    .eq("id", requestId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "No se pudo cargar rrhh.solicitudes_admision.", error);
  }

  return (data as RequestRow | null) ?? null;
}

async function loadVolunteer(
  tenantId: string,
  volunteerId: string | null
): Promise<VolunteerRow | null> {
  if (!volunteerId) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("ong")
    .from("voluntarios")
    .select(
      "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, codigo_estado, observaciones"
    )
    .eq("tenant_id", tenantId)
    .eq("id", volunteerId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "No se pudo cargar ong.voluntarios.", error);
  }

  return (data as VolunteerRow | null) ?? null;
}

async function loadProfile(userId: string): Promise<ProfileRow | null> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("public")
    .from("profiles")
    .select("id, tenant_id, full_name, tipo_documento, numero_documento, genero")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, "No se pudo cargar public.profiles.", error);
  }

  return (data as ProfileRow | null) ?? null;
}

async function findVolunteerByDocument(
  tenantId: string,
  documentNumber: string,
  documentType: string | null
): Promise<VolunteerRow | null> {
  if (!documentNumber) {
    return null;
  }

  const adminClient = createAdminClient();
  let query = adminClient
    .schema("ong")
    .from("voluntarios")
    .select(
      "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, codigo_estado, observaciones"
    )
    .eq("tenant_id", tenantId)
    .eq("numero_documento", documentNumber);

  if (documentType) {
    query = query.eq("tipo_documento", documentType);
  }

  const { data, error } = await query.limit(2);
  if (error) {
    throw new HttpError(500, "No se pudo validar duplicados por documento.", error);
  }

  const rows = (data ?? []) as VolunteerRow[];
  if (rows.length > 1) {
    throw new HttpError(
      409,
      "Se detectaron multiples voluntarios con el mismo documento en el tenant."
    );
  }

  return rows[0] ?? null;
}

async function findVolunteerByEmail(
  tenantId: string,
  email: string | null
): Promise<VolunteerRow | null> {
  if (!email) {
    return null;
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("ong")
    .from("voluntarios")
    .select(
      "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, codigo_estado, observaciones"
    )
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .limit(2);

  if (error) {
    throw new HttpError(500, "No se pudo validar duplicados por correo.", error);
  }

  const rows = (data ?? []) as VolunteerRow[];
  if (rows.length > 1) {
    throw new HttpError(
      409,
      "Se detectaron multiples voluntarios con el mismo correo en el tenant."
    );
  }

  return rows[0] ?? null;
}

async function findUserByEmail(email: string): Promise<User | null> {
  const adminClient = createAdminClient();
  let page = 1;
  const perPage = 200;

  while (page <= 10) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw new HttpError(500, "No se pudo listar auth.users.", error);
    }

    const match =
      data.users.find((candidate) => candidate.email?.toLowerCase() === email) ?? null;
    if (match) {
      return match;
    }

    if (data.users.length < perPage) {
      return null;
    }

    page += 1;
  }

  return null;
}

async function ensureUserByEmail(options: {
  email: string;
  password: string;
  fullName: string;
  documentType: string | null;
  documentNumber: string;
  genderCode: string | null;
}): Promise<{ user: User; existingUser: boolean }> {
  const existingUser = await findUserByEmail(options.email);
  if (existingUser) {
    return {
      user: existingUser,
      existingUser: true,
    };
  }

  const adminClient = createAdminClient();
  const { data, error } = await adminClient.auth.admin.createUser({
    email: options.email,
    password: options.password,
    email_confirm: true,
    user_metadata: {
      full_name: options.fullName,
      tipo_documento: options.documentType,
      numero_documento: options.documentNumber,
      genero: options.genderCode,
    },
  });

  if (error || !data.user) {
    throw new HttpError(500, "No se pudo crear auth.users.", error);
  }

  return {
    user: data.user,
    existingUser: false,
  };
}

async function syncProfile(options: {
  tenantId: string;
  userId: string;
  fullName: string;
  documentType: string | null;
  documentNumber: string;
  genderCode: string | null;
}): Promise<void> {
  const existingProfile = await loadProfile(options.userId);
  if (existingProfile?.tenant_id && existingProfile.tenant_id !== options.tenantId) {
    throw new HttpError(
      409,
      "El auth.user ya esta vinculado a otro tenant en public.profiles."
    );
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .schema("public")
    .from("profiles")
    .upsert(
      {
        id: options.userId,
        tenant_id: options.tenantId,
        full_name: options.fullName || existingProfile?.full_name ?? null,
        tipo_documento: options.documentType ?? existingProfile?.tipo_documento ?? null,
        numero_documento:
          options.documentNumber || existingProfile?.numero_documento ?? null,
        genero: options.genderCode ?? existingProfile?.genero ?? null,
      },
      { onConflict: "id" }
    );

  if (error) {
    throw new HttpError(500, "No se pudo sincronizar public.profiles.", error);
  }
}

async function ensureUserNotLinkedToAnotherVolunteer(
  tenantId: string,
  userId: string,
  volunteerId: string | null
): Promise<void> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("ong")
    .from("voluntarios")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("iam_user_id", userId)
    .limit(2);

  if (error) {
    throw new HttpError(500, "No se pudo validar la vinculacion IAM del voluntario.", error);
  }

  const rows = (data ?? []) as Array<{ id: string }>;
  if (!rows.length) {
    return;
  }

  if (!volunteerId) {
    throw new HttpError(
      409,
      "El usuario institucional ya esta vinculado a otro voluntario del tenant."
    );
  }

  if (rows.some((row) => row.id !== volunteerId)) {
    throw new HttpError(
      409,
      "El usuario institucional ya esta vinculado a otro voluntario del tenant."
    );
  }
}

async function resolveDefaultVolunteerState(): Promise<string> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("ong")
    .from("estados_voluntario")
    .select("codigo, nombre_estado")
    .order("orden_visual", { ascending: true });

  if (error) {
    throw new HttpError(500, "No se pudo cargar ong.estados_voluntario.", error);
  }

  const rows = (data ?? []) as VolunteerStateRow[];
  if (!rows.length) {
    throw new HttpError(409, "No existe un estado real en ong.estados_voluntario.");
  }

  const pending =
    rows.find((row) => normalizeText(`${row.codigo} ${row.nombre_estado}`).includes("pend")) ??
    rows.find((row) => normalizeText(`${row.codigo} ${row.nombre_estado}`).includes("nuev")) ??
    rows.find((row) => normalizeText(`${row.codigo} ${row.nombre_estado}`).includes("act")) ??
    rows[0];

  return pending.codigo;
}

async function ensureVolunteerUniqueFields(options: {
  tenantId: string;
  volunteerId: string | null;
  documentNumber: string;
  documentType: string | null;
  email: string | null;
}): Promise<void> {
  const adminClient = createAdminClient();

  let documentQuery = adminClient
    .schema("ong")
    .from("voluntarios")
    .select("id")
    .eq("tenant_id", options.tenantId)
    .eq("numero_documento", options.documentNumber);

  if (options.documentType) {
    documentQuery = documentQuery.eq("tipo_documento", options.documentType);
  }
  if (options.volunteerId) {
    documentQuery = documentQuery.neq("id", options.volunteerId);
  }

  const { data: documentRows, error: documentError } = await documentQuery.limit(1);
  if (documentError) {
    throw new HttpError(500, "No se pudo validar el documento del voluntario.", documentError);
  }
  if ((documentRows ?? []).length > 0) {
    throw new HttpError(
      409,
      "Ya existe un voluntario con el mismo tipo y numero de documento."
    );
  }

  if (!options.email) {
    return;
  }

  let emailQuery = adminClient
    .schema("ong")
    .from("voluntarios")
    .select("id")
    .eq("tenant_id", options.tenantId)
    .eq("email", options.email);

  if (options.volunteerId) {
    emailQuery = emailQuery.neq("id", options.volunteerId);
  }

  const { data: emailRows, error: emailError } = await emailQuery.limit(1);
  if (emailError) {
    throw new HttpError(500, "No se pudo validar el correo del voluntario.", emailError);
  }
  if ((emailRows ?? []).length > 0) {
    throw new HttpError(409, "Ya existe un voluntario con el mismo correo.");
  }
}

async function upsertVolunteer(options: {
  tenantId: string;
  currentVolunteer: VolunteerRow | null;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
  documentType: string | null;
  genderCode: string | null;
  countryCode: string | null;
  birthDate: string | null;
  phone: string | null;
  notes: string | null;
}): Promise<{ volunteer: VolunteerRow; linked: boolean }> {
  await ensureVolunteerUniqueFields({
    tenantId: options.tenantId,
    volunteerId: options.currentVolunteer?.id ?? null,
    documentNumber: options.documentNumber,
    documentType: options.documentType,
    email: options.email,
  });

  await ensureUserNotLinkedToAnotherVolunteer(
    options.tenantId,
    options.userId,
    options.currentVolunteer?.id ?? null
  );

  const adminClient = createAdminClient();
  if (options.currentVolunteer) {
    if (
      options.currentVolunteer.iam_user_id &&
      options.currentVolunteer.iam_user_id !== options.userId
    ) {
      throw new HttpError(409, "El voluntario ya esta vinculado a otro auth.user.");
    }

    const { data, error } = await adminClient
      .schema("ong")
      .from("voluntarios")
      .update({
        iam_user_id: options.userId,
        numero_documento: options.documentNumber,
        tipo_documento: options.documentType,
        genero: options.genderCode,
        codigo_pais: options.countryCode ?? options.currentVolunteer.codigo_pais ?? "PE",
        nombre: options.firstName,
        apellido: options.lastName,
        fecha_nacimiento: options.birthDate,
        email: options.email,
        telefono: options.phone,
        observaciones: options.notes ?? options.currentVolunteer.observaciones ?? null,
        updated_by: options.userId,
      })
      .eq("tenant_id", options.tenantId)
      .eq("id", options.currentVolunteer.id)
      .select(
        "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, codigo_estado, observaciones"
      )
      .single();

    if (error) {
      throw new HttpError(500, "No se pudo actualizar ong.voluntarios.", error);
    }

    return {
      volunteer: data as VolunteerRow,
      linked: true,
    };
  }

  const defaultState = await resolveDefaultVolunteerState();
  const { data, error } = await adminClient
    .schema("ong")
    .from("voluntarios")
    .insert({
      tenant_id: options.tenantId,
      iam_user_id: options.userId,
      numero_documento: options.documentNumber,
      tipo_documento: options.documentType,
      genero: options.genderCode,
      codigo_pais: options.countryCode ?? "PE",
      nombre: options.firstName,
      apellido: options.lastName,
      fecha_nacimiento: options.birthDate,
      email: options.email,
      telefono: options.phone,
      codigo_estado: defaultState,
      observaciones: options.notes,
      created_by: options.userId,
      updated_by: options.userId,
    })
    .select(
      "id, tenant_id, iam_user_id, numero_documento, tipo_documento, genero, codigo_pais, nombre, apellido, fecha_nacimiento, email, telefono, codigo_estado, observaciones"
    )
    .single();

  if (error) {
    throw new HttpError(500, "No se pudo crear ong.voluntarios.", error);
  }

  return {
    volunteer: data as VolunteerRow,
    linked: true,
  };
}

async function syncAdmissionRequest(
  tenantId: string,
  requestId: string | null,
  volunteerId: string,
  userId: string
): Promise<boolean> {
  if (!requestId) {
    return false;
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .schema("rrhh")
    .from("solicitudes_admision")
    .update({
      id_voluntario_vinculado: volunteerId,
      updated_by: userId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", requestId);

  if (error) {
    throw new HttpError(500, "No se pudo vincular rrhh.solicitudes_admision.", error);
  }

  return true;
}

async function consumeCodeUse(
  code: RegistrationCodeRow,
  volunteerId: string,
  userId: string
): Promise<RegistrationCodeRow> {
  const nextUseCount = code.use_count + 1;
  const nextStatus: RegistrationCodeStatus =
    nextUseCount >= code.max_uses ? "consumido" : code.estado;

  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("rrhh")
    .from("codigos_registro_voluntario")
    .update({
      id_voluntario: volunteerId,
      use_count: nextUseCount,
      estado: nextStatus,
      updated_by: userId,
    })
    .eq("tenant_id", code.tenant_id)
    .eq("id", code.id)
    .eq("use_count", code.use_count)
    .eq("estado", code.estado)
    .select(
      "id, tenant_id, codigo, email_objetivo, numero_documento_objetivo, nombres_objetivo, apellidos_objetivo, id_solicitud, id_voluntario, expires_at, max_uses, use_count, estado, created_by, updated_by"
    )
    .single();

  if (error) {
    throw new HttpError(409, "El codigo fue consumido o actualizado en paralelo.", error);
  }

  return data as RegistrationCodeRow;
}

async function loadExistingRegistrationDocuments(
  tenantId: string,
  codeId: string
): Promise<RegistrationDocumentRow[]> {
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .schema("rrhh")
    .from("registro_documentos_postulante")
    .select("id, tenant_id, id_codigo_registro, tipo_documento, archivo_url")
    .eq("tenant_id", tenantId)
    .eq("id_codigo_registro", codeId);

  if (error) {
    throw new HttpError(
      500,
      "No se pudo cargar rrhh.registro_documentos_postulante.",
      error
    );
  }

  return (data ?? []) as RegistrationDocumentRow[];
}

async function uploadRegistrationFile(
  code: RegistrationCodeRow,
  file: File
): Promise<string> {
  if (!REGISTRATION_DOCUMENTS_BUCKET.trim()) {
    throw new HttpError(
      400,
      "No hay bucket configurado para subir documentos del postulante. Registra una URL manual."
    );
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `registro-postulantes/${code.tenant_id}/${code.id}/${Date.now()}-${safeName}`;
  const adminClient = createAdminClient();
  const { error } = await adminClient.storage
    .from(REGISTRATION_DOCUMENTS_BUCKET.trim())
    .upload(storagePath, file, {
      upsert: false,
      contentType: file.type || undefined,
    });

  if (error) {
    throw new HttpError(500, "No se pudo subir el documento del postulante.", error);
  }

  return `${REGISTRATION_DOCUMENTS_BUCKET.trim()}/${storagePath}`;
}

function isRouteValueValid(value: string | null | undefined): boolean {
  const cleaned = sanitizeText(value, 2000);
  if (!cleaned) {
    return false;
  }

  return /^(https?:\/\/\S+|[a-zA-Z0-9._-]+\/.+)$/.test(cleaned);
}

async function syncRegistrationDocuments(options: {
  code: RegistrationCodeRow;
  userId: string;
  documents: ConsumeDocumentPayload[];
  formData: FormData;
}): Promise<number> {
  const existingRows = await loadExistingRegistrationDocuments(
    options.code.tenant_id,
    options.code.id
  );
  const existingKeys = new Set(
    existingRows.map((row) => `${row.tipo_documento}::${row.archivo_url}`)
  );

  const seenPayloadKeys = new Set<string>();
  const payloads: Array<{ type: string; url: string }> = [];

  for (const document of options.documents) {
    const type = sanitizeText(document.type, 50);
    if (!type) {
      throw new HttpError(400, "Cada documento debe indicar un tipo real.");
    }

    let resolvedUrl = sanitizeText(document.manualUrl ?? null, 2000);
    if (document.fileField) {
      const entry = options.formData.get(document.fileField);
      if (!entry || !(entry instanceof File)) {
        throw new HttpError(400, "No se encontro el archivo enviado para uno de los documentos.");
      }

      resolvedUrl = await uploadRegistrationFile(options.code, entry);
    }

    if (!resolvedUrl || !isRouteValueValid(resolvedUrl)) {
      throw new HttpError(
        400,
        "Cada documento debe subir un archivo o registrar una URL valida."
      );
    }

    const duplicateKey = `${type}::${resolvedUrl}`;
    if (seenPayloadKeys.has(duplicateKey)) {
      throw new HttpError(
        409,
        "No repitas documentos con el mismo tipo y archivo dentro del mismo envio."
      );
    }
    if (existingKeys.has(duplicateKey)) {
      throw new HttpError(
        409,
        "Uno de los documentos ya fue registrado previamente para este codigo."
      );
    }

    seenPayloadKeys.add(duplicateKey);
    payloads.push({
      type,
      url: resolvedUrl,
    });
  }

  if (!payloads.length) {
    return 0;
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .schema("rrhh")
    .from("registro_documentos_postulante")
    .insert(
      payloads.map((document) => ({
        tenant_id: options.code.tenant_id,
        id_codigo_registro: options.code.id,
        tipo_documento: document.type,
        archivo_url: document.url,
        verificado: false,
        verified_by: null,
        verified_at: null,
        created_by: options.userId,
        updated_by: options.userId,
      }))
    );

  if (error) {
    throw new HttpError(500, "No se pudo registrar la documentacion del postulante.", error);
  }

  return payloads.length;
}

function buildPreviewWarning(code: RegistrationCodeRow): string | null {
  if (code.estado === "revocado") {
    return "El codigo fue revocado por el tenant y ya no puede usarse.";
  }
  if (code.estado === "consumido") {
    return "El codigo ya fue consumido y no admite un nuevo registro.";
  }
  if (code.estado === "expirado") {
    return "El codigo se encuentra expirado.";
  }
  if (code.use_count >= code.max_uses) {
    return "El codigo alcanzo su numero maximo de usos.";
  }
  return null;
}

async function buildPreviewPayload(code: RegistrationCodeRow) {
  const normalizedCode = await markCodeExpiredIfNeeded(code);
  const request = await loadRequest(normalizedCode.tenant_id, normalizedCode.id_solicitud);
  const linkedVolunteer =
    (await loadVolunteer(normalizedCode.tenant_id, normalizedCode.id_voluntario)) ??
    (await loadVolunteer(normalizedCode.tenant_id, request?.id_voluntario_vinculado ?? null));

  const targetEmail = normalizedCode.email_objetivo ?? request?.email ?? linkedVolunteer?.email ?? null;
  const targetDocumentNumber =
    normalizedCode.numero_documento_objetivo ?? linkedVolunteer?.numero_documento ?? null;
  const targetFullName = buildTargetFullName(normalizedCode, request);
  const nameSource =
    targetFullName ||
    (linkedVolunteer ? `${linkedVolunteer.nombre} ${linkedVolunteer.apellido}`.trim() : "");
  const splitName = splitFullName(nameSource);
  const warning = buildPreviewWarning(normalizedCode);

  return {
    tenantId: normalizedCode.tenant_id,
    codeId: normalizedCode.id,
    code: normalizedCode.codigo,
    status: normalizedCode.estado,
    expiresAt: normalizedCode.expires_at,
    expiresAtLabel: toDateTimeLabel(normalizedCode.expires_at),
    usesLabel: `${normalizedCode.use_count}/${normalizedCode.max_uses}`,
    requestId: normalizedCode.id_solicitud,
    volunteerId: linkedVolunteer?.id ?? normalizedCode.id_voluntario ?? request?.id_voluntario_vinculado ?? null,
    linkedVolunteerName: linkedVolunteer
      ? `${linkedVolunteer.nombre} ${linkedVolunteer.apellido}`.trim()
      : null,
    targetEmail: normalizedCode.email_objetivo,
    targetDocumentNumber: normalizedCode.numero_documento_objetivo,
    targetFullName,
    email: targetEmail,
    documentNumber: targetDocumentNumber,
    documentType: linkedVolunteer?.tipo_documento ?? null,
    firstName: splitName.firstName,
    lastName: splitName.lastName,
    genderCode: linkedVolunteer?.genero ?? null,
    countryCode: linkedVolunteer?.codigo_pais ?? "PE",
    birthDate: linkedVolunteer?.fecha_nacimiento ?? null,
    phone: linkedVolunteer?.telefono ?? null,
    notes: request?.notas ?? linkedVolunteer?.observaciones ?? null,
    emailLocked: Boolean(normalizedCode.email_objetivo),
    documentLocked: Boolean(normalizedCode.numero_documento_objetivo),
    canConsume:
      normalizedCode.estado === "activo" &&
      !warning &&
      normalizedCode.use_count < normalizedCode.max_uses,
    warning,
  };
}

async function parseConsumePayload(request: Request): Promise<{
  payload: ConsumePayload;
  formData: FormData;
}> {
  const formData = await request.formData();
  const payloadRaw = formData.get("payload");

  if (typeof payloadRaw !== "string") {
    throw new HttpError(400, "Falta el payload del registro.");
  }

  try {
    const payload = JSON.parse(payloadRaw) as ConsumePayload;
    return {
      payload,
      formData,
    };
  } catch (error) {
    throw new HttpError(400, "El payload del registro no es JSON valido.", error);
  }
}

function validateCodeCompatibility(code: RegistrationCodeRow, payload: ConsumePayload): void {
  const email = sanitizeEmail(payload.email);
  const documentNumber = sanitizeText(payload.documentNumber, 50);

  if (code.email_objetivo && email !== code.email_objetivo.toLowerCase()) {
    throw new HttpError(409, "El correo no coincide con el objetivo definido en el codigo.");
  }
  if (
    code.numero_documento_objetivo &&
    documentNumber !== code.numero_documento_objetivo
  ) {
    throw new HttpError(
      409,
      "El numero de documento no coincide con el objetivo definido en el codigo."
    );
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return optionsResponse();
  }

  try {
    if (request.method !== "POST") {
      throw new HttpError(405, "Metodo no permitido.");
    }

    const contentType = request.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await parseJsonBody<PreviewRequest>(request);
      const code = sanitizeCode(body.code);
      const tenantId = sanitizeOptionalId(body.tenantId ?? null);

      if (!code) {
        throw new HttpError(400, "Debes enviar un codigo de registro.");
      }

      const registrationCode = await loadRegistrationCode(code, tenantId);
      const preview = await buildPreviewPayload(registrationCode);
      return jsonResponse(preview);
    }

    const { payload, formData } = await parseConsumePayload(request);
    const codeValue = sanitizeCode(payload.code);
    const tenantId = sanitizeOptionalId(payload.tenantId ?? null);
    const email = sanitizeEmail(payload.email);
    const password = sanitizeText(payload.password, 128);
    const firstName = sanitizeText(payload.firstName, 150);
    const lastName = sanitizeText(payload.lastName, 150);
    const documentNumber = sanitizeText(payload.documentNumber, 50);
    const documentType = sanitizeText(payload.documentType ?? null, 20) || null;
    const genderCode = sanitizeText(payload.genderCode ?? null, 20) || null;
    const countryCode = sanitizeText(payload.countryCode ?? null, 20) || null;
    const birthDate = sanitizeDateValue(payload.birthDate ?? null);
    const phone = sanitizePhone(payload.phone ?? null);
    const notes = sanitizeText(payload.notes ?? null, 500) || null;
    const documents = payload.documents ?? [];

    if (!codeValue) {
      throw new HttpError(400, "Debes enviar un codigo valido.");
    }
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      throw new HttpError(400, "Debes enviar un correo valido.");
    }
    if (password.length < 8) {
      throw new HttpError(400, "La contrasena debe tener al menos 8 caracteres.");
    }
    if (!firstName || !lastName) {
      throw new HttpError(400, "Nombres y apellidos son obligatorios.");
    }
    if (!documentNumber) {
      throw new HttpError(400, "El numero de documento es obligatorio.");
    }

    const rawCode = await loadRegistrationCode(codeValue, tenantId);
    const registrationCode = await markCodeExpiredIfNeeded(rawCode);
    const preview = await buildPreviewPayload(registrationCode);

    if (!preview.canConsume) {
      throw new HttpError(409, preview.warning ?? "El codigo ya no puede consumirse.");
    }

    validateCodeCompatibility(registrationCode, payload);

    const requestRow = await loadRequest(
      registrationCode.tenant_id,
      registrationCode.id_solicitud
    );
    const directVolunteer =
      (await loadVolunteer(registrationCode.tenant_id, registrationCode.id_voluntario)) ??
      (await loadVolunteer(
        registrationCode.tenant_id,
        requestRow?.id_voluntario_vinculado ?? null
      ));
    const volunteerByDocument = await findVolunteerByDocument(
      registrationCode.tenant_id,
      documentNumber,
      documentType
    );
    const volunteerByEmail = await findVolunteerByEmail(registrationCode.tenant_id, email);

    let targetVolunteer = directVolunteer ?? volunteerByDocument ?? volunteerByEmail ?? null;
    if (
      volunteerByDocument &&
      volunteerByEmail &&
      volunteerByDocument.id !== volunteerByEmail.id
    ) {
      throw new HttpError(
        409,
        "El correo y el documento apuntan a voluntarios distintos dentro del tenant."
      );
    }
    if (
      directVolunteer &&
      volunteerByDocument &&
      directVolunteer.id !== volunteerByDocument.id
    ) {
      throw new HttpError(
        409,
        "El codigo apunta a un voluntario distinto del documento enviado."
      );
    }
    if (
      directVolunteer &&
      volunteerByEmail &&
      directVolunteer.id !== volunteerByEmail.id
    ) {
      throw new HttpError(
        409,
        "El codigo apunta a un voluntario distinto del correo enviado."
      );
    }

    const { user, existingUser } = await ensureUserByEmail({
      email,
      password,
      fullName: `${firstName} ${lastName}`.trim(),
      documentType,
      documentNumber,
      genderCode,
    });

    await syncProfile({
      tenantId: registrationCode.tenant_id,
      userId: user.id,
      fullName: `${firstName} ${lastName}`.trim(),
      documentType,
      documentNumber,
      genderCode,
    });

    const upsertedVolunteer = await upsertVolunteer({
      tenantId: registrationCode.tenant_id,
      currentVolunteer: targetVolunteer,
      userId: user.id,
      email,
      firstName,
      lastName,
      documentNumber,
      documentType,
      genderCode,
      countryCode,
      birthDate,
      phone,
      notes,
    });

    const documentsRegistered = await syncRegistrationDocuments({
      code: registrationCode,
      userId: user.id,
      documents,
      formData,
    });

    const requestLinked = await syncAdmissionRequest(
      registrationCode.tenant_id,
      registrationCode.id_solicitud,
      upsertedVolunteer.volunteer.id,
      user.id
    );

    const consumedCode = await consumeCodeUse(
      registrationCode,
      upsertedVolunteer.volunteer.id,
      user.id
    );

    return jsonResponse({
      tenantId: registrationCode.tenant_id,
      codeId: consumedCode.id,
      code: consumedCode.codigo,
      email,
      userId: user.id,
      volunteerId: upsertedVolunteer.volunteer.id,
      requestId: consumedCode.id_solicitud,
      existingUser,
      profileSynced: true,
      volunteerLinked: upsertedVolunteer.linked,
      requestLinked,
      documentsRegistered,
      codeStatus: consumedCode.estado,
      usesLabel: `${consumedCode.use_count}/${consumedCode.max_uses}`,
    });
  } catch (error) {
    return errorResponse(error, "No se pudo consumir el codigo de registro.");
  }
});
