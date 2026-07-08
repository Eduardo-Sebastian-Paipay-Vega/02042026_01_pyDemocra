import type {
  InventoryKardexData,
  InventoryKardexFilters,
  InventoryKardexRow,
  InventoryMovementCreateInput,
  InventoryMovementDetailData,
  InventoryMovementRemoveInput,
  InventoryMovementRow,
  InventoryMovementsData,
  InventoryMovementsFilters,
  InventoryMovementUpdateInput,
  InventoryStockByItemRow,
  InventoryStockByLocationRow,
  InventoryStockRow,
  InventoryTransactionKind,
  InventoryTransactionTypeOption,
} from "../../modules/resources/types";
import {
  loadCatalogRows,
  ongSchema,
  resolveActorId,
  resolveCurrentTenantId,
  resolveProfileLabels,
  sanitizeOptionalId,
  sanitizeSearchTerm,
  sanitizeText,
  toDateTimeLabel,
  toOperationError,
} from "./shared";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface ItemRow { id: string; codigo: string; nombre_item: string; activo: boolean; }
interface LocationRow { id: string; codigo: string; nombre_ubicacion: string; activa: boolean; }
interface TypeRow { codigo: string; nombre: string; signo: -1 | 0 | 1; }
interface MovementRow {
  id: string;
  tenant_id: string;
  id_item: string;
  codigo_tipo_transaccion: string;
  cantidad: number;
  id_ubicacion_origen: string | null;
  id_ubicacion_destino: string | null;
  fecha_transaccion: string;
  registrado_por: string;
  created_by: string | null;
  updated_by: string | null;
}

function resolvePage(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? 1 : Math.floor(value);
}

function resolvePageSize(value: number | null | undefined): number {
  return !value || Number.isNaN(value) || value < 1 ? DEFAULT_PAGE_SIZE : Math.min(MAX_PAGE_SIZE, Math.floor(value));
}

function kindFromType(type: TypeRow | undefined): InventoryTransactionKind {
  const name = type?.nombre.toLowerCase() ?? "";
  if (name.includes("entrada") || type?.signo === 1) return "entrada";
  if (name.includes("salida") || type?.signo === -1) return "salida";
  if (name.includes("transfer")) return "transferencia";
  if (name.includes("ajuste")) return "ajuste";
  return "other";
}

function signForMovement(kind: InventoryTransactionKind, quantity: number, originId: string | null, destinationId: string | null) {
  const safe = Math.abs(quantity);
  if (kind === "entrada") return safe;
  if (kind === "salida") return -safe;
  if (kind === "transferencia") return 0;
  if (kind === "ajuste") {
    if (originId && !destinationId) return -safe;
    if (!originId && destinationId) return safe;
  }
  return 0;
}

function deltaForLocation(kind: InventoryTransactionKind, quantity: number, originId: string | null, destinationId: string | null, locationId: string) {
  const safe = Math.abs(quantity);
  if (kind === "entrada") return destinationId === locationId ? safe : 0;
  if (kind === "salida") return originId === locationId ? -safe : 0;
  if (kind === "transferencia") {
    let delta = 0;
    if (originId === locationId) delta -= safe;
    if (destinationId === locationId) delta += safe;
    return delta;
  }
  if (kind === "ajuste") {
    if (originId === locationId && !destinationId) return -safe;
    if (destinationId === locationId && !originId) return safe;
  }
  return 0;
}

