import { supabase } from "../../../supabaseClient";

const DEFAULT_TEXT_MAX_LENGTH = 500;
const DEFAULT_SEARCH_MAX_LENGTH = 120;

export function ongSchema() {
  return supabase.schema("ong");
}

export function finanzasSchema() {
  return supabase.schema("finanzas");
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
  const cleaned = sanitizeText(value, 120);
  return cleaned ? cleaned : null;
}

export function sanitizePath(value: string | null | undefined): string {
  return sanitizeText(value, 250);
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

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(value);
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "-";
  }

  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(value);
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

export async function resolveCurrentTenantId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("fn_current_tenant_id");

  if (error || !data) {
    return null;
  }

  return typeof data === "string" ? data : String(data);
}

export async function resolveActorId(explicitId?: string | null): Promise<string | null> {
  const sanitized = sanitizeOptionalId(explicitId ?? null);
  if (sanitized) {
    return sanitized;
  }

  return resolveCurrentUserId();
}

export async function resolveProfileLabels(
  userIds: string[]
): Promise<Map<string, string>> {
  const ids = Array.from(new Set(userIds.map((value) => sanitizeOptionalId(value)).filter((id): id is string => Boolean(id))));

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

  return new Map(
    (data ?? []).map((row) => [row.id, row.full_name?.trim() || row.id])
  );
}

export async function loadCatalogRows<TRow>(
  executor: () => Promise<{ data: TRow[] | null; error: { message: string } | null }>,
  warnings: string[],
  warningMessage: string
): Promise<TRow[]> {
  try {
    const { data, error } = await executor();
    if (error) {
      throw new Error(error.message);
    }
    return data ?? [];
  } catch {
    warnings.push(warningMessage);
    return [];
  }
}

interface FinancialAccountTypeCatalogRow {
  codigo: string;
  nombre: string;
}

export async function resolveFinancialAccountTypeCatalog(warnings: string[]) {
  const rows = await loadCatalogRows(
    async () =>
      finanzasSchema()
        .from("cat_tipos_cuenta")
        .select("codigo, nombre")
        .order("nombre", { ascending: true }),
    warnings,
    "No se pudo cargar el catalogo de tipos de cuenta."
  );

  const accountTypeRows = rows as FinancialAccountTypeCatalogRow[];

  return {
    rows: accountTypeRows,
    labels: new Map(accountTypeRows.map((row) => [row.codigo, row.nombre])),
    options: accountTypeRows.map((row) => ({
      value: row.codigo,
      label: row.nombre,
    })),
  };
}
