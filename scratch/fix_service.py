import re

with open('ong/src/app/services/academico/cursos.service.ts', 'r', encoding='utf-8') as f:
    data = f.read()

# Add inscritosCount to CursoRow
data = data.replace('activo: boolean;', 'activo: boolean;\n  inscritosCount: number;')

new_list_cursos = """export async function listCursos(search = ""): Promise<CursoRow[]> {
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
}"""

data = re.sub(r'export async function listCursos[\s\S]*?(?=\nexport async function createCurso)', new_list_cursos, data)

with open('ong/src/app/services/academico/cursos.service.ts', 'w', encoding='utf-8') as f:
    f.write(data)

print('Updated cursos.service.ts')