function mapMovement(row: MovementRow, items: Map<string, ItemRow>, locations: Map<string, LocationRow>, types: Map<string, TypeRow>, actorLabels: Map<string, string>): InventoryMovementRow {
  const type = types.get(row.codigo_tipo_transaccion);
  const kind = kindFromType(type);
  const item = items.get(row.id_item);
  const origin = row.id_ubicacion_origen ? locations.get(row.id_ubicacion_origen) : null;
  const destination = row.id_ubicacion_destino ? locations.get(row.id_ubicacion_destino) : null;
  const actorId = row.registrado_por || row.created_by || row.updated_by || "";
  return {
    id: row.id,
    itemId: row.id_item,
    itemName: item?.nombre_item ?? row.id_item,
    typeCode: row.codigo_tipo_transaccion,
    typeName: type?.nombre ?? row.codigo_tipo_transaccion,
    typeSign: type?.signo ?? 0,
    typeKind: kind,
    quantity: Number(row.cantidad),
    signedQuantity: signForMovement(kind, Number(row.cantidad), row.id_ubicacion_origen, row.id_ubicacion_destino),
    date: toDateTimeLabel(row.fecha_transaccion),
    rawDate: row.fecha_transaccion,
    originId: row.id_ubicacion_origen,
    originName: origin?.nombre_ubicacion ?? "-",
    destinationId: row.id_ubicacion_destino,
    destinationName: destination?.nombre_ubicacion ?? "-",
    registeredBy: ((actorLabels.get(actorId) ?? actorId) || "-"),
    registeredById: actorId,
    statusVariant: kind === "entrada" ? "success" : kind === "salida" ? "destructive" : kind === "transferencia" ? "info" : kind === "ajuste" ? "warning" : "default",
    isReversal: false,
    observation: "",
    isDeleted: false,
  };
}

async function resolveCatalogs(warnings: string[]) {
  const tenantId = await resolveCurrentTenantId();
  const [items, locations, types] = await Promise.all([
    loadCatalogRows(async () => {
      let query = ongSchema().from("items").select("id, codigo, nombre_item, activo").order("nombre_item", { ascending: true }).limit(500);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      return query;
    }, warnings, "No se pudo cargar el catalogo de items."),
    loadCatalogRows(async () => {
      let query = ongSchema().from("ubicaciones").select("id, codigo, nombre_ubicacion, activa").order("nombre_ubicacion", { ascending: true }).limit(500);
      if (tenantId) query = query.eq("tenant_id", tenantId);
      return query;
    }, warnings, "No se pudo cargar el catalogo de ubicaciones."),
    loadCatalogRows(async () => ongSchema().from("tipo_transaccion_inventario").select("codigo, nombre, signo").order("nombre", { ascending: true }), warnings, "No se pudo cargar el catalogo de tipos de transaccion."),
  ]);

  const itemsMap = new Map((items as ItemRow[]).map((row) => [row.id, row]));
  const locationsMap = new Map((locations as LocationRow[]).map((row) => [row.id, row]));
  const typesMap = new Map((types as TypeRow[]).map((row) => [row.codigo, row]));

  return {
    itemsMap,
    locationsMap,
    typesMap,
    itemOptions: (items as ItemRow[]).map((row) => ({ value: row.id, label: `${row.nombre_item}${row.activo ? "" : " (Inactivo)"}` })),
    locationOptions: (locations as LocationRow[]).map((row) => ({ value: row.id, label: `${row.nombre_ubicacion}${row.activa ? "" : " (Inactiva)"}` })),
    typeOptions: (types as TypeRow[]).map((row) => ({ value: row.codigo, label: row.nombre, sign: row.signo, kind: kindFromType(row) })),
  };
}

