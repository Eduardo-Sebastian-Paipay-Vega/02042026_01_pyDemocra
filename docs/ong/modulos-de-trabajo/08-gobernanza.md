# 1. Nombre del modulo
- `Gobernanza`

## 2. Objetivo del modulo
- Reemplazar los placeholders de `/admin/catalogs`, `/admin/audit-log`, `/admin/sensitive-access` y `/admin/soft-delete` por vistas operativas conectadas a la BD real multi-esquema.
- Exponer catalogos reales solo desde tablas verificadas en scripts, consultar auditoria real desde `public.audit_logs` y `auditoria.audit_log`, monitorear accesos sensibles con `clinico.accesos_sensibles_log` y `clinico.accesos_sensibles_voluntario_log`, y administrar restricciones reales con `public.role_access_constraints`.
- Exponer restore real solo sobre la whitelist documental de tablas con `is_deleted`, `deleted_at` y `deleted_by`, y leer la ventana de retencion desde `public.tenants` + `public.plan_policies` cuando el Core lo permite.

## 3. Submodulos incluidos
- `Catalogos` (`/admin/catalogs`): implementado como explorador de catalogos reales, con listado y detalle.
- `Auditoria` (`/admin/audit-log`): implementado como visor consolidado de bitacoras reales.
- `Accesos sensibles` (`/admin/sensitive-access`): implementado con log sensible real de beneficiarios y voluntarios, y CRUD de restricciones por rol.
- `Retencion y borrado` (`/admin/soft-delete`): implementado como visor de soporte real, ventana de retencion y restore whitelist sobre tablas con soft delete documental.

## 4. RF/CU usados
- `RF-07`: catalogos normalizados desde `public`, `ong`, `rrhh` y `comunicaciones`.
- `RF-05 / CU-32`: revision de bitacora de cambios desde `public.audit_logs` y `auditoria.audit_log`.
- `RF-04 / CU-33`: revision de accesos sensibles desde `clinico.accesos_sensibles_log` y `clinico.accesos_sensibles_voluntario_log`.
- `RF-03`: controles reales de acceso usando `public.fn_has_permission()`, `public.fn_is_tenant_admin()` y `public.role_access_constraints`.
- `RF-06`: validacion del soporte real de soft delete / retencion; el modulo solo expone restore donde Parte 4 documento columnas de soft delete.

## 5. Rutas o paginas impactadas
- `src/app/routes.tsx`
- `src/app/pages/Catalogs.tsx`
- `src/app/pages/AuditLog.tsx`
- `src/app/pages/SensitiveAccess.tsx`
- `src/app/pages/SoftDelete.tsx`

## 6. Layouts o componentes relevantes
- `src/app/components/layout/AppShell.tsx`
- `src/app/components/shared/PageHeader.tsx`
- `src/app/components/shared/FilterBar.tsx`
- `src/app/components/shared/DataTable.tsx`
- `src/app/components/ui/modal-shell.tsx`
- `src/app/components/ui/status-dot.tsx`
- `src/app/modules/governance/components/governance-shared.tsx`

## 7. Hooks afectados
- `src/app/modules/governance/hooks/useGovernanceCatalogs.ts`
- `src/app/modules/governance/hooks/useGovernanceAuditLog.ts`
- `src/app/modules/governance/hooks/useSensitiveAccess.ts`
- `src/app/modules/governance/hooks/useRoleAccessConstraints.ts`
- `src/app/modules/governance/hooks/useGovernanceRetention.ts`
- `src/app/modules/governance/hooks/useGovernanceRestore.ts`

## 8. Services afectados
- `src/app/services/gobernanza/shared.ts`
- `src/app/services/gobernanza/catalogs.service.ts`
- `src/app/services/gobernanza/audit.service.ts`
- `src/app/services/gobernanza/sensitiveAccess.service.ts`
- `src/app/services/gobernanza/retention.service.ts`

## 9. Tipos o modelos TS afectados
- `src/app/modules/governance/types.ts`
- `src/lib/db/ong/app-database.ts`

## 10. Tablas reales y esquemas usados
- `public.cat_permissions`
- `public.cat_tipos_documento`
- `public.cat_generos`
- `public.cat_paises`
- `public.cat_monedas`
- `public.cat_module_statuses`
- `public.roles`
- `public.role_permissions` mediante `public.fn_has_permission()`
- `public.user_roles_sedes` mediante `public.fn_has_permission()` y `public.fn_is_tenant_admin()`
- `public.role_access_constraints`
- `public.sedes`
- `public.audit_logs`
- `public.tenants`
- `public.plan_policies`
- `ong.estados_voluntario`
- `ong.unidades_medida`
- `ong.estados_objeto`
- `ong.estados_proyecto`
- `ong.tipo_transaccion_inventario`
- `ong.beneficiarios`
- `ong.voluntarios`
- `ong.asistencias`
- `ong.asignaciones_actividad`
- `ong.recursos_proyecto`
- `rrhh.habilidades`
- `rrhh.onboarding_voluntario`
- `clinico.fichas_medicas`
- `clinico.accesos_sensibles_log`
- `clinico.ficha_sensible_voluntario`
- `clinico.accesos_sensibles_voluntario_log`
- `comunicaciones.canales_notificacion`
- `auditoria.audit_log`

