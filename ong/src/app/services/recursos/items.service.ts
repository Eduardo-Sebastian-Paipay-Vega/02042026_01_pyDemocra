import type {
  InventoryItemCreateInput,
  InventoryItemDetailData,
  InventoryItemRow,
  InventoryItemsData,
  InventoryItemsFilters,
  InventoryItemUpdateInput,
  InventoryMutationFeedback,
} from "../../modules/resources/types";
import {
  loadCatalogRows,
  ongSchema,
  resolveActorId,
  resolveCurrentTenantId,
  sanitizeOptionalId,
  sanitizeText,
  sanitizeSearchTerm,
  toDateTimeLabel,
  toOperationError,
} from "./shared";
import { getStockByLocationForItem, getStockMetricsByItemIds, listTransaccionesInventario } from "./inventarioMovimientos.service";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const MAX_CODE_LENGTH = 100;
const MAX_NAME_LENGTH = 255;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_SKU_LENGTH = 100;
const MAX_IMAGE_LENGTH = 500;

interface ItemCatalogRow {
  codigo: string;
  nombre: string;
  abreviatura?: string | null;
}

interface ItemDbRow {
  id: string;
  tenant_id: string;
  codigo: string;
  nombre_item: string;
  descripcion: string;
  codigo_unidad_medida: string;
  codigo_estado_objeto: string;
  sku: string | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

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

function sanitizeCode(value: string | null | undefined, maxLength: number): string {
  return sanitizeText(value, maxLength).replace(/\s+/g, "_").toUpperCase();
}

function mapItemRow(
  row: ItemDbRow,
  metrics: { stock: number; movementCount: number; lastMovementAt: string } | undefined,
  unitByCode: Map<string, ItemCatalogRow>,
  stateByCode: Map<string, ItemCatalogRow>
): InventoryItemRow {
  const unit = unitByCode.get(row.codigo_unidad_medida);
  const state = stateByCode.get(row.codigo_estado_objeto);

  return {
    id: row.id,
    code: row.codigo,
    name: row.nombre_item,
    description: row.descripcion ?? "",
    unitCode: row.codigo_unidad_medida,
    unitLabel: unit ? `${unit.nombre}${unit.abreviatura ? ` (${unit.abreviatura})` : ""}` : row.codigo_unidad_medida,
    stateCode: row.codigo_estado_objeto,
    stateLabel: state?.nombre ?? row.codigo_estado_objeto,
    sku: row.sku ?? "",
    imageUrl: row.imagen_url,
    active: row.activo,
    activeLabel: row.activo ? "Activo" : "Inactivo",
    statusVariant: row.activo ? "success" : "secondary",
    derivedStock: metrics ? metrics.stock : null,
    movementCount: metrics?.movementCount ?? 0,
    lastMovementAt: metrics?.lastMovementAt ?? "-",
  };
}

async function resolveCatalogs(warnings: string[]) {
  const [units, states] = await Promise.all([
    loadCatalogRows(
      async () =>
        ongSchema()
          .from("unidades_medida")
          .select("codigo, nombre, abreviatura")
          .order("nombre", { ascending: true }),
      warnings,
      "No se pudo cargar el catalogo de unidades de medida."
    ),
    loadCatalogRows(
      async () =>
        ongSchema()
          .from("estados_objeto")
          .select("codigo, nombre, descripcion")
          .order("nombre", { ascending: true }),
      warnings,
      "No se pudo cargar el catalogo de estados de objeto."
    ),
  ]);

  return {
    units: new Map((units as ItemCatalogRow[]).map((item) => [item.codigo, item])),
    states: new Map((states as ItemCatalogRow[]).map((item) => [item.codigo, item])),
    unitOptions: (units as ItemCatalogRow[]).map((item) => ({
      value: item.codigo,
      label: `${item.nombre}${item.abreviatura ? ` (${item.abreviatura})` : ""}`,
    })),
    stateOptions: (states as ItemCatalogRow[]).map((item) => ({
      value: item.codigo,
      label: item.nombre,
    })),
  };
}

async function fetchItemRows(params: Partial<InventoryItemsFilters> = {}) {
  const warnings: string[] = [];
  const page = resolvePage(params.page);
  const pageSize = resolvePageSize(params.pageSize);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const searchPattern = sanitizeSearchTerm(params.searchTerm);
  const tenantId = await resolveCurrentTenantId();

  const catalogs = await resolveCatalogs(warnings);

  let query = ongSchema()
    .from("items")
    .select(
      "id, tenant_id, codigo, nombre_item, descripcion, codigo_unidad_medida, codigo_estado_objeto, sku, imagen_url, activo, created_at, updated_at, created_by, updated_by",
      { count: "exact" }
    )
    .order("nombre_item", { ascending: true })
    .range(from, to);

  if (tenantId) {
    query = query.eq("tenant_id", tenantId);
  }

  if (params.state === "active") {
    query = query.eq("activo", true);
  } else if (params.state === "inactive") {
    query = query.eq("activo", false);
  }

  if (searchPattern) {
    query = query.or(
      `codigo.ilike.%${searchPattern}%,nombre_item.ilike.%${searchPattern}%,descripcion.ilike.%${searchPattern}%,sku.ilike.%${searchPattern}%`
    );
  }

  const { data, error, count } = await query;
  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as ItemDbRow[];
  const metrics = await getStockMetricsByItemIds(rows.map((row) => row.id)).catch(() => {
    warnings.push("No se pudo calcular el stock derivado por item.");
    return new Map<string, { stock: number; movementCount: number; lastMovementAt: string }>();
  });

  return {
    rows: rows.map((row) => mapItemRow(row, metrics.get(row.id), catalogs.units, catalogs.states)),
    total: count ?? rows.length,
    page,
    pageSize,
    warnings,
    unitOptions: catalogs.unitOptions,
    stateOptions: catalogs.stateOptions,
  };
}

export async function listItems(
  filters: Partial<InventoryItemsFilters> = {}
): Promise<InventoryItemsData> {
  try {
    return await fetchItemRows(filters);
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el catalogo de items.");
  }
}

export async function getItemById(itemId: string): Promise<InventoryItemDetailData> {
  try {
    const id = sanitizeOptionalId(itemId);
    if (!id) {
      throw new Error("No se encontro el item solicitado.");
    }

    const warnings: string[] = [];
    const catalogs = await resolveCatalogs(warnings);
    const tenantId = await resolveCurrentTenantId();

    let query = ongSchema()
      .from("items")
      .select(
        "id, tenant_id, codigo, nombre_item, descripcion, codigo_unidad_medida, codigo_estado_objeto, sku, imagen_url, activo, created_at, updated_at, created_by, updated_by"
      )
      .eq("id", id)
      .limit(1);

    if (tenantId) {
      query = query.eq("tenant_id", tenantId);
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    const row = (data ?? [])[0] as ItemDbRow | undefined;
    if (!row) {
      throw new Error("El item ya no existe.");
    }

    const [metrics, stockByLocation, latestMovements] = await Promise.all([
      getStockMetricsByItemIds([id]).catch(() => {
        warnings.push("No se pudo calcular la metrica de stock del item.");
        return new Map<string, { stock: number; movementCount: number; lastMovementAt: string }>();
      }),
      getStockByLocationForItem(id).catch(() => {
        warnings.push("No se pudo cargar el stock por ubicacion del item.");
        return [];
      }),
      listTransaccionesInventario({
        itemId: id,
        includeDeleted: false,
        page: 1,
        pageSize: 10,
      }).catch(() => {
        warnings.push("No se pudo cargar el historial reciente de movimientos.");
        return {
          rows: [],
          total: 0,
          page: 1,
          pageSize: 10,
          warnings: [],
          itemOptions: [],
          locationOptions: [],
          typeOptions: [],
        };
      }),
    ]);

    return {
      item: mapItemRow(row, metrics.get(id), catalogs.units, catalogs.states),
      stockByLocation,
      latestMovements: latestMovements.rows,
      warnings,
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo cargar el detalle del item.");
  }
}

async function generateItemCode(tenantId: string | null): Promise<string> {
  const q = ongSchema().from("items").select("codigo").like("codigo", "INV-%").order("codigo", { ascending: false }).limit(1);
  const { data } = tenantId ? await q.eq("tenant_id", tenantId) : await q;
  const last = (data?.[0] as { codigo: string } | undefined)?.codigo ?? "INV-000";
  const num = parseInt(last.replace(/^INV-/, ""), 10);
  const next = Number.isFinite(num) ? num + 1 : 1;
  return `INV-${String(next).padStart(3, "0")}`;
}

export async function createItem(
  input: InventoryItemCreateInput
): Promise<InventoryMutationFeedback> {
  try {
    const tenantId = await resolveCurrentTenantId();
    const actorId = await resolveActorId(null);
    // Si el usuario no provee código, se auto-genera como INV-XXX
    const rawCode = sanitizeCode(input.code, MAX_CODE_LENGTH);
    const code = rawCode || (await generateItemCode(tenantId));
    const name = sanitizeText(input.name, MAX_NAME_LENGTH);
    const description = sanitizeText(input.description, MAX_DESCRIPTION_LENGTH);
    const unitCode = sanitizeOptionalId(input.unitCode);
    const stateCode = sanitizeOptionalId(input.stateCode);
    const sku = sanitizeText(input.sku, MAX_SKU_LENGTH);
    const imageUrl = sanitizeText(input.imageUrl, MAX_IMAGE_LENGTH);

    if (!code) {
      throw new Error("El codigo del item es obligatorio.");
    }
    if (!name) {
      throw new Error("El nombre del item es obligatorio.");
    }
    if (!unitCode) {
      throw new Error("La unidad de medida es obligatoria.");
    }
    if (!stateCode) {
      throw new Error("El estado del objeto es obligatorio.");
    }

    const payload: Record<string, string | boolean | null> = {
      codigo: code,
      nombre_item: name,
      descripcion: description || "",
      codigo_unidad_medida: unitCode,
      codigo_estado_objeto: stateCode,
      sku: sku || null,
      imagen_url: imageUrl || null,
      activo: input.active ?? true,
      created_by: actorId,
      updated_by: actorId,
    };

    if (tenantId) {
      payload.tenant_id = tenantId;
    }

    const { data, error } = await ongSchema()
      .from("items")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      message: "Item registrado correctamente.",
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo crear el item.");
  }
}

export async function updateItem(
  input: InventoryItemUpdateInput
): Promise<InventoryMutationFeedback> {
  try {
    const itemId = sanitizeOptionalId(input.itemId);
    if (!itemId) {
      throw new Error("No se encontro el item a editar.");
    }

    const actorId = await resolveActorId(null);
    const payload: Record<string, string | boolean | null> = {};

    if (input.code !== undefined) {
      const code = sanitizeCode(input.code, MAX_CODE_LENGTH);
      if (!code) {
        throw new Error("El codigo del item es obligatorio.");
      }
      payload.codigo = code;
    }

    if (input.name !== undefined) {
      const name = sanitizeText(input.name, MAX_NAME_LENGTH);
      if (!name) {
        throw new Error("El nombre del item es obligatorio.");
      }
      payload.nombre_item = name;
    }

    if (input.description !== undefined) {
      payload.descripcion = sanitizeText(input.description, MAX_DESCRIPTION_LENGTH) || "";
    }

    if (input.unitCode !== undefined) {
      const unitCode = sanitizeOptionalId(input.unitCode);
      if (!unitCode) {
        throw new Error("La unidad de medida es obligatoria.");
      }
      payload.codigo_unidad_medida = unitCode;
    }

    if (input.stateCode !== undefined) {
      const stateCode = sanitizeOptionalId(input.stateCode);
      if (!stateCode) {
        throw new Error("El estado del objeto es obligatorio.");
      }
      payload.codigo_estado_objeto = stateCode;
    }

    if (input.sku !== undefined) {
      payload.sku = sanitizeText(input.sku, MAX_SKU_LENGTH);
    }

    if (input.imageUrl !== undefined) {
      payload.imagen_url = sanitizeText(input.imageUrl, MAX_IMAGE_LENGTH);
    }

    if (input.active !== undefined) {
      payload.activo = Boolean(input.active);
    }

    if (Object.keys(payload).length === 0) {
      throw new Error("No hay cambios para actualizar.");
    }

    payload.updated_by = actorId;

    const { error } = await ongSchema().from("items").update(payload).eq("id", itemId);
    if (error) {
      throw new Error(error.message);
    }

    return {
      id: itemId,
      message: "Item actualizado correctamente.",
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo actualizar el item.");
  }
}

export async function removeOrArchiveItem(
  itemId: string
): Promise<InventoryMutationFeedback> {
  try {
    const id = sanitizeOptionalId(itemId);
    if (!id) {
      throw new Error("No se encontro el item a inactivar.");
    }

    const actorId = await resolveActorId(null);
    const { error } = await ongSchema()
      .from("items")
      .update({ activo: false, updated_by: actorId })
      .eq("id", id);

    if (error) {
      throw new Error(error.message);
    }

    return {
      id,
      message: "Item inactivado correctamente.",
    };
  } catch (error) {
    throw toOperationError(error, "No se pudo inactivar el item.");
  }
}
