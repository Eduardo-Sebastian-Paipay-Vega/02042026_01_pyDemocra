import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  IdCardCapabilityState,
  IdCardDetailData,
  IdCardListRow,
  IdCardStatusCode,
  IdCardTemplateDetailData,
  IdCardTemplateFieldRow,
  IdCardTemplateOption,
  IdCardTemplateSummaryRow,
  IdCardTemplateUpsertInput,
  IdCardUpsertInput,
  IdCardVolunteerOption,
  IdCardWorkspaceData,
} from "../../modules/people/types";
import {
  ID_CARD_FIELD_KEYS,
  ID_CARD_FIELD_LABELS,
  ID_CARD_STATUS_LABELS,
  buildIdCardQrPayload,
  generateIdCardCode,
  mergeIdCardFieldsWithDefaults,
} from "../../modules/people/idCardShared";
import type { StatusVariant } from "../../modules/operation/types";
import {
  createTenantScopedQuery,
  getRequiredTenantId,
  ongSchema,
  peopleDb,
  publicSchema,
  resolveActorId,
  resolveCurrentUserId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeText,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type TemplateRow = AppDatabase["ong"]["Tables"]["id_card_templates"]["Row"];
type TemplateFieldDbRow =
  AppDatabase["ong"]["Tables"]["id_card_template_fields"]["Row"];
type CardRow = AppDatabase["ong"]["Tables"]["id_cards"]["Row"];
type VolunteerRow = AppDatabase["ong"]["Tables"]["voluntarios"]["Row"];
type VolunteerStateRow =
  AppDatabase["ong"]["Tables"]["estados_voluntario"]["Row"];
type DocumentTypeRow =
  AppDatabase["public"]["Tables"]["cat_tipos_documento"]["Row"];

const DATE_TIME_FORMAT = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "Sin fecha";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return DATE_TIME_FORMAT.format(parsed);
}

function toStatusVariant(status: IdCardStatusCode): StatusVariant {
  if (status === "activa") {
    return "success";
  }
  if (status === "expirada") {
    return "warning";
  }
  return "secondary";
}

function sanitizeLongText(
  value: string | null | undefined,
  maxLength = 2_000_000
): string {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function normalizeColorHex(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 20);
  if (!cleaned) {
    return null;
  }

  const normalized = cleaned.startsWith("#") ? cleaned : `#${cleaned}`;
  if (!/^#[0-9A-Fa-f]{3,8}$/.test(normalized)) {
    throw new Error("El color hexadecimal del campo no es valido.");
  }

  return normalized.toUpperCase();
}

function normalizeNumeric(
  value: number,
  label: string,
  options?: { min?: number }
): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`${label} debe ser numerico.`);
  }

  if (typeof options?.min === "number" && numeric < options.min) {
    throw new Error(`${label} debe ser mayor o igual a ${options.min}.`);
  }

  return Math.round(numeric * 100) / 100;
}

function normalizeOptionalNumeric(
  value: number | null | undefined,
  label: string,
  options?: { min?: number }
): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  return normalizeNumeric(value, label, { min: options?.min });
}

