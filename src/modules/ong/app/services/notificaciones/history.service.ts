import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  NotificationHistoryData,
  NotificationHistoryFilters,
  NotificationHistoryRow,
  NotificationSelectOption,
  NotificationTopbarItem,
} from "../../modules/notifications/types";
import {
  comunicacionesSchema,
  normalizeDateValue,
  normalizeText,
  resolveNotificationCapabilities,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toDayEndIso,
  toDayStartIso,
  toFriendlyError,
  uniqueNonEmpty,
} from "./shared";

type NotificationHistoryDbRow =
  AppDatabase["comunicaciones"]["Tables"]["historial_notificaciones"]["Row"];
type NotificationChannelRow =
  AppDatabase["comunicaciones"]["Tables"]["canales_notificacion"]["Row"];
type NotificationTemplateLookupRow =
  Pick<
    AppDatabase["comunicaciones"]["Tables"]["plantillas_notificacion"]["Row"],
    "id" | "nombre_plantilla"
  >;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const HISTORY_RECIPIENT_OPTION_LIMIT = 500;
const DELIVERY_STATE_OPTION_LIMIT = 300;
const TOPBAR_NOTIFICATION_LIMIT = 5;
const DEFAULT_PAYLOAD_JSON = "{}";

const HISTORY_UNSUPPORTED_FLOWS = [
  "La tabla ya expone `codigo_canal`, `estado_entrega`, `error_mensaje`, `id_plantilla` y `payload`; la UI muestra esos metadatos reales sin inventar proveedores ni motores externos.",
  "No existe contrato documental para reintentos o envio automatico desde frontend. sync_queue y user_devices no se exponen aqui como motor operativo de notificaciones.",
  "La bitacora real separa leida/no leida por `leida`; no existe fecha documental de lectura.",
];

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

function formatJsonValue(value: unknown, fallback = DEFAULT_PAYLOAD_JSON): string {
  try {
    return JSON.stringify(value ?? {}, null, 2) ?? fallback;
  } catch {
    return fallback;
  }
}

function buildJsonPreview(value: string, maxLength = 140): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (!compact) {
    return DEFAULT_PAYLOAD_JSON;
  }

  return compact.length > maxLength ? `${compact.slice(0, maxLength - 3)}...` : compact;
}

