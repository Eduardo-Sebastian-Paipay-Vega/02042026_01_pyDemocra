import { supabase } from "../../../supabaseClient";
import type {
  ActivityStatusKind,
  ApprovalStateOption,
  ApprovalStatusKind,
  NumericSelectOption,
  SelectOption,
  StatusVariant,
} from "../../modules/operation/types";

const MAX_TEXT_LENGTH = 500;
const MAX_PATH_LENGTH = 255;
const TENANT_CACHE_TTL_MS = 5 * 60 * 1000;

const ACTIVITY_STATE_OPTIONS: Array<{
  value: number;
  code: string;
  label: string;
  kind: ActivityStatusKind;
  variant: StatusVariant;
}> = [
  { value: 1, code: "pendiente", label: "Pendiente", kind: "scheduled", variant: "secondary" },
  { value: 2, code: "planificada", label: "Planificada", kind: "scheduled", variant: "info" },
  { value: 3, code: "en_progreso", label: "En progreso", kind: "in-progress", variant: "warning" },
  { value: 4, code: "completada", label: "Completada", kind: "completed", variant: "success" },
  { value: 5, code: "cancelada", label: "Cancelada", kind: "cancelled", variant: "destructive" },
];

const HOURS_APPROVAL_OPTIONS: ApprovalStateOption[] = [
  { value: 1, label: "Pendiente", kind: "pending" },
  { value: 2, label: "Aprobada", kind: "approved" },
  { value: 3, label: "Rechazada", kind: "rejected" },
];

const EVIDENCE_TYPE_CACHE = new Map<string, { byId: Map<number, string>; byCode: Map<string, number> }>();

let tenantCache: { value: string; at: number } | null = null;

