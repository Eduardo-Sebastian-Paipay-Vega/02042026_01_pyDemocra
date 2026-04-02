# AUDIT-06 Gaps y Plan de Parches

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: priorización de gaps (P0/P1/P2) y definición de Patch Cards con trazabilidad RF/CU ↔ BD ↔ código.

## 1) Priorización general

- `P0`: riesgo inmediato de seguridad/datos (RLS, autorización, drift de migraciones).
- `P1`: bloquea features críticos de negocio (RBAC operativo, billing, concurrencia, lifecycle).
- `P2`: mejoras necesarias para completitud/consistencia (campos, nomenclatura, deuda documental).

---

## 2) Patch Cards

### GAP-001 (P0) - Drift crítico de migraciones SQL

- Qué falta y por qué:
  - El directorio `supabase/migrations` está vacío en working tree, pero en `HEAD` existen migraciones críticas (`20260301120000`, `20260302125000`).
  - Impacta onboarding y auditoría (error `audit_logs.tenant_id null` ya reconocido por frontend).
- Trazabilidad:
  - RF/CU: `RF-TEN-001-B`, `CU-01`, `RF-AUD-001`.
  - Evidencia: `git ls-tree -r --name-only HEAD`, `src/js/useOnboardingFlow.js:604-610`, `git:HEAD:supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql:1-202`.
- Solución propuesta:
  1. Restaurar migraciones históricas en `supabase/migrations/`.
  2. Crear migración de consolidación baseline (`schema_guard`) para evitar drift futuro.
  3. Documentar orden de aplicación y checksum.
- Archivos a modificar:
  - `supabase/migrations/20260301120000_ai_security_copilot.sql` (restaurar)
  - `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql` (restaurar)
  - `supabase/migrations/20260305XXXXXX_schema_guard.sql` (nuevo)
  - `DEPLOY-NOTES.md` (nuevo)
- SQL necesario:
  - No funcional nuevo para negocio; sí baseline de consistencia (`DO $$ ... $$` validando existencia de objetos críticos).
- Tests/validaciones:
  - Smoke: onboarding completo (`fn_bootstrap_tenant`) sin error de auditoría.
  - Smoke: login + OTP + metrics en `/api/security/metrics`.
- Riesgos:
  - Entornos que ya aplicaron versiones parciales pueden tener conflictos de `create policy`.
- Rollback:
  - Revertir commit de restauración y ejecutar script de rollback de policies si hubo cambios incompatibles.

### GAP-002 (P0) - Policies RLS permisivas (`with check (true)`) en perfiles/URS

- Qué falta y por qué:
  - Existen políticas con `with check (true)` en `profiles` (base) y variantes históricas en `user_roles_sedes`.
  - Riesgo de mutaciones fuera de tenant esperado en contextos no controlados.
- Trazabilidad:
  - RF/CU: `RF-IAM-001`, `RF-IAM-004`, `RF-AUD-001`.
  - Evidencia: `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:815-821`, `indi-info/todocorridoensupabase.md:3446-3449`, `:3583-3586`.
- Solución propuesta:
  1. Reemplazar `p_profiles_update` con `with check (tenant_id = fn_current_tenant_id())`.
  2. Garantizar policy estricta en `user_roles_sedes` por `tenant_id` y permiso.
  3. Asegurar trigger `tr_audit_urs` usando `tenant_id`.
- Archivos a modificar:
  - `supabase/migrations/20260305XXXXXX_rls_hardening_profiles_urs.sql` (nuevo)
- SQL necesario:
  - Ver `audit/AUDIT-07-rls-recomendado.sql` (bloques `p_profiles_update` y `p_urs_*`).
- Tests/validaciones:
  - Intento de update de profile cruzando tenant debe fallar.
  - Insert/update/delete en `user_roles_sedes` fuera de tenant debe fallar.
- Riesgos:
  - Podría romper flujos antiguos de onboarding si dependían de update directo cliente.
- Rollback:
  - Restaurar policies previas (`drop/create` inverso) temporalmente + activar solo vía RPC.

### GAP-003 (P0) - `required_permission` no se valida en motor de riesgo/acciones críticas

- Qué falta y por qué:
  - Frontend envía `required_permission`, backend la pasa a `evaluateRiskEngine`, pero el motor no la usa.
  - Riesgo de autorización incompleta en acciones críticas.
- Trazabilidad:
  - RF/CU: `RF-IAM-001`, `RF-IAM-003`, `CU-03`.
  - Evidencia: `src/hooks/useRiskGate.js:82`, `server/routes/auth.js:66-82`, `server/security/risk-engine.js:338-607` (sin check de permiso).
- Solución propuesta:
  1. En `evaluateRiskEngine`, validar `requiredPermission` con `userClient.rpc('fn_has_permission', ...)` o query segura equivalente.
  2. Si no cumple, retornar `IAM-003` + auditoría `ACTION_CRITICAL_BLOCKED`.
  3. Agregar ruta dedicada de override transaccional (si aplica en paquete P1).
