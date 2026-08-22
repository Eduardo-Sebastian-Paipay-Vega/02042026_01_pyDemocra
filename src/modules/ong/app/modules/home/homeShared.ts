import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "../../../supabaseClient";
import type { AppDatabase } from "../../../lib/db/ong/app-database";
import type {
  DashboardActivityRow,
  DashboardAdmissionRow,
  DashboardHoursRow,
  GlobalSearchGroupedResults,
} from "./types";
import { normalizeText, sanitizeText } from "./validators";

export const db: SupabaseClient<AppDatabase> = supabase;

export const HOURS_PAGE_SIZE = 500;
export const SEARCH_MIN_LENGTH = 2;
const TENANT_CACHE_TTL_MS = 30_000;

let tenantCache: { value: string; at: number } | null = null;

export const EMPTY_GLOBAL_SEARCH_RESULTS: GlobalSearchGroupedResults = {
  volunteers: [],
  projects: [],
  activities: [],
  admissions: [],
};

export interface TaskLookup {
  id: string;
  projectId: string;
  title: string;
  status: "pendiente" | "en_progreso" | "completada" | "cancelada";
  dueDate: string | null;
  createdAt: string;
}

export function toFriendlyError(error: unknown, fallbackMessage: string): string {
  const rawMessage = error instanceof Error ? error.message : String(error ?? "");
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("failed to fetch") ||
    normalized.includes("network") ||
    normalized.includes("fetch")
  ) {
    return "No se pudo conectar con la base de datos. Revisa tu conexion e intenta de nuevo.";
  }

  if (
    normalized.includes("jwt") ||
    normalized.includes("auth") ||
    normalized.includes("permission") ||
    normalized.includes("rls")
  ) {
    return "No tienes permisos suficientes para completar esta accion.";
  }

  if (normalized.includes("timeout") || normalized.includes("timed out")) {
    return "La consulta demoro demasiado. Intenta nuevamente en unos segundos.";
  }

  if (rawMessage.trim()) {
    return `${fallbackMessage} (${rawMessage})`;
  }

  return fallbackMessage;
}

export function formatDateISO(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function formatWeekDayLabel(value: Date): string {
  const text = new Intl.DateTimeFormat("es-PE", { weekday: "short" }).format(value);
  const cleaned = text.replace(".", "").trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function uniqueNonEmpty<TValue>(values: Array<TValue | null | undefined>): TValue[] {
  const rows: TValue[] = [];
  const seen = new Set<TValue>();

  for (const value of values) {
    if (value === null || value === undefined) {
      continue;
    }
    if (seen.has(value)) {
      continue;
    }
    seen.add(value);
    rows.push(value);
  }

  return rows;
}

export function splitIntoChunks<TValue>(rows: TValue[], size: number): TValue[][] {
  if (size <= 0) {
    return [rows];
  }

  const chunks: TValue[][] = [];
  for (let start = 0; start < rows.length; start += size) {
    chunks.push(rows.slice(start, start + size));
  }

  return chunks;
}

export function safeOrPatternValue(value: string): string {
  return value.replace(/[%,]/g, " ").replace(/\s+/g, " ").trim();
}

export function mapHoursStatus(value: string | null | undefined): DashboardHoursRow["status"] {
  const normalized = normalizeText(value);
  if (normalized.includes("aprob")) {
    return "approved";
  }
  if (normalized.includes("rechaz")) {
    return "rejected";
  }
  return "pending";
}

export function mapTaskStatus(value: string | null | undefined): DashboardActivityRow["status"] {
  const normalized = normalizeText(value);
  if (normalized.includes("en_progreso") || normalized.includes("progreso")) {
    return "in-progress";
  }
  if (normalized.includes("complet")) {
    return "completed";
  }
  if (normalized.includes("cancel")) {
    return "cancelled";
  }
  return "scheduled";
}

export function mapAdmissionStatus(
  value: string | null | undefined
): DashboardAdmissionRow["status"] {
  const normalized = normalizeText(value);
  if (normalized.includes("aprob")) {
    return "approved";
  }
  if (normalized.includes("rechaz")) {
    return "rejected";
  }
  if (normalized.includes("entrevist")) {
    return "interviewing";
  }
  return "pending";
}

export function mapTaskStatusLabel(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "Sin estado";
  }
  if (normalized.includes("en_progreso") || normalized.includes("progreso")) {
    return "En progreso";
  }
  if (normalized.includes("complet")) {
    return "Completada";
  }
  if (normalized.includes("cancel")) {
    return "Cancelada";
  }
  if (normalized.includes("pend")) {
    return "Pendiente";
  }
  return value ?? "Sin estado";
}

export function mapHourStatusLabel(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (normalized.includes("aprob")) {
    return "Aprobada";
  }
  if (normalized.includes("rechaz")) {
    return "Rechazada";
  }
  return "Pendiente";
}

export function mapAdmissionStatusLabel(value: string | null | undefined): string {
  const normalized = normalizeText(value);
  if (normalized.includes("nueva")) {
    return "Nueva";
  }
  if (normalized.includes("entrevist")) {
    return "En entrevista";
  }
  if (normalized.includes("aprob")) {
    return "Aprobada";
  }
  if (normalized.includes("rechaz")) {
    return "Rechazada";
  }
  return value ?? "Sin estado";
}

export function appendResolutionNote(base: string | null, note: string): string {
  const sanitizedNote = sanitizeText(note, 500);
  if (!sanitizedNote) {
    return base ?? "";
  }

  const stamp = new Date().toISOString().slice(0, 16).replace("T", " ");
  const tagged = `[RESOLUCION ${stamp}] ${sanitizedNote}`;
  return base ? `${base}\n${tagged}` : tagged;
}

export async function getRequiredTenantId(): Promise<string> {
  if (tenantCache && Date.now() - tenantCache.at < TENANT_CACHE_TTL_MS) {
    return tenantCache.value;
  }

  const { data, error } = await db.rpc("fn_current_tenant_id");

  if (error) {
    throw new Error(error.message);
  }

  if (typeof data !== "string" || !(data as string).trim()) {
    throw new Error("No se pudo resolver el tenant actual.");
  }

  tenantCache = {
    value: data,
    at: Date.now(),
  };

  return data;
}

export async function hasCorePermission(permission: string): Promise<boolean> {
  const normalizedPermission = sanitizeText(permission, 160);
  if (!normalizedPermission) {
    return false;
  }

  try {
    const { data, error } = await db.rpc("fn_has_permission", {
      p_permission: normalizedPermission,
    } as any);

    return !error && data === true;
  } catch {
    return false;
  }
}

export async function safeGetCurrentUser() {
  try {
    const response = await supabase.auth.getUser();
    const user = response.data.user ?? null;
    if (!user) {
      tenantCache = null;
    }
    return user;
  } catch {
    tenantCache = null;
    return null;
  }
}

export async function getVolunteerNameMap(
  volunteerIds: string[],
  tenantId?: string
): Promise<Map<string, string>> {
  if (!volunteerIds.length) {
    return new Map();
  }

  let query = db
    .schema("ong")
    .from("voluntarios")
    .select("id, nombre, apellido")
    .in("id", volunteerIds);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [row.id, `${row.nombre} ${row.apellido}`.trim()])
  );
}

