import { ongSchema, getRequiredTenantId, resolveCurrentUserId, toFriendlyError } from "./shared";
import type { AppDatabase } from "../../../lib/db/ong/app-database";

export type AreaRow = AppDatabase["ong"]["Tables"]["areas"]["Row"];

export interface AreaWithProjects extends AreaRow {
  proyectos_count: number;
}

export async function listAreas(searchTerm: string = ""): Promise<AreaWithProjects[]> {
  const tenantId = await getRequiredTenantId();

  let query = ongSchema().from("areas").select(`
    *,
    proyectos ( id )
  `).eq("tenant_id", tenantId);

  if (searchTerm.trim()) {
    const term = `%${searchTerm.trim()}%`;
    query = query.or(`nombre_area.ilike.${term},codigo.ilike.${term}`);
  }

  const { data, error } = await query.order("nombre_area", { ascending: true });

  if (error) {
    throw new Error(toFriendlyError(error, "Error al cargar las áreas"));
  }

  return (data as any[]).map(area => ({
    ...area,
    proyectos_count: area.proyectos ? area.proyectos.length : 0
  }));
}

export async function createArea(payload: { codigo: string; nombre_area: string; descripcion?: string; activo: boolean }): Promise<AreaRow> {
  const tenantId = await getRequiredTenantId();
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    throw new Error("No se pudo identificar el usuario activo.");
  }

  const { data, error } = await ongSchema().from("areas").insert({
    tenant_id: tenantId,
    codigo: payload.codigo,
    nombre_area: payload.nombre_area,
    descripcion: payload.descripcion || null,
    activo: payload.activo,
    created_by: currentUserId,
    updated_by: currentUserId,
  } as any).select().single();

  if (error) {
    throw new Error(toFriendlyError(error, "Error al crear el área"));
  }
  
  return data as AreaRow;
}

export async function updateArea(id: string, payload: { codigo: string; nombre_area: string; descripcion?: string; activo: boolean }): Promise<AreaRow> {
  const tenantId = await getRequiredTenantId();
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    throw new Error("No se pudo identificar el usuario activo.");
  }

  const { data, error } = await ongSchema().from("areas").update({
    codigo: payload.codigo,
    nombre_area: payload.nombre_area,
    descripcion: payload.descripcion || null,
    activo: payload.activo,
    updated_by: currentUserId,
    updated_at: new Date().toISOString()
  } as any)
  .eq("id", id)
  .eq("tenant_id", tenantId)
  .select().single();

  if (error) {
    throw new Error(toFriendlyError(error, "Error al actualizar el área"));
  }
  
  return data as AreaRow;
}

export async function toggleAreaStatus(id: string, activo: boolean): Promise<AreaRow> {
  const tenantId = await getRequiredTenantId();
  const currentUserId = await resolveCurrentUserId();

  if (!currentUserId) {
    throw new Error("No se pudo identificar el usuario activo.");
  }

  const { data, error } = await ongSchema().from("areas").update({
    activo: activo,
    updated_by: currentUserId,
    updated_at: new Date().toISOString()
  } as any)
  .eq("id", id)
  .eq("tenant_id", tenantId)
  .select().single();

  if (error) {
    throw new Error(toFriendlyError(error, "Error al cambiar el estado del área"));
  }
  
  return data as AreaRow;
}
