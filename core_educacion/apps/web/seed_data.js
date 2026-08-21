import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qafvnjoqvdtnrdvlnwco.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-key-here'; // Service role key para bypassear RLS
const supabase = createClient(supabaseUrl, supabaseKey);

async function runSeed() {
  console.log('🌱 INICIANDO INYECCIÓN DE DATOS SEMILLA (SEED DATA) 🌱');

  try {
    // 1. Crear Instituto (Tenant)
    console.log('1. Creando Instituto Core...');
    const { data: instituto, error: errInst } = await supabase.schema('core').from('institutos').insert({
      nombre: 'Democra School of Excellence',
      dominio: 'democra.edu',
      configuracion_json: { theme: 'dark', language: 'es' }
    }).select().single();
    if (errInst) throw errInst;
    const tenantId = instituto.instituto_id;

    // 2. Crear Roles
    console.log('2. Configurando Roles...');
    await supabase.schema('core').from('roles').insert([
      { rol_id: 'STUDENT', descripcion: 'Estudiante regular', tenant_id: tenantId, permisos_json: { can_study: true } },
      { rol_id: 'TEACHER', descripcion: 'Profesor', tenant_id: tenantId, permisos_json: { can_grade: true } }
    ]);

    // 3. Crear Usuario (Estudiante)
    console.log('3. Creando Usuario Estudiante...');
    const { data: usuario, error: errUser } = await supabase.schema('core').from('usuarios').insert({
      tenant_id: tenantId,
      rol_id: 'STUDENT',
      nombres: 'Eduardo Sebastián',
      apellidos: 'Paipay Vega',
      email: 'eduardo@democra.edu'
    }).select().single();
    if (errUser) throw errUser;
    const userId = usuario.usuario_id;

    // 4. Crear Perfil Estudiante
    console.log('4. Creando Perfil de Estudiante...');
    // We need a specific UUID for estudiante_id, same as user to keep it easy, or just let DB generate if it was default...
    // Wait, in core.estudiantes, estudiante_id is PK, not default. We must supply it.
    const { data: estudiante, error: errEst } = await supabase.schema('core').from('estudiantes').insert({
      estudiante_id: userId, // Usamos el mismo ID de usuario para mapeo 1:1
      tenant_id: tenantId,
      usuario_id: userId,
      matricula_codigo: 'DEMO-2026-001',
      grado_actual: '5to Secundaria'
    }).select().single();
    if (errEst) throw errEst;

    // 5. Crear Curso y Lección
    console.log('5. Creando Cursos y Lecciones...');
    const { data: curso, error: errCurso } = await supabase.schema('educa').from('cursos').insert({
      tenant_id: tenantId,
      nombre: 'Arquitectura Cloud con Supabase',
      descripcion: 'Aprende a diseñar sistemas Multi-Tenant en la nube.',
      creditos: 5
    }).select().single();
    if (errCurso) throw errCurso;

    const { data: leccion, error: errLec } = await supabase.schema('educa').from('lecciones').insert({
      tenant_id: tenantId,
      curso_id: curso.curso_id,
      titulo: 'Fundamentos de Row-Level Security',
      orden: 1
    }).select().single();
    if (errLec) throw errLec;

    // 6. Inyectar Calificación (Esto debería disparar el Trigger de Telemetría)
    console.log('6. Inyectando Calificación (Evaluando Trigger de Telemetría)...');
    await supabase.schema('educa').from('calificaciones').insert({
      tenant_id: tenantId,
      estudiante_id: userId,
      leccion_id: leccion.leccion_id,
      nota: 98.50,
      feedback: '¡Excelente comprensión de PostgREST y RLS!'
    });

    // 7. Inyectar Perfil de Gamificación
    console.log('7. Creando Perfil de Gamificación...');
    await supabase.schema('educa').from('gamificacion').insert({
      tenant_id: tenantId,
      estudiante_id: userId,
      puntos_xp: 2500,
      nivel: 5,
      medallas_json: ['cloud_architect_badge', 'sql_master']
    });

    console.log('\n✅ ¡SEED EXITOSO! Todos los datos fueron inyectados correctamente en tu nube de Supabase.');
    console.log(`🔑 Tenant ID guardado: ${tenantId}`);
    console.log(`🧑‍🎓 Estudiante ID guardado: ${userId}`);
    
  } catch (error) {
    console.error('\n❌ ERROR EN EL SEED:', error.message || error);
  }
}

runSeed();