async function listRawMovements(filters: {
  itemId?: string | null;
  typeCode?: string | null;
  originId?: string | null;
  destinationId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  searchTerm?: string | null;
  page?: number;
  pageSize?: number;
  orderAscending?: boolean;
}) {
  const tenantId = await resolveCurrentTenantId();
  let query = ongSchema().from("transacciones_inventario").select("id, tenant_id, id_item, codigo_tipo_transaccion, cantidad, id_ubicacion_origen, id_ubicacion_destino, fecha_transaccion, registrado_por, created_by, updated_by", { count: "exact" }).order("fecha_transaccion", { ascending: filters.orderAscending ?? false });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (filters.itemId) query = query.eq("id_item", filters.itemId);
  if (filters.typeCode) query = query.eq("codigo_tipo_transaccion", filters.typeCode);
  if (filters.originId) query = query.eq("id_ubicacion_origen", filters.originId);
  if (filters.destinationId) query = query.eq("id_ubicacion_destino", filters.destinationId);
  if (filters.dateFrom) query = query.gte("fecha_transaccion", `${filters.dateFrom}T00:00:00.000Z`);
  if (filters.dateTo) query = query.lte("fecha_transaccion", `${filters.dateTo}T23:59:59.999Z`);
  const search = sanitizeSearchTerm(filters.searchTerm);
  if (search) query = query.or(`id.ilike.%${search}%,registrado_por.ilike.%${search}%`);
  if (filters.page !== undefined && filters.pageSize !== undefined) {
    const from = (filters.page - 1) * filters.pageSize;
    query = query.range(from, from + filters.pageSize - 1);
  }
  return query;
}

async function loadMovementRows(filters: {
  itemId?: string | null;
  typeCode?: string | null;
  originId?: string | null;
  destinationId?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  searchTerm?: string | null;
  page?: number;
  pageSize?: number;
  orderAscending?: boolean;
}) {
  const { data, error, count } = await listRawMovements(filters);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []) as MovementRow[], total: count ?? (data ?? []).length };
}

async function actorLabelsFor(rows: MovementRow[]) {
  const ids = Array.from(new Set(rows.flatMap((row) => [row.registrado_por, row.created_by, row.updated_by]).filter((value): value is string => Boolean(value))));
  return resolveProfileLabels(ids);
}

function validateKind(kind: InventoryTransactionKind, originId: string | null, destinationId: string | null) {
  if (kind === "entrada" && !destinationId) throw new Error("La transaccion de entrada requiere una ubicacion destino.");
  if (kind === "salida" && !originId) throw new Error("La transaccion de salida requiere una ubicacion origen.");
  if (kind === "transferencia") {
    if (!originId || !destinationId) throw new Error("La transferencia requiere ubicacion origen y destino.");
    if (originId === destinationId) throw new Error("La transferencia no permite origen y destino iguales.");
  }
  if (kind === "ajuste" && !originId && !destinationId) throw new Error("El ajuste requiere al menos una ubicacion.");
}

export async function listTiposTransaccionInventario(): Promise<InventoryTransactionTypeOption[]> {
  try {
    const { typeOptions } = await resolveCatalogs([]);
    return typeOptions;
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el catalogo de tipos de transaccion.");
  }
}

export async function listTransaccionesInventario(params: Partial<InventoryMovementsFilters> = {}): Promise<InventoryMovementsData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(params.page);
    const pageSize = resolvePageSize(params.pageSize);
    const catalogs = await resolveCatalogs(warnings);
    const itemId = params.itemId && params.itemId !== "all" ? params.itemId : null;
    const originId = params.originId && params.originId !== "all" ? params.originId : null;
    const destinationId = params.destinationId && params.destinationId !== "all" ? params.destinationId : null;
    const typeCode = sanitizeText(String(params.typeCode ?? params.typeId ?? ""), 50).toLowerCase();

    const { rows, total } = await loadMovementRows({
      itemId,
      typeCode,
      originId,
      destinationId,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      searchTerm: params.searchTerm,
      page,
      pageSize,
      orderAscending: false,
    });

    const actorLabels = await actorLabelsFor(rows).catch(() => new Map());
    const mapped = rows.map((row) => mapMovement(row, catalogs.itemsMap, catalogs.locationsMap, catalogs.typesMap, actorLabels));

    if (params.includeDeleted) {
      warnings.push(
        "ong.transacciones_inventario no documenta soft delete; el filtro de anulados no aplica."
      );
    }

    return { rows: mapped, total, page, pageSize, warnings, itemOptions: catalogs.itemOptions, locationOptions: catalogs.locationOptions, typeOptions: catalogs.typeOptions };
  } catch (error) {
    throw toOperationError(error, "No se pudieron cargar los movimientos de inventario.");
  }
}

