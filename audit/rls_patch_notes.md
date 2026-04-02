# RLS Patch Notes

- Fecha: 2026-03-05 (America/Lima)
- Commit base: `8131eab`
- Alcance: documentacion de policies agregadas/reemplazadas en `supabase/migrations/20260305_rls_hardening.sql`.

## 1) Fuentes usadas para decisiones

- `audit/AUDIT-06-gaps-y-parches.md:44-63` (GAP-002 P0: hardening `profiles` + `user_roles_sedes`).
- `audit/AUDIT-07-rls-recomendado.sql:57-158,162-239` (base SQL recomendada para hardening y catalogos read-only).
- `audit/AUDIT-08-rls-informe.md:43-57,68-71,133-136` (riesgo `WITH CHECK (true)` y lectura abierta de catalogos).
- `audit/AUDIT-02-bd-modelo-real.md:85,217-218,233` (modelo consolidado con `user_roles_sedes`, RLS activo y riesgo historico de `p_profiles_update`).
- `audit/AUDIT-00-inventario.md:45-46,86-87` (inventario de tablas/funciones y evidencia de policies historicas inseguras).
- `audit/AUDIT-03-bd-huerfanos-y-uso.md:36-40,73,86` (uso/no uso de tablas y funciones RLS en app actual).
- `audit/AUDIT-04-mapa-de-uso-codigo.md:11-13,39,93` (uso real de `profiles` y riesgo por bypass RLS en backend service role).
- `audit/AUDIT-01-rf-cu-normalizados.md:81,129,209` (trazabilidad RF-IAM-001, RF-IAM-004, RF-AUD-001).
- `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:201-212,308-317,815-821,856-877,1057-1063` (esquema maestro y policies base).
- `indi-info/SUBS-06-Act-BD.md:74-89` (version robusta de `fn_current_tenant_id`).
- `indi-info/SUBS-02-SEC-Matriz-Permisos.md:6,33-97` (convencion `perm.*`; observacion de naming vs `iam.*`).

## 2) Decisiones y trazabilidad

### DEC-001 - Endurecer `profiles` por riesgo P0

- Motivo: eliminar riesgo detectado en `p_profiles_update ... with check (true)`.
- Decision: recrear `p_profiles_select`, `p_profiles_insert`, `p_profiles_update` con validacion de tenant via `tenant_id = public.fn_current_tenant_id()`.
- Policies:
  - `p_profiles_select`
  - `p_profiles_insert`
  - `p_profiles_update`
- Implementacion: `supabase/migrations/20260305_rls_hardening.sql:38-83`.
- RF/CU relacionados: `RF-IAM-001`, `RF-IAM-004`, `RF-AUD-001`.
- Evidencia: `audit/AUDIT-06-gaps-y-parches.md:44-63`, `audit/AUDIT-08-rls-informe.md:43-48`, `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:815-821`.

### DEC-002 - Normalizar `user_roles_sedes` para aislamiento tenant

- Motivo: variantes historicas con checks permisivos y trigger de auditoria inconsistente.
- Decision:
  - asegurar `tenant_id` (backfill + `NOT NULL` + FK + index),
  - recrear policies `p_urs_*` estrictas por tenant y permiso,
  - recrear `tr_audit_urs` con `tenant_id`.
- Policies:
  - `p_urs_select`
  - `p_urs_insert`
  - `p_urs_update`
  - `p_urs_delete`
- Implementacion: `supabase/migrations/20260305_rls_hardening.sql:98-198`.
- RF/CU relacionados: `RF-IAM-001`, `RF-TEN-002`, `RF-AUD-001`.
- Evidencia: `audit/AUDIT-06-gaps-y-parches.md:53-62`, `audit/AUDIT-07-rls-recomendado.sql:75-158`, `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:201-212,856-877`.

### DEC-003 - Cobertura minima solicitada para tablas tenant-scoped