function normalizeFieldRows(
  fields: IdCardTemplateFieldRow[],
  templateWidth: number,
  templateHeight: number
): IdCardTemplateFieldRow[] {
  const normalizedFields = mergeIdCardFieldsWithDefaults(
    fields,
    templateWidth,
    templateHeight
  );
  const seen = new Set<string>();

  return normalizedFields.map((field) => {
    if (seen.has(field.fieldKey)) {
      throw new Error("No puedes repetir el mismo campo en una plantilla.");
    }
    seen.add(field.fieldKey);

    const width = normalizeOptionalNumeric(field.width, `Ancho de ${field.label}`, {
      min: 1,
    });
    const height = normalizeOptionalNumeric(field.height, `Alto de ${field.label}`, {
      min: 1,
    });
    const fontSize = normalizeOptionalNumeric(
      field.fontSize,
      `Fuente de ${field.label}`,
      { min: 1 }
    );

    if ((field.fieldKey === "foto" || field.fieldKey === "qr") && (!width || !height)) {
      throw new Error(`El campo ${field.label} requiere ancho y alto.`);
    }

    return {
      id: sanitizeOptionalId(field.id),
      fieldKey: field.fieldKey,
      label: ID_CARD_FIELD_LABELS[field.fieldKey],
      posX: normalizeNumeric(field.posX, `Posicion X de ${field.label}`, { min: 0 }),
      posY: normalizeNumeric(field.posY, `Posicion Y de ${field.label}`, { min: 0 }),
      width,
      height,
      fontSize,
      fontFamily: sanitizeText(field.fontFamily ?? null, 100),
      fontWeight: sanitizeText(field.fontWeight ?? null, 50),
      colorHex: normalizeColorHex(field.colorHex),
      zIndex: Math.max(1, Math.round(Number(field.zIndex) || 1)),
    };
  });
}

function sanitizeCardCode(value: string | null | undefined): string {
  return sanitizeText(value, 50).toUpperCase().replace(/\s+/g, "-");
}

function normalizeExpiryDate(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 20);
  if (!cleaned) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    throw new Error("La fecha de vencimiento no es valida.");
  }

  return `${cleaned}T23:59:59.999`;
}

function buildDocumentLabel(
  documentTypeCode: string | null,
  documentNumber: string,
  documentTypeByCode: Map<string, string>
): string {
  const number = sanitizeText(documentNumber, 50);
  const type = documentTypeCode
    ? documentTypeByCode.get(documentTypeCode) ?? documentTypeCode
    : "";
  return type ? `${type} ${number}` : number;
}

async function hasPermission(permission: string, warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await peopleDb.rpc("fn_has_permission", {
      p_permission: permission,
    });

    if (error) {
      warnings.push(`No se pudo validar el permiso ${permission} con public.fn_has_permission().`);
      return false;
    }

    return data === true;
  } catch {
    warnings.push(`No se pudo validar el permiso ${permission} por RPC.`);
    return false;
  }
}

async function isTenantAdmin(warnings: string[]): Promise<boolean> {
  try {
    const { data, error } = await peopleDb.rpc("fn_is_tenant_admin");
    if (error) {
      warnings.push("No se pudo validar tenant admin con public.fn_is_tenant_admin().");
      return false;
    }

    return data === true;
  } catch {
    warnings.push("No se pudo validar tenant admin por RPC.");
    return false;
  }
}

export async function resolveIdCardCapabilities(): Promise<IdCardCapabilityState> {
  const warnings: string[] = [];
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    return {
      currentUserId: null,
      tenantId: null,
      isTenantAdmin: false,
      canRead: false,
      canManage: false,
      warnings: ["No se pudo resolver el usuario autenticado."],
    };
  }

  const [tenantIdResult, admin, canRead, canManage] = await Promise.all([
    getRequiredTenantId().catch(() => null),
    isTenantAdmin(warnings),
    hasPermission("idcards.read", warnings),
    hasPermission("idcards.manage", warnings),
  ]);

  return {
    currentUserId,
    tenantId: tenantIdResult,
    isTenantAdmin: admin,
    canRead: admin || canRead || canManage,
    canManage: admin || canManage,
    warnings,
  };
}

async function ensureIdCardReadAccess(): Promise<IdCardCapabilityState> {
  const access = await resolveIdCardCapabilities();
  if (!access.canRead) {
    throw new Error(
      "No tienes permisos para consultar credenciales ID. Requiere `idcards.read` o tenant admin."
    );
  }

  return access;
}

async function ensureIdCardManageAccess(): Promise<IdCardCapabilityState> {
  const access = await resolveIdCardCapabilities();
  if (!access.canManage) {
    throw new Error(
      "No tienes permisos para gestionar credenciales ID. Requiere `idcards.manage` o tenant admin."
    );
  }

  return access;
}