export async function getTransaccionInventarioById(movementId: string): Promise<InventoryMovementDetailData> {
  try {
    const id = sanitizeOptionalId(movementId);
    if (!id) throw new Error("No se encontro el movimiento solicitado.");
    const warnings: string[] = [];
    const catalogs = await resolveCatalogs(warnings);
    const tenantId = await resolveCurrentTenantId();
    let query = ongSchema().from("transacciones_inventario").select("id, tenant_id, id_item, codigo_tipo_transaccion, cantidad, id_ubicacion_origen, id_ubicacion_destino, fecha_transaccion, registrado_por, created_by, updated_by").eq("id", id).limit(1);
    if (tenantId) query = query.eq("tenant_id", tenantId);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const row = (data ?? [])[0] as MovementRow | undefined;
    if (!row) throw new Error("El movimiento de inventario ya no existe.");
    const labels = await actorLabelsFor([row]);
    return { movement: mapMovement(row, catalogs.itemsMap, catalogs.locationsMap, catalogs.typesMap, labels), warnings };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle del movimiento.");
  }
}

async function ensureItemIsValid(itemId: string) {
  const tenantId = await resolveCurrentTenantId();
  let query = ongSchema().from("items").select("id, activo").eq("id", itemId).limit(1);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const row = data?.[0];
  if (!row) throw new Error("El item seleccionado no existe.");
  if (!row.activo) throw new Error("El item seleccionado esta inactivo.");
}

async function ensureLocationsExist(locationIds: Array<string | null>) {
  const ids = Array.from(new Set(locationIds.filter((value): value is string => Boolean(value))));
  if (!ids.length) return;
  const tenantId = await resolveCurrentTenantId();
  let query = ongSchema().from("ubicaciones").select("id").in("id", ids);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const existing = new Set((data ?? []).map((row) => row.id));
  for (const id of ids) if (!existing.has(id)) throw new Error(`La ubicacion ${id} no existe.`);
}

async function findType(code: string) {
  const list = await listTiposTransaccionInventario();
  const type = list.find((item) => item.value === code);
  if (!type) throw new Error("El tipo de transaccion no existe en el catalogo.");
  return type;
}

export async function createTransaccionInventario(input: InventoryMovementCreateInput): Promise<InventoryMovementRow> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const itemId = sanitizeOptionalId(input.itemId);
    const originId = sanitizeOptionalId(input.originId ?? null);
    const destinationId = sanitizeOptionalId(input.destinationId ?? null);
    const typeCode = sanitizeText(String(input.typeCode || input.typeId || ""), 50).toLowerCase();
    const quantity = Number(input.quantity);
    const actorId = await resolveActorId(input.actorId ?? null);
    if (!itemId) throw new Error("El item es obligatorio.");
    if (!typeCode) throw new Error("Debes seleccionar un tipo de transaccion valido.");
    if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
    await ensureItemIsValid(itemId);
    await ensureLocationsExist([originId, destinationId]);
    const type = await findType(typeCode);
    validateKind(type.kind, originId, destinationId);
    const payload: Record<string, string | number | null> = { id_item: itemId, codigo_tipo_transaccion: type.value, cantidad: quantity, id_ubicacion_origen: originId, id_ubicacion_destino: destinationId, fecha_transaccion: input.transactionDate ? new Date(input.transactionDate).toISOString() : new Date().toISOString(), registrado_por: actorId, created_by: actorId, updated_by: actorId };
    if (tenantId) payload.tenant_id = tenantId;
    const { data, error } = await ongSchema().from("transacciones_inventario").insert(payload).select("id, tenant_id, id_item, codigo_tipo_transaccion, cantidad, id_ubicacion_origen, id_ubicacion_destino, fecha_transaccion, registrado_por, created_by, updated_by").single();
    if (error) throw new Error(error.message);
    const catalogs = await resolveCatalogs([]);
    const labels = await resolveProfileLabels([actorId ?? ""]).catch(() => new Map());
    return mapMovement(data as MovementRow, catalogs.itemsMap, catalogs.locationsMap, catalogs.typesMap, labels);
  } catch (error) {
    throw toOperationError(error, "No se pudo registrar el movimiento de inventario.");
  }
}