## 11. Columnas relevantes consumidas o escritas
- `public.cat_permissions`: `id`, `description`, `module`, `created_at`.
- `public.roles`: `id`, `tenant_id`, `name`, `hierarchy_level`, `is_system_role`, `created_at`, `updated_at`.
- `public.role_access_constraints`: `id`, `tenant_id`, `role_id`, `sede_id`, `ip_cidr`, `time_start`, `time_end`, `require_trusted_device`, `created_at`.
- `public.sedes`: `id`, `tenant_id`, `name`, `is_active`.
- `public.audit_logs`: `id`, `tenant_id`, `schema_name`, `table_name`, `operation`, `record_pk`, `old_data`, `new_data`, `changed_by`, `created_at`.
- `public.tenants`: `id`, `plan_id`, `name`, `status_financial_id`.
- `public.plan_policies`: `plan_id`, `retention_days`, `max_sedes`, `max_licenses`, `can_use_terminals`.
- `clinico.fichas_medicas`: `id`, `id_beneficiario`.
- `clinico.accesos_sensibles_log`: `id`, `tenant_id`, `id_ficha`, `usuario_id`, `motivo`, `fecha_acceso`, `created_at`.
- `clinico.ficha_sensible_voluntario`: `id`, `tenant_id`, `id_voluntario`.
- `clinico.accesos_sensibles_voluntario_log`: `id`, `tenant_id`, `id_ficha_voluntario`, `usuario_id`, `motivo`, `ip`, `user_agent`, `fecha_acceso`, `created_at`.
- `ong.asistencias`: `id`, `tenant_id`, `id_actividad`, `id_voluntario`, `fecha_operacion`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_deleted`.
- `ong.asignaciones_actividad`: `id`, `tenant_id`, `id_actividad`, `id_voluntario`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_deleted`.
- `ong.recursos_proyecto`: `id`, `tenant_id`, `id_proyecto`, `id_item`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_deleted`.
- `rrhh.onboarding_voluntario`: `id`, `tenant_id`, `id_voluntario`, `id_paso`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`, `is_deleted`.
- `comunicaciones.canales_notificacion`: `codigo`, `nombre`.
- `auditoria.audit_log`: `id_audit`, `tenant_id`, `table_name`, `record_pk`, `action`, `before_json`, `after_json`, `auth_user_id`, `event_at`, `ip`, `user_agent`, `correlation_id`, `source`.

## 12. Fuente de schema y permisos verificados
- `public.cat_permissions`, `public.roles`, `public.role_permissions`, `public.user_roles_sedes`, `public.role_access_constraints`, `public.audit_logs`, `public.tenants`, `public.plan_policies`, `public.fn_has_permission()` y `public.fn_is_tenant_admin()` se validaron contra `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`.
- Los permisos nuevos `governance.catalogs.read`, `governance.audit.read`, `governance.sensitive.read`, `governance.retention.read`, `settings.roles.read` y `settings.roles.manage` se validaron contra `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- `public.audit_logs` se usa porque el Core crea la tabla y restringe escritura directa al cliente con `REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated`.
- `ong.estados_voluntario`, `ong.unidades_medida`, `ong.estados_objeto`, `ong.estados_proyecto`, `ong.tipo_transaccion_inventario`, `rrhh.habilidades`, `clinico.accesos_sensibles_log`, `clinico.ficha_sensible_voluntario`, `comunicaciones.canales_notificacion` y `auditoria.audit_log` se validaron contra `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`.
- `clinico.accesos_sensibles_voluntario_log`, `ong.asistencias`, `ong.asignaciones_actividad`, `ong.recursos_proyecto` y `rrhh.onboarding_voluntario` con soft delete se validaron contra `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.

## 13. Reglas de auditoria / soft delete / sensibilidad
- `Catalogos` exige `governance.catalogs.read` o tenant admin.
- `Auditoria` solo lee `public.audit_logs` y `auditoria.audit_log`; no intenta insertar ni editar eventos.
- `Accesos sensibles` respeta RBAC del Core: la lectura del log sensible depende de `governance.sensitive.read` o tenant admin; se mantiene compatibilidad con `iam.audit.read` mientras migra el RBAC legacy.
- `role_access_constraints` se lee/escribe con `settings.roles.read` y `settings.roles.manage` como contrato principal, manteniendo fallback legacy donde aun exista `iam.user_roles.manage`.
- `Accesos sensibles` consolida `clinico.accesos_sensibles_log` y `clinico.accesos_sensibles_voluntario_log`; la UI no expone el contenido de las fichas, solo la bitacora.
- `Soft delete / retencion` solo implementa restore sobre la whitelist `ong.asistencias`, `ong.asignaciones_actividad`, `ong.recursos_proyecto` y `rrhh.onboarding_voluntario`; si otra tabla no documenta `is_deleted`, `deleted_at`, `deleted_by`, no se expone restore.
- Mientras el Core no publique un permiso de restore dedicado, la accion queda limitada a tenant admin.

