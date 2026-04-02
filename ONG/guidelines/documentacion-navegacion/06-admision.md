# Modulo Admision

## Objetivo
- Operar solicitudes, documentos, entrevistas y onboarding contra la BD multi-schema real.
- Conectar la conversion de solicitudes con `ong.voluntarios` sin mocks ni arrays fake.
- Cerrar los campos agregados por la migracion de Parte 4: `verified_by`, `verified_at`, `puntaje`, `id_voluntario_vinculado` y `evidencia_url`.

## Fuentes auditadas
- `AGENTS.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/documentacion-navegacion/04-personas.md`

## Paginas afectadas
- `src/app/pages/AdmissionRequests.tsx`
- `src/app/pages/AdmissionDocuments.tsx`
- `src/app/pages/AdmissionInterviews.tsx`
- `src/app/pages/AdmissionOnboarding.tsx`

## Hooks y services afectados
- `src/app/modules/admission/types.ts`
- `src/app/modules/admission/hooks/useSolicitudesAdmision.ts`
- `src/app/modules/admission/hooks/useAdmissionReferenceCatalogs.ts`
- `src/app/modules/admission/hooks/useDocumentosAdmision.ts`
- `src/app/modules/admission/hooks/useEntrevistasAdmision.ts`
- `src/app/modules/admission/hooks/useOnboardingAdmision.ts`
- `src/app/services/admision/solicitudesAdmision.service.ts`

## Tablas, RPCs y esquemas reales
- `rrhh.solicitudes_admision`
- `rrhh.documentos_admision`
- `rrhh.entrevistas_admision`
- `rrhh.onboarding_pasos`
- `rrhh.onboarding_voluntario`
- `rrhh.admision_estado_historial`
- `rrhh.codigos_registro_voluntario`
- `rrhh.fn_generate_registration_code`
- `ong.voluntarios`
- `ong.estados_voluntario`
- `public.cat_tipos_documento`
- `public.cat_generos`
- `public.cat_paises`
- `public.profiles`

## Contrato post-migracion aplicado
- `rrhh.documentos_admision` ahora expone y persiste `verified_by` y `verified_at`.
- `rrhh.entrevistas_admision` ahora expone y persiste `puntaje`.
- `rrhh.solicitudes_admision` ahora guarda `id_voluntario_vinculado` y la UI lo diferencia de una coincidencia solo por correo.
- `rrhh.onboarding_voluntario` ahora expone y persiste `evidencia_url`.
- `rrhh.onboarding_voluntario` usa soft delete (`is_deleted`, `deleted_at`, `deleted_by`) y las lecturas operativas excluyen eliminados.

## Acciones implementadas
- `Solicitudes`: listar, ver detalle, crear, editar, cambiar estado, generar codigo de registro y convertir a voluntario.
- `Solicitudes`: la conversion ahora sincroniza `id_voluntario_vinculado` en `rrhh.solicitudes_admision`.
- `Solicitudes`: el modal de codigo ahora entrega un enlace publico completo `/landing/register?tenant=<uuid>&code=<codigo>` para consumo controlado.
- `Documentos`: listar por solicitud, crear, editar y eliminar, mostrando verificador y fecha de verificacion.
- `Entrevistas`: listar por solicitud, crear, editar y eliminar, mostrando `puntaje`.
- `Onboarding`: listar pasos por solicitud convertida o enlazada, iniciar onboarding, actualizar estado del paso y guardar `evidencia_url`.
- `Registro por codigo`: pantalla publica/controlada en `src/app/pages/landing/VolunteerRegistrationPage.tsx` con validacion previa del codigo, captura de perfil y documentos del postulante.
- `Registro por codigo`: backend real en `supabase/functions/consume-volunteer-registration-code/index.ts` para preview y consumo del codigo, usando `rrhh.codigos_registro_voluntario`, `rrhh.registro_documentos_postulante`, `public.profiles`, `auth.users` y `ong.voluntarios`.

## Reglas aplicadas
- Todas las consultas usan schema explicito: `supabase.schema("rrhh")`, `supabase.schema("ong")` o `supabase.schema("public")`.
- Se respeta `tenant_id` resolviendo el tenant actual con `public.fn_current_tenant_id()`.
- `rrhh.onboarding_voluntario` excluye filas soft deleted por defecto.
- La conversion reutiliza coincidencia por documento o email antes de insertar y luego escribe el vinculo directo en la solicitud.
- La emision de codigos usa `rrhh.fn_generate_registration_code` y persiste en `rrhh.codigos_registro_voluntario`.
- El consumo del codigo NO usa frontend privilegiado ni service-role en browser; se resuelve por Edge Function segura porque el repositorio no expone `rrhh.fn_consume_registration_code`.
- Los documentos del postulante se persisten en `rrhh.registro_documentos_postulante`; si existe bucket configurado, la Edge Function sube el archivo y guarda `archivo_url`, y si no existe bucket exige URL manual.
- La vinculacion final sincroniza `auth.users`, `public.profiles`, `ong.voluntarios` y `rrhh.solicitudes_admision.id_voluntario_vinculado` cuando corresponde.

## Riesgos y limites
- `rrhh.documentos_admision` y `rrhh.entrevistas_admision` no exponen soft delete documentado; la baja sigue el contrato real mediante `DELETE`.
- El alta a voluntario depende de los catalogos y constraints realmente expuestos en la BD.
- `rrhh.fn_consume_registration_code` no aparece en los scripts ni tipos auditados del repositorio; el consumo se implemento por Edge Function `consume-volunteer-registration-code` para no inventar una RPC SQL inexistente.
- Si el bucket de documentos no esta configurado en el runtime de la Edge Function, el flujo sigue operativo solo con `archivo_url` manual.
