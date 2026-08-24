import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  NotificationSelectOption,
  NotificationTemplateMutationInput,
  NotificationTemplateRow,
  NotificationTemplatesData,
} from "../../modules/notifications/types";
import {
  comunicacionesSchema,
  normalizeText,
  resolveNotificationCapabilities,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
} from "./shared";

type NotificationChannelRow =
  AppDatabase["comunicaciones"]["Tables"]["canales_notificacion"]["Row"];
type NotificationTemplateDbRow =
  AppDatabase["comunicaciones"]["Tables"]["plantillas_notificacion"]["Row"];
type NotificationTemplateVariablesValue = NotificationTemplateDbRow["variables"];

const DEFAULT_TEMPLATE_VARIABLES_JSON = "[]";

const TEMPLATE_UNSUPPORTED_FLOWS = [
  "comunicaciones.plantillas_notificacion ya documenta `variables` y `codigo_evento`; la UI persiste ambos campos reales, pero no inventa motor de disparo, render ni envio.",
  "No existe tabla documental de ejecuciones o entregas por plantilla; este submodulo administra solo el registro real y su activacion.",
  "comunicaciones.plantillas_notificacion no documenta soft delete. La baja operativa se resuelve con `activa = false`.",
];

function sanitizeTemplateContent(
  value: string | null | undefined,
  maxLength: number
): string {
  if (!value) {
    return "";
  }

  return value.trim().slice(0, maxLength);
}

function formatJsonValue(
  value: NotificationTemplateVariablesValue,
  fallback = DEFAULT_TEMPLATE_VARIABLES_JSON
): string {
  try {
    return JSON.stringify(value ?? [], null, 2) ?? fallback;
  } catch {
    return fallback;
  }
}

function buildJsonPreview(value: string, maxLength = 120): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return DEFAULT_TEMPLATE_VARIABLES_JSON;
  }

  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function buildVariablesSummary(value: NotificationTemplateVariablesValue): string {
  if (Array.isArray(value)) {
    return `${value.length} variable${value.length === 1 ? "" : "s"}`;
  }

  if (value && typeof value === "object") {
    return `${Object.keys(value as Record<string, unknown>).length} clave(s)`;
  }

  return "Sin variables";
}

function parseVariablesJson(
  value: string | null | undefined
): NotificationTemplateVariablesValue {
  const raw = sanitizeTemplateContent(value, 20_000).trim();
  const source = raw || DEFAULT_TEMPLATE_VARIABLES_JSON;

  try {
    return JSON.parse(source) as NotificationTemplateVariablesValue;
  } catch {
    throw new Error("`variables` debe contener JSON valido.");
  }
}

function sanitizeTemplateInput(input: NotificationTemplateMutationInput): {
  templateId: string | null;
  channelCode: string;
  name: string;
  subject: string;
  textBody: string;
  htmlBody: string;
  eventCode: string;
  variables: NotificationTemplateVariablesValue;
  active: boolean;
} {
  const templateId = sanitizeOptionalId(input.templateId ?? null);
  const channelCode = sanitizeText(input.channelCode, 50);
  const name = sanitizeText(input.name, 150);
  const subject = sanitizeText(input.subject, 500);
  const textBody = sanitizeTemplateContent(input.textBody, 10_000);
  const htmlBody = sanitizeTemplateContent(input.htmlBody, 20_000);
  const eventCode = sanitizeText(input.eventCode, 100);
  const variables = parseVariablesJson(input.variablesJson);

  if (!channelCode) {
    throw new Error("El canal de la plantilla es obligatorio.");
  }

  if (!name) {
    throw new Error("El nombre de la plantilla es obligatorio.");
  }

  return {
    templateId,
    channelCode,
    name,
    subject,
    textBody,
    htmlBody,
    eventCode,
    variables,
    active: Boolean(input.active),
  };
}

function buildContentSummary(row: NotificationTemplateDbRow): string {
  const formats: string[] = [];
  if (row.cuerpo_texto) {
    formats.push("Texto");
  }
  if (row.cuerpo_html) {
    formats.push("HTML");
  }

  if (!formats.length) {
    return "Sin cuerpo documentado";
  }

  return formats.join(" + ");
}

