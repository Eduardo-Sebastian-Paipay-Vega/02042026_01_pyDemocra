# 1. Nombre del modulo
- `Personas`

## 2. Objetivo del modulo
- Gestionar `Voluntarios`, `Credenciales ID`, `Beneficiarios` y `Ficha medica sensible` con servicios reales sobre la BD multi-schema del tenant actual.
- Mantener el flujo `page -> hook -> service -> Supabase` definido en `AGENTS.md`.
- Evitar mocks, arrays hardcodeados y lecturas implicitas sobre `public`.

## 3. Estado funcional actual
- `Voluntarios` (`/admin/volunteers`): implementado con listar, ver detalle, crear, editar y desactivacion logica.
- `Credenciales ID` (`/admin/id-cards`): implementado con listar, ver detalle, crear, editar y revocar; incluye gestion de plantillas, coordenadas de campos, canvas de render y exportacion PNG.
- `Beneficiarios` (`/admin/beneficiaries`): implementado con listar, ver detalle, crear y editar.
- `Ficha medica sensible` (`/admin/medical-records`): implementada para beneficiarios y voluntarios con acceso guiado, detalle y edicion condicionada por acceso sensible.

## 4. RF/CU usados
- `RF-08`, `RF-09`, `RF-10` y `CU-03`, `CU-04`, `CU-05` para voluntarios, roles, habilidades y credencial del voluntariado.
- `RF-13`, `RF-14` y `CU-06` para beneficiarios y perfiles especificos.
- `RF-15` y `CU-07` para fichas medicas y datos sensibles con acceso reforzado.
- Fuente funcional: `guidelines/ONGDiccionarioRF.md`.

## 5. Scripts y documentos auditados
- `AGENTS.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/ONGDiccionarioRF.md`