export interface ActivityContext {
  id: string;
  taskId: string;
  name: string;
  description: string;
  taskName: string;
  projectId: string | null;
  projectName: string;
  statusId: number | null;
  statusName: string;
  statusKind: ActivityStatusKind;
  statusVariant: StatusVariant;
  startAt: string | null;
  endAt: string | null;
  locationId: string | null;
  locationName: string;
  meta: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface TaskCatalogRow {
  id: string;
  projectId: string;
  name: string;
  projectName: string;
}

export interface LocationCatalogRow {
  id: string;
  name: string;
  address: string | null;
  label: string;
}

export interface ActivityCatalogRow {
  id: string;
  taskId: string | null;
  projectId: string | null;
  label: string;
}

export function ongSchema() {
  return supabase.schema("ong" as any) as any;
}

export function publicSchema() {
  return supabase.schema("public" as any) as any;
}

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeText(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return stripAccents(value).toLowerCase().replace(/\s+/g, " ").trim();
}

export function sanitizeText(
  value: string | null | undefined,
  maxLength = MAX_TEXT_LENGTH
): string {
  if (!value) {
    return "";
  }

  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export function sanitizeSearchTerm(value: string | null | undefined): string {
  return sanitizeText(value, 120).replace(/[%_,'"]/g, " ");
}

export function sanitizePath(value: string | null | undefined): string {
  return sanitizeText(value, MAX_PATH_LENGTH);
}

export function sanitizeOptionalId(value: string | null | undefined): string | null {
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function normalizeDateValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? trimmed : null;
}

export function normalizeDateTimeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString();
}

export function toLocalDateKey(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function toDateLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function toDateTimeLabel(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function normalizeTimeValue(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const match = value.trim().match(/^(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  return `${match[1]}:${match[2]}`;
}

export function timeToMinutes(value: string | null | undefined): number | null {
  const normalized = normalizeTimeValue(value);
  if (!normalized) {
    return null;
  }

  const [hoursText, minutesText] = normalized.split(":");
  const hours = Number(hoursText);
  const minutes = Number(minutesText);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

export function resolveMinutes(
  minutes: number | null,
  start: string | null,
  end: string | null
): number {
  if (typeof minutes === "number" && Number.isFinite(minutes) && minutes >= 0) {
    return minutes;
  }

  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (
    startMinutes === null ||
    endMinutes === null ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes) ||
    endMinutes < startMinutes
  ) {
    return 0;
  }

  return endMinutes - startMinutes;
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

export function ensureDateOrder(
  start: string | null | undefined,
  end: string | null | undefined,
  message = "La fecha de fin no puede ser anterior a la fecha de inicio."
): void {
  if (!start || !end) {
    return;
  }

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() < startDate.getTime()
  ) {
    throw new Error(message);
  }
}

export function ensureHoursRange(
  startTime: string | null | undefined,
  endTime: string | null | undefined
): void {
  if (!startTime || !endTime) {
    return;
  }

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  if (
    startMinutes === null ||
    endMinutes === null ||
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes)
  ) {
    throw new Error("El rango horario no es valido.");
  }

  if (endMinutes < startMinutes) {
    throw new Error("La hora de fin no puede ser anterior a la hora de inicio.");
  }
}

export function ensurePositiveMinutes(minutes: number): void {
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new Error("Los minutos deben ser positivos.");
  }
}

export function uniqueNonEmpty<TValue>(values: Array<TValue | null | undefined>): TValue[] {
  const seen = new Set<TValue>();
  const rows: TValue[] = [];

  for (const value of values) {
    if (value === null || value === undefined || seen.has(value)) {
      continue;
    }

    seen.add(value);
    rows.push(value);
  }

  return rows;
}

export function getTodayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    startDate: toLocalDateKey(start),
    endDate: toLocalDateKey(end),
  };
}

export function getWeekRange(now = new Date()) {
  const start = new Date(now);
  const weekDay = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekDay);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start,
    end,
    startDate: toLocalDateKey(start),
    endDate: toLocalDateKey(end),
  };
}

export function buildScheduleText(startAt: string | null | undefined, endAt: string | null | undefined): string {
  const startLabel = startAt ? toDateLabel(startAt) : "";
  const endLabel = endAt ? toDateLabel(endAt) : "";

  if (startLabel && endLabel) {
    return `${startLabel} - ${endLabel}`;
  }
  if (startLabel) {
    return `Desde ${startLabel}`;
  }
  if (endLabel) {
    return `Hasta ${endLabel}`;
  }
  return "Sin programación documentada";
}

export function isRouteValueValid(value: string): boolean {
  if (!value) {
    return false;
  }

  if (/^https?:\/\/\S+$/i.test(value)) {
    return true;
  }

  return /^[a-zA-Z0-9_./:@\-]+$/.test(value);
}

export function sanitizeFileName(fileName: string): string {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return cleaned.slice(0, 80) || "archivo";
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

export function toOperationError(error: unknown, fallback: string): Error {
  return new Error(toFriendlyError(error, fallback));
}

export async function resolveCurrentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function resolveActorId(explicitId?: string | null): Promise<string | null> {
  const sanitized = sanitizeOptionalId(explicitId ?? null);
  if (sanitized) {
    return sanitized;
  }

  return resolveCurrentUserId();
}

export function getActorId(explicitId?: string | null): string {
  return sanitizeOptionalId(explicitId ?? null) ?? "";
}

export function mapActivityStatusKind(value: string | null | undefined): ActivityStatusKind {
  const normalized = normalizeText(value);

  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  if (normalized.includes("complet")) {
    return "completed";
  }
  if (normalized.includes("prog")) {
    return "in-progress";
  }
  if (normalized.includes("planific")) {
    return "scheduled";
  }
  if (normalized.includes("pend")) {
    return "scheduled";
  }

  return "other";
}

export function mapApprovalStatusKind(value: string | null | undefined): ApprovalStatusKind {
  const normalized = normalizeText(value);

  if (normalized.includes("aprob")) {
    return "approved";
  }
  if (normalized.includes("rechaz")) {
    return "rejected";
  }
  if (normalized.includes("observ")) {
    return "observed";
  }
  if (normalized.includes("pend")) {
    return "pending";
  }

  return "other";
}

export function mapApprovalVariant(kind: ApprovalStatusKind): StatusVariant {
  if (kind === "approved") {
    return "success";
  }
  if (kind === "rejected") {
    return "destructive";
  }
  if (kind === "observed") {
    return "info";
  }
  if (kind === "pending") {
    return "warning";
  }
  return "secondary";
}

export function mapActivityStatusVariant(kind: ActivityStatusKind): StatusVariant {
  if (kind === "in-progress") {
    return "warning";
  }
  if (kind === "completed") {
    return "success";
  }
  if (kind === "cancelled") {
    return "destructive";
  }
  if (kind === "scheduled") {
    return "secondary";
  }

  return "info";
}

export function resolveActivityStateCode(stateId: number | null | undefined): string | null {
  if (!stateId || !Number.isFinite(stateId)) {
    return null;
  }

  return ACTIVITY_STATE_OPTIONS.find((item) => item.value === stateId)?.code ?? null;
}

export function buildActivityStateOptions(): NumericSelectOption[] {
  return ACTIVITY_STATE_OPTIONS.map((item) => ({ value: item.value, label: item.label }));
}

export function buildApprovalStateOptions(): ApprovalStateOption[] {
  return HOURS_APPROVAL_OPTIONS.slice();
}

export function buildEvidenceTypeLabel(code: string): string {
  const normalized = sanitizeText(code, 80).replace(/[_-]+/g, " ");
  if (!normalized) {
    return "Sin tipo";
  }

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

async function getTenantId(): Promise<string> {
  if (tenantCache && Date.now() - tenantCache.at < TENANT_CACHE_TTL_MS) {
    return tenantCache.value;
  }

  const { data, error } = await supabase.rpc("fn_current_tenant_id");
  if (error) {
    throw new Error(error.message);
  }

  const tenantValue = (typeof data === "string" ? (data as string) : "").trim();
  if (!tenantValue) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  tenantCache = { value: tenantValue, at: Date.now() };
  return tenantValue;
}

export async function getRequiredTenantId(): Promise<string> {
  return getTenantId();
}

export function resetTenantCache(): void {
  tenantCache = null;
}

export function createTenantScopedFilter<TQuery extends { eq(column: string, value: string): TQuery }>(
  query: TQuery,
  tenantId: string
): TQuery {
  return query.eq("tenant_id", tenantId);
}

export async function loadCatalogRows<T>(
  loader: () => Promise<{ data: T[] | null; error: { message: string } | null }>,
  warnings: string[],
  warningMessage: string
): Promise<T[]> {
  try {
    const { data, error } = await loader();
    if (error) {
      throw new Error(error.message);
    }
    return data ?? [];
  } catch {
    warnings.push(warningMessage);
    return [];
  }
}

export async function computeFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function resolveProfileLabels(userIds: string[]): Promise<Map<string, string>> {
  const ids = uniqueNonEmpty(userIds.map((value) => sanitizeOptionalId(value)).filter(Boolean));
  if (!ids.length) {
    return new Map();
  }

  const { data, error } = await publicSchema()
    .from("profiles")
    .select("id, full_name")
    .in("id", ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Map<string, string>(
    (data ?? []).map((row: { id: string; full_name: string | null }): [string, string] => [
      row.id,
      row.full_name?.trim() || row.id,
    ])
  );
}

export async function fetchVolunteerCatalog(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("voluntarios")
    .select("id, nombre, apellido")
    .eq("tenant_id", tenantId)
    .order("nombre", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: string; nombre: string; apellido: string }) => ({
    value: row.id,
    label: `${row.nombre} ${row.apellido}`.trim(),
  }));
}

export async function fetchProjectCatalog(): Promise<SelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("proyectos")
    .select("id, codigo, nombre_proyecto")
    .eq("tenant_id", tenantId)
    .order("nombre_proyecto", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: string; codigo: string; nombre_proyecto: string }) => ({
    value: row.id,
    label: `${row.codigo} - ${row.nombre_proyecto}`.trim(),
  }));
}

