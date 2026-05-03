# Sincronizacion Post-Migracion

## Alcance
- Ajuste minimo de contrato despues de la migracion unificada ejecutada en Supabase.
- Sincronizacion de tipos centrales, servicios operativos y mensajes de UI sin redisenar modulos.

## Archivos centrales ajustados
- `src/lib/db/ong/app-database.ts`
- `src/lib/db/ong/types.ts`
- `src/lib/db/index.ts`

## Contratos nuevos o corregidos
- `ong.asistencias`
- `ong.aprobaciones`
- `clinico.accesos_sensibles_voluntario_log`
- `rrhh.codigos_registro_voluntario`
- `rrhh.registro_documentos_postulante`
- `ong.id_card_templates`
- `ong.id_card_template_fields`
- `ong.id_cards`
- `finanzas.cat_tipos_cuenta`
- `finanzas.aprobaciones_transaccion`
- nuevas columnas en `ong.actividades`, `ong.horas_actividad`, `rrhh.documentos_admision`, `rrhh.entrevistas_admision`, `rrhh.solicitudes_admision`, `rrhh.onboarding_voluntario`, `comunicaciones.plantillas_notificacion`, `comunicaciones.historial_notificaciones`

## Resultado
- El contrato tipado ya no asume una BD monolitica en `public`.
- `Operacion` deja de declarar `Asistencias` y `Aprobaciones` como ausentes cuando `Parte 4` ya las creo.
- La bitacora sensible de voluntarios usa la tabla real creada en la migracion.

## Verificacion
- `npm run build`
- Resultado: compilacion Vite exitosa despues de los ajustes.

## Cierre integral
- El cierre transversal posterior a todas las fases quedo documentado en `guidelines/documentacion-navegacion/99-cierre-integral-repo.md`.
- En ese cierre se consolido:
  - verificacion final de build y rutas nuevas.
  - eliminacion del mock legacy huerfano `src/app/data/mockData.ts`.
  - checklist final por modulo y riesgo residual visible del placeholder `/admin/courses`.
