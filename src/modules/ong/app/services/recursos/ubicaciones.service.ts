import type {
  InventoryLocationCreateInput,
  InventoryLocationDetailData,
  InventoryLocationRow,
  InventoryLocationsData,
  InventoryLocationsFilters,
  InventoryLocationUpdateInput,
  InventoryMutationFeedback,
} from "../../modules/resources/types";
import {
  loadCatalogRows,
  ongSchema,
  publicSchema,
  resolveActorId,
  resolveCurrentTenantId,
  sanitizeOptionalId,
  sanitizeText,
  sanitizeSearchTerm,
  toOperationError,
} from "./shared";
import {
  getStockByItemForLocation,
  listTransaccionesInventario,
} from "./inventarioMovimientos.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface CountryRow { codigo: string; nombre: string; }
interface LocationRow {
  id: string;
  tenant_id: string;
  codigo: string;
  nombre_ubicacion: string;
  direccion: string;
  latitud: number | null;
  longitud: number | null;
  activa: boolean;
  imagen_url: string | null;
  codigo_pais: string | null;
}

function resolvePage(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value);
}
function resolvePageSize(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? DEFAULT_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.floor(value));
}
function sanitizeCode(value: string | null | undefined): string {
  return sanitizeText(value, 50).replace(/\s+/g, "_").toUpperCase();
}

function mapRow(row: LocationRow, countryLabels: Map<string, string>): InventoryLocationRow {
  const countryCode = row.codigo_pais ?? "PE";
  return {
    id: row.id,
    code: row.codigo,
    name: row.nombre_ubicacion,
    address: row.direccion ?? "",
    countryCode,
    countryLabel: countryLabels.get(countryCode) ?? countryCode,
    latitude: row.latitud,
    longitude: row.longitud,
    imageUrl: row.imagen_url,
    active: row.activa,
    activeLabel: row.activa ? "Activa" : "Inactiva",
    statusVariant: row.activa ? "success" : "secondary",
  };
}

async function resolveCatalogs(warnings: string[]) {
  const tenantId = await resolveCurrentTenantId();
  const [countries] = await Promise.all([
    loadCatalogRows(
      async () => publicSchema().from("cat_paises").select("codigo, nombre").order("nombre", { ascending: true }),
      warnings,
      "No se pudo cargar el catalogo de paises."
    ),
  ]);

  return {
    countryLabels: new Map((countries as CountryRow[]).map((row) => [row.codigo, row.nombre])),
    countryOptions: (countries as CountryRow[]).map((row) => ({ value: row.codigo, label: row.nombre })),
    tenantId,
  };
}