export async function updateTransaccionInventario(input: InventoryMovementUpdateInput): Promise<InventoryMovementRow> {
  try {
    const movementId = sanitizeOptionalId(input.movementId);
    if (!movementId) throw new Error("No se encontro el movimiento a editar.");
    const actorId = await resolveActorId(input.actorId ?? null);
    const current = await getTransaccionInventarioById(movementId);
    const nextQuantity = input.quantity !== undefined ? Number(input.quantity) : current.movement.quantity;
    const nextOriginId = input.originId !== undefined ? sanitizeOptionalId(input.originId ?? null) : current.movement.originId;
    const nextDestinationId = input.destinationId !== undefined ? sanitizeOptionalId(input.destinationId ?? null) : current.movement.destinationId;
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) throw new Error("La cantidad debe ser mayor a cero.");
    await ensureLocationsExist([nextOriginId, nextDestinationId]);
    validateKind(current.movement.typeKind, nextOriginId, nextDestinationId);
    const payload: Record<string, string | number | null> = { cantidad: nextQuantity, id_ubicacion_origen: nextOriginId, id_ubicacion_destino: nextDestinationId, fecha_transaccion: input.transactionDate ? new Date(input.transactionDate).toISOString() : current.movement.rawDate, updated_by: actorId, updated_at: new Date().toISOString() };
    if (input.typeCode || input.typeId) {
      const type = await findType(sanitizeText(String(input.typeCode || input.typeId || ""), 50).toLowerCase());
      validateKind(type.kind, nextOriginId, nextDestinationId);
      payload.codigo_tipo_transaccion = type.value;
    }
    const { data, error } = await ongSchema().from("transacciones_inventario").update(payload).eq("id", movementId).select("id, tenant_id, id_item, codigo_tipo_transaccion, cantidad, id_ubicacion_origen, id_ubicacion_destino, fecha_transaccion, registrado_por, created_by, updated_by").single();
    if (error) throw new Error(error.message);
    const catalogs = await resolveCatalogs([]);
    const labels = await resolveProfileLabels([actorId ?? ""]).catch(() => new Map());
    return mapMovement(data as MovementRow, catalogs.itemsMap, catalogs.locationsMap, catalogs.typesMap, labels);
  } catch (error) {
    throw toOperationError(error, "No se pudo editar el movimiento.");
  }
}

export async function removeOrVoidTransaccionInventario(input: InventoryMovementRemoveInput): Promise<void> {
  try {
    const id = sanitizeOptionalId(input.movementId);
    if (!id) throw new Error("No se encontro el movimiento a eliminar.");
    const { error } = await ongSchema().from("transacciones_inventario").delete().eq("id", id);
    if (error) throw new Error(error.message);
  } catch (error) {
    throw toOperationError(error, "No se pudo eliminar el movimiento de inventario.");
  }
}

async function getRowsForStock(itemIds?: string[]) {
  const tenantId = await resolveCurrentTenantId();
  let query = ongSchema().from("transacciones_inventario").select("id, tenant_id, id_item, codigo_tipo_transaccion, cantidad, id_ubicacion_origen, id_ubicacion_destino, fecha_transaccion, registrado_por, created_by, updated_by").order("fecha_transaccion", { ascending: true });
  if (tenantId) query = query.eq("tenant_id", tenantId);
  if (itemIds?.length) query = query.in("id_item", itemIds);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as MovementRow[];
}