function mapTemplateRow(
  row: NotificationTemplateDbRow,
  channelByCode: Map<string, string>,
  profileLabels: Map<string, string>
): NotificationTemplateRow {
  const variablesJson = formatJsonValue(row.variables);

  return {
    id: row.id,
    channelCode: row.codigo_canal,
    channelLabel: channelByCode.get(row.codigo_canal) ?? row.codigo_canal,
    name: row.nombre_plantilla,
    subject: row.asunto ?? "",
    textBody: row.cuerpo_texto ?? "",
    htmlBody: row.cuerpo_html ?? "",
    eventCode: row.codigo_evento ?? "",
    variablesJson,
    variablesPreview: buildJsonPreview(variablesJson),
    variablesSummary: buildVariablesSummary(row.variables),
    active: row.activa ?? false,
    activeLabel: row.activa ? "Activa" : "Inactiva",
    statusVariant: row.activa ? "success" : "secondary",
    contentSummary: buildContentSummary(row),
      // @ts-ignore
      // @ts-ignore
    createdAt: row.created_at,
    createdAtLabel: toDateTimeLabel(row.created_at),
    createdBy: row.created_by,
    createdByLabel: row.created_by
      ? profileLabels.get(row.created_by) ?? row.created_by
      // @ts-ignore
      : "-",
      // @ts-ignore
    updatedAt: row.updated_at,
    updatedAtLabel: toDateTimeLabel(row.updated_at),
    updatedBy: row.updated_by,
    updatedByLabel: row.updated_by
      ? profileLabels.get(row.updated_by) ?? row.updated_by
      : "-",
    searchValue: normalizeText(
      [
        row.nombre_plantilla,
        row.codigo_canal,
        channelByCode.get(row.codigo_canal) ?? "",
        row.codigo_evento ?? "",
        row.asunto ?? "",
        row.cuerpo_texto ?? "",
        row.cuerpo_html ?? "",
        variablesJson,
      ].join(" ")
    ),
  };
}

async function loadNotificationChannels(): Promise<{
  rows: NotificationChannelRow[];
  options: NotificationSelectOption[];
  byCode: Map<string, string>;
}> {
  const { data, error } = await comunicacionesSchema()
    .from("canales_notificacion")
    .select("codigo, nombre")
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as NotificationChannelRow[];
  return {
    rows,
    options: rows.map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
    byCode: new Map(rows.map((row): [string, string] => [row.codigo, row.nombre])),
  };
}

async function validateChannelCode(channelCode: string): Promise<void> {
  const { data, error } = await comunicacionesSchema()
    .from("canales_notificacion")
    .select("codigo")
    .eq("codigo", channelCode)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  if (!(data ?? []).length) {
    throw new Error("El canal seleccionado no existe en comunicaciones.canales_notificacion.");
  }
}

async function getEditableTemplate(
  templateId: string,
  tenantId: string
): Promise<NotificationTemplateDbRow> {
  const { data, error } = await comunicacionesSchema()
    .from("plantillas_notificacion")
    .select(
      "id, tenant_id, codigo_canal, nombre_plantilla, asunto, cuerpo_html, cuerpo_texto, activa, variables, codigo_evento, created_at, updated_at, created_by, updated_by"
    )
    .eq("tenant_id", tenantId)
    .eq("id", templateId)
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  const template = ((data ?? []) as NotificationTemplateDbRow[])[0];
  if (!template) {
    throw new Error("La plantilla no existe para el tenant actual.");
  }

  return template;
}

export async function getNotificationTemplatesData(): Promise<NotificationTemplatesData> {
  const access = await resolveNotificationCapabilities();
  const warnings = access.warnings.slice();

  if (!access.canReadTemplates || !access.tenantId) {
    return {
      access,
      rows: [],
      channelOptions: [],
      summary: {
        total: 0,
        active: 0,
        inactive: 0,
        channels: 0,
        withEventCode: 0,
      },
      warnings,
      unsupportedFlows: TEMPLATE_UNSUPPORTED_FLOWS,
    };
  }

  try {
    const [channels, templatesResult] = await Promise.all([
      loadNotificationChannels(),
      comunicacionesSchema()
        .from("plantillas_notificacion")
        .select(
          "id, tenant_id, codigo_canal, nombre_plantilla, asunto, cuerpo_html, cuerpo_texto, activa, variables, codigo_evento, created_at, updated_at, created_by, updated_by"
        )
        .eq("tenant_id", access.tenantId)
        .order("updated_at", { ascending: false })
        .order("nombre_plantilla", { ascending: true }),
    ]);

    if (templatesResult.error) {
      throw new Error(templatesResult.error.message);
    }

    const templateRows = (templatesResult.data ?? []) as NotificationTemplateDbRow[];
    const profileLabels = await resolveProfileLabels(
      templateRows.flatMap((row) =>
        [row.created_by, row.updated_by].filter((value): value is string => Boolean(value))
      ),
      access.tenantId
    ).catch(() => {
      warnings.push("No se pudieron resolver algunos nombres de usuarios en public.profiles.");
      return new Map<string, string>();
    });

    const rows = templateRows.map((row) =>
      mapTemplateRow(row, channels.byCode, profileLabels)
    );

    return {
      access,
      rows,
      channelOptions: channels.options,
      summary: {
        total: rows.length,
        active: rows.filter((row) => row.active).length,
        inactive: rows.filter((row) => !row.active).length,
        channels: new Set(rows.map((row) => row.channelCode)).size,
        withEventCode: rows.filter((row) => Boolean(row.eventCode)).length,
      },
      warnings,
      unsupportedFlows: TEMPLATE_UNSUPPORTED_FLOWS,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudieron cargar las plantillas reales.")
    );
  }
}