- Motivo: requerimiento explicito de cubrir `users`, `projects`, `activities`, `tasks`, `payments`, `billing`, `subscriptions`.
- Decision: crear bloque condicional idempotente que, si tabla existe y tiene `tenant_id`, habilita RLS y crea cuatro policies tenant (`select/insert/update/delete`) con validacion `tenant_id = public.fn_current_tenant_id()`.
- Policies (patron):
  - `p_<tabla>_tenant_select`
  - `p_<tabla>_tenant_insert`
  - `p_<tabla>_tenant_update`
  - `p_<tabla>_tenant_delete`
- Implementacion: `supabase/migrations/20260305_rls_hardening.sql:208-259`.
- Nota de compatibilidad: en el modelo auditado estas tablas no aparecen dentro de las 30 tablas consolidadas; por eso se aplica en modo condicional para no romper despliegues.
- Evidencia: `audit/AUDIT-00-inventario.md:45-46`, `audit/AUDIT-02-bd-modelo-real.md:217-223`, `audit/AUDIT-03-bd-huerfanos-y-uso.md:36-40`.

### DEC-004 - Catalogos en modo read-only para authenticated

- Motivo: aplicar minimo privilegio en tablas globales sin `tenant_id`.
- Decision: para `cat_industry_types`, `cat_plan_types`, `cat_permissions`, `plan_policies`:
  - permitir solo `SELECT` a `authenticated`,
  - bloquear `INSERT/UPDATE/DELETE` desde cliente,
  - limpiar policies legacy en `cat_permissions`.
- Policies (por tabla):
  - `p_<tabla>_read`
  - `p_<tabla>_insert_block`
  - `p_<tabla>_update_block`
  - `p_<tabla>_delete_block`
- Implementacion: `supabase/migrations/20260305_rls_hardening.sql:265-307`.
- Evidencia: `audit/AUDIT-07-rls-recomendado.sql:162-239`, `audit/AUDIT-08-rls-informe.md:68-71,124-126`, `indi-info/SUBS-05-Base-De-Datos-BD-supabase.md:16-26,308-317,1057-1063`.

### DEC-005 - Funcion tenant robusta y reusable en policies

- Motivo: estandarizar evaluacion de tenant en RLS y evitar recursion fragil.
- Decision: `create or replace function public.fn_current_tenant_id()` con `security definer` y `set search_path = public`, y grant explicito de ejecucion.
- Implementacion: `supabase/migrations/20260305_rls_hardening.sql:12-25`.
- Evidencia: `audit/AUDIT-07-rls-recomendado.sql:11-26`, `audit/AUDIT-08-rls-informe.md:102`, `indi-info/SUBS-06-Act-BD.md:74-89`.

## 3) Inventario de policies agregadas/recreadas

- `public.profiles`
  - `p_profiles_select`
  - `p_profiles_insert`
  - `p_profiles_update`

- `public.user_roles_sedes`
  - `p_urs_select`
  - `p_urs_insert`
  - `p_urs_update`
  - `p_urs_delete`

- `public.<users|projects|activities|tasks|payments|billing|subscriptions>` (si existen y tienen `tenant_id`)
  - `p_<tabla>_tenant_select`
  - `p_<tabla>_tenant_insert`
  - `p_<tabla>_tenant_update`
  - `p_<tabla>_tenant_delete`

- `public.<cat_industry_types|cat_plan_types|cat_permissions|plan_policies>` (si existen)
  - `p_<tabla>_read`
  - `p_<tabla>_insert_block`
  - `p_<tabla>_update_block`
  - `p_<tabla>_delete_block`

## 4) Validaciones sugeridas en staging (no ejecutadas en este paso)

- Ejecutar diff previo:
  - `supabase db diff`
- Aplicar migraciones:
  - `supabase db push`
  - o `supabase migration up`
- Pruebas negativas multi-tenant:
  - update cross-tenant en `profiles` debe fallar.
  - insert/update/delete cross-tenant en `user_roles_sedes` debe fallar.
  - escrituras cliente sobre catalogos deben fallar.