function applyToStock(stockByItem: Map<string, number>, stockByItemLocation: Map<string, Map<string, number>>, row: MovementRow, types: Map<string, TypeRow>) {
  const type = types.get(row.codigo_tipo_transaccion);
  const kind = kindFromType(type);
  const quantity = Number(row.cantidad);
  stockByItem.set(row.id_item, (stockByItem.get(row.id_item) ?? 0) + signForMovement(kind, quantity, row.id_ubicacion_origen, row.id_ubicacion_destino));
  const locationMap = stockByItemLocation.get(row.id_item) ?? new Map<string, number>();
  if (row.id_ubicacion_origen) {
    const delta = deltaForLocation(kind, quantity, row.id_ubicacion_origen, row.id_ubicacion_destino, row.id_ubicacion_origen);
    if (delta) locationMap.set(row.id_ubicacion_origen, (locationMap.get(row.id_ubicacion_origen) ?? 0) + delta);
  }
  if (row.id_ubicacion_destino && row.id_ubicacion_destino !== row.id_ubicacion_origen) {
    const delta = deltaForLocation(kind, quantity, row.id_ubicacion_origen, row.id_ubicacion_destino, row.id_ubicacion_destino);
    if (delta) locationMap.set(row.id_ubicacion_destino, (locationMap.get(row.id_ubicacion_destino) ?? 0) + delta);
  }
  stockByItemLocation.set(row.id_item, locationMap);
}

export async function getStockDerivado(itemIds?: string[]): Promise<InventoryStockRow[]> {
  try {
    const catalogs = await resolveCatalogs([]);
    const rows = await getRowsForStock(itemIds);
    const stockByItem = new Map<string, number>();
    const stockByItemLocation = new Map<string, Map<string, number>>();
    for (const row of rows) applyToStock(stockByItem, stockByItemLocation, row, catalogs.typesMap);
    const ids = itemIds?.length ? itemIds : Array.from(stockByItem.keys());
    return ids.map((itemId) => ({ itemId, itemName: catalogs.itemsMap.get(itemId)?.nombre_item ?? itemId, totalStock: Math.round((stockByItem.get(itemId) ?? 0) * 1000) / 1000 })).sort((a, b) => a.itemName.localeCompare(b.itemName, "es"));
  } catch (error) {
    throw toOperationError(error, "No se pudo calcular el stock derivado.");
  }
}

export async function getStockByLocationForItem(itemId: string): Promise<InventoryStockByLocationRow[]> {
  try {
    const sanitized = sanitizeOptionalId(itemId);
    if (!sanitized) throw new Error("No se encontro el item para calcular stock.");
    const catalogs = await resolveCatalogs([]);
    const rows = await getRowsForStock([sanitized]);
    const stockByItem = new Map<string, number>();
    const stockByItemLocation = new Map<string, Map<string, number>>();
    for (const row of rows) applyToStock(stockByItem, stockByItemLocation, row, catalogs.typesMap);
    const locationStock = stockByItemLocation.get(sanitized) ?? new Map();
    return Array.from(locationStock.entries()).map(([locationId, stock]) => ({ locationId, locationName: catalogs.locationsMap.get(locationId)?.nombre_ubicacion ?? locationId, stock: Math.round(stock * 1000) / 1000 }));
  } catch (error) {
    throw toOperationError(error, "No se pudo calcular el stock por ubicacion.");
  }
}

export async function getStockByItemForLocation(locationId: string): Promise<InventoryStockByItemRow[]> {
  try {
    const sanitized = sanitizeOptionalId(locationId);
    if (!sanitized) throw new Error("No se encontro la ubicacion para calcular stock.");
    const catalogs = await resolveCatalogs([]);
    const rows = await getRowsForStock();
    const stockByItem = new Map<string, number>();
    for (const row of rows) {
      const type = catalogs.typesMap.get(row.codigo_tipo_transaccion);
      const kind = kindFromType(type);
      const delta = deltaForLocation(kind, Number(row.cantidad), row.id_ubicacion_origen, row.id_ubicacion_destino, sanitized);
      if (delta) stockByItem.set(row.id_item, (stockByItem.get(row.id_item) ?? 0) + delta);
    }
    return Array.from(stockByItem.entries()).map(([itemId, stock]) => ({ itemId, itemName: catalogs.itemsMap.get(itemId)?.nombre_item ?? itemId, stock: Math.round(stock * 1000) / 1000 }));
  } catch (error) {
    throw toOperationError(error, "No se pudo calcular el stock por item.");
  }
}

