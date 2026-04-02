# DEPLOY-NOTES

## Commit 1 - restore-migrations + schema_guard (GAP-001)

### Fuentes de decisión
- `audit/AUDIT-00-inventario.md` (migraciones ausentes en working tree).
- `audit/AUDIT-06-gaps-y-parches.md` (GAP-001).

### Cambios
- Restauradas migraciones:
  - `supabase/migrations/20260301120000_ai_security_copilot.sql`
  - `supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql`
- Nueva migración:
  - `supabase/migrations/20260305100000_schema_guard.sql`

### Despliegue
1. Ejecutar migraciones en orden:
```bash
supabase db push
```
2. Verificar que `schema_guard` no falle.

### Rollback
1. Revertir commit.
2. Si `schema_guard` falla por drift histórico, corregir objetos faltantes y volver a ejecutar `supabase db push`.
## Commit 2 - rls-hardening-p0 (GAP-002)

### Fuentes de decisión
- `audit/AUDIT-07-rls-recomendado.sql`
- `audit/AUDIT-08-rls-informe.md`
- `audit/AUDIT-06-gaps-y-parches.md` (GAP-002)
- `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md`

### Cambios
- Nueva migración:
  - `supabase/migrations/20260305110000_rls_hardening_p0.sql`
- Hardening aplicado en:
  - `profiles` (`p_profiles_update` sin `with check (true)`)
  - `user_roles_sedes` (`tenant_id` not null + FK + index + policies estrictas)
  - catálogos read-only authenticated: `cat_permissions`, `cat_industry_types`, `cat_plan_types`, `plan_policies`

### Despliegue
```bash
supabase db push
```
Verificar:
- policies nuevas en `pg_policies`
- `user_roles_sedes.tenant_id` no nulo

### Rollback
1. Revertir commit.
2. Reaplicar migraciones previas de policies (si existen en historial).
3. Si falla por datos legacy en `user_roles_sedes`, completar backfill y relanzar.
## Commit 3 - required-permission-enforcement (GAP-003)

### Fuentes de decisión
- `audit/AUDIT-04-mapa-de-uso-codigo.md` (required_permission enviado pero no aplicado).
- `audit/AUDIT-06-gaps-y-parches.md` (GAP-003).
- `audit/AUDIT-08-rls-informe.md` (gap de enforcement de permisos).
- `indi-info/SUBS-02-SEC-Matriz-Permisos.md` (modelo de permisos).

### Cambios
- Backend:
  - `server/security/risk-engine.js`
    - valida `requiredPermission` usando `fn_has_permission` por RPC (`userClient`)
    - fallback seguro por query tenant-scoped (`user_roles_sedes` + `role_permissions`)
    - deniega con `IAM-003` y `decision=DENY` cuando falta permiso
  - `server/routes/auth.js`
    - clasifica como error cualquier decisión bloqueada (incluye `DENY`)
    - mantiene traza `ACTION_CRITICAL_BLOCKED` en `auth_events`

### Despliegue
1. Aplicar migraciones previas (`db push`).
2. Desplegar API Node.
3. Smoke test:
   - `ACTION_CRITICAL` sin permiso => `IAM-003` + evento bloqueado.

### Rollback
1. Revertir commit.
2. Reiniciar API.
## Commit 4 - service-role-tenant-guards (GAP-004 mínimo viable)

### Fuentes de decisión
- `audit/AUDIT-04-mapa-de-uso-codigo.md` (uso de `serviceClient` tenant-scoped).
- `audit/AUDIT-08-rls-informe.md` (riesgo de bypass RLS con service role).
- `audit/AUDIT-06-gaps-y-parches.md` (GAP-004).

### Cambios
- Nuevo helper:
  - `server/utils/tenant-scope.js`
    - `assertTenantScope()`
    - `applyTenantScope()`
- Aplicado en backend:
  - `server/routes/auth.js`
  - `server/routes/audit.js`
  - `server/security/audit.js`
  - `server/security/risk-engine.js`
- Resultado:
  - operaciones `serviceClient` tenant-scoped ahora validan tenant UUID y aplican scope de forma centralizada.

### Despliegue
1. Desplegar API Node con este commit.
2. Smoke test:
   - login web/terminal
   - OTP verify/resend
   - `/api/security/metrics`
   - `/api/audit/summary`

### Rollback
1. Revertir commit.
2. Reiniciar API.