## 14. Acciones implementadas
- `Catalogos`:
  - listar catalogos reales disponibles para Gobernanza.
  - mostrar conteo por catalogo cuando la API devuelve `count`.
  - buscar dentro del catalogo seleccionado.
  - abrir detalle por registro.
- `Auditoria`:
  - filtrar por esquema, tabla, operacion, actor y fecha.
  - consolidar `public.audit_logs` y `auditoria.audit_log`.
  - abrir detalle con `before/after` en JSON.
  - degradar con warning si una de las fuentes no esta expuesta.
- `Accesos sensibles`:
  - listar eventos reales de `clinico.accesos_sensibles_log`.
  - listar eventos reales de `clinico.accesos_sensibles_voluntario_log`.
  - filtrar por actor y fecha.
  - abrir detalle del evento.
  - listar restricciones reales desde `public.role_access_constraints`.
  - crear restriccion.
  - editar restriccion.
  - eliminar restriccion.
- `Retencion y borrado`:
  - leer la ventana real de retencion por plan.
  - exponer el estado real del soporte documental.
  - listar registros soft deleted restaurables en whitelist.
  - restaurar registros whitelisted cuando el usuario es tenant admin.
  - listar eventos `DELETE` auditados.
  - bloquear restore fuera de whitelist y documentar el motivo exacto.

## 15. Validaciones funcionales y tecnicas
- Toda consulta multi-tenant nueva aplica `tenant_id` explicito o reutiliza RLS con `public.fn_current_tenant_id()`.
- Los services nuevos usan `schema("public")`, `schema("ong")`, `schema("rrhh")`, `schema("clinico")`, `schema("comunicaciones")` y `schema("auditoria")` de forma explicita; no quedan accesos implicitos a `public` en este modulo.
- Las restricciones validan:
  - rol obligatorio.
  - horario completo `inicio/fin`.
  - `time_end > time_start`.
  - formato basico de `ip_cidr`.
- El restore valida:
  - `governance.retention.read` para lectura.
  - tenant admin como requisito de mutacion mientras no exista permiso dedicado.
  - tabla incluida en whitelist.
  - registro real con `is_deleted = true`.
- Las pantallas implementan `loading`, `empty`, `error` y `retry`.
- El modulo no introduce mocks, arrays fake de datos operativos ni placeholders visuales.

## 16. Pendientes reales
- No existe CRUD documental para los catalogos expuestos en `Catalogos`; la vista queda en modo consulta/detalle.
- No existe un permiso core dedicado para mutar restore; la accion queda restringida a tenant admin hasta que el Core publique ese contrato.
- No existe papelera generica ni restore transversal fuera de la whitelist con soft delete documental.

## 17. Riesgos
- `public.audit_logs` y `auditoria.audit_log` representan dos contratos de auditoria distintos; si una fuente queda fuera del schema cache o de la API, la pagina mostrara solo la otra y lo advertira.
- `public.tenants` y `public.plan_policies` no estaban tipadas en el contrato frontend anterior; si el Core cambia esas tablas y no se resincroniza `app-database.ts`, la vista de retencion puede degradar a warning.
- El control RBAC fino depende de RPC del Core (`fn_has_permission`, `fn_is_tenant_admin`); mientras coexistan permisos legacy y nuevos, la UI puede mostrar warnings de compatibilidad hasta cerrar la migracion de roles.

## 18. Decisiones tomadas
- Se mantuvieron las rutas existentes de Sidebar y AppShell; solo se reemplazaron los placeholders de routing.
- `Catalogos` no fuerza un CRUD inexistente sobre tablas con `SELECT` documentado; se priorizo lectura y trazabilidad sobre una falsa administracion.
- `Accesos sensibles` usa `public.role_access_constraints` como control real porque el schema la expone con `FOR ALL`, mientras el log sensible consolida beneficiarios y voluntarios con el mismo gating `governance.sensitive.read`.
- `Retencion y borrado` se resuelve como restore whitelist y reporte operacional; no existe papelera generica ni restore transversal en la BD auditada.

## 19. Dependencias con otros modulos
- `Personas`: beneficiarios, voluntarios y ficha medica sensible.
- `Configuracion / IAM`: roles, permisos, sedes y constraints del Core.
- `Home`: reutiliza funciones del Core para tenant y RBAC.

## 20. Validacion tecnica
- `npm run build` ejecutado el `2026-03-26` en `America/Lima`: compilacion satisfactoria.
- El build mantiene la advertencia preexistente de chunk grande en `dist/assets/index-*.js`; no bloquea esta fase.
