# Personas / Proyectos / Salud

## Auditoría inicial
- Documentos base revisados: `AGENTS.md`, `guidelines/ONGDiccionarioRF.md`, `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`, `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`, `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`.
- UI auditada: `src/app/pages/Volunteers.tsx`, `src/app/pages/Projects.tsx`, `src/app/pages/MedicalRecords.tsx`.
- Servicios añadidos para salir de mocks/hardcodes: `src/app/services/personas/volunteers.service.ts`, `src/app/services/proyectos/projects.service.ts`, `src/app/services/clinico/medicalRecords.service.ts`.
- Mocks detectados y retirados de la navegación de este dominio: `fetchOngVolunteersPreview`/`fetchOngVolunteerStates`, `mockProjects`, `mockMedicalRecords`.
- No se tocó `src/lib/db/**`, `src/supabaseClient.ts`, `src/app/routes.tsx` ni `src/app/components/layout/**`.

## Mapa RF/CU -> schema.table
| RF/CU | Flujo del dominio | schema.table reales |
| --- | --- | --- |
| RF-08 / CU-03 / CU-04 | Registro, lectura y actualización lógica de voluntarios | `ong.voluntarios`, `ong.estados_voluntario`, `ong.horas_actividad`, `public.cat_tipos_documento`, `public.cat_generos`, `public.cat_paises` |
| RF-15 / CU-07 | Ficha médica sensible con lectura restringida | `clinico.ficha_sensible_voluntario` |
| RF-17 / CU-09 | Lectura y gestión lógica de proyectos | `ong.proyectos`, `ong.areas`, `ong.estados_proyecto`, `ong.asignaciones_proyecto`, `ong.voluntarios` |
| RF-18 / CU-10 | Asignación de voluntarios a proyecto como dato de detalle | `ong.asignaciones_proyecto`, `ong.voluntarios`, `ong.proyectos` |

## Consultas legacy corregidas
- `Volunteers.tsx` dejó de depender de helpers antiguos desde `supabaseClient.ts` y ahora usa `ong.voluntarios` + catálogos reales.
- `Projects.tsx` dejó de usar `mockProjects` y ahora consulta `ong.proyectos`, `ong.areas`, `ong.estados_proyecto` y `ong.asignaciones_proyecto`.
- `MedicalRecords.tsx` dejó de usar `mockMedicalRecords` y ahora consulta `clinico.ficha_sensible_voluntario` con referencia real a `ong.voluntarios`.

## Archivos impactados
- `src/app/pages/Volunteers.tsx`
- `src/app/pages/Projects.tsx`
- `src/app/pages/MedicalRecords.tsx`
- `src/app/services/personas/volunteers.service.ts`
- `src/app/services/proyectos/projects.service.ts`
- `src/app/services/clinico/medicalRecords.service.ts`
- `guidelines/documentacion-navegacion/personas-proyectos-salud.md`

## Riesgos y bloqueos
- `clinico.accesos_sensibles_log` existe en los scripts, pero está relacionado a `clinico.fichas_medicas`, no a `clinico.ficha_sensible_voluntario`. Por eso el acceso sensible de voluntarios quedó en lectura real con gate de UI, pero sin persistir un log de acceso en esta iteración.
- Los listados y detalles ya son reales, pero el CRUD completo de crear/editar no se implementó en este submódulo porque el objetivo priorizado fue quitar mocks, conectar lectura real y dejar acciones seguras.
- Las acciones lógicas implementadas son: desactivar voluntario y archivar proyecto. Ambas usan catálogos reales de estado.

## Resultado operativo
- Voluntarios: listado real, detalle real y desactivación lógica.
- Proyectos: listado real, detalle real y archivo lógico.
- Salud: listado real de fichas sensibles, gate de acceso y detalle real sin mock.