export async function getProjectNameMap(
  projectIds: string[],
  tenantId?: string
): Promise<Map<string, string>> {
  if (!projectIds.length) {
    return new Map();
  }

  let query = db
    .schema("ong")
    .from("proyectos")
    .select("id, nombre_proyecto")
    .in("id", projectIds);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Map((data ?? []).map((row) => [row.id, row.nombre_proyecto]));
}

export async function getTaskMap(
  taskIds: string[],
  tenantId?: string
): Promise<Map<string, TaskLookup>> {
  if (!taskIds.length) {
    return new Map();
  }

  let query = db
    .schema("ong")
    .from("tareas")
    .select("id, id_proyecto, titulo, estado, fecha_limite, created_at")
    .in("id", taskIds);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return new Map(
    (data ?? []).map((row) => [
      row.id,
      {
        id: row.id,
        projectId: row.id_proyecto,
        title: row.titulo,
        status: (row.estado as TaskLookup["status"]) ?? "pendiente",
        dueDate: row.fecha_limite,
        createdAt: row.created_at,
      },
    ])
  );
}

export async function sumHours(options: {
  onlyApproved?: boolean;
  activityId?: string;
  fromDate?: string;
  toDate?: string;
  tenantId?: string;
} = {}): Promise<number> {
  let from = 0;
  let total = 0;

  while (true) {
    let query = db
      .schema("ong")
      .from("horas_actividad")
      .select("id, horas_registradas, estado_aprobacion, fecha")
      .range(from, from + HOURS_PAGE_SIZE - 1);

    if (options.onlyApproved) {
      query = query.eq("estado_aprobacion", "aprobada");
    }
    if (options.activityId) {
      query = query.eq("id_actividad", options.activityId);
    }
    if (options.fromDate) {
      query = query.gte("fecha", options.fromDate);
    }
    if (options.toDate) {
      query = query.lte("fecha", options.toDate);
    }
    if (options.tenantId) {
      query = query.eq("tenant_id", options.tenantId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const rows = data ?? [];
    total += rows.reduce((sum, row) => sum + Number(row.horas_registradas ?? 0), 0);

    if (rows.length < HOURS_PAGE_SIZE) {
      break;
    }

    from += HOURS_PAGE_SIZE;
  }

  return Math.round(total * 10) / 10;
}