function toDeliveryStatusLabel(value: string | null | undefined): string {
  const normalized = sanitizeText(value, 60);
  if (!normalized) {
    return "Pendiente";
  }

  return normalized
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function toDeliveryStatusVariant(
  deliveryStatusCode: string,
  errorMessage: string
): NotificationHistoryRow["deliveryStatusVariant"] {
  const normalized = normalizeText(deliveryStatusCode);

  if (errorMessage) {
    return "destructive";
  }

  if (
    normalized.includes("entregado") ||
    normalized.includes("delivered") ||
    normalized.includes("exitos") ||
    normalized.includes("succeed")
  ) {
    return "success";
  }

  if (
    normalized.includes("enviado") ||
    normalized.includes("sent") ||
    normalized.includes("procesando") ||
    normalized.includes("processing")
  ) {
    return "info";
  }

  if (
    normalized.includes("error") ||
    normalized.includes("fall") ||
    normalized.includes("failed") ||
    normalized.includes("rechaz")
  ) {
    return "destructive";
  }

  if (
    normalized.includes("pendiente") ||
    normalized.includes("queue") ||
    normalized.includes("cola") ||
    normalized.includes("programad")
  ) {
    return "warning";
  }

  return "secondary";
}

function mapHistoryRow(
  row: NotificationHistoryDbRow,
  profileLabels: Map<string, string>,
  channelByCode: Map<string, string>,
  templateById: Map<string, string>
): NotificationHistoryRow {
  const recipientLabel = profileLabels.get(row.id_usuario) ?? row.id_usuario;
  const createdByLabel = row.created_by
    ? profileLabels.get(row.created_by) ?? row.created_by
    : "-";
  const updatedByLabel = row.updated_by
    ? profileLabels.get(row.updated_by) ?? row.updated_by
    : "-";
  const channelCode = row.codigo_canal ?? "";
  const channelLabel = channelCode
    ? channelByCode.get(channelCode) ?? channelCode
    : "Sin canal";
  const deliveryStatusCode = row.estado_entrega ?? "pendiente";
  const deliveryStatusLabel = toDeliveryStatusLabel(deliveryStatusCode);
  const errorMessage = sanitizeText(row.error_mensaje ?? null, 1_000);
  const payloadJson = formatJsonValue(row.payload);
  const templateLabel = row.id_plantilla
    ? templateById.get(row.id_plantilla) ?? row.id_plantilla
    : "Sin plantilla";

  return {
    id: row.id,
    recipientId: row.id_usuario,
    recipientLabel,
    title: row.titulo,
    message: row.mensaje,
    messagePreview: row.mensaje.length > 120 ? `${row.mensaje.slice(0, 117)}...` : row.mensaje,
    isRead: row.leida ?? false,
    readLabel: row.leida ? "Leida" : "No leida",
    statusVariant: row.leida ? "success" : "warning",
    channelCode,
    channelLabel,
    deliveryStatusCode,
    deliveryStatusLabel,
    deliveryStatusVariant: toDeliveryStatusVariant(deliveryStatusCode, errorMessage),
    errorMessage,
    templateId: row.id_plantilla,
    templateLabel,
    payloadJson,
    payloadPreview: buildJsonPreview(payloadJson),
    createdAt: row.created_at,
    createdAtLabel: toDateTimeLabel(row.created_at),
    createdBy: row.created_by,
    createdByLabel,
    updatedAt: row.updated_at,
    updatedAtLabel: toDateTimeLabel(row.updated_at),
    updatedBy: row.updated_by,
    updatedByLabel,
    searchValue: normalizeText(
      [
        recipientLabel,
        row.titulo,
        row.mensaje,
        channelCode,
        channelLabel,
        deliveryStatusCode,
        deliveryStatusLabel,
        errorMessage,
        templateLabel,
        payloadJson,
      ].join(" ")
    ),
  };
}

function mapTopbarItem(
  row: NotificationHistoryDbRow,
  channelByCode: Map<string, string>
): NotificationTopbarItem {
  const preview =
    row.mensaje.length > 96 ? `${row.mensaje.slice(0, 93)}...` : row.mensaje;
  const channelLabel = row.codigo_canal
    ? channelByCode.get(row.codigo_canal) ?? row.codigo_canal
    : "Sin canal";
  const deliveryLabel = toDeliveryStatusLabel(row.estado_entrega);

  return {
    id: row.id,
    title: row.titulo,
    description: `${channelLabel} | ${deliveryLabel} | ${toDateTimeLabel(row.created_at)} | ${preview}`,
    targetPath: `/app/ong/notifications/history?notificationId=${encodeURIComponent(row.id)}`,
  };
}

async function loadNotificationChannels(): Promise<{
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
    options: rows.map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
    byCode: new Map(rows.map((row): [string, string] => [row.codigo, row.nombre])),
  };
}

async function buildRecipientOptions(
  tenantId: string
): Promise<NotificationSelectOption[]> {
  const { data, error } = await comunicacionesSchema()
    .from("historial_notificaciones")
    .select("id_usuario")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(HISTORY_RECIPIENT_OPTION_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const recipientIds = uniqueNonEmpty(
    ((data ?? []) as Array<{ id_usuario: string }>).map((row) => row.id_usuario)
  );

  const profileLabels = await resolveProfileLabels(recipientIds, tenantId).catch(() => new Map());
  return recipientIds
    .map((recipientId) => ({
      value: recipientId,
      label: profileLabels.get(recipientId) ?? recipientId,
    }))
    .sort((left, right) => left.label.localeCompare(right.label, "es"));
}

async function buildDeliveryStateOptions(
  tenantId: string
): Promise<NotificationSelectOption[]> {
  const { data, error } = await comunicacionesSchema()
    .from("historial_notificaciones")
    .select("estado_entrega")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(DELIVERY_STATE_OPTION_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  const states = uniqueNonEmpty(
    ((data ?? []) as Array<{ estado_entrega: string | null }>).map((row) =>
      sanitizeText(row.estado_entrega ?? null, 60)
    )
  );

  return states.map((state) => ({
    value: state,
    label: toDeliveryStatusLabel(state),
  }));
}

async function loadTemplateLabels(
  templateIds: string[],
  tenantId: string
): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(templateIds.map((value) => sanitizeOptionalId(value)).filter(Boolean));
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await comunicacionesSchema()
    .from("plantillas_notificacion")
    .select("id, nombre_plantilla")
    .eq("tenant_id", tenantId)
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    ((data ?? []) as NotificationTemplateLookupRow[]).map((row): [string, string] => [
      row.id,
      row.nombre_plantilla,
    ])
  );
}

