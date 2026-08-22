import { supabase } from "../../../supabaseClient";
import {
  getRequiredTenantId,
  resolveCurrentUserId,
  sanitizeText,
  toDateTimeLabel,
  toFriendlyError,
} from "../configuracion/shared";

function academicoDb() {
  return supabase.schema("academico");
}

function ongDb() {
  return supabase.schema("ong");
}

export interface CursoRow {
  id: string;
  nombre: string;
  descripcion: string | null;
  horasCertificacion: number | null;
  activo: boolean;
  inscripciones: number;
  creadoEn: string;
}

export interface InscripcionRow {
  id: string;
  idVoluntario: string;
  voluntarioNombre: string;
  estado: "inscrito" | "aprobado" | "reprobado";
  creadoEn: string;
  certificadoUrl: string | null;
}

export interface CursosResumen {
  cursos: CursoRow[];
  totalCursos: number;
  activos: number;
  totalInscripciones: number;
  totalCertificados: number;
}

export interface CursoCreateInput {
  nombre: string;
  descripcion: string | null;
  horasCertificacion: number | null;
}

export interface CursoUpdateInput extends CursoCreateInput {
  activo: boolean;
}

export async function listCursos(): Promise<CursosResumen> {
  const tenantId = await getRequiredTenantId();

  const [cursosRes, inscRes, certRes] = await Promise.all([
    academicoDb()
      .from("cursos")
      .select("id, nombre_curso, descripcion, horas_certificacion, activo, created_at")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false }),
    academicoDb()
      .from("inscripciones")
      .select("id, id_curso")
      .eq("tenant_id", tenantId),
    academicoDb()
      .from("certificados")
      .select("id")
      .eq("tenant_id", tenantId),
  ]);

  if (cursosRes.error) throw new Error(cursosRes.error.message);

  const cursos = cursosRes.data ?? [];
  const inscripciones = inscRes.data ?? [];
  const certificados = certRes.data ?? [];

  const countByCurso = new Map<string, number>();
  for (const insc of inscripciones) {
    countByCurso.set(insc.id_curso, (countByCurso.get(insc.id_curso) ?? 0) + 1);
  }

  return {
    cursos: cursos.map((row) => ({
      id: row.id,
      nombre: row.nombre_curso,
      descripcion: row.descripcion,
      horasCertificacion: row.horas_certificacion,
      activo: row.activo ?? true,
      inscripciones: countByCurso.get(row.id) ?? 0,
      creadoEn: toDateTimeLabel(row.created_at),
    })),
    totalCursos: cursos.length,
    activos: cursos.filter((r) => r.activo).length,
    totalInscripciones: inscripciones.length,
    totalCertificados: certificados.length,
  };
}

export async function createCurso(input: CursoCreateInput): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();

  const { error } = await academicoDb().from("cursos").insert({
    tenant_id: tenantId,
    nombre_curso: sanitizeText(input.nombre, 200),
    descripcion: input.descripcion ? sanitizeText(input.descripcion, 1000) : null,
    horas_certificacion: input.horasCertificacion ?? null,
    activo: true,
    created_by: userId,
    updated_by: userId,
  });

  if (error) throw new Error(toFriendlyError(error, "No se pudo crear el curso."));
}

export async function updateCurso(id: string, input: CursoUpdateInput): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();

  const { error } = await academicoDb()
    .from("cursos")
    .update({
      nombre_curso: sanitizeText(input.nombre, 200),
      descripcion: input.descripcion ? sanitizeText(input.descripcion, 1000) : null,
      horas_certificacion: input.horasCertificacion ?? null,
      activo: input.activo,
      updated_by: userId,
    })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(toFriendlyError(error, "No se pudo actualizar el curso."));
}

export async function toggleCursoActivo(id: string, activo: boolean): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();

  const { error } = await academicoDb()
    .from("cursos")
    .update({ activo, updated_by: userId })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(toFriendlyError(error, "No se pudo cambiar el estado del curso."));
}

export async function listInscripciones(idCurso: string): Promise<InscripcionRow[]> {
  const tenantId = await getRequiredTenantId();

  const [inscRes, certRes] = await Promise.all([
    academicoDb()
      .from("inscripciones")
      .select("id, id_voluntario, estado, created_at")
      .eq("tenant_id", tenantId)
      .eq("id_curso", idCurso)
      .order("created_at", { ascending: false }),
    academicoDb()
      .from("certificados")
      .select("id_inscripcion, url_certificado")
      .eq("tenant_id", tenantId),
  ]);

  if (inscRes.error) throw new Error(inscRes.error.message);

  const inscripciones = inscRes.data ?? [];
  const certs = certRes.data ?? [];
  const certMap = new Map(certs.map((c) => [c.id_inscripcion, c.url_certificado]));

  let nameMap = new Map<string, string>();
  if (inscripciones.length > 0) {
    const ids = [...new Set(inscripciones.map((i) => i.id_voluntario))];
    const { data: vols } = await ongDb()
      .from("voluntarios")
      .select("id, nombre, apellido")
      .in("id", ids)
      .eq("tenant_id", tenantId);

    nameMap = new Map(
      (vols ?? []).map((v) => [v.id, `${v.nombre} ${v.apellido}`.trim()])
    );
  }

  return inscripciones.map((row) => ({
    id: row.id,
    idVoluntario: row.id_voluntario,
    voluntarioNombre: nameMap.get(row.id_voluntario) ?? "Voluntario desconocido",
    estado: (row.estado ?? "inscrito") as InscripcionRow["estado"],
    creadoEn: toDateTimeLabel(row.created_at),
    certificadoUrl: certMap.get(row.id) ?? null,
  }));
}

export async function updateEstadoInscripcion(
  id: string,
  estado: "inscrito" | "aprobado" | "reprobado"
): Promise<void> {
  const tenantId = await getRequiredTenantId();
  const userId = await resolveCurrentUserId();

  const { error } = await academicoDb()
    .from("inscripciones")
    .update({ estado, updated_by: userId })
    .eq("id", id)
    .eq("tenant_id", tenantId);

  if (error) throw new Error(toFriendlyError(error, "No se pudo actualizar el estado."));
}

