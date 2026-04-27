import type {
  FinancialCategoriesData,
  FinancialCategoriesFilters,
  FinancialCategoryCreateInput,
  FinancialCategoryDetailData,
  FinancialCategoryKind,
  FinancialCategoryRow,
  FinancialCategoryUpdateInput,
  FinancialMutationFeedback,
} from "../../modules/resources/types";
import { finanzasSchema, resolveActorId, resolveCurrentTenantId, sanitizeOptionalId, sanitizeText, sanitizeSearchTerm, toDateTimeLabel, toOperationError } from "./shared";
import { listTransaccionesFinancieras } from "./transaccionesFinancieras.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface CategoryRow {
  id: string;
  tenant_id: string;
  nombre: string;
  tipo: string;
  created_at: string | null;
  updated_at: string | null;
}

function resolvePage(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value);
}

function resolvePageSize(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1
    ? DEFAULT_PAGE_SIZE
    : Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

function kindFromType(value: string | null | undefined): FinancialCategoryKind {
  const normalized = sanitizeText(value, 30).toLowerCase();
  if (normalized.includes("ingres")) return "ingreso";
  if (normalized.includes("egres")) return "egreso";
  return "other";
}

function mapRow(
  row: CategoryRow,
  metrics: { count: number; lastDate: string | null } | undefined
): FinancialCategoryRow {
  const kind = kindFromType(row.tipo);
  return {
    id: row.id,
    name: row.nombre,
    typeLabel: kind === "ingreso" ? "Ingreso" : kind === "egreso" ? "Egreso" : row.tipo,
    typeKind: kind,
    active: true,
    activeLabel: "Catalogo vigente",
    statusVariant: "success",
    transactionCount: metrics?.count ?? 0,
    lastTransactionAt: metrics?.lastDate ? toDateTimeLabel(metrics.lastDate) : "-",
  };
}

async function getMetrics(categoryIds: string[]) {
  const ids = Array.from(
    new Set(categoryIds.filter((value): value is string => Boolean(sanitizeOptionalId(value))))
  );
  if (!ids.length) return new Map<string, { count: number; lastDate: string | null }>();

  const tenantId = await resolveCurrentTenantId();
  let query = finanzasSchema().from("transacciones").select("id_categoria, fecha_transaccion");
  if (tenantId) query = query.eq("tenant_id", tenantId);
  query = query.in("id_categoria", ids);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const metrics = new Map<string, { count: number; lastDate: string | null }>();
  ids.forEach((id) => metrics.set(id, { count: 0, lastDate: null }));

  for (const row of (data ?? []) as Array<{ id_categoria: string; fecha_transaccion: string }>) {
    const current = metrics.get(row.id_categoria) ?? { count: 0, lastDate: null };
    current.count += 1;
    if (!current.lastDate || new Date(row.fecha_transaccion) > new Date(current.lastDate)) {
      current.lastDate = row.fecha_transaccion;
    }
    metrics.set(row.id_categoria, current);
  }

  return metrics;
}

export async function listCategorias(
  filters: Partial<FinancialCategoriesFilters> = {}
): Promise<FinancialCategoriesData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = sanitizeSearchTerm(filters.searchTerm);
    const tenantId = await resolveCurrentTenantId();

    let query = finanzasSchema()
      .from("categorias")
      .select("id, tenant_id, nombre, tipo, created_at, updated_at", { count: "exact" })
      .order("nombre", { ascending: true })
      .range(from, to);

    if (tenantId) query = query.eq("tenant_id", tenantId);
    if (search) query = query.or(`nombre.ilike.%${search}%,tipo.ilike.%${search}%`);

    if (filters.type && filters.type !== "all") {
      query = query.eq("tipo", filters.type);
    }

    if (filters.state && filters.state !== "all") {
      warnings.push(
        "finanzas.categorias no documenta una columna de estado; el filtro de vigencia no aplica."
      );
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const rows = (data ?? []) as CategoryRow[];
    const metrics = await getMetrics(rows.map((row) => row.id)).catch(() => {
      warnings.push("No se pudo calcular la trazabilidad de las categorias.");
      return new Map<string, { count: number; lastDate: string | null }>();
    });

    return {
      rows: rows.map((row) => mapRow(row, metrics.get(row.id))),
      total: count ?? rows.length,
      page,
      pageSize,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el catalogo de categorias.");
  }
}

export async function getCategoriaById(categoryId: string): Promise<FinancialCategoryDetailData> { try { const id = sanitizeOptionalId(categoryId); if (!id) throw new Error("No se encontro la categoria solicitada."); const warnings: string[] = []; const tenantId = await resolveCurrentTenantId(); let query = finanzasSchema().from("categorias").select("id, tenant_id, nombre, tipo, created_at, updated_at").eq("id", id).limit(1); if (tenantId) query = query.eq("tenant_id", tenantId); const { data, error } = await query; if (error) throw new Error(error.message); const row = (data ?? [])[0] as CategoryRow | undefined; if (!row) throw new Error("La categoria ya no existe."); const metrics = await getMetrics([id]).catch(() => { warnings.push("No se pudo calcular metrica de transacciones de la categoria."); return new Map<string, { count: number; lastDate: string | null }>(); }); const transacciones = await listTransaccionesFinancieras({ categoryId: id, page: 1, pageSize: 10 }).catch(() => ({ rows: [], total: 0, page: 1, pageSize: 10, warnings: [], accountOptions: [], categoryOptions: [], typeOptions: [], projectOptions: [], approvalOptions: [], support: { projectLink: false, approvalWorkflow: true } })); return { category: mapRow(row, metrics.get(id)), latestTransactions: transacciones.rows, warnings }; } catch (error) { throw toOperationError(error, "No se pudo cargar el detalle de la categoria."); } }

export async function createCategoria(input: FinancialCategoryCreateInput): Promise<FinancialMutationFeedback> { try { const tenantId = await resolveCurrentTenantId(); const actorId = await resolveActorId(null); const name = sanitizeText(input.name, 100); const type = sanitizeText(input.type, 20).toLowerCase(); if (!name) throw new Error("El nombre de la categoria es obligatorio."); if (!["ingreso", "egreso"].includes(type)) throw new Error("El tipo de categoria debe ser ingreso o egreso."); const payload: Record<string, string | number | boolean | null> = { nombre: name, tipo: type, created_by: actorId, updated_by: actorId }; if (tenantId) payload.tenant_id = tenantId; const { data, error } = await finanzasSchema().from("categorias").insert(payload).select("id").single(); if (error) throw new Error(error.message); return { id: data.id, message: "Categoria registrada correctamente." }; } catch (error) { throw toOperationError(error, "No se pudo crear la categoria."); } }

export async function updateCategoria(input: FinancialCategoryUpdateInput): Promise<FinancialMutationFeedback> { try { const categoryId = sanitizeOptionalId(input.categoryId); if (!categoryId) throw new Error("No se encontro la categoria a editar."); const actorId = await resolveActorId(null); const payload: Record<string, string | boolean | null> = { updated_by: actorId, updated_at: new Date().toISOString() }; if (input.name !== undefined) payload.nombre = sanitizeText(input.name, 100); if (input.type !== undefined) { const type = sanitizeText(input.type, 20).toLowerCase(); if (!["ingreso", "egreso"].includes(type)) throw new Error("El tipo de categoria debe ser ingreso o egreso."); payload.tipo = type; } const { error } = await finanzasSchema().from("categorias").update(payload).eq("id", categoryId); if (error) throw new Error(error.message); return { id: categoryId, message: "Categoria actualizada correctamente." }; } catch (error) { throw toOperationError(error, "No se pudo actualizar la categoria."); } }

export async function removeOrArchiveCategoria(categoryId: string): Promise<FinancialMutationFeedback> { try { const id = sanitizeOptionalId(categoryId); if (!id) throw new Error("No se encontro la categoria a eliminar."); const { error } = await finanzasSchema().from("categorias").delete().eq("id", id); if (error) throw new Error(error.message); return { id, message: "Categoria eliminada correctamente." }; } catch (error) { throw toOperationError(error, "No se pudo eliminar la categoria."); } }