export async function fetchActivityCatalog(): Promise<ActivityCatalogRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data: activityRows, error: activityError } = await ongSchema()
    .from("actividades")
    .select("id, id_proyecto, titulo")
    .eq("tenant_id", tenantId)
    .order("titulo", { ascending: true });

  if (activityError) {
    throw new Error(activityError.message);
  }

  const rows = (activityRows ?? []) as Array<{
    id: string;
    id_proyecto: string | null;
    titulo: string;
  }>;
  const projectIds = uniqueNonEmpty(rows.map((row) => row.id_proyecto));
  const projectLabelById = new Map<string, string>();

  if (projectIds.length > 0) {
    const { data: projectRows, error: projectError } = await ongSchema()
      .from("proyectos")
      .select("id, codigo, nombre_proyecto")
      .eq("tenant_id", tenantId)
      .in("id", projectIds);

    if (projectError) {
      throw new Error(projectError.message);
    }

    for (const row of (projectRows ?? []) as Array<{
      id: string;
      codigo: string;
      nombre_proyecto: string;
    }>) {
      projectLabelById.set(row.id, `${row.codigo} - ${row.nombre_proyecto}`.trim());
    }
  }

  return rows.map((row) => {
    const projectId = row.id_proyecto ?? null;
    const projectLabel = projectId ? projectLabelById.get(projectId) ?? projectId : null;

    return {
      id: row.id,
      taskId: null,
      projectId,
      label: projectLabel ? `${row.titulo} · ${projectLabel}` : row.titulo,
    };
  });
}