async function fetchVolunteerMaps(tenantId: string) {
  const [volunteerResult, documentTypesResult, statesResult] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("voluntarios")
        .select(
          "id, numero_documento, tipo_documento, nombre, apellido, ruta_foto, codigo_estado"
        ),
      tenantId
    )
      .order("apellido", { ascending: true })
      .order("nombre", { ascending: true }),
    publicSchema().from("cat_tipos_documento").select("codigo, nombre"),
    ongSchema().from("estados_voluntario").select("codigo, nombre_estado"),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (documentTypesResult.error) {
    throw new Error(documentTypesResult.error.message);
  }
  if (statesResult.error) {
    throw new Error(statesResult.error.message);
  }

  const volunteers = (volunteerResult.data ?? []) as Array<
    Pick<
      VolunteerRow,
      | "id"
      | "numero_documento"
      | "tipo_documento"
      | "nombre"
      | "apellido"
      | "ruta_foto"
      | "codigo_estado"
    >
  >;
  const documentTypeByCode = new Map(
    ((documentTypesResult.data ?? []) as DocumentTypeRow[]).map((row): [string, string] => [
      row.codigo,
      row.nombre,
    ])
  );
  const stateByCode = new Map(
    ((statesResult.data ?? []) as VolunteerStateRow[]).map((row): [string, string] => [
      row.codigo,
      row.nombre_estado,
    ])
  );

  return {
    volunteers,
    volunteerById: new Map(volunteers.map((row) => [row.id, row])),
    volunteerOptions: volunteers.map((row): IdCardVolunteerOption => ({
      value: row.id,
      label: `${row.nombre} ${row.apellido}`.trim(),
      fullName: `${row.nombre} ${row.apellido}`.trim(),
      documentLabel: buildDocumentLabel(
        row.tipo_documento,
        row.numero_documento,
        documentTypeByCode
      ),
      photoUrl: row.ruta_foto,
      stateLabel: stateByCode.get(row.codigo_estado) ?? row.codigo_estado,
    })),
  };
}

function mapTemplateSummary(row: TemplateRow, fieldCount: number): IdCardTemplateSummaryRow {
  return {
    id: row.id,
    name: row.nombre,
    baseImageUrl: row.base_image_url,
    templateWidth: Number(row.template_width),
    templateHeight: Number(row.template_height),
    isActive: row.activa,
    fieldCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedAtLabel: toDateTimeLabel(row.updated_at),
  };
}

function mapFieldRow(row: TemplateFieldDbRow): IdCardTemplateFieldRow {
  return {
    id: row.id,
    // @ts-ignore
    fieldKey: row.field_key,
    label: ID_CARD_FIELD_LABELS[row.field_key],
    posX: Number(row.pos_x),
    posY: Number(row.pos_y),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    fontSize: row.font_size === null ? null : Number(row.font_size),
    fontFamily: row.font_family,
    fontWeight: row.font_weight,
    colorHex: row.color_hex,
    zIndex: row.z_index,
  };
}

function mapCardRow(options: {
  row: CardRow;
  volunteerOptionsById: Map<string, IdCardVolunteerOption>;
  templateById: Map<string, IdCardTemplateSummaryRow>;
}): IdCardListRow {
  const volunteer = options.volunteerOptionsById.get(options.row.id_voluntario);
  const template = options.templateById.get(options.row.id_template);
  const stateCode = options.row.estado as IdCardStatusCode;

  return {
    id: options.row.id,
    volunteerId: options.row.id_voluntario,
    volunteerName: volunteer?.fullName ?? options.row.id_voluntario,
    documentLabel: volunteer?.documentLabel ?? "Sin documento",
    volunteerPhotoUrl: volunteer?.photoUrl ?? null,
    templateId: options.row.id_template,
    templateName: template?.name ?? options.row.id_template,
    cardCode: options.row.card_code,
    qrPayload: options.row.qr_payload,
    issuedAt: options.row.issued_at,
    issuedAtLabel: toDateTimeLabel(options.row.issued_at),
    expiresAt: options.row.expires_at,
    expiresAtLabel: toDateTimeLabel(options.row.expires_at),
    stateCode,
    stateLabel: ID_CARD_STATUS_LABELS[stateCode],
    statusVariant: toStatusVariant(stateCode),
    imageRenderUrl: options.row.image_render_url,
  };
}