function buildHistoryQuery(filters: NotificationHistoryFilters, tenantId: string) {
  let query = comunicacionesSchema()
    .from("historial_notificaciones")
    .select(
      "id, tenant_id, id_usuario, titulo, mensaje, leida, codigo_canal, estado_entrega, error_mensaje, id_plantilla, payload, created_at, updated_at, created_by, updated_by",
      { count: "exact" }
    )
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  const searchPattern = sanitizeSearchTerm(filters.searchTerm);
  const recipientId =
    filters.recipientId === "all" ? null : sanitizeOptionalId(filters.recipientId);
  const channelCode =
    filters.channelCode === "all" ? null : sanitizeText(filters.channelCode, 50);
  const deliveryState =
    filters.deliveryState === "all" ? null : sanitizeText(filters.deliveryState, 60);
  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);

  if (filters.readState === "read") {
    query = query.eq("leida", true);
  } else if (filters.readState === "unread") {
    query = query.eq("leida", false);
  }

  if (recipientId) {
    query = query.eq("id_usuario", recipientId);
  }

  if (channelCode) {
    query = query.eq("codigo_canal", channelCode);
  }

  if (deliveryState) {
    query = query.eq("estado_entrega", deliveryState);
  }

  if (dateFrom) {
    query = query.gte("created_at", toDayStartIso(dateFrom));
  }

  if (dateTo) {
    query = query.lte("created_at", toDayEndIso(dateTo));
  }

  if (searchPattern) {
    query = query.or(
      `titulo.ilike.%${searchPattern}%,mensaje.ilike.%${searchPattern}%,codigo_canal.ilike.%${searchPattern}%,estado_entrega.ilike.%${searchPattern}%,error_mensaje.ilike.%${searchPattern}%`
    );
  }

  return query;
}

export async function getNotificationHistoryData(
  filters: NotificationHistoryFilters
): Promise<NotificationHistoryData> {
  const access = await resolveNotificationCapabilities();
  const warnings = access.warnings.slice();

  const page = resolvePage(filters.page);
  const pageSize = resolvePageSize(filters.pageSize);

  if (!access.canReadHistory || !access.tenantId) {
    return {
      access,
      rows: [],
      recipientOptions: [],
      channelOptions: [],
      deliveryStateOptions: [],
      summary: {
        total: 0,
        unread: 0,
        withErrors: 0,
        linkedTemplates: 0,
      },
      total: 0,
      page,
      pageSize,
      warnings,
      unsupportedFlows: HISTORY_UNSUPPORTED_FLOWS,
    };
  }

  const dateFrom = normalizeDateValue(filters.dateFrom);
  const dateTo = normalizeDateValue(filters.dateTo);
  if (dateFrom && dateTo && dateFrom > dateTo) {
    throw new Error("La fecha inicial no puede ser mayor a la fecha final.");
  }

  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const [rowsResult, unreadResult, errorsResult, linkedTemplatesResult, recipientOptions, channels, deliveryStateOptions] =
      await Promise.all([
        buildHistoryQuery(
          {
            ...filters,
            dateFrom,
            dateTo,
            page,
            pageSize,
          },
          access.tenantId
        ).range(from, to),
        comunicacionesSchema()
          .from("historial_notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", access.tenantId)
          .eq("leida", false),
        comunicacionesSchema()
          .from("historial_notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", access.tenantId)
          .not("error_mensaje", "is", null),
        comunicacionesSchema()
          .from("historial_notificaciones")
          .select("id", { count: "exact", head: true })
          .eq("tenant_id", access.tenantId)
          .not("id_plantilla", "is", null),
        buildRecipientOptions(access.tenantId).catch(() => {
          warnings.push("No se pudieron cargar todos los destinatarios disponibles para filtrar.");
          return [];
        }),
        loadNotificationChannels().catch(() => {
          warnings.push("No se pudo cargar el catalogo real de canales para Historial.");
          return {
            options: [] as NotificationSelectOption[],
            byCode: new Map<string, string>(),
          };
        }),
        buildDeliveryStateOptions(access.tenantId).catch(() => {
          warnings.push("No se pudieron cargar todos los estados de entrega disponibles.");
          return [];
        }),
      ]);

    if (rowsResult.error) {
      throw new Error(rowsResult.error.message);
    }

    if (unreadResult.error) {
      throw new Error(unreadResult.error.message);
    }

    if (errorsResult.error) {
      throw new Error(errorsResult.error.message);
    }

    if (linkedTemplatesResult.error) {
      throw new Error(linkedTemplatesResult.error.message);
    }

    const historyRows = (rowsResult.data ?? []) as NotificationHistoryDbRow[];
    const profileLabels = await resolveProfileLabels(
      historyRows.flatMap((row) =>
        [row.id_usuario, row.created_by, row.updated_by].filter(
          (value): value is string => Boolean(value)
        )
      ),
      access.tenantId
    ).catch(() => {
      warnings.push("No se pudieron resolver algunos perfiles relacionados al historial.");
      return new Map<string, string>();
    });
    const templateById = await loadTemplateLabels(
      historyRows
        .map((row) => row.id_plantilla)
        .filter((value): value is string => Boolean(value)),
      access.tenantId
    ).catch(() => {
      warnings.push("No se pudieron resolver algunos nombres de plantilla del historial.");
      return new Map<string, string>();
    });

    return {
      access,
      rows: historyRows.map((row) =>
        mapHistoryRow(row, profileLabels, channels.byCode, templateById)
      ),
      recipientOptions,
      channelOptions: channels.options,
      deliveryStateOptions,
      summary: {
        total: rowsResult.count ?? 0,
        unread: unreadResult.count ?? 0,
        withErrors: errorsResult.count ?? 0,
        linkedTemplates: linkedTemplatesResult.count ?? 0,
      },
      total: rowsResult.count ?? 0,
      page,
      pageSize,
      warnings,
      unsupportedFlows: HISTORY_UNSUPPORTED_FLOWS,
    };
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar el historial real de notificaciones.")
    );
  }
}

