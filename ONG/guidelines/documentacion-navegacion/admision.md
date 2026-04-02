# Admision

Dominio auditado: `src/app/modules/admission/**`, `src/app/services/admision/**`, `src/app/pages/AdmissionRequests.tsx`, `src/app/pages/AdmissionDocuments.tsx`, `src/app/pages/AdmissionInterviews.tsx`, `src/app/pages/AdmissionOnboarding.tsx`.

Fuentes revisadas para el anclaje de esquema:
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG mÃ³dulos complementarios.txt`
- `guidelines/BD/Parte 3- Script maestro documental de ONG mÃ³dulos complementarios.txt`
- `guidelines/ONGDiccionarioRF.md`

## Mapa RF/CU -> schema.table

| RF / CU | Flujo de Admision | schema.table reales | Observacion |
| --- | --- | --- | --- |
| RF-28 / CU-21 | Solicitud de admision | `rrhh.solicitudes_admision` | Fuente real de expedientes. Se usa `tenant_id`, `estado`, `fecha_solicitud`, `notas`, `created_at`, `updated_at`, `created_by`, `updated_by`. |
| RF-29 / CU-22 | Documentos de admision | `rrhh.documentos_admision`, `public.cat_tipos_documento` | Documentos por solicitud con verificacion booleana. El catalogo de tipos se resuelve desde `public`. |
| RF-30 / CU-23 | Entrevistas de admision | `rrhh.entrevistas_admision`, `public.profiles` | `entrevistador_id` se resuelve contra perfiles del tenant para etiquetas de UI. |
| RF-31 / CU-24 | Onboarding por pasos | `rrhh.onboarding_pasos`, `rrhh.onboarding_voluntario`, `ong.voluntarios` | Los pasos se cargan desde `rrhh`; el progreso solo existe si hay un voluntario real vinculado por email. |
| RF-32 / CU-25 | Conversion a voluntario | `ong.voluntarios`, `rrhh.solicitudes_admision`, `rrhh.admision_estado_historial` | Se crea o actualiza el voluntario por `tenant_id + tipo_documento + numero_documento` y se deja historia de estado. |
| RF-33 | KPIs de admision | `rrhh.solicitudes_admision`, `ong.voluntarios` | KPIs derivados de solicitudes reales y vinculacion por email. |

## Archivos impactados

- `src/app/services/admision/solicitudesAdmision.service.ts`
- `src/app/modules/admission/types.ts`
- `src/app/modules/admission/hooks/useSolicitudesAdmision.ts`
- `src/app/pages/AdmissionRequests.tsx`

## Consultas legacy corregidas

- Se reemplazo el acceso implicito a schema por consultas explicitas con `schema("rrhh")`, `schema("ong")` y `schema("public")` solo en catalogos globales.
- Se elimino el uso de campos legacy que no existen en la BD nueva: `dni`, `phone`, `source`, `observation`, `createdVolunteerId`, `statusId`.
- La conversion ya no asume una tabla monolitica en `public`; usa `ong.voluntarios` con claves reales del esquema.

## Huecos documentados

- `rrhh.solicitudes_admision` no expone `dni`, `telefono` ni `source`. Esos campos fueron retirados de la UI porque no tienen respaldo real.
- No existe llave foranea directa desde `rrhh.solicitudes_admision` hacia `ong.voluntarios`. La vinculacion se resuelve por email exacto cuando existe un voluntario real; si no existe, el onboarding queda sin resolver.
- `rrhh.documentos_admision` no documenta `verified_by` ni `verified_at`. Solo existe `verificado` booleano.
- `rrhh.entrevistas_admision` no documenta `puntaje`. El flujo solo persiste fecha, entrevistador, resultado y comentarios.
- `rrhh.onboarding_voluntario` no documenta evidencia adjunta ni borrado logico. El progreso es booleano por paso.

## Notas de validacion

- La UI mantiene el shell actual y los modales existentes.
- No se usan mocks ni datos simulados.
- Los listados esconden registros eliminados solo donde la tabla real lo permite; en `rrhh` no se implemento delete logico porque las tablas no lo documentan.