export async function listIdCardWorkspace(): Promise<IdCardWorkspaceData> {
  const access = await resolveIdCardCapabilities();

  if (!access.canRead || !access.tenantId) {
    return {
      access,
      templates: [],
      cards: [],
      volunteerOptions: [],
      templateOptions: [],
      warnings: access.warnings.concat(
        "El submodulo de credenciales ID requiere `idcards.read` o tenant admin."
      ),
    };
  }

  const tenantId = access.tenantId;
  const [templateResult, fieldResult, cardResult, volunteerMaps] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("id_card_templates")
        .select(
          "id, nombre, base_image_url, template_width, template_height, activa, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    ).order("updated_at", { ascending: false }),
    createTenantScopedQuery(
      ongSchema()
        .from("id_card_template_fields")
        .select(
          "id, id_template, field_key, pos_x, pos_y, width, height, font_size, font_family, font_weight, color_hex, z_index, created_at, updated_at"
        ),
      tenantId
    ),
    createTenantScopedQuery(
      ongSchema()
        .from("id_cards")
        .select(
          "id, id_voluntario, id_template, card_code, qr_payload, issued_at, expires_at, estado, image_render_url, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    ).order("issued_at", { ascending: false }),
    fetchVolunteerMaps(tenantId),
  ]);

  if (templateResult.error) {
    throw new Error(templateResult.error.message);
  }
  if (fieldResult.error) {
    throw new Error(fieldResult.error.message);
  }
  if (cardResult.error) {
    throw new Error(cardResult.error.message);
  }

  const fieldRows = (fieldResult.data ?? []) as Array<Pick<TemplateFieldDbRow, "id_template">>;
  const fieldCountByTemplateId = new Map<string, number>();
  for (const row of fieldRows) {
    fieldCountByTemplateId.set(
      row.id_template,
      (fieldCountByTemplateId.get(row.id_template) ?? 0) + 1
    );
  }

  const templates = ((templateResult.data ?? []) as TemplateRow[]).map((row) =>
    mapTemplateSummary(row, fieldCountByTemplateId.get(row.id) ?? 0)
  );
  const templateById = new Map(templates.map((row) => [row.id, row]));
  const volunteerOptionsById = new Map(
    volunteerMaps.volunteerOptions.map((option) => [option.value, option])
  );

  const cards = ((cardResult.data ?? []) as CardRow[]).map((row) =>
    mapCardRow({
      row,
      volunteerOptionsById,
      templateById,
    })
  );

  return {
    access,
    templates,
    cards,
    volunteerOptions: volunteerMaps.volunteerOptions,
    templateOptions: templates.map(
      (template): IdCardTemplateOption => ({
        value: template.id,
        label: template.name,
        isActive: template.isActive,
      })
    ),
    warnings: access.warnings.concat(
      'Credenciales ID opera sobre `ong.id_card_templates`, `ong.id_card_template_fields` y `ong.id_cards` usando `supabase.schema("ong")` segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.'
    ),
  };
}

async function fetchTemplateDetailRaw(
  tenantId: string,
  templateId: string
): Promise<{
  template: TemplateRow;
  fields: IdCardTemplateFieldRow[];
}> {
  const targetId = sanitizeOptionalId(templateId);
  if (!targetId) {
    throw new Error("No se encontro la plantilla de credencial.");
  }

  const [templateResult, fieldResult] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("id_card_templates")
        .select(
          "id, nombre, base_image_url, template_width, template_height, activa, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    )
      .eq("id", targetId)
      .maybeSingle(),
    createTenantScopedQuery(
      ongSchema()
        .from("id_card_template_fields")
        .select(
          "id, id_template, field_key, pos_x, pos_y, width, height, font_size, font_family, font_weight, color_hex, z_index, created_at, updated_at"
        ),
      tenantId
    )
      .eq("id_template", targetId)
      .order("z_index", { ascending: true }),
  ]);

  if (templateResult.error) {
    throw new Error(templateResult.error.message);
  }
  if (fieldResult.error) {
    throw new Error(fieldResult.error.message);
  }

  const template = templateResult.data as TemplateRow | null;
  if (!template) {
    throw new Error("La plantilla de credencial ya no esta disponible.");
  }

  const mergedFields = mergeIdCardFieldsWithDefaults(
    ((fieldResult.data ?? []) as TemplateFieldDbRow[]).map(mapFieldRow),
    Number(template.template_width),
    Number(template.template_height)
  );

  return {
    template,
    fields: mergedFields,
  };
}

