/**
 * Servicio de Sincronización Kobo → Supabase
 * Kobo = datos crudos
 * Supabase = verdad operativa
 */

import { getKoboClient, KOBO_FORMS } from './kobo.ts';

// =====================================================
// UTILIDADES
// =====================================================

function generarPasswordAleatoria(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  return Array.from({ length: 16 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('npm:bcryptjs');
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

// =====================================================
// VOLUNTARIOS
// =====================================================

async function buscarVoluntarioPorDNI(
  supabase: any,
  dni: string
) {
  return await supabase
    .from('usuarios')
    .select('id_usuario, estado')
    .eq('dni', dni)
    .eq('rol', 'voluntario')
    .maybeSingle(); // 👈 clave
}

async function crearVoluntarioAutomatico(
  supabase: any,
  dni: string,
  nombre?: string
): Promise<number | null> {

  const password = generarPasswordAleatoria();
  const hash = await hashPassword(password);

  const { data, error } = await supabase
    .from('usuarios')
    .insert({
      nombre_completo: nombre || `Voluntario ${dni}`,
      organizacion: 'Voluntarios externos',
      cargo: 'Voluntario',
      dni: dni,
      correo: `vol_${dni}@sistema.local`,
      usuario: `vol_${dni}`,
      contrasena_hash: hash,
      tipo_usuario: 'usuario',
      rol: 'voluntario',
      estado: 'activo'
    })
    .select('id_usuario')
    .maybeSingle();

  if (error) {
    console.error('❌ Error creando voluntario:', error);
    return null;
  }

  return data.id_usuario;
}

async function buscarOCrearVoluntario(
  supabase: any,
  dni: string
): Promise<number | null> {

  const { data } = await buscarVoluntarioPorDNI(supabase, dni);

  if (data) {
    if (data.estado !== 'activo') {
      await supabase
        .from('usuarios')
        .update({ estado: 'activo' })
        .eq('id_usuario', data.id_usuario);
    }
    return data.id_usuario;
  }

  return await crearVoluntarioAutomatico(supabase, dni);
}

// =====================================================
// SYNC ASISTENCIA Y HORAS
// =====================================================

export async function syncAsistenciaHoras(supabase: any) {
  const kobo = getKoboClient();
  
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  try {
    const submissions = await kobo.getSubmissions(
      KOBO_FORMS.ASISTENCIA_HORAS,
      { limit: 1000 }
    );

    for (const s of submissions.results) {
      try {
        const uuid = s._uuid;
        const dni = s.numero_dni;
        const codigoActividad = s.codigo;
        const horas = Number(s.cantidad_horas || 0);

        if (!dni || !codigoActividad || horas <= 0) {
          skipped++;
          continue;
        }

        const { data: yaProcesado } = await supabase
          .from('kobo_submissions_procesadas')
          .select('id')
          .eq('kobo_uuid', uuid)
          .maybeSingle();

        if (yaProcesado) {
          skipped++;
          continue;
        }

        const idUsuario = await buscarOCrearVoluntario(supabase, dni);
        if (!idUsuario) {
          errors++;
          continue;
        }

        const { data: actividad } = await supabase
          .from('actividades')
          .select('id_actividad')
          .eq('codigo', codigoActividad)
          .maybeSingle();

        if (!actividad) {
          errors++;
          continue;
        }

        const { data: relacion } = await supabase
          .from('actividad_voluntarios')
          .select('horas_total')
          .eq('id_usuario', idUsuario)
          .eq('id_actividad', actividad.id_actividad)
          .maybeSingle();

        if (relacion) {
          await supabase
            .from('actividad_voluntarios')
            .update({
              horas_total: relacion.horas_total + horas
            })
            .eq('id_usuario', idUsuario)
            .eq('id_actividad', actividad.id_actividad);
        } else {
          await supabase
            .from('actividad_voluntarios')
            .insert({
              id_usuario: idUsuario,
              id_actividad: actividad.id_actividad,
              horas_total: horas
            });
        }

        await supabase
          .from('kobo_submissions_procesadas')
          .insert({
            kobo_uuid: uuid,
            formulario: 'ASISTENCIA_HORAS',
            fecha_procesamiento: new Date().toISOString()
          });

        processed++;
      } catch (error: any) {
        console.error('Error procesando submission:', error);
        errors++;
      }
    }

    return {
      success: true,
      processed,
      errors,
      skipped,
      total: submissions.results.length
    };
  } catch (error: any) {
    console.error('Error en syncAsistenciaHoras:', error);
    return {
      success: false,
      processed,
      errors: errors + 1,
      skipped,
      errorMessage: error.message
    };
  }
}

// =====================================================
// SYNC EJECUCIÓN + EVIDENCIAS
// =====================================================

export async function syncEjecucionEvidencias(supabase: any) {
  const kobo = getKoboClient();
  
  let processed = 0;
  let errors = 0;
  let skipped = 0;

  try {
    const submissions = await kobo.getSubmissions(
      KOBO_FORMS.EJECUCION_EVIDENCIAS,
      { limit: 1000 }
    );

    for (const s of submissions.results) {
      try {
        const uuid = s._uuid;
        const codigoActividad = s.codigo;

        if (!codigoActividad) {
          skipped++;
          continue;
        }

        const { data: ya } = await supabase
          .from('kobo_submissions_procesadas')
          .select('id')
          .eq('kobo_uuid', uuid)
          .maybeSingle();

        if (ya) {
          skipped++;
          continue;
        }

        const { data: actividad } = await supabase
          .from('actividades')
          .select('id_actividad')
          .eq('codigo', codigoActividad)
          .maybeSingle();

        if (!actividad) {
          errors++;
          continue;
        }
        await supabase
          .from('kobo_submissions_procesadas')
          .insert({
            kobo_uuid: uuid,
            formulario: 'EJECUCION_EVIDENCIAS',
            fecha_procesamiento: new Date().toISOString()
          });

        processed++;
      } catch (error: any) {
        console.error('Error procesando submission:', error);
        errors++;
      }
    }

    return {
      success: true,
      processed,
      errors,
      skipped,
      total: submissions.results.length
    };
  } catch (error: any) {
    console.error('Error en syncEjecucionEvidencias:', error);
    return {
      success: false,
      processed,
      errors: errors + 1,
      skipped,
      errorMessage: error.message
    };
  }
}

// =====================================================
// UTILIDADES ADICIONALES
// =====================================================

/**
 * Generar código único para una actividad
 * Formato: ACT-YYYYMMDD-XXXX
 */
export function generarCodigoActividad(): string {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `ACT-${year}${month}${day}-${random}`;
}

/**
 * Obtener estadísticas de sincronización
 */
export async function obtenerEstadisticasSync(supabase: any) {
  try {
    // Contar submissions procesadas por formulario
    const { count: asistenciaCount, error: asistenciaCountError } = await supabase
      .from('kobo_submissions_procesadas')
      .select('id', { count: 'exact', head: true })
      .eq('formulario', 'ASISTENCIA_HORAS');

    if (asistenciaCountError) {
      throw new Error(`Error contando ASISTENCIA_HORAS: ${asistenciaCountError.message}`);
    }

    const { count: ejecucionCount, error: ejecucionCountError } = await supabase
      .from('kobo_submissions_procesadas')
      .select('id', { count: 'exact', head: true })
      .eq('formulario', 'EJECUCION_EVIDENCIAS');

    if (ejecucionCountError) {
      throw new Error(`Error contando EJECUCION_EVIDENCIAS: ${ejecucionCountError.message}`);
    }

    // Obtener última fecha de sincronización
    const { data: ultimaSync } = await supabase
      .from('kobo_submissions_procesadas')
      .select('fecha_procesamiento')
      .order('fecha_procesamiento', { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      success: true,
      asistenciaHorasProcesadas: asistenciaCount || 0,
      ejecucionProcesadas: ejecucionCount || 0,
      ultimaSincronizacion: ultimaSync?.fecha_procesamiento || null,
      totalProcesadas: (asistenciaCount || 0) + (ejecucionCount || 0)
    };
  } catch (error: any) {
    console.error('Error obteniendo estadísticas de sync:', error);
    return {
      success: false,
      error: error.message,
      asistenciaHorasProcesadas: 0,
      ejecucionProcesadas: 0,
      totalProcesadas: 0
    };
  }
}