export async function getNotificationTemplateById(
  templateId: string
): Promise<NotificationTemplateRow> {
  const access = await resolveNotificationCapabilities();
  if (!access.canReadTemplates || !access.tenantId) {
    throw new Error("No tienes acceso para consultar plantillas.");
  }

  const sanitizedId = sanitizeOptionalId(templateId);
  if (!sanitizedId) {
    throw new Error("No se encontro la plantilla solicitada.");
  }

  try {
    const [channels, template] = await Promise.all([
      loadNotificationChannels(),
      getEditableTemplate(sanitizedId, access.tenantId),
    ]);

    const profileLabels = await resolveProfileLabels(
      [template.created_by, template.updated_by].filter((value): value is string => Boolean(value)),
      access.tenantId
    ).catch(() => new Map<string, string>());

    return mapTemplateRow(template, channels.byCode, profileLabels);
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar el detalle de la plantilla.")
    );
  }
}

export async function createNotificationTemplate(
  input: NotificationTemplateMutationInput
): Promise<void> {
  const access = await resolveNotificationCapabilities();
  if (!access.canManageTemplates || !access.tenantId) {
    throw new Error("No tienes acceso para crear plantillas.");
  }

  const sanitized = sanitizeTemplateInput(input);

  try {
    await validateChannelCode(sanitized.channelCode);

    const { error } = await comunicacionesSchema()
      .from("plantillas_notificacion")
      .insert({
        tenant_id: access.tenantId,
        codigo_canal: sanitized.channelCode,
        nombre_plantilla: sanitized.name,
        asunto: sanitized.subject || null,
        cuerpo_texto: sanitized.textBody || null,
        cuerpo_html: sanitized.htmlBody || null,
        variables: sanitized.variables,
        codigo_evento: sanitized.eventCode || null,
        activa: sanitized.active,
        created_by: access.currentUserId,
        updated_by: access.currentUserId,
      });

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo crear la plantilla."));
  }
}

export async function updateNotificationTemplate(
  input: NotificationTemplateMutationInput
): Promise<void> {
  const access = await resolveNotificationCapabilities();
  if (!access.canManageTemplates || !access.tenantId) {
    throw new Error("No tienes acceso para editar plantillas.");
  }

  const sanitized = sanitizeTemplateInput(input);
  if (!sanitized.templateId) {
    throw new Error("No se encontro la plantilla a editar.");
  }

  try {
    await getEditableTemplate(sanitized.templateId, access.tenantId);
    await validateChannelCode(sanitized.channelCode);

    const { error } = await comunicacionesSchema()
      .from("plantillas_notificacion")
      .update({
        codigo_canal: sanitized.channelCode,
        nombre_plantilla: sanitized.name,
        asunto: sanitized.subject || null,
        cuerpo_texto: sanitized.textBody || null,
        cuerpo_html: sanitized.htmlBody || null,
        variables: sanitized.variables,
        codigo_evento: sanitized.eventCode || null,
        activa: sanitized.active,
        updated_by: access.currentUserId,
      })
      .eq("tenant_id", access.tenantId)
      .eq("id", sanitized.templateId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(toFriendlyError(error, "No se pudo actualizar la plantilla."));
  }
}

export async function setNotificationTemplateActiveState(
  templateId: string,
  active: boolean
): Promise<void> {
  const access = await resolveNotificationCapabilities();
  if (!access.canManageTemplates || !access.tenantId) {
    throw new Error("No tienes acceso para cambiar el estado de plantillas.");
  }

  const sanitizedId = sanitizeOptionalId(templateId);
  if (!sanitizedId) {
    throw new Error("No se encontro la plantilla a actualizar.");
  }

  try {
    await getEditableTemplate(sanitizedId, access.tenantId);

    const { error } = await comunicacionesSchema()
      .from("plantillas_notificacion")
      .update({
        activa: active,
        updated_by: access.currentUserId,
      })
      .eq("tenant_id", access.tenantId)
      .eq("id", sanitizedId);

    if (error) {
      throw new Error(error.message);
    }
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo actualizar el estado de la plantilla.")
    );
  }
}