## 6. Paginas afectadas
- `src/app/pages/Volunteers.tsx`
- `src/app/pages/IdCards.tsx`
- `src/app/pages/Beneficiaries.tsx`
- `src/app/pages/MedicalRecords.tsx`
- `src/app/routes.tsx`
- `src/app/components/layout/Sidebar.tsx`
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/ui/command-palette.tsx`

## 7. Hooks afectados
- `src/app/modules/people/hooks/useVolunteers.ts`
- `src/app/modules/people/hooks/useVolunteerDetail.ts`
- `src/app/modules/people/hooks/useVolunteerMutations.ts`
- `src/app/modules/people/hooks/useIdCards.ts`
- `src/app/modules/people/hooks/useIdCardTemplateDetail.ts`
- `src/app/modules/people/hooks/useIdCardDetail.ts`
- `src/app/modules/people/hooks/useIdCardMutations.ts`
- `src/app/modules/people/hooks/useBeneficiaries.ts`
- `src/app/modules/people/hooks/useBeneficiaryDetail.ts`
- `src/app/modules/people/hooks/useBeneficiaryMutations.ts`
- `src/app/modules/people/hooks/useMedicalRecords.ts`
- `src/app/modules/people/hooks/useMedicalRecordDetail.ts`
- `src/app/modules/people/hooks/useMedicalRecordMutations.ts`

## 8. Services afectados
- `src/app/services/personas/shared.ts`
- `src/app/services/personas/volunteers.service.ts`
- `src/app/services/personas/idCards.service.ts`
- `src/app/services/personas/beneficiaries.service.ts`
- `src/app/services/clinico/medicalRecords.service.ts`

## 9. Componentes del modulo
- `src/app/modules/people/components/VolunteerPanels.tsx`
- `src/app/modules/people/components/IdCardPanels.tsx`
- `src/app/modules/people/components/IdCardTemplatePanels.tsx`
- `src/app/modules/people/components/IdCardCardPanels.tsx`
- `src/app/modules/people/components/IdCardCanvasPreview.tsx`
- `src/app/modules/people/components/BeneficiaryPanels.tsx`
- `src/app/modules/people/components/MedicalRecordPanels.tsx`
- `src/app/modules/people/components/people-shared.tsx`

## 10. Tipos y helpers afectados
- `src/app/modules/people/types.ts`
- `src/app/modules/people/idCardShared.ts`
- `src/app/modules/people/idCardCanvas.ts`
- `src/lib/db/ong/app-database.ts`

## 11. Tablas reales y schema.table
- `ong.voluntarios`
- `ong.id_card_templates`
- `ong.id_card_template_fields`
- `ong.id_cards`
- `ong.beneficiarios`
- `ong.estados_voluntario`
- `rrhh.habilidades`
- `rrhh.voluntario_habilidades`
- `rrhh.documentos_voluntario`
- `rrhh.roles_operativos`
- `rrhh.asignaciones_rol`
- `rrhh.perfil_coordinador`
- `clinico.fichas_medicas`
- `clinico.perfil_nino`
- `clinico.perfil_adulto_mayor`
- `clinico.ficha_sensible_voluntario`
- `clinico.accesos_sensibles_log`
- `public.cat_tipos_documento`
- `public.cat_generos`
- `public.cat_paises`
- `public.profiles`
- `public.roles`
- `public.user_roles_sedes`
- `public.role_permissions`
- `public.sedes`

## 12. Fuente de schema y columnas verificadas
- `ong.id_card_templates`, `ong.id_card_template_fields`, `ong.id_cards`: `guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt`, bloque `9) ID CARDS`.
- Permisos `idcards.read` e `idcards.manage`: mismo script, bloque de permisos inicial.
- Flujo QR de asistencias que consume `ong.id_cards.qr_payload` con `estado='activa'`: mismo script, bloque `fn_register_attendance_scan`.
- `ong.voluntarios` y `ong.beneficiarios`: `guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt`.
- Permisos core y funciones RBAC: `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`.

## 13. Columnas relevantes usadas
- `ong.voluntarios`: `iam_user_id`, `numero_documento`, `tipo_documento`, `nombre`, `apellido`, `ruta_foto`, `codigo_estado`, `email`, `telefono`, `created_by`, `updated_by`.
- `ong.id_card_templates`: `nombre`, `base_image_url`, `template_width`, `template_height`, `activa`, `created_by`, `updated_by`.
- `ong.id_card_template_fields`: `id_template`, `field_key`, `pos_x`, `pos_y`, `width`, `height`, `font_size`, `font_family`, `font_weight`, `color_hex`, `z_index`.
- `ong.id_cards`: `id_voluntario`, `id_template`, `card_code`, `qr_payload`, `issued_at`, `expires_at`, `estado`, `image_render_url`, `created_by`, `updated_by`.
- `ong.beneficiarios`: `numero_documento`, `tipo_documento`, `codigo_pais`, `nombre`, `apellido`, `fecha_nacimiento`, `genero`, `telefono`, `direccion`, `foto_url`, `observaciones`, `created_by`, `updated_by`.
- `clinico.fichas_medicas`: `tipos_sangre`, `alergias`, `condiciones_preexistentes`, `medicacion_actual`.
- `clinico.ficha_sensible_voluntario`: `condiciones_medicas`, `contacto_emergencia`, `telefono_emergencia`.

## 14. Decisiones de modelado y mapeo
- `Voluntarios` usa `supabase.schema("ong").from("voluntarios")` porque la tabla vive en `ong`, no en `public`.
- `Credenciales ID` usa `supabase.schema("ong").from("id_card_templates")`, `supabase.schema("ong").from("id_card_template_fields")` y `supabase.schema("ong").from("id_cards")` porque el script de Parte 4 ubica el submodulo completo en `ong`.
- La plantilla persiste siempre los cinco `field_key` reales del CHECK SQL: `foto`, `nombre`, `dni`, `codigo`, `qr`.
- El render PNG se resuelve en cliente con canvas real; no se invento backend paralelo ni motor adicional de composicion.
- `ong.id_cards` no documenta soft delete. La accion operativa equivalente es `revocar`, persistiendo `estado='revocada'`.
- `Beneficiarios` se conecta a `ong.beneficiarios` y sus perfiles especificos a `clinico.perfil_nino` y `clinico.perfil_adulto_mayor`.

## 15. Reglas de acceso sensible y RBAC
- El detalle y la edicion sensible requieren motivo de acceso en UI.
- `Ficha medica sensible` usa `public.fn_is_tenant_admin()` y `public.fn_has_permission('clinico.volunteer_sensitive.read')`.
- `Credenciales ID` valida `public.fn_has_permission('idcards.read')`, `public.fn_has_permission('idcards.manage')` y `public.fn_is_tenant_admin()`.
- La UI de gestion se oculta o bloquea cuando falta `idcards.manage`, pero la lectura puede seguir habilitada con `idcards.read`.

## 16. Tenant, RLS y auditoria
- Todas las consultas del modulo aplican `tenant_id` explicito con `createTenantScopedQuery(...).eq("tenant_id", tenantId)`.
- La resolucion del tenant usa `public.fn_current_tenant_id()`.
- Se preservan `created_by` y `updated_by` en inserts y updates.
- `Voluntarios` usa desactivacion logica por `codigo_estado`.
- `Credenciales ID` preserva trazabilidad de alta, actualizacion y revocacion en las tablas reales.

## 17. Dependencias con otros modulos
- `Operacion`: el escaneo QR de asistencias depende de `ong.id_cards.qr_payload` y `estado='activa'`.
- `Configuracion / IAM`: `public.profiles`, `public.roles`, `public.user_roles_sedes`, `public.role_permissions`.
- `Landing / Admision`: el alta por codigo unico puede terminar vinculando `ong.voluntarios.iam_user_id`, que luego se reutiliza en Personas.

## 18. Pendientes reales
- Consolidar en Gobernanza la lectura de `clinico.accesos_sensibles_voluntario_log`.
- Disenar, si negocio lo confirma, una bitacora de acceso sensible especifica para `clinico.ficha_sensible_voluntario`.
- Si negocio necesita historico de multiples credenciales por voluntario, habra que revisar el `UNIQUE (tenant_id, id_voluntario)` existente en `ong.id_cards`; el frontend actual respeta esa restriccion 1:1.

## 19. Riesgos
- La exportacion PNG depende de que `base_image_url` y `ruta_foto` permitan carga segura al canvas; si la imagen remota falla, el renderer degrada a placeholder visual.
- `src/lib/db/ong/types.ts` sigue siendo compatibilidad legacy; el modulo Personas usa `src/lib/db/ong/app-database.ts` como fuente tipada vigente.
- No existe soft delete documental para `ong.id_cards`; la revocacion es la accion de negocio disponible.

## 20. Validacion tecnica
- `npm run build` ejecutado el `2026-03-26` en `America/Lima`: compilacion satisfactoria.