export async function fetchTaskCatalog(): Promise<TaskCatalogRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("tareas")
    .select("id, id_actividad, titulo")
    .eq("tenant_id", tenantId)
    .order("titulo", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: string; id_actividad: string | null; titulo: string }) => ({
    id: row.id,
    projectId: row.id_actividad ?? "",
    name: row.titulo,
    projectName: "",
  }));
}

export async function fetchLocationCatalog(): Promise<LocationCatalogRow[]> {
  const tenantId = await getRequiredTenantId();
  const { data, error } = await ongSchema()
    .from("ubicaciones")
    .select("id, codigo, nombre_ubicacion, direccion")
    .eq("tenant_id", tenantId)
    .order("nombre_ubicacion", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row: { id: string; codigo: string; nombre_ubicacion: string; direccion: string | null }) => ({
    id: row.id,
    name: row.nombre_ubicacion,
    address: row.direccion,
    label: `${row.codigo} - ${row.nombre_ubicacion}`.trim(),
  }));
}

export async function fetchActivityStateOptions(): Promise<NumericSelectOption[]> {
  return buildActivityStateOptions();
}

export async function fetchApprovalStateOptions(): Promise<ApprovalStateOption[]> {
  return buildApprovalStateOptions();
}

export async function fetchEvidenceTypeOptions(): Promise<NumericSelectOption[]> {
  const tenantId = await getRequiredTenantId();
  const cached = EVIDENCE_TYPE_CACHE.get(tenantId);
  if (cached) {
    return Array.from(cached.byId.entries()).map(([value, code]) => ({
      value,
      label: buildEvidenceTypeLabel(code),
    }));
  }

  const { data, error } = await ongSchema()
    .from("evidencias_actividad")
    .select("tipo_evidencia")
    .eq("tenant_id", tenantId)
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  const codes = uniqueNonEmpty(
    (data ?? []).map((row: { tipo_evidencia: string | null }) => row.tipo_evidencia ?? null)
  );
  const safeCodes = codes.length ? codes : ["foto"];
  const byId = new Map<number, string>();
  const byCode = new Map<string, number>();

  safeCodes.forEach((code, index) => {
    const id = index + 1;
      // @ts-ignore
      // @ts-ignore
    byId.set(id, code);
      // @ts-ignore
    byCode.set(code, id);
  });

  EVIDENCE_TYPE_CACHE.set(tenantId, { byId, byCode });

  return Array.from(byId.entries()).map(([value, code]) => ({
    value,
    label: buildEvidenceTypeLabel(code),
  }));
}

export async function resolveEvidenceTypeCode(typeId: number | null | undefined): Promise<string | null> {
  if (typeId === null || typeId === undefined) {
    return null;
  }

  const tenantId = await getRequiredTenantId();
  const cached = EVIDENCE_TYPE_CACHE.get(tenantId);
  if (cached?.byId.has(typeId)) {
    return cached.byId.get(typeId) ?? null;
  }

  await fetchEvidenceTypeOptions();
  return EVIDENCE_TYPE_CACHE.get(tenantId)?.byId.get(typeId) ?? null;
}

export async function resolveEvidenceTypeId(typeCode: string | null | undefined): Promise<number | null> {
  const cleaned = sanitizeText(typeCode ?? null, 80);
  if (!cleaned) {
    return null;
  }

  const tenantId = await getRequiredTenantId();
  const cached = EVIDENCE_TYPE_CACHE.get(tenantId);
  if (cached?.byCode.has(cleaned)) {
    return cached.byCode.get(cleaned) ?? null;
  }

  await fetchEvidenceTypeOptions();
  return EVIDENCE_TYPE_CACHE.get(tenantId)?.byCode.get(cleaned) ?? null;
}

export function toEvidenceTypeLabel(typeCode: string | null | undefined): string {
  if (!typeCode) {
    return "Sin tipo";
  }

  return buildEvidenceTypeLabel(typeCode);
}

export function mapActivityRowLabel(value: string | null | undefined): string {
  return value?.trim() || "-";
}

export function getTaskStatusVariant(status: string | null | undefined): StatusVariant {
  return mapActivityStatusVariant(mapActivityStatusKind(status));
}