export async function listUbicaciones(filters: Partial<InventoryLocationsFilters> = {}): Promise<InventoryLocationsData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(filters.page);
    const pageSize = resolvePageSize(filters.pageSize);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const search = sanitizeSearchTerm(filters.searchTerm);
    const catalogs = await resolveCatalogs(warnings);

    let query = ongSchema()
      .from("ubicaciones")
      .select("id, tenant_id, codigo, nombre_ubicacion, direccion, latitud, longitud, activa, imagen_url, codigo_pais", { count: "exact" })
      .order("nombre_ubicacion", { ascending: true })
      .range(from, to);

    if (catalogs.tenantId) query = query.eq("tenant_id", catalogs.tenantId);
    if (search) query = query.or(`codigo.ilike.%${search}%,nombre_ubicacion.ilike.%${search}%,direccion.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    return {
      rows: (data ?? []).map((row) => mapRow(row as LocationRow, catalogs.countryLabels)),
      total: count ?? (data ?? []).length,
      page,
      pageSize,
      warnings,
      countryOptions: catalogs.countryOptions,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar las ubicaciones.");
  }
}

export async function getUbicacionById(locationId: string): Promise<InventoryLocationDetailData> {
  try {
    const id = sanitizeOptionalId(locationId);
    if (!id) throw new Error("No se encontro la ubicacion solicitada.");
    const warnings: string[] = [];
    const catalogs = await resolveCatalogs(warnings);
    const tenantId = catalogs.tenantId;

    let query = ongSchema().from("ubicaciones").select("id, tenant_id, codigo, nombre_ubicacion, direccion, latitud, longitud, activa, imagen_url, codigo_pais").eq("id", id).limit(1);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const row = (data ?? [])[0] as LocationRow | undefined;
    if (!row) throw new Error("La ubicacion ya no existe.");

    const [stockByItem, originMovements, destinationMovements] = await Promise.all([
      getStockByItemForLocation(id).catch(() => {
        warnings.push("No se pudo calcular el stock por item de la ubicacion.");
        return [];
      }),
      listTransaccionesInventario({ originId: id, page: 1, pageSize: 10 }).catch(() => ({
        rows: [],
        total: 0,
        page: 1,
        pageSize: 10,
        warnings: [],
        itemOptions: [],
        locationOptions: [],
        typeOptions: [],
      })),
      listTransaccionesInventario({ destinationId: id, page: 1, pageSize: 10 }).catch(() => ({
        rows: [],
        total: 0,
        page: 1,
        pageSize: 10,
        warnings: [],
        itemOptions: [],
        locationOptions: [],
        typeOptions: [],
      })),
    ]);

    const latestMovements = [...originMovements.rows, ...destinationMovements.rows]
      .filter(
        (movement, index, collection) =>
          collection.findIndex((candidate) => candidate.id === movement.id) === index
      )
      .sort((left, right) => right.rawDate.localeCompare(left.rawDate))
      .slice(0, 10);

    return {
      location: mapRow(row, catalogs.countryLabels),
      stockByItem,
      latestMovements,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle de la ubicacion.");
  }
}

export async function createUbicacion(input: InventoryLocationCreateInput): Promise<InventoryMutationFeedback> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(null);
    const payload: Record<string, string | number | boolean | null> = {
      codigo: sanitizeCode(input.code),
      nombre_ubicacion: sanitizeText(input.name, 255),
      direccion: sanitizeText(input.address, 500) || "Sin dirección",
      latitud: input.latitude ?? null,
      longitud: input.longitude ?? null,
      activa: input.active ?? true,
      imagen_url: sanitizeText(input.imageUrl, 500) || null,
      codigo_pais: sanitizeOptionalId(input.countryCode ?? null) ?? "PE",
      created_by: actorId,
      updated_by: actorId,
    };
    if (tenantId) payload.tenant_id = tenantId;
    if (!payload.codigo) throw new Error("El codigo de la ubicacion es obligatorio.");
    if (!payload.nombre_ubicacion) throw new Error("El nombre de la ubicacion es obligatorio.");

    const { data, error } = await ongSchema().from("ubicaciones").insert(payload as any).select("id").single();
    if (error) throw new Error(error.message);
    return { id: data.id, message: "Ubicacion registrada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo crear la ubicacion.");
  }
}

export async function updateUbicacion(input: InventoryLocationUpdateInput): Promise<InventoryMutationFeedback> {
  try {
    const locationId = sanitizeOptionalId(input.locationId);
    if (!locationId) throw new Error("No se encontro la ubicacion a editar.");
    const actorId = await resolveActorId(null);
    const payload: Record<string, string | number | boolean | null> = { updated_by: actorId, updated_at: new Date().toISOString() };
    if (input.code !== undefined) payload.codigo = sanitizeCode(input.code);
    if (input.name !== undefined) payload.nombre_ubicacion = sanitizeText(input.name, 255);
    if (input.address !== undefined) payload.direccion = sanitizeText(input.address, 500) || "Sin dirección";
    if (input.latitude !== undefined) payload.latitud = input.latitude;
    if (input.longitude !== undefined) payload.longitud = input.longitude;
    if (input.countryCode !== undefined) payload.codigo_pais = sanitizeOptionalId(input.countryCode) ?? "PE";
    if (input.imageUrl !== undefined) payload.imagen_url = sanitizeText(input.imageUrl, 500) || null;
    if (input.active !== undefined) payload.activa = Boolean(input.active);
    if (Object.keys(payload).length === 2) throw new Error("No hay cambios para actualizar.");

    const { error } = await ongSchema().from("ubicaciones").update(payload as any).eq("id", locationId);
    if (error) throw new Error(error.message);
    return { id: locationId, message: "Ubicacion actualizada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar la ubicacion.");
  }
}

export async function removeOrArchiveUbicacion(locationId: string): Promise<InventoryMutationFeedback> {
  try {
    const id = sanitizeOptionalId(locationId);
    if (!id) throw new Error("No se encontro la ubicacion a inactivar.");
    const actorId = await resolveActorId(null);
    const { error } = await ongSchema().from("ubicaciones").update({ activa: false, updated_by: actorId, updated_at: new Date().toISOString() }).eq("id", id);
    if (error) throw new Error(error.message);
    return { id, message: "Ubicacion inactivada correctamente." };
  } catch (error) {
    throw toOperationError(error, "No se pudo inactivar la ubicacion.");
  }
}

