# AUDIT-08 Informe RLS (Multi-tenant y Permisos)

- Fecha: 2026-03-04 (America/Lima)
- Commit auditado: `fde837c`
- Alcance: auditoría de seguridad RLS con foco en aislamiento por tenant, mínimo privilegio y bypass controlado en Supabase.

## 1) Resultado ejecutivo

- Estado general: **parcialmente conforme**.
- Fortalezas:
  - RLS habilitado en la mayoría de tablas de negocio tenant-scoped.
  - Patrón de funciones `fn_current_tenant_id`, `fn_has_permission`, `fn_is_tenant_admin`.
  - Trigger de auditoría universal presente.
- Riesgos críticos:
  - Policies permisivas (`with check (true)`) en rutas históricas y base documental.
  - Deriva de migraciones (migraciones eliminadas del árbol actual).
  - Backend con service role en operaciones tenant-scoped (RLS bypass por diseño de backend).

## 2) Cobertura RLS por tabla

### 2.1 Tablas tenant-scoped con RLS ON (evidencia base)

- `tenants`, `sedes`, `profiles`, `roles`, `role_permissions`, `user_roles_sedes`, `role_access_constraints`, `terminals`, `devices`, `sessions`, `auth_events`, `subscription_contracts`, `entitlements`, `subscription_changes`, `invoices`, `invoice_lines`, `payment_methods`, `payment_transactions`, `payment_webhook_events`, `audit_logs`.
- Evidencia: `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:755-779`.

### 2.2 Tablas con RLS ON por delta

- `mfa_challenges` (`indi-info/SUBS-06-Act-BD.md:32`).
- `cat_permissions` (`indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:1057`).

### 2.3 Tablas sin RLS explícito (globales/catálogos)

- `cat_industry_types`, `cat_plan_types`, `cat_tenant_statuses`, `cat_subscription_statuses`, `cat_subscription_change_statuses`, `cat_invoice_statuses`, `cat_payment_statuses`, `plan_policies`.
- Evaluación:
  - Son tablas globales sin `tenant_id`; no requieren aislamiento por fila de tenant.
  - Sí requieren política de mínimo privilegio (read-only para `authenticated`, no write cliente).

## 3) Hallazgos críticos de políticas

### 3.1 Policy peligrosa en `profiles`

- Hallazgo:
  - `p_profiles_update` usa `with check (true)`.
- Evidencia:
  - `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:815-821`.
  - Variantes repetidas en `indi-info/todocorridoensupabase.md:3777-3783`.
- Riesgo:
  - Permitir cambios no suficientemente acotados en columnas sensibles (ej. `tenant_id`) según contexto.

### 3.2 Policy histórica peligrosa en `user_roles_sedes`

- Hallazgo:
  - Existe variante histórica `p_urs_write ... with check (true)`.
- Evidencia:
  - `indi-info/todocorridoensupabase.md:3446-3449`.
- Estado:
  - También existe variante corregida por `tenant_id` (`:3583-3586`), pero no hay garantía de qué versión quedó activa en todos los entornos.

### 3.3 Trigger histórico de auditoría URS incorrecto

- Hallazgo:
  - Variante de `tr_audit_urs` usando `'user_id'` como tenant column.
- Evidencia:
  - `indi-info/todocorridoensupabase.md:3285-3288`.
- Riesgo:
  - Inserciones en `audit_logs` con tenant inválido/NULL y pérdida de trazabilidad.

### 3.4 Lectura abierta en `cat_permissions`

- Hallazgo:
  - `p_cat_permissions_read using (true)` sin `to authenticated` explícito.
- Evidencia:
  - `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:1060-1063`.
- Riesgo:
  - Exposición innecesaria del catálogo según grants efectivos del entorno.

## 4) Multi-tenant: evaluación por patrón requerido

### 4.1 Patrón esperado

- `user -> roles -> permissions` + `tenant_id` + `auth.uid()`.

### 4.2 Estado actual

- Estructura existe en BD:
  - `roles`, `role_permissions`, `user_roles_sedes`.
  - Funciones: `fn_has_permission`, `fn_is_tenant_admin` (`SUBS-05:543-567`).
- Gap principal:
  - Capa de aplicación no explota plenamente ese patrón en lógica de negocio.
  - `required_permission` se envía pero no se aplica en `evaluateRiskEngine`.
- Evidencia:
  - `src/hooks/useRiskGate.js:82`.
  - `server/routes/auth.js:66-82`.
  - `server/security/risk-engine.js:338-607`.

## 5) Security definer / bypass controlado

### 5.1 Funciones `security definer`

- `fn_trigger_audit_universal` (`SUBS-05:573`),
- `fn_bootstrap_tenant` (`SUBS-05:1079`; fix `HEAD migration 20260302125000:106-108`),
- versión robusta de `fn_current_tenant_id` en fix (`HEAD migration 20260302125000:15-17`).

### 5.2 Evaluación

- Correcto usar `security definer` para bootstrap/auditoría técnica.
- Recomendación:
  - Asegurar `set search_path = public` en todas las funciones definer.
  - Grants mínimos explícitos.
  - Input validation estricta (ya presente en fix de bootstrap).

## 6) Edge Functions / RPC y seguridad

- Edge Functions Supabase: no detectadas (`supabase/functions` inexistente).
- RPC activa en app: `fn_bootstrap_tenant` (`src/hooks/useAuthFlow.js:112`).
- Recomendación:
  - Mantener creación de tenant exclusivamente por RPC.
  - Restringir inserts directos en `tenants` (ya modelado por `p_tenants_no_insert`, `SUBS-05:1164-1167`).

## 7) Lista de tablas sin RLS que deberían endurecerse

Aunque no sean tenant-scoped, por mínimo privilegio se recomienda endurecer:

- `cat_industry_types` (read-only autenticados).
- `cat_plan_types` (read-only autenticados).
- `plan_policies` (read-only autenticados).
- Catálogos de estados (`cat_tenant_statuses`, `cat_subscription_statuses`, `cat_subscription_change_statuses`, `cat_invoice_statuses`, `cat_payment_statuses`) en read-only.

## 8) Políticas recomendadas exactas

- Se entregan en: `audit/AUDIT-07-rls-recomendado.sql`.
- Incluyen:
  - hardening de `profiles` y `user_roles_sedes`,
  - corrección de auditoría URS,
  - endurecimiento de catálogos/plan policies,
  - restricción de `cat_permissions`.

## 9) Riesgo residual si no se aplica hardening

- Fuga o corrupción de contexto tenant por políticas laxas en escenarios edge.
- Inconsistencia entre entornos por drift de migraciones.
- Falsa sensación de seguridad RLS cuando backend opera mayormente con service role.

## 10) Recomendación de implementación segura

1. Aplicar `GAP-001` (restaurar migraciones) antes de nuevos cambios.
2. Aplicar `AUDIT-07` en entorno staging con pruebas negativas multi-tenant.
3. Migrar gradualmente operaciones backend a user-scoped client o guardas estrictas por tenant.
4. Cerrar gap de autorización (`required_permission`) antes de exponer acciones críticas.