export async function getIdCardTemplateDetail(
  templateId: string
): Promise<IdCardTemplateDetailData | null> {
  const access = await ensureIdCardReadAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const { template, fields } = await fetchTemplateDetailRaw(tenantId, templateId);
  const labels = await resolveProfileLabels(
    uniqueNonEmpty([template.created_by, template.updated_by]),
    tenantId
  ).catch(() => new Map<string, string>());

  return {
    template: mapTemplateSummary(template, fields.length),
    fields,
    createdBy: labels.get(template.created_by ?? "") ?? template.created_by ?? "Sin dato",
    updatedBy: labels.get(template.updated_by ?? "") ?? template.updated_by ?? "Sin dato",
  };
}

function validateTemplateInput(input: IdCardTemplateUpsertInput): IdCardTemplateUpsertInput {
  const name = sanitizeText(input.name, 150);
  if (!name) {
    throw new Error("El nombre de la plantilla es obligatorio.");
  }

  const baseImageUrl = sanitizeLongText(input.baseImageUrl, 2_000_000);
  if (!baseImageUrl) {
    throw new Error("La plantilla debe tener una imagen base o un data URL real.");
  }

  const templateWidth = Math.max(1, Math.round(Number(input.templateWidth) || 0));
  const templateHeight = Math.max(1, Math.round(Number(input.templateHeight) || 0));
  if (!templateWidth || !templateHeight) {
    throw new Error("El ancho y alto de la plantilla deben ser mayores a cero.");
  }

  const normalizedFields = normalizeFieldRows(input.fields, templateWidth, templateHeight);
  if (normalizedFields.length !== ID_CARD_FIELD_KEYS.length) {
    throw new Error("La plantilla debe configurar foto, nombre, DNI, codigo y QR.");
  }

  return {
    name,
    baseImageUrl,
    templateWidth,
    templateHeight,
    isActive: Boolean(input.isActive),
    fields: normalizedFields,
    templateConfig: input.templateConfig ?? null,
  };
}

async function upsertTemplateFields(
  tenantId: string,
  templateId: string,
  fields: IdCardTemplateFieldRow[]
) {
  const payload = fields.map((field) => ({
    tenant_id: tenantId,
    id_template: templateId,
    field_key: field.fieldKey,
    pos_x: field.posX,
    pos_y: field.posY,
    width: field.width,
    height: field.height,
    font_size: field.fontSize,
    font_family: field.fontFamily,
    font_weight: field.fontWeight,
    color_hex: field.colorHex,
    z_index: field.zIndex,
  }));

  const { error } = await ongSchema().from("id_card_template_fields").upsert(payload, {
    onConflict: "id_template,field_key",
  });

  if (error) {
    throw new Error(error.message);
  }
}

