# Home

Dominio auditado: `src/app/modules/home/**`, `src/app/pages/Dashboard.tsx`, `src/app/pages/GlobalSearch.tsx`.

Fuentes revisadas para el anclaje de esquema:
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/ONGDiccionarioRF.md`

## Mapa RF/CU -> schema.table

| RF / CU | Flujo Home | schema.table reales | Observación |
| --- | --- | --- | --- |
| RF-01 / CU-01 | Contexto del usuario autenticado | `public.profiles`, `public.roles`, `public.user_roles_sedes` | Se usa para resolver nombre de usuario, roles y capacidad de gestión. |
| RF-08 / CU-03/04 | Voluntarios visibles en dashboard y búsqueda | `ong.voluntarios`, `ong.estados_voluntario` | Se usa el catálogo real de estados para filtrar activos. |
| RF-17 / CU-09 | Proyectos activos y búsqueda | `ong.proyectos`, `ong.estados_proyecto` | Se usa el catálogo real de estados para filtrar proyectos activos. |
| RF-20 / CU-12 | Tareas por proyecto para contexto del dashboard | `ong.tareas` | Soporta métricas de agenda y operación. |
| RF-21 / CU-13 | Actividades por tarea | `ong.actividades`, `ong.tareas` | Lista reciente, detalle y búsqueda. |
| RF-22 / CU-14 | Asignaciones de actividad | `ong.asignaciones_actividad`, `ong.voluntarios` | Se usa para contar voluntarios asignados y resolver nombres. |
| RF-23 / CU-15 | Evidencias por actividad | `ong.evidencias_actividad` | Se usa para la métrica de evidencias y el detalle de actividad. |
| RF-25 / CU-17/18 | Horas y aprobación | `ong.horas_actividad`, `public.profiles` | La aprobación real se resuelve contra `estado_aprobacion` y `aprobado_por`. |
| RF-28 / CU-21 | Solicitudes de admisión | `rrhh.solicitudes_admision` | Lista, detalle y resolución de solicitudes. |
| RF-29 / CU-22 | Historial de estado de admisión | `rrhh.admision_estado_historial`, `public.profiles` | Se usa para trazabilidad del cambio de estado. |

## Archivos impactados

- `src/app/modules/home/types.ts`
- `src/app/modules/home/homeShared.ts`
- `src/app/modules/home/homeDashboardService.ts`
- `src/app/modules/home/useDashboardData.ts`
- `src/app/pages/Dashboard.tsx`

Revisados sin cambios porque ya estaban alineados con esquema explícito:
- `src/app/modules/home/homeSearchService.ts`
- `src/app/pages/GlobalSearch.tsx`

## Consultas legacy corregidas

- Se eliminó cualquier dependencia funcional de `aprobaciones`.
- La métrica antes asociada a aprobaciones ahora se resuelve con `ong.horas_actividad.estado_aprobacion = 'pendiente'`.
- Las consultas a `profiles` quedaron explícitas contra `public.profiles`.
- Las consultas de admisión y operación usan explícitamente `schema("rrhh")` y `schema("ong")`.

## Bloqueos documentados

### Tabla inexistente en scripts
`aprobaciones` no aparece en los scripts documentales del repositorio. Por eso no se usa para métricas, detalle ni resolución.

### Campo no documentado en horas
`ong.horas_actividad` no documenta un campo persistente de comentario para la resolución de horas. Resultado:
- el dashboard muestra el estado y el aprobador real,
- la resolución de horas actualiza `estado_aprobacion`, `aprobado_por` y `updated_by`,
- el comentario de horas no se persiste porque no existe columna documental para hacerlo.

### Consecuencia funcional
- La búsqueda global y el dashboard quedan operativos contra tablas reales.
- La métrica de pendientes se mantiene, pero solo como conteo de horas en estado `pendiente`.
- No se inventa un flujo paralelo para comentarios de horas.

## Notas de compatibilidad

- No se tocó `src/lib/db/**`, `src/supabaseClient.ts`, `src/app/routes.tsx` ni `src/app/components/layout/**`.
- No se usaron mocks ni datos simulados.
- La UI existente se preservó, ajustando solo textos y flujos que dependían de la tabla no documentada.
