import { supabase } from "../../../supabaseClient";
import type {
  ActivityStatusCode,
  ActivityStatusKind,
  ActivityStatusOption,
  ProjectCatalogs,
  ProjectStatusKind,
  ProjectStatusOption,
  SelectOption,
  TaskStatusCode,
  TaskStatusKind,
  TaskStatusOption,
} from "../../modules/projects/types";

const DEFAULT_TEXT_MAX_LENGTH = 500;
const DEFAULT_SEARCH_MAX_LENGTH = 120;
const UUID_MAX_LENGTH = 120;
const TENANT_CACHE_TTL_MS = 5 * 60 * 1000;

let tenantCache: { value: string; at: number } | null = null;

const TASK_STATUS_OPTIONS: TaskStatusOption[] = [
  { value: "pendiente", label: "Pendiente", code: "pendiente", kind: "pending" },
  {
    value: "en_progreso",
    label: "En progreso",
    code: "en_progreso",
    kind: "in-progress",
  },
  { value: "completada", label: "Completada", code: "completada", kind: "completed" },
  { value: "cancelada", label: "Cancelada", code: "cancelada", kind: "cancelled" },
];

const ACTIVITY_STATUS_OPTIONS: ActivityStatusOption[] = [
  { value: "pendiente", label: "Pendiente", code: "pendiente", kind: "pending" },
  {
    value: "planificada",
    label: "Planificada",
    code: "planificada",
    kind: "planned",
  },
  {
    value: "en_progreso",
    label: "En progreso",
    code: "en_progreso",
    kind: "in-progress",
  },
  { value: "completada", label: "Completada", code: "completada", kind: "completed" },
  { value: "cancelada", label: "Cancelada", code: "cancelada", kind: "cancelled" },
];

export function ongSchema() {
  return supabase.schema("ong");
}

export function publicSchema() {
  return supabase.schema("public");
}

export function normalizeText(value: string | null | undefined): string {
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

export function sanitizeText(
  value: string | null | undefined,
  maxLength = DEFAULT_TEXT_MAX_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeSearchTerm(value: string | null | undefined): string {
  return sanitizeText(value, DEFAULT_SEARCH_MAX_LENGTH).replace(/[%_,'"]/g, " ");
}

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, UUID_MAX_LENGTH);
  return cleaned ? cleaned : null;
}

export function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const cleaned = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(cleaned) ? cleaned : null;
}

export function ensureDateOrder(
  startDate: string | null | undefined,
  endDate: string | null | undefined,
  message = "La fecha fin no puede ser menor a la fecha inicio."
): void {
  const start = normalizeDateValue(startDate);
  const end = normalizeDateValue(endDate);
  if (!start || !end) {
    return;
  }

  if (new Date(end).getTime() < new Date(start).getTime()) {
    throw new Error(message);
  }
}

export function parseNumericInput(value: string | number | null | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = sanitizeText(value ?? null, 80).replace(",", ".");
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function toDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsed);
}

export function toDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function toFriendlyError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function toProjectsError(error: unknown, fallback: string): Error {
  return new Error(toFriendlyError(error, fallback));
}

export function uniqueNonEmpty<TValue>(values: Array<TValue | null | undefined>): TValue[] {
  const seen = new Set<TValue>();
  const result: TValue[] = [];

  for (const value of values) {
    if (value === null || value === undefined || seen.has(value)) {
      continue;
    }

    seen.add(value);
    result.push(value);
  }

  return result;
}

export function getTaskStatusOptions(): TaskStatusOption[] {
  return TASK_STATUS_OPTIONS.slice();
}

export function getTaskStatusKind(value: string | null | undefined): TaskStatusKind {
  const normalized = normalizeText(value);
  if (normalized.includes("progreso")) {
    return "in-progress";
  }
  if (normalized.includes("complet")) {
    return "completed";
  }
  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  return "pending";
}

export function getTaskStatusLabel(value: string | null | undefined): string {
  const cleaned = sanitizeText(value ?? null, 60);
  return (
    TASK_STATUS_OPTIONS.find((option) => option.code === cleaned)?.label ??
    cleaned.replace(/_/g, " ") ??
    "Sin estado"
  );
}

export function getActivityStatusOptions(): ActivityStatusOption[] {
  return ACTIVITY_STATUS_OPTIONS.slice();
}

export function getActivityStatusKind(
  value: string | null | undefined
): ActivityStatusKind {
  const normalized = normalizeText(value);
  if (normalized.includes("planific")) {
    return "planned";
  }
  if (normalized.includes("progreso")) {
    return "in-progress";
  }
  if (normalized.includes("complet")) {
    return "completed";
  }
  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  return "pending";
}

export function getActivityStatusLabel(value: string | null | undefined): string {
  const cleaned = sanitizeText(value ?? null, 60);
  return (
    ACTIVITY_STATUS_OPTIONS.find((option) => option.code === cleaned)?.label ??
    cleaned.replace(/_/g, " ") ??
    "Sin estado"
  );
}

export function resolveActivityStatusCode(
  value: string | null | undefined
): ActivityStatusCode {
  const cleaned = sanitizeText(value ?? "pendiente", 60) || "pendiente";
  if (
    cleaned === "pendiente" ||
    cleaned === "planificada" ||
    cleaned === "en_progreso" ||
    cleaned === "completada" ||
    cleaned === "cancelada"
  ) {
    return cleaned;
  }
  return "pendiente";
}

export function getProjectStatusKind(value: string | null | undefined): ProjectStatusKind {
  const normalized = normalizeText(value);
  if (normalized.includes("plan")) {
    return "planning";
  }
  if (normalized.includes("ejec")) {
    return "active";
  }
  if (normalized.includes("complet")) {
    return "completed";
  }
  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  return "other";
}

