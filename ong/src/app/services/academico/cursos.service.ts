import { supabase } from "../../../supabaseClient";
import {
  getRequiredTenantId,
  resolveCurrentUserId,
  toFriendlyError,
  normalizeText,
} from "../operacion/shared";

export const NOTA_APROBACION = 11;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CursoRow {
  id: string;
  displayCode: string;
  nombre: string;
  descripcion: string | null;
  horasCertificacion: number | null;
  imageUrl: string | null;
  activo: boolean;
  inscritosCount: number;
}

export interface InscripcionRow {
  id: string;
  cursoId: string;
  cursoNombre: string;
  voluntarioId: string;
  voluntarioNombre: string;
  estado: "inscrito" | "aprobado" | "reprobado";
  nota: number | null;
  createdAt: string;
  certificadoId: string | null;
}

export interface CertificadoRow {
  id: string;
  inscripcionId: string;
  cursoNombre: string;
  voluntarioNombre: string;
  urlCertificado: string;
  fechaEmision: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function academicoSchema() {
  return supabase.schema("academico");
}

function ongSchema() {
  return supabase.schema("ong");
}

function nowIso() {
  return new Date().toISOString();
}

// ─── Cursos ───────────────────────────────────────────────────────────────────

export async function listCursos(search = ""): Promise<CursoRow[]> {
  const tenantId = await getRequiredTenantId();
  
  // 1. Obtener los cursos
  const { data, error } = await academicoSchema()
    .from("cursos")
    .select("id, nombre_curso, descripcion, horas_certificacion, imagen_url, activo")
    .eq("tenant_id", tenantId)
    .order("nombre_curso");
  if (error) throw new Error(toFriendlyError(error, "No se pudieron cargar los cursos."));

  // 2. Hacer el join/count manual con inscripciones
  const cursoIds = (data ?? []).map((c) => c.id);
  let inscritosCountMap: Record<string, number> = {};
  
  if (cursoIds.length > 0) {
    const { data: inscripciones } = await academicoSchema()
      .from("inscripciones")
      .select("id_curso")
      .eq("tenant_id", tenantId)
      .in("id_curso", cursoIds);
      
    if (inscripciones) {
      for (const ins of inscripciones) {
        inscritosCountMap[ins.id_curso] = (inscritosCountMap[ins.id_curso] || 0) + 1;
      }
    }
  }

  const term = normalizeText(search);
  return (data ?? [])
    .filter((r) => !term || normalizeText(r.nombre_curso).includes(term))
    .map((r, idx) => ({
      id: r.id,
      displayCode: `CUR-${String(idx + 1).padStart(3, "0")}`,
      nombre: r.nombre_curso,
      descripcion: r.descripcion,
      horasCertificacion: r.horas_certificacion,
      imageUrl: r.imagen_url ?? null,
      activo: r.activo ?? true,
      inscritosCount: inscritosCountMap[r.id] || 0,
    }));
}
export async function createCurso(input: {
  nombre: string;
  descripcion: string | null;
  horasCertificacion: number | null;
  imageUrl?: string | null;
}): Promise<CursoRow> {
  const tenantId = await getRequiredTenantId();
  const actorId = await resolveCurrentUserId();
  const ts = nowIso();
  const { data, error } = await academicoSchema()
    .from("cursos")
    .insert({
      tenant_id: tenantId,
      nombre_curso: input.nombre.trim(),
      descripcion: input.descripcion ?? null,
      horas_certificacion: input.horasCertificacion,
      imagen_url: input.imageUrl ?? null,
      activo: true,
      created_at: ts,
      updated_at: ts,
      created_by: actorId,
      updated_by: actorId,
    })
    .select("id, nombre_curso, descripcion, horas_certificacion, imagen_url, activo")
    .single();
  if (error) throw new Error(toFriendlyError(error, "No se pudo crear el curso."));
  return {
    id: data.id,
    displayCode: "CUR-NEW",
    nombre: data.nombre_curso,
    descripcion: data.descripcion,
    horasCertificacion: data.horas_certificacion,
    imageUrl: data.imagen_url ?? null,
    activo: data.activo ?? true,
  };
}

// ─── Inscripciones ────────────────────────────────────────────────────────────

export async function listInscripcionesByCurso(cursoId: string): Promise<InscripcionRow[]> {
  const tenantId = await getRequiredTenantId();

  const { data: inscripciones, error } = await academicoSchema()
    .from("inscripciones")
    .select("id, id_curso, id_voluntario, estado, nota, created_at")
    .eq("tenant_id", tenantId)
    .eq("id_curso", cursoId)
    .order("created_at");
  if (error) throw new Error(toFriendlyError(error, "No se pudieron cargar las inscripciones."));

  const rows = inscripciones ?? [];
  if (!rows.length) return [];

  const volunteerIds = [...new Set(rows.map((r) => r.id_voluntario))];
  const { data: volunteers } = await ongSchema()
    .from("voluntarios")
    .select("id, nombre, apellido")
    .eq("tenant_id", tenantId)
    .in("id", volunteerIds);
  const volunteerMap = new Map(
    (volunteers ?? []).map((v) => [v.id, `${v.nombre} ${v.apellido}`.trim()])
  );

  const inscripcionIds = rows.map((r) => r.id);
  const { data: certs } = await academicoSchema()
    .from("certificados")
    .select("id, id_inscripcion")
    .eq("tenant_id", tenantId)
    .in("id_inscripcion", inscripcionIds);
  const certMap = new Map((certs ?? []).map((c) => [c.id_inscripcion, c.id]));

  return rows.map((r) => ({
    id: r.id,
    cursoId: r.id_curso,
    cursoNombre: "",
    voluntarioId: r.id_voluntario,
    voluntarioNombre: volunteerMap.get(r.id_voluntario) ?? r.id_voluntario,
    estado: (r.estado ?? "inscrito") as InscripcionRow["estado"],
    nota: r.nota !== null ? Number(r.nota) : null,
    createdAt: r.created_at,
    certificadoId: certMap.get(r.id) ?? null,
  }));
}

export async function updateInscripcion(
  inscripcionId: string,
  input: { estado: InscripcionRow["estado"]; nota: number | null }
): Promise<{ certificadoCreado: boolean }> {
  const tenantId = await getRequiredTenantId();
  const actorId = await resolveCurrentUserId();
  const ts = nowIso();

  const { error } = await academicoSchema()
    .from("inscripciones")
    .update({
      estado: input.estado,
      nota: input.nota,
      updated_at: ts,
      updated_by: actorId,
    })
    .eq("id", inscripcionId)
    .eq("tenant_id", tenantId);
  if (error) throw new Error(toFriendlyError(error, "No se pudo actualizar la inscripción."));

  const debeEmitir =
    input.estado === "aprobado" &&
    input.nota !== null &&
    input.nota >= NOTA_APROBACION;

  if (!debeEmitir) return { certificadoCreado: false };

  const { data: existing } = await academicoSchema()
    .from("certificados")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id_inscripcion", inscripcionId)
    .maybeSingle();

  if (existing) return { certificadoCreado: false };

  const { error: certError } = await academicoSchema()
    .from("certificados")
    .insert({
      tenant_id: tenantId,
      id_inscripcion: inscripcionId,
      url_certificado: "",
      fecha_emision: ts.slice(0, 10),
      created_at: ts,
      updated_at: ts,
      created_by: actorId,
      updated_by: actorId,
    });

  if (certError) throw new Error(toFriendlyError(certError, "No se pudo emitir el certificado."));
  return { certificadoCreado: true };
}

export async function enrollVolunteer(input: {
  cursoId: string;
  voluntarioId: string;
}): Promise<string> {
  const tenantId = await getRequiredTenantId();
  const actorId = await resolveCurrentUserId();
  const ts = nowIso();

  const { data: existing } = await academicoSchema()
    .from("inscripciones")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("id_curso", input.cursoId)
    .eq("id_voluntario", input.voluntarioId)
    .maybeSingle();
  if (existing) throw new Error("Este voluntario ya está inscrito en el curso.");

  const { data, error } = await academicoSchema()
    .from("inscripciones")
    .insert({
      tenant_id: tenantId,
      id_curso: input.cursoId,
      id_voluntario: input.voluntarioId,
      estado: "inscrito",
      nota: null,
      created_at: ts,
      updated_at: ts,
      created_by: actorId,
      updated_by: actorId,
    })
    .select("id")
    .single();
  if (error) throw new Error(toFriendlyError(error, "No se pudo inscribir al voluntario."));
  return data.id;
}

// ─── Certificados ─────────────────────────────────────────────────────────────

export async function listCertificadosByCurso(cursoId: string): Promise<CertificadoRow[]> {
  const tenantId = await getRequiredTenantId();

  const { data: inscripciones, error: iErr } = await academicoSchema()
    .from("inscripciones")
    .select("id, id_voluntario")
    .eq("tenant_id", tenantId)
    .eq("id_curso", cursoId);
  if (iErr) throw new Error(toFriendlyError(iErr, "No se pudieron cargar las inscripciones."));

  const rows = inscripciones ?? [];
  if (!rows.length) return [];

  const inscripcionIds = rows.map((r) => r.id);
  const { data: certs, error: cErr } = await academicoSchema()
    .from("certificados")
    .select("id, id_inscripcion, url_certificado, fecha_emision")
    .eq("tenant_id", tenantId)
    .in("id_inscripcion", inscripcionIds)
    .order("fecha_emision", { ascending: false });
  if (cErr) throw new Error(toFriendlyError(cErr, "No se pudieron cargar los certificados."));

  const volunteerIds = [...new Set(rows.map((r) => r.id_voluntario))];
  const { data: volunteers } = await ongSchema()
    .from("voluntarios")
    .select("id, nombre, apellido")
    .eq("tenant_id", tenantId)
    .in("id", volunteerIds);
  const volunteerMap = new Map(
    (volunteers ?? []).map((v) => [v.id, `${v.nombre} ${v.apellido}`.trim()])
  );
  const inscripcionToVolunteer = new Map(rows.map((r) => [r.id, r.id_voluntario]));

  const { data: curso } = await academicoSchema()
    .from("cursos")
    .select("nombre_curso")
    .eq("id", cursoId)
    .maybeSingle();

  return (certs ?? []).map((c) => {
    const volunteerId = inscripcionToVolunteer.get(c.id_inscripcion) ?? "";
    return {
      id: c.id,
      inscripcionId: c.id_inscripcion,
      cursoNombre: curso?.nombre_curso ?? "",
      voluntarioNombre: volunteerMap.get(volunteerId) ?? volunteerId,
      urlCertificado: c.url_certificado,
      fechaEmision: c.fecha_emision,
    };
  });
}