- Archivos a modificar:
  - `server/security/risk-engine.js`
  - `server/routes/auth.js`
  - `src/hooks/useRiskGate.js` (alinear payload/respuesta)
- SQL necesario:
  - Opcional: wrapper RPC `fn_has_permission_rpc(permission text, sede_id uuid)` con grants explícitos.
- Tests/validaciones:
  - Usuario sin permiso recibe `IAM-003` en `ACTION_CRITICAL`.
  - Usuario con permiso obtiene `ALLOW/REQUIRE_OTP` según riesgo.
- Riesgos:
  - Cambios en contratos de respuesta de endpoint.
- Rollback:
  - Feature flag `ENFORCE_REQUIRED_PERMISSION=false` temporal.

### GAP-004 (P0) - Backend usa service role en operaciones tenant-scoped (bypass RLS)

- Qué falta y por qué:
  - La mayoría de lecturas/escrituras se ejecutan con `serviceClient`, que bypass RLS.
  - Seguridad depende de filtros de app y aumenta superficie de fuga si hay bug.
- Trazabilidad:
  - RF/CU: `RF-IAM-001`, `RF-TEN-002`, `RF-AUD-001`.
  - Evidencia: `server/supabase.js:11-25`, `server/security/audit.js:51-55`, `server/security/risk-engine.js:25-38`.
- Solución propuesta:
  1. Introducir helper `assertTenantScope(query, tenantId)` para todas las mutaciones service role.
  2. Migrar operaciones no privilegiadas a `userClient` cuando sea viable.
  3. Mantener service role solo en flujos privilegiados (auditoría interna, triggers técnicos).
- Archivos a modificar:
  - `server/supabase.js`
  - `server/security/audit.js`
  - `server/security/risk-engine.js`
  - `server/routes/auth.js`
  - `server/routes/audit.js`
- SQL necesario:
  - No obligatorio.
- Tests/validaciones:
  - Pruebas negativas con tenant_id cruzado deben devolver `TEN-003`/403.
- Riesgos:
  - Refactor transversal con regresiones si no hay pruebas.
- Rollback:
  - Revertir capa helper y mantener filtros existentes (temporal).

### GAP-005 (P1) - Billing core (CU-PAY-01..08) no implementado

- Qué falta y por qué:
  - Existen tablas de billing pero no hay rutas/orquestador/webhook/reconciliación.
- Trazabilidad:
  - RF/CU: `RF-SUB-002`, `RF-SUB-003`, `RF-SUB-004`, `CU-PAY-01..08`.
  - Evidencia: `server/routes` solo auth/audit/onboarding; `server/routes/audit.js:111` usa pagos solo para métricas.
- Solución propuesta:
  1. Crear `server/routes/billing.js` (intent, confirm, webhook, reconcile).
  2. Implementar FSM de `subscription_changes` y `status_financial_id`.
  3. Garantizar idempotencia en webhook (`provider,event_id` + `idempotency_key`).
- Archivos a modificar:
  - `server/routes/billing.js` (nuevo)
  - `server/index.js` (montaje)
  - `server/security/audit.js` (eventos de billing)
  - `src/js/billing*.js` (nuevo, si UI incluida)
- SQL necesario:
  - Migración opcional para índices de reconciliación y constraints de estado.
- Tests/validaciones:
  - Happy path + duplicate webhook + timeout + inconsistencia.
- Riesgos:
  - Integración con proveedor de pago externo.
- Rollback:
  - Desmontar ruta billing por feature flag, preservar tablas.

### GAP-006 (P1) - Control de concurrencia/licencias no aplicado en login

- Qué falta y por qué:
  - Requisito exige bloquear exceso de sesiones/licencias; código no compara sesiones activas contra límites de plan.
- Trazabilidad:
  - RF/CU: `RF-SUB-001`, `CU-04`.
  - Evidencia: `server/routes/auth.js:382-614` (sin check de `entitlements.max_licenses`), `SUBS-01:226-239`.
- Solución propuesta:
  1. Antes de crear sesión, contar sesiones activas por tenant.
  2. Leer límite desde `entitlements.max_licenses`.
  3. Retornar `SUB-001` y opcionalmente ofrecer cierre remoto autorizado.
- Archivos a modificar:
  - `server/security/risk-engine.js`
  - `server/routes/auth.js`
  - `src/shared/error-explainer.js` (alineación mensajes)
- SQL necesario:
  - Índice parcial recomendado sobre sesiones activas por tenant.
- Tests/validaciones:
  - Con límite alcanzado, login bloqueado con código esperado.
- Riesgos:
  - Falsos bloqueos si expiración de sesiones no está limpia.
- Rollback:
  - Desactivar validación por flag temporal.

### GAP-007 (P1) - FSM de estado financiero no forzada en backend

- Qué falta y por qué:
  - Requisito de `solo_lectura`/`suspendido` no está aplicado a endpoints de escritura.
- Trazabilidad:
  - RF/CU: `RF-TEN-003`, `RF-SUB-003`, `CU-PAY-06`.
  - Evidencia: `SUBS-01:134-159`, `server/routes/auth.js` (sin middleware por estado tenant).