async function saveTemplate(
  templateId: string | null,
  input: IdCardTemplateUpsertInput
): Promise<IdCardTemplateDetailData> {
  const access = await ensureIdCardManageAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const actorId = await resolveActorId();
  const normalized = validateTemplateInput(input);
  const targetId = sanitizeOptionalId(templateId);
  let persistedId = targetId;

  if (targetId) {
    const { error } = await ongSchema()
      .from("id_card_templates")
      .update({
        nombre: normalized.name,
        base_image_url: normalized.baseImageUrl,
        template_width: normalized.templateWidth,
        template_height: normalized.templateHeight,
        activa: normalized.isActive,
        template_config: normalized.templateConfig ?? null,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", targetId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await ongSchema()
      .from("id_card_templates")
      .insert({
        tenant_id: tenantId,
        nombre: normalized.name,
        base_image_url: normalized.baseImageUrl,
        template_width: normalized.templateWidth,
        template_height: normalized.templateHeight,
        activa: normalized.isActive,
        template_config: normalized.templateConfig ?? null,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    persistedId = data?.[0]?.id ?? null;
    if (!persistedId) {
      throw new Error("No se pudo recuperar la plantilla creada.");
    }
  }

  // @ts-ignore
  await upsertTemplateFields(tenantId, persistedId, normalized.fields);

  // @ts-ignore
  const detail = await getIdCardTemplateDetail(persistedId);
  if (!detail) {
    throw new Error("La plantilla fue guardada, pero ya no esta disponible.");
  }

  return detail;
}

/**
 * Upload a background image for an ID card template to Supabase Storage
 * bucket `id_templates` and return the public URL.
 *
 * Path: id_templates/<tenantId>/<timestamp>-<filename>
 */
export async function uploadTemplateBackground(file: File): Promise<string> {
  const tenantId = await getRequiredTenantId();
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${tenantId}/${Date.now()}-template-bg.${ext}`;

  const { error: uploadError } = await peopleDb.storage
    .from("id_templates")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    throw new Error(toFriendlyError(uploadError, "No se pudo subir la imagen de fondo."));
  }

  const { data } = peopleDb.storage.from("id_templates").getPublicUrl(path);
  return data.publicUrl;
}

export async function createIdCardTemplate(
  input: IdCardTemplateUpsertInput
): Promise<IdCardTemplateDetailData> {
  try {
    return await saveTemplate(null, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear la plantilla de credencial."));
  }
}

export async function updateIdCardTemplate(
  templateId: string,
  input: IdCardTemplateUpsertInput
): Promise<IdCardTemplateDetailData> {
  try {
    return await saveTemplate(templateId, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar la plantilla de credencial."));
  }
}

export async function setIdCardTemplateActive(
  templateId: string,
  isActive: boolean
): Promise<IdCardTemplateDetailData> {
  const access = await ensureIdCardManageAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const actorId = await resolveActorId();
  const targetId = sanitizeOptionalId(templateId);
  if (!targetId) {
    throw new Error("No se encontro la plantilla a actualizar.");
  }

  const { error } = await ongSchema()
    .from("id_card_templates")
    .update({
      activa: isActive,
      updated_by: actorId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", targetId);

  if (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar el estado de la plantilla."));
  }

  const detail = await getIdCardTemplateDetail(targetId);
  if (!detail) {
    throw new Error("La plantilla fue actualizada, pero su detalle ya no esta disponible.");
  }

  return detail;
}

async function ensureCardInputValid(
  tenantId: string,
  cardId: string | null,
  input: IdCardUpsertInput
): Promise<{
  volunteerId: string;
  templateId: string;
  cardCode: string;
  qrPayload: string;
  expiresAt: string | null;
  stateCode: IdCardStatusCode;
  imageRenderUrl: string | null;
}> {
  const volunteerId = sanitizeOptionalId(input.volunteerId);
  const templateId = sanitizeOptionalId(input.templateId);
  const stateCode = (sanitizeText(input.stateCode, 20) || "activa") as IdCardStatusCode;
  const allowedStates = new Set<IdCardStatusCode>(["activa", "revocada", "expirada"]);

  if (!volunteerId) {
    throw new Error("Debes seleccionar un voluntario real.");
  }
  if (!templateId) {
    throw new Error("Debes seleccionar una plantilla real.");
  }
  if (!allowedStates.has(stateCode)) {
    throw new Error("El estado de la credencial no es valido.");
  }

  const [volunteerResult, templateResult] = await Promise.all([
    createTenantScopedQuery(
      ongSchema().from("voluntarios").select("id, numero_documento"),
      tenantId
    )
      .eq("id", volunteerId)
      .maybeSingle(),
    createTenantScopedQuery(
      ongSchema().from("id_card_templates").select("id, activa"),
      tenantId
    )
      .eq("id", templateId)
      .maybeSingle(),
  ]);

  if (volunteerResult.error) {
    throw new Error(volunteerResult.error.message);
  }
  if (templateResult.error) {
    throw new Error(templateResult.error.message);
  }
  if (!volunteerResult.data) {
    throw new Error("El voluntario seleccionado no existe en ong.voluntarios.");
  }
  if (!templateResult.data) {
    throw new Error("La plantilla seleccionada no existe en ong.id_card_templates.");
  }

  const cardCode =
    sanitizeCardCode(input.cardCode) ||
    generateIdCardCode(volunteerResult.data.numero_documento);

  if (!cardCode) {
    throw new Error("No se pudo generar el codigo de la credencial.");
  }

  let duplicateCodeQuery = createTenantScopedQuery(
    ongSchema().from("id_cards").select("id"),
    tenantId
  ).eq("card_code", cardCode);

  let duplicateVolunteerQuery = createTenantScopedQuery(
    ongSchema().from("id_cards").select("id"),
    tenantId
  ).eq("id_voluntario", volunteerId);

  if (cardId) {
    duplicateCodeQuery = duplicateCodeQuery.neq("id", cardId);
    duplicateVolunteerQuery = duplicateVolunteerQuery.neq("id", cardId);
  }

  const [duplicateCodeResult, duplicateVolunteerResult] = await Promise.all([
    duplicateCodeQuery.limit(1),
    duplicateVolunteerQuery.limit(1),
  ]);

  if (duplicateCodeResult.error) {
    throw new Error(duplicateCodeResult.error.message);
  }
  if (duplicateVolunteerResult.error) {
    throw new Error(duplicateVolunteerResult.error.message);
  }
  if ((duplicateCodeResult.data ?? []).length > 0) {
    throw new Error("Ya existe otra credencial con el mismo codigo.");
  }
  if ((duplicateVolunteerResult.data ?? []).length > 0) {
    throw new Error("El voluntario ya tiene una credencial emitida. Edita la existente o revocala.");
  }

  return {
    volunteerId,
    templateId,
    cardCode,
    qrPayload: buildIdCardQrPayload(cardCode),
    expiresAt: normalizeExpiryDate(input.expiresAt),
    stateCode,
    imageRenderUrl: sanitizeLongText(input.imageRenderUrl, 2_000_000),
  };
}

async function saveCard(
  cardId: string | null,
  input: IdCardUpsertInput
): Promise<IdCardDetailData> {
  const access = await ensureIdCardManageAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const actorId = await resolveActorId();
  const targetId = sanitizeOptionalId(cardId);
  const normalized = await ensureCardInputValid(tenantId, targetId, input);
  let persistedId = targetId;

  if (targetId) {
    const { error } = await ongSchema()
      .from("id_cards")
      .update({
        id_voluntario: normalized.volunteerId,
        id_template: normalized.templateId,
        card_code: normalized.cardCode,
        qr_payload: normalized.qrPayload,
        expires_at: normalized.expiresAt,
        estado: normalized.stateCode,
        image_render_url: normalized.imageRenderUrl,
        updated_by: actorId,
      })
      .eq("tenant_id", tenantId)
      .eq("id", targetId);

    if (error) {
      throw new Error(error.message);
    }
  } else {
    const { data, error } = await ongSchema()
      .from("id_cards")
      .insert({
        tenant_id: tenantId,
        id_voluntario: normalized.volunteerId,
        id_template: normalized.templateId,
        card_code: normalized.cardCode,
        qr_payload: normalized.qrPayload,
        expires_at: normalized.expiresAt,
        estado: normalized.stateCode,
        image_render_url: normalized.imageRenderUrl,
        created_by: actorId,
        updated_by: actorId,
      })
      .select("id")
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    persistedId = data?.[0]?.id ?? null;
    if (!persistedId) {
      throw new Error("No se pudo recuperar la credencial creada.");
      // @ts-ignore
    }
  }

      // @ts-ignore
  const detail = await getIdCardDetail(persistedId);
  if (!detail) {
    throw new Error("La credencial fue guardada, pero su detalle ya no esta disponible.");
  }

  return detail;
}

export async function createIdCard(input: IdCardUpsertInput): Promise<IdCardDetailData> {
  try {
    return await saveCard(null, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo emitir la credencial."));
  }
}

export async function updateIdCard(
  cardId: string,
  input: IdCardUpsertInput
): Promise<IdCardDetailData> {
  try {
    return await saveCard(cardId, input);
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar la credencial."));
  }
}

export async function revokeIdCard(cardId: string): Promise<IdCardDetailData> {
  const access = await ensureIdCardManageAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const targetId = sanitizeOptionalId(cardId);
  if (!targetId) {
    throw new Error("No se encontro la credencial a revocar.");
  }

  const actorId = await resolveActorId();
  const { error } = await ongSchema()
    .from("id_cards")
    .update({
      estado: "revocada",
      updated_by: actorId,
    })
    .eq("tenant_id", tenantId)
    .eq("id", targetId);

  if (error) {
    throw new Error(toFriendlyError(error, "No se pudo revocar la credencial."));
  }

  const detail = await getIdCardDetail(targetId);
  if (!detail) {
    throw new Error("La credencial fue revocada, pero su detalle ya no esta disponible.");
  }

  return detail;
}

export async function getIdCardDetail(cardId: string): Promise<IdCardDetailData | null> {
  const access = await ensureIdCardReadAccess();
  const tenantId = access.tenantId;
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  const targetId = sanitizeOptionalId(cardId);
  if (!targetId) {
    return null;
  }

  const [cardResult, templateResult, volunteerMaps] = await Promise.all([
    createTenantScopedQuery(
      ongSchema()
        .from("id_cards")
        .select(
          "id, id_voluntario, id_template, card_code, qr_payload, issued_at, expires_at, estado, image_render_url, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    )
      .eq("id", targetId)
      .maybeSingle(),
    createTenantScopedQuery(
      ongSchema()
        .from("id_card_templates")
        .select(
          "id, nombre, base_image_url, template_width, template_height, activa, created_at, updated_at, created_by, updated_by"
        ),
      tenantId
    ),
    fetchVolunteerMaps(tenantId),
  ]);

  if (cardResult.error) {
    throw new Error(cardResult.error.message);
  }
  if (templateResult.error) {
    throw new Error(templateResult.error.message);
  }

  const card = cardResult.data as CardRow | null;
  if (!card) {
    return null;
  }

  const templates = ((templateResult.data ?? []) as TemplateRow[]).map((row) =>
    mapTemplateSummary(row, 0)
  );
  const templateById = new Map(templates.map((row) => [row.id, row]));
  const volunteerOptionsById = new Map(
    volunteerMaps.volunteerOptions.map((option) => [option.value, option])
  );

  const mappedCard = mapCardRow({
    row: card,
    volunteerOptionsById,
    templateById,
  });
  const templateDetail = await getIdCardTemplateDetail(card.id_template);
  if (!templateDetail) {
    throw new Error("La plantilla asociada a la credencial ya no esta disponible.");
  }

  const labels = await resolveProfileLabels(
    uniqueNonEmpty([card.created_by, card.updated_by]),
    tenantId
  ).catch(() => new Map<string, string>());

  return {
    card: mappedCard,
    template: templateDetail.template,
    fields: templateDetail.fields,
    createdBy: labels.get(card.created_by ?? "") ?? card.created_by ?? "Sin dato",
    updatedBy: labels.get(card.updated_by ?? "") ?? card.updated_by ?? "Sin dato",
  };
}
