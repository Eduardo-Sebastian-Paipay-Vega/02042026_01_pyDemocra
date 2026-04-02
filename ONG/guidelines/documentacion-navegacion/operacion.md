# Operación

Dominio auditado:
- `src/app/modules/operation/**`
- `src/app/services/operacion/**`
- `src/app/pages/Activities.tsx`
- `src/app/pages/Attendance.tsx`
- `src/app/pages/Hours.tsx`
- `src/app/pages/Evidence.tsx`
- `src/app/pages/Approvals.tsx`
- `src/app/pages/HoursApproval.tsx`

Fuentes de anclaje revisadas:
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/ONGDiccionarioRF.md`

## Mapa RF/CU -> schema.table

| RF / CU | Subflujo Operación | schema.table reales | Estado |
| --- | --- | --- | --- |
| RF-21 / CU-13 | Actividades por tarea | `ong.actividades`, `ong.tareas`, `ong.proyectos`, `ong.ubicaciones` | Operativo con `schema("ong")` explícito. La actividad deriva su estado desde `ong.tareas.estado` porque no existe `ong.estados_actividad` en los scripts. |
| RF-22 / CU-14 | Asignaciones de voluntarios a actividad | `ong.asignaciones_actividad`, `ong.actividades`, `ong.voluntarios` | Operativo. Alta, edición y baja lógica de asignaciones sobre tabla real. |
| RF-23 / CU-15 | Evidencias por actividad | `ong.evidencias_actividad`, `ong.actividades`, `ong.tareas`, `ong.proyectos`, `ong.voluntarios` | Operativo para listar, ver, crear, editar y eliminar. La validación genérica queda bloqueada por ausencia de tabla de aprobaciones/documentación de validación. |
| RF-24 / CU-16 | Asistencias | No documentado en los scripts | Bloqueado de forma segura. No existe `ong.asistencias` en los scripts documentales. |
| RF-25 / CU-17/18 | Horas + aprobación | `ong.horas_actividad`, `ong.actividades`, `ong.tareas`, `ong.proyectos`, `ong.voluntarios` | Operativo. La aprobación se resuelve sobre `horas_actividad.estado_aprobacion` y `horas_actividad.aprobado_por`; no se usa tabla de estados aparte. |
| RF-27 / CU-19/20 | Aprobaciones genéricas | No documentado en los scripts | Bloqueado de forma segura. No existe `ong.aprobaciones` en los scripts documentales. |

## Tablas reales usadas por el dominio

- `ong.tareas`
- `ong.actividades`
- `ong.horas_actividad`
- `ong.asignaciones_actividad`
- `ong.evidencias_actividad`
- `ong.voluntarios`
- `ong.proyectos`
- `ong.ubicaciones`

## Consultas legacy corregidas

- Se eliminaron consultas implícitas con `supabase.from(...)` dentro del dominio Operación.
- Todas las consultas de lectura/escritura del dominio quedan en `supabase.schema("ong")`.
- La lectura de perfiles auxiliares para nombres de usuario usa `supabase.schema("public").from("profiles")` cuando corresponde.
- No se asumió que tablas como `voluntarios`, `proyectos`, `tareas`, `actividades`, `horas_actividad` o `evidencias_actividad` viven en `public`.

## Bloqueos documentados

### Asistencias
`guidelines/ONGDiccionarioRF.md` define el flujo `RF-24 / CU-16` para `asistencias` en la línea 1159, y los scripts revisados no crean `ong.asistencias`. Las tablas reales del dominio Operación en los scripts son `ong.actividades`, `ong.horas_actividad`, `ong.asignaciones_actividad` y `ong.evidencias_actividad` en `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt:194-241`.

Resultado:
- `src/app/services/operacion/asistencias.service.ts` queda bloqueado con error seguro.
- `Attendance.tsx` recibe ese error desde el hook y no ejecuta mutaciones.

### Aprobaciones genéricas
`guidelines/ONGDiccionarioRF.md` define `RF-27 / CU-19/20` para `aprobaciones` en la línea 1161, pero los scripts documentales no crean `ong.aprobaciones`.

Resultado:
- `src/app/services/operacion/aprobaciones.service.ts` queda bloqueado con error seguro.
- `Approvals.tsx` queda en estado seguro con el mensaje de bloqueo.

### Estados y catálogos no documentados
- `estados_actividad` aparece en el RF, pero no en el SQL documental. La UI de actividades usa el estado persistido en `ong.tareas.estado`.
- `estados_aprobacion` no está documentado como tabla separada. Horas usa `ong.horas_actividad.estado_aprobacion`.
- `tipos_evidencia` aparece en el RF, pero no en el SQL documental. Evidencias usa el valor persistido en `ong.evidencias_actividad.tipo_evidencia`.

## Archivos impactados

- `src/app/services/operacion/shared.ts`
- `src/app/services/operacion/actividades.service.ts`
- `src/app/services/operacion/horas.service.ts`
- `src/app/services/operacion/evidencias.service.ts`
- `src/app/services/operacion/asistencias.service.ts`
- `src/app/services/operacion/aprobaciones.service.ts`
- `src/app/services/operacion/asignacionesActividad.service.ts`
- `src/app/modules/operation/operationService.ts`

## Validación ejecutada

- Se revisó el dominio contra los scripts SQL documentales antes de reescribir servicios.
- Se validó que no quedaran consultas legacy `supabase.from(...)` dentro del dominio Operación.
- Se ejecutó compilación parcial con `tsc` sobre los archivos tocados del dominio; los errores restantes quedaron fuera del scope permitido en `src/lib/db/**` y `src/supabaseClient.ts`.
- El build global sigue bloqueado por un import roto fuera del dominio (`src/app/routes.tsx` -> `./pages/AdmissionRequests`), que no se modificó por restricción de ownership.

## Resultado

- `Activities`, `Hours` y `Evidence` funcionan contra tablas reales con `schema("ong")` explícito.
- `Attendance` y `Approvals` quedaron en estado seguro por ausencia de tablas/documentación suficiente.
- No se introdujeron mocks ni hardcodes para simular persistencia.