export async function getNotificationTopbarItems(
  limit = TOPBAR_NOTIFICATION_LIMIT
): Promise<NotificationTopbarItem[]> {
  const access = await resolveNotificationCapabilities();
  if (!access.canReadHistory || !access.tenantId || !access.currentUserId) {
    return [];
  }

  try {
    const [channels, result] = await Promise.all([
      loadNotificationChannels().catch(() => ({
        options: [] as NotificationSelectOption[],
        byCode: new Map<string, string>(),
      })),
      comunicacionesSchema()
        .from("historial_notificaciones")
        .select(
          "id, tenant_id, id_usuario, titulo, mensaje, leida, codigo_canal, estado_entrega, error_mensaje, id_plantilla, payload, created_at, updated_at, created_by, updated_by"
        )
        .eq("tenant_id", access.tenantId)
        .eq("id_usuario", access.currentUserId)
        .eq("leida", false)
        .order("created_at", { ascending: false })
        .limit(limit),
    ]);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return ((result.data ?? []) as NotificationHistoryDbRow[]).map((row) =>
      mapTopbarItem(row, channels.byCode)
    );
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar el historial real de notificaciones.")
    );
  }
}

export async function getNotificationHistoryEntryById(
  notificationId: string
): Promise<NotificationHistoryRow> {
  const access = await resolveNotificationCapabilities();
  if (!access.canReadHistory || !access.tenantId) {
    throw new Error("No tienes acceso para consultar el historial.");
  }

  const sanitizedId = sanitizeOptionalId(notificationId);
  if (!sanitizedId) {
    throw new Error("No se encontro la notificacion solicitada.");
  }

  try {
    const [channels, result] = await Promise.all([
      loadNotificationChannels().catch(() => ({
        options: [] as NotificationSelectOption[],
        byCode: new Map<string, string>(),
      })),
      comunicacionesSchema()
        .from("historial_notificaciones")
        .select(
          "id, tenant_id, id_usuario, titulo, mensaje, leida, codigo_canal, estado_entrega, error_mensaje, id_plantilla, payload, created_at, updated_at, created_by, updated_by"
        )
        .eq("tenant_id", access.tenantId)
        .eq("id", sanitizedId)
        .limit(1),
    ]);

    if (result.error) {
      throw new Error(result.error.message);
    }

    const row = ((result.data ?? []) as NotificationHistoryDbRow[])[0];
    if (!row) {
      throw new Error("La notificacion no existe para el tenant actual.");
    }

    const [profileLabels, templateById] = await Promise.all([
      resolveProfileLabels(
        [row.id_usuario, row.created_by, row.updated_by].filter(
          (value): value is string => Boolean(value)
        ),
        access.tenantId
      ).catch(() => new Map<string, string>()),
      loadTemplateLabels(
        [row.id_plantilla].filter((value): value is string => Boolean(value)),
        access.tenantId
      ).catch(() => new Map<string, string>()),
    ]);

    return mapHistoryRow(row, profileLabels, channels.byCode, templateById);
  } catch (error) {
    throw new Error(
      toFriendlyError(error, "No se pudo cargar el detalle del historial.")
    );
  }
}