export async function resolveCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export function resetTenantCache(): void {
  tenantCache = null;
}

export async function getRequiredTenantId(): Promise<string> {
  if (tenantCache && Date.now() - tenantCache.at < TENANT_CACHE_TTL_MS) {
    return tenantCache.value;
  }

  const { data, error } = await supabase.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(error.message);
  }

  const tenantId = typeof data === "string" ? data.trim() : "";
  if (!tenantId) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  tenantCache = { value: tenantId, at: Date.now() };
  return tenantId;
}

export async function resolveProfileLabels(userIds: string[]): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(userIds.map((item) => sanitizeOptionalId(item)).filter(Boolean));
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await publicSchema().from("profiles").select("id, full_name").in("id", ids);
  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row: { id: string; full_name: string | null }): [string, string] => [
      row.id,
      row.full_name?.trim() || row.id,
    ])
  );
}

export async function resolveProjectManageCapability(): Promise<{
  canManage: boolean | null;
  permissionWarning: string | null;
}> {
  const { data, error } = await supabase.rpc("fn_is_tenant_admin");
  if (error) {
    return {
      canManage: null,
      permissionWarning:
        "No se pudo verificar RBAC con public.fn_is_tenant_admin(); la UI deja las acciones visibles y delega el control a RLS.",
    };
  }

  return {
    canManage: Boolean(data),
    permissionWarning: null,
  };
}

export async function fetchProjectStateOptions(): Promise<ProjectStatusOption[]> {
  const { data, error } = await ongSchema()
    .from("estados_proyecto")
    .select("codigo, nombre_estado, orden_visual")
    .order("orden_visual", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row: { codigo: string; nombre_estado: string }): ProjectStatusOption => ({
      value: row.codigo,
      label: row.nombre_estado,
      kind: getProjectStatusKind(`${row.codigo} ${row.nombre_estado}`),
    })
  );
}

export async function fetchAreaOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("areas")
    .select("id, nombre_area, activo")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre_area", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: string; nombre_area: string }): SelectOption => ({
    value: row.id,
    label: row.nombre_area,
  }));
}

export async function fetchProjectOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .order("nombre_proyecto", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row: { id: string; codigo: string; nombre_proyecto: string }): SelectOption => ({
      value: row.id,
      label: `${row.codigo} - ${row.nombre_proyecto}`,
    })
  );
}

export async function fetchActivityOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("actividades")
    .select("id, titulo, id_proyecto")
    .eq("tenant_id", tenantId)
    .order("titulo", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const projects = await fetchProjectOptions().catch(() => [] as SelectOption[]);
  const projectLabelById = new Map<string, string>(
    projects.map((item): [string, string] => [item.value, item.label])
  );

  return (data ?? []).map(
    (row: { id: string; titulo: string; id_proyecto: string }): SelectOption => ({
      value: row.id,
      label: `${row.titulo} - ${projectLabelById.get(row.id_proyecto) ?? row.id_proyecto}`,
      projectId: row.id_proyecto,
    })
  );
}

export async function fetchTaskOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, titulo, id_actividad")
    .eq("tenant_id", tenantId)
    .order("titulo", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const activities = await fetchActivityOptions().catch(() => [] as SelectOption[]);
  const activityLabelById = new Map<string, string>(
    activities.map((item): [string, string] => [item.value, item.label])
  );

  return (data ?? []).map(
    (row: { id: string; titulo: string; id_actividad: string | null }): SelectOption => ({
      value: row.id,
      label: row.id_actividad
        ? `${row.titulo} - ${activityLabelById.get(row.id_actividad) ?? row.id_actividad}`
        : row.titulo,
    })
  );
}

export async function fetchLocationOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion")
    .eq("tenant_id", tenantId)
    .order("nombre_ubicacion", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row: { id: string; codigo: string; nombre_ubicacion: string }): SelectOption => ({
      value: row.id,
      label: `${row.codigo} - ${row.nombre_ubicacion}`,
    })
  );
}

export async function fetchVolunteerOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select("id, nombre, apellido")
    .eq("tenant_id", tenantId)
    .order("nombre", { ascending: true })
    .order("apellido", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row: { id: string; nombre: string; apellido: string }): SelectOption => ({
      value: row.id,
      label: `${row.nombre} ${row.apellido}`.trim(),
    })
  );
}

export async function fetchItemOptions(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("items")
    .select("id, codigo, nombre_item, activo")
    .eq("tenant_id", tenantId)
    .eq("activo", true)
    .order("nombre_item", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(
    (row: { id: string; codigo: string; nombre_item: string }): SelectOption => ({
      value: row.id,
      label: `${row.codigo} - ${row.nombre_item}`,
    })
  );
}

export async function fetchProjectCatalogs(): Promise<ProjectCatalogs> {
  const [
    projectStates,
    areas,
    projects,
    activityStates,
    activities,
    locations,
    volunteers,
    items,
    permissionState,
  ] = await Promise.all([
    fetchProjectStateOptions(),
    fetchAreaOptions(),
    fetchProjectOptions(),
    Promise.resolve(getActivityStatusOptions()),
    fetchActivityOptions(),
    fetchLocationOptions(),
    fetchVolunteerOptions(),
    fetchItemOptions(),
    resolveProjectManageCapability(),
  ]);
  // Tasks depend on activities, fetch after
  const tasks = await fetchTaskOptions().catch(() => [] as SelectOption[]);

  return {
    projectStates,
    taskStates: getTaskStatusOptions(),
    activityStates,
    areas,
    projects,
    tasks,
    activities,
    locations,
    volunteers,
    items,
    canManage: permissionState.canManage,
    permissionWarning: permissionState.permissionWarning,
  };
}
