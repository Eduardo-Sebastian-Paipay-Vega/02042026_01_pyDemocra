import {
  getRequiredTenantId,
  ongSchema,
  resolveCurrentUserId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
} from "../proyectos/shared";

const CODE_MAX = 20;
const NAME_MAX = 120;
const DESC_MAX = 500;

export interface AreaRow {
  id: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  createdAtLabel: string;
  updatedAt: string;
}

export interface AreaFormInput {
  code: string;
  name: string;
  description: string;
}

type RawArea = {
  id: string;
  codigo: string;
  nombre_area: string;
  descripcion: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
};

function mapArea(row: RawArea): AreaRow {
  return {
    id: row.id,
    code: row.codigo,
    name: row.nombre_area,
    description: row.descripcion,
    active: row.activo,
    createdAt: row.created_at,
    createdAtLabel: toDateTimeLabel(row.created_at),
    updatedAt: row.updated_at,
  };
}

function validateInput(input: AreaFormInput): { code: string; name: string; description: string | null } {
  const code = sanitizeText(input.code, CODE_MAX);
  if (!code) throw new Error("El código del área es obligatorio.");
  if (!/^[A-Z0-9_-]+$/i.test(code)) throw new Error("El código solo puede contener letras, números, guiones y guiones bajos.");

  const name = sanitizeText(input.name, NAME_MAX);
  if (!name) throw new Error("El nombre del área es obligatorio.");

  const description = sanitizeText(input.description, DESC_MAX);
  return { code: code.toUpperCase(), name, description };
}

export async function listAreas(search?: string): Promise<AreaRow[]> {
  const tenantId = await getRequiredTenantId();
  let q = ongSchema()
    .from("areas")
    .select("id, codigo, nombre_area, descripcion, activo, created_at, updated_at")
    .eq("tenant_id", tenantId)
    .order("nombre_area", { ascending: true });

  if (search?.trim()) {
    const term = `%${search.trim()}%`;
    q = q.or(`nombre_area.ilike.${term},codigo.ilike.${term}`);
  }

  const { data, error } = await q;
  if (error) throw new Error(toFriendlyError(error, "No se pudo cargar las áreas."));
  return (data as RawArea[]).map(mapArea);
}

export async function createArea(input: AreaFormInput): Promise<AreaRow> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();
  const { code, name, description } = validateInput(input);

  const { data: existing } = await ongSchema()
    .from("areas")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("codigo", code)
    .maybeSingle();
  if (existing) throw new Error(`Ya existe un área con el código "${code}".`);

  const payload: Record<string, unknown> = {
    tenant_id: tenantId,
    codigo: code,
    nombre_area: name,
    descripcion: description,
    activo: true,
  };
  if (userId) payload.created_by = userId;

  const { data, error } = await ongSchema()
    .from("areas")
    .insert(payload)
    .select("id, codigo, nombre_area, descripcion, activo, created_at, updated_at")
    .single();
  if (error) throw new Error(toFriendlyError(error, "No se pudo crear el área."));
  return mapArea(data as RawArea);
}

export async function updateArea(id: string, input: AreaFormInput): Promise<AreaRow> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();
  const { code, name, description } = validateInput(input);

  const { data: existing } = await ongSchema()
    .from("areas")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("codigo", code)
    .neq("id", id)
    .maybeSingle();
  if (existing) throw new Error(`Ya existe otro área con el código "${code}".`);

  const payload: Record<string, unknown> = {
    codigo: code,
    nombre_area: name,
    descripcion: description,
  };
  if (userId) payload.updated_by = userId;

  const { data, error } = await ongSchema()
    .from("areas")
    .update(payload)
    .eq("id", id)
    .eq("tenant_id", tenantId)
    .select("id, codigo, nombre_area, descripcion, activo, created_at, updated_at")
    .single();
  if (error) throw new Error(toFriendlyError(error, "No se pudo actualizar el área."));
  return mapArea(data as RawArea);
}

export async function toggleAreaActive(id: string, active: boolean): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const { error } = await ongSchema()
    .from("areas")
    .update({ activo: active })
    .eq("id", id)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(toFriendlyError(error, "No se pudo actualizar el estado del área."));
}