- Solución propuesta:
  1. Crear middleware `enforceTenantWriteState`.
  2. Bloquear operaciones mutantes cuando estado sea `FIN-READONLY`/`FIN-SUSPENDED`.
  3. Auditar rechazos (`FIN-001`/`FIN-002`).
- Archivos a modificar:
  - `server/middleware/tenant-state.js` (nuevo)
  - `server/routes/auth.js` y futuras rutas mutantes
- SQL necesario:
  - Opcional: función `fn_tenant_can_write(tenant_id)`.
- Tests/validaciones:
  - Estados restringidos deben denegar updates.
- Riesgos:
  - Corte de flujos legítimos si transición de estado está mal calibrada.
- Rollback:
  - Middleware por flag.

### GAP-008 (P1) - Gestión operativa de RBAC/multi-sede no expuesta

- Qué falta y por qué:
  - No hay API/UI para administrar `roles`, `role_permissions`, `user_roles_sedes`, `sedes`.
- Trazabilidad:
  - RF/CU: `RF-IAM-001`, `RF-TEN-002`.
  - Evidencia: sin rutas relacionadas en `server/routes`; tablas existen en `SUBS-05:148-208`.
- Solución propuesta:
  1. Crear rutas `iam` y `tenancy` con CRUD controlado.
  2. Aplicar checks de jerarquía y permisos.
  3. Registrar auditoría de cada cambio.
- Archivos a modificar:
  - `server/routes/iam.js` (nuevo)
  - `server/routes/tenancy.js` (nuevo)
  - `server/index.js`
- SQL necesario:
  - Opcional: constraints adicionales de jerarquía.
- Tests/validaciones:
  - No permitir creación de roles por encima del actor.
- Riesgos:
  - Complejidad funcional alta sin UX madura.
- Rollback:
  - Mantener rutas no publicadas hasta completar QA.

### GAP-009 (P2) - Campo teléfono de onboarding no persistido

- Qué falta y por qué:
  - Front captura teléfono pero no se guarda en BD ni RPC.
- Trazabilidad:
  - RF/CU: `CU-01` (datos de onboarding).
  - Evidencia: `src/js/useOnboardingFlow.js:11`, `:589`.
- Solución propuesta:
  1. Agregar `phone` en `profiles` o `tenants` (definir ownership funcional).
  2. Extender `fn_bootstrap_tenant` para recibir y persistir `p_phone`.
  3. Pasar `phone` desde frontend.
- Archivos a modificar:
  - `supabase/migrations/20260305XXXXXX_add_phone_onboarding.sql`
  - `src/hooks/useAuthFlow.js`
  - `src/js/useOnboardingFlow.js`
  - `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md` (si se mantiene como fuente documental)
- SQL necesario:
  - `alter table public.profiles add column phone text;` (o en `tenants`).
- Tests/validaciones:
  - Finalizar onboarding y verificar persistencia del teléfono.
- Riesgos:
  - Definición incorrecta de ownership de dato (usuario vs empresa).
- Rollback:
  - Mantener columna nullable y dejar de usarla desde app.

### GAP-010 (P2) - Inconsistencia de nomenclatura de permisos (`perm.*` vs `iam.*`)

- Qué falta y por qué:
  - Documentación define `perm.*`, SQL usa `iam.*`/`subs.*`/`billing.*`.
  - Riesgo de errores de autorización por mapeo incorrecto.
- Trazabilidad:
  - RF/CU: `RF-IAM-001`, `RF-SUB-004`.
  - Evidencia: `SUBS-02:6,33-97` vs `SUBS-05:1010-1031`.
- Solución propuesta:
  1. Elegir estándar único (`perm.*` o actual `iam.*` sin prefijo).
  2. Crear tabla de alias temporal y función de resolución para transición.
  3. Migrar `cat_permissions` y referencias en políticas/código.
- Archivos a modificar:
  - `supabase/migrations/20260305XXXXXX_permissions_naming_alignment.sql`
  - `indi-info/SUBS-02-SEC-Matriz-Permisos.md`
  - `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md`
- SQL necesario:
  - `insert/update` de `cat_permissions` + ajuste de `role_permissions`.
- Tests/validaciones:
  - `fn_has_permission` devuelve mismo resultado antes/después de migración.
- Riesgos:
  - Pérdida de permisos asignados si no se migra transaccionalmente.
- Rollback:
  - Mantener mapping dual durante periodo de transición.

---

## 3) Orden recomendado de ejecución

1. `GAP-001` (restaurar baseline de migraciones).
2. `GAP-002` + `GAP-003` + `GAP-004` (seguridad core P0).
3. `GAP-006` + `GAP-007` (gobernanza de acceso y estado).
4. `GAP-005` + `GAP-008` (expansión funcional de negocio).
5. `GAP-009` + `GAP-010` (consistencia y deuda técnica).

## 4) Criterio de aceptación global por parche

- Cada parche debe incluir:
  - migración SQL versionada,
  - pruebas smoke automatizables,
  - nota de despliegue y rollback,
  - referencia explícita a `GAP-XXX` en commit.