export async function getStockMetricsByItemIds(itemIds: string[]) {
  try {
    const ids = Array.from(new Set(itemIds.map((value) => sanitizeOptionalId(value)).filter((value): value is string => Boolean(value))));
    if (!ids.length) return new Map();
    const catalogs = await resolveCatalogs([]);
    const rows = await getRowsForStock(ids);
    const stockByItem = new Map<string, number>();
    const stockByItemLocation = new Map<string, Map<string, number>>();
    const countByItem = new Map<string, number>();
    const lastByItem = new Map<string, string>();
    for (const row of rows) {
      applyToStock(stockByItem, stockByItemLocation, row, catalogs.typesMap);
      countByItem.set(row.id_item, (countByItem.get(row.id_item) ?? 0) + 1);
      if (!lastByItem.has(row.id_item) || new Date(row.fecha_transaccion) > new Date(lastByItem.get(row.id_item) ?? "")) lastByItem.set(row.id_item, row.fecha_transaccion);
    }
    const metrics = new Map<string, { stock: number; movementCount: number; lastMovementAt: string }>();
    for (const id of ids) metrics.set(id, { stock: Math.round((stockByItem.get(id) ?? 0) * 1000) / 1000, movementCount: countByItem.get(id) ?? 0, lastMovementAt: toDateTimeLabel(lastByItem.get(id) ?? null) });
    return metrics;
  } catch (error) {
    throw toOperationError(error, "No se pudo calcular metrica de stock por item.");
  }
}

export async function listKardex(params: Partial<InventoryKardexFilters> = {}): Promise<InventoryKardexData> {
  try {
    const warnings: string[] = [];
    const page = resolvePage(params.page);
    const pageSize = resolvePageSize(params.pageSize);
    const catalogs = await resolveCatalogs(warnings);
    const itemId = params.itemId && params.itemId !== "all" ? params.itemId : null;
    const locationId = params.locationId && params.locationId !== "all" ? params.locationId : null;
    const typeCode = sanitizeText(String(params.typeCode ?? params.typeId ?? ""), 50).toLowerCase();
    const rows = await getRowsForStock(itemId ? [itemId] : undefined);
    const actorLabels = await actorLabelsFor(rows).catch(() => new Map());
    const filtered = rows.filter((row) => {
      if (typeCode && row.codigo_tipo_transaccion !== typeCode) return false;
      if (params.dateFrom && row.fecha_transaccion < `${params.dateFrom}T00:00:00.000Z`) return false;
      if (params.dateTo && row.fecha_transaccion > `${params.dateTo}T23:59:59.999Z`) return false;
      if (locationId) return row.id_ubicacion_origen === locationId || row.id_ubicacion_destino === locationId;
      return true;
    });
    let running = 0;
    const mapped = filtered.map((row) => {
      const movement = mapMovement(row, catalogs.itemsMap, catalogs.locationsMap, catalogs.typesMap, actorLabels);
      running += locationId ? deltaForLocation(movement.typeKind, movement.quantity, movement.originId, movement.destinationId, locationId) : movement.signedQuantity;
      return { ...movement, runningBalance: Math.round(running * 1000) / 1000 } as InventoryKardexRow;
    });
    const from = (page - 1) * pageSize;
    const to = from + pageSize;
    return { rows: mapped.slice(from, to), total: mapped.length, page, pageSize, warnings, itemOptions: catalogs.itemOptions, locationOptions: catalogs.locationOptions, typeOptions: catalogs.typeOptions };
  } catch (error) {
    throw toOperationError(error, "No se pudo consultar el kardex.");
  }
}
