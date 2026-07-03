# DATABASE_MASTER_SCRIPT — Democra ONG Platform (proyecto "DEMOCRA - GIT - ONG")

> **Tipo de documento:** Reconstrucción completa de la estructura de base de datos por ingeniería inversa (auditoría técnica).
> **Fecha de auditoría:** 2026-07-03
> **Motor:** PostgreSQL 16 (Supabase)
> **Alcance:** Solo estructura (DDL, funciones, triggers, vistas, políticas, grants, storage, seeds estructurales). Sin datos de producción.
>
> **Fuentes de evidencia (en orden de autoridad):**
> 1. `supabase/migrations/*.sql` (10 migraciones versionadas — proyecto raíz)
> 2. `ONG/supabase/migrations/*.sql` (4 migraciones + 1 script de diagnóstico — subproyecto ONG)
> 3. `docs/DB_MAESTRA.md` (diccionario consolidado 2026-05-10, autodeclarado "fuente única de verdad")
> 4. `docs/general/scripts-maestros/Parte 1- Script maestro documental del Core SUBS public.md`
> 5. `docs/ong/scripts/Parte 2/3/4 - Script maestro documental de ONG módulos complementarios.md`
> 6. `docs/general/auditorias-y-patches/AUDIT-07-rls-recomendado.sql`
> 7. `ONG/supabase/Configuracion_Supabase.md` (storage `id_templates` + `template_config`)
> 8. Código consumidor: `src/modules/ong/**`, `ONG/src/**`, `server/**`, `ONG/supabase/functions/**` (Edge Functions)
>
> **Convención de marcado de auditoría usada en este documento:**
> - `-- [AUDIT-OK]` objeto confirmado por ≥2 fuentes coherentes.
> - `-- [AUDIT-CONFLICT]` existen definiciones contradictorias entre fuentes; se conserva la versión más reciente y se documenta la otra.
> - `-- [AUDIT-DOUBT]` no se pudo confirmar contra la BD real. Requiere revisión manual.
> - `-- [AUDIT-DEAD?]` objeto sin referencias en el código; posible código muerto. NO eliminar sin verificación.
> - `-- [AUDIT-SYNTAX]` el script fuente contiene sintaxis inválida para PostgreSQL tal como está escrito.
>
> **Regla de esta auditoría:** no se elimina ningún objeto. Los elementos posiblemente obsoletos se conservan y se marcan.

---

## ÍNDICE

0. Extensiones y schemas
1. Schema `public` — Catálogos globales
2. Schema `public` — Core multi-tenant (tenants, sedes, profiles, roles, IAM)
3. Schema `public` — IAM operativo (terminals, devices, sessions, auth_events, mfa_challenges)
4. Schema `public` — Suscripciones y Billing
5. Schema `public` — Auditoría core (`audit_logs`)
6. Schema `public` — Módulos del sistema
7. Schema `public` — ACE (Access & Context Engine)
8. Schema `ong`
9. Schema `rrhh`
10. Schema `finanzas`
11. Schema `donaciones`
12. Schema `clinico`
13. Schema `academico`
14. Schema `gamificacion`
15. Schema `impacto`
16. Schema `comunicaciones`
17. Schema `auditoria`
18. Funciones (todas)
19. Triggers (todos)
20. Vistas
21. Políticas RLS (todas)
22. Grants y permisos
23. Supabase Storage (buckets y políticas)
24. Seeds estructurales
25. Objetos referenciados pero NO definidos en el repositorio

---

## 0. EXTENSIONES Y SCHEMAS

```sql
-- [AUDIT-OK] Parte 1 §0, Parte 4 §0, migración 20260301120000
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- [AUDIT-OK] Schemas confirmados por Parte 2 y por el preflight de Parte 3 (A1)
CREATE SCHEMA IF NOT EXISTS ong;
CREATE SCHEMA IF NOT EXISTS finanzas;
CREATE SCHEMA IF NOT EXISTS donaciones;     -- [AUDIT-DEAD?] sin uso en frontend/server (ver §11)
CREATE SCHEMA IF NOT EXISTS rrhh;
CREATE SCHEMA IF NOT EXISTS clinico;
CREATE SCHEMA IF NOT EXISTS academico;
CREATE SCHEMA IF NOT EXISTS gamificacion;   -- [AUDIT-DEAD?] sin uso en frontend/server (ver §14)
CREATE SCHEMA IF NOT EXISTS impacto;        -- [AUDIT-DEAD?] sin uso en frontend/server (ver §15)
CREATE SCHEMA IF NOT EXISTS comunicaciones;
CREATE SCHEMA IF NOT EXISTS auditoria;
```

> **Nota de auditoría:** no existe configuración de Prisma, Drizzle, Sequelize, TypeORM ni Knex en el proyecto. El acceso a datos es 100% `@supabase/supabase-js` (PostgREST + RPC) con tipos manuales en `app-database.ts` (duplicado en `ONG/src/lib/db/ong/` y `src/modules/ong/lib/db/ong/` — ver AUDIT_REPORT). No existe Docker ni `supabase/config.toml` en el repo; `supabase/.temp/` confirma uso de Supabase CLI contra un proyecto remoto (PostgreSQL 16, project-ref presente en `.temp/project-ref`).

---

## 1. SCHEMA `public` — CATÁLOGOS GLOBALES

```sql
-- [AUDIT-OK] Parte 1 §1 + DB_MAESTRA §2.1. Catálogos sin tenant_id (globales).

CREATE TABLE IF NOT EXISTS public.cat_industry_types (
  id text PRIMARY KEY,                    -- 'retail','gym','health','ong',...
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_plan_types (
  id text PRIMARY KEY,                    -- 'basic','pro','enterprise'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_tenant_statuses (
  id text PRIMARY KEY,                    -- 'FIN-PENDING','FIN-ACTIVE','FIN-GRACE','FIN-READONLY','FIN-SUSPENDED','FIN-INCONSISTENT'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_subscription_statuses (
  id text PRIMARY KEY,                    -- 'PENDING','ACTIVE','GRACE','READONLY','SUSPENDED','CANCELLED'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_subscription_change_statuses (
  id text PRIMARY KEY,                    -- 'CHG-SUBMITTED','CHG-AWAITING-CONFIRMATION','CHG-APPLIED','CHG-FAILED','CHG-CONFLICT'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_invoice_statuses (
  id text PRIMARY KEY,                    -- 'DRAFT','ISSUED','PAID','VOID','OVERDUE'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_payment_statuses (
  id text PRIMARY KEY,                    -- 'CREATED','PENDING','SUCCEEDED','FAILED','CANCELLED','REFUNDED','CHARGEBACK'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_permissions (
  id text PRIMARY KEY,                    -- código de permiso, ej. 'iam.admin', 'ong.voluntarios.write'
  description text NOT NULL,
  module text NOT NULL DEFAULT 'core',
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Nota: role_permissions.permission se valida contra esta tabla vía trigger (§19).

CREATE TABLE IF NOT EXISTS public.cat_generos (
  codigo text PRIMARY KEY,
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cat_paises (
  codigo text PRIMARY KEY,                -- ISO-3166
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cat_monedas (
  codigo text PRIMARY KEY,                -- ISO-4217 ('PEN','USD')
  nombre text NOT NULL,
  simbolo text NULL
);

CREATE TABLE IF NOT EXISTS public.cat_tipos_documento (
  codigo text PRIMARY KEY,                -- 'DNI','CE','PASAPORTE',...
  nombre text NOT NULL
);

-- [AUDIT-CONFLICT] cat_module_statuses:
--   Parte 3 §H (versión ejecutable): codigo varchar(30) PK, nombre varchar(100); seeds 'enabled','disabled','paused'.
--   DB_MAESTRA §2.1 documenta valores 'active','inactive','trial' (NO coincide con seeds reales ni con fn_is_module_enabled que compara status_code='enabled').
--   Se conserva la versión de Parte 3 §H por coherencia con fn_is_module_enabled. DB_MAESTRA requiere corrección documental.
CREATE TABLE IF NOT EXISTS public.cat_module_statuses (
  codigo varchar(30) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);
```

---

## 2. SCHEMA `public` — CORE MULTI-TENANT

```sql
-- [AUDIT-OK] Parte 1 §2 + DB_MAESTRA §2.1
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text NOT NULL UNIQUE,                                        -- RUC 11 dígitos (validado en fn_bootstrap_tenant)
  industry_type_id text NOT NULL REFERENCES public.cat_industry_types(id),
  plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_financial_id text NOT NULL DEFAULT 'FIN-PENDING' REFERENCES public.cat_tenant_statuses(id),
  billing_day int NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  max_licenses int NOT NULL DEFAULT 1 CHECK (max_licenses >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status_financial_id);

CREATE TABLE IF NOT EXISTS public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS idx_sedes_tenant ON public.sedes(tenant_id);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,   -- 1:1 con Supabase Auth
  tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL, -- NULL durante pre-onboarding
  full_name text NULL,
  pin_hash text NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text NULL,
  -- [AUDIT-OK] Columnas añadidas por migración 20260301120000_ai_security_copilot:
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_last_failed_at timestamptz NULL,
  pin_blocked_until timestamptz NULL,
  risk_blocked_until timestamptz NULL,
  -- [AUDIT-OK] Columnas usadas por fn_complete_access_onboarding y v_user_session_context:
  tipo_documento text NULL,
  numero_documento text NULL,
  genero text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);
-- [AUDIT-DOUBT] La migración de origen de tipo_documento/numero_documento/genero no está en el repo;
-- se confirma su existencia por DB_MAESTRA, app-database.ts y fn_complete_access_onboarding. Requiere revisión manual.

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  hierarchy_level int NOT NULL DEFAULT 100,     -- 0 = máximo poder (Owner)
  is_system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)                      -- [AUDIT-OK] confirmado por ON CONFLICT (tenant_id,name) en supabase/tests/fase1_onboarding_test.sql
);
CREATE INDEX IF NOT EXISTS idx_roles_tenant ON public.roles(tenant_id);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,                     -- validado por trigger contra cat_permissions
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS public.user_roles_sedes (
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,  -- [AUDIT-OK] NOT NULL + FK 'fk_user_roles_sedes_tenant' impuestos por 20260305110000_rls_hardening_p0
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id, sede_id)
);
CREATE INDEX IF NOT EXISTS idx_urs_tenant ON public.user_roles_sedes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_urs_user   ON public.user_roles_sedes(user_id);
CREATE INDEX IF NOT EXISTS idx_urs_sede   ON public.user_roles_sedes(sede_id);
-- [AUDIT-DOUBT] server/routes/iam.js ejecuta .from("user_roles_sedes").delete().eq("id", assignmentId):
-- presupone una columna 'id' que NO existe en ninguna definición del repo (PK compuesta). Requiere revisión manual (posible bug o columna id añadida fuera del repo).

CREATE TABLE IF NOT EXISTS public.role_access_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  sede_id uuid NULL REFERENCES public.sedes(id),
  ip_cidr cidr NULL,
  time_start time NULL,
  time_end time NULL,
  require_trusted_device boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_rac_role ON public.role_access_constraints(role_id);
```

---

## 3. SCHEMA `public` — IAM OPERATIVO

```sql
-- [AUDIT-OK] Parte 1 §3-4 + DB_MAESTRA §2.1
CREATE TABLE IF NOT EXISTS public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_seen_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sede_id, name)
);
CREATE INDEX IF NOT EXISTS idx_terminals_tenant ON public.terminals(tenant_id);

CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  device_type text NULL,                        -- 'web','mobile','terminal'
  is_trusted boolean NOT NULL DEFAULT false,
  last_ip inet NULL,
  last_user_agent text NULL,
  last_seen_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, device_fingerprint)
);
CREATE INDEX IF NOT EXISTS idx_devices_tenant ON public.devices(tenant_id);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  terminal_id uuid NULL REFERENCES public.terminals(id) ON DELETE SET NULL,
  device_id uuid NULL REFERENCES public.devices(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('web','terminal','api')),
  ip inet NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz NULL,
  revoke_reason text NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user   ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_tenant ON public.sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_public_sessions_tenant_created_at ON public.sessions(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id uuid NULL REFERENCES public.sessions(id) ON DELETE SET NULL,
  terminal_id uuid NULL REFERENCES public.terminals(id) ON DELETE SET NULL,
  device_id uuid NULL REFERENCES public.devices(id) ON DELETE SET NULL,
  event_type text NOT NULL,                     -- 'PIN_OK','PIN_FAIL','LOGIN_OK','LOGIN_FAIL','SESSION_REVOKED',...
  result text NOT NULL CHECK (result IN ('success','error')),
  ip inet NULL,
  user_agent text NULL,
  error_code text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_events_tenant_time ON public.auth_events(tenant_id, created_at);

-- [AUDIT-CONFLICT] mfa_challenges:
--   Migración 20260301120000 (autoritativa, ejecutada): columna 'code_hash' NOT NULL + 'context' jsonb.
--   DB_MAESTRA §2.1 documenta 'otp_hash' NULL y omite 'context' → ERROR DOCUMENTAL.
--   server/security/risk-engine.js usa 'code_hash' y 'context' → confirma la versión de la migración.
CREATE TABLE IF NOT EXISTS public.mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email_otp','app_otp','sms_otp')),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz NULL,
  risk_level text NOT NULL CHECK (risk_level IN ('LOW','MEDIUM','HIGH')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_tenant_user
  ON public.mfa_challenges (tenant_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_challenges_active
  ON public.mfa_challenges (tenant_id, user_id, expires_at) WHERE verified_at IS NULL;
```

---

## 4. SCHEMA `public` — SUSCRIPCIONES Y BILLING

```sql
-- [AUDIT-OK] Parte 1 §5 + DB_MAESTRA §2.1. Consumo real: server/middleware/financial-state.js,
-- server/security/audit.js (plan_policies, payment_transactions). Frontend admin (src/) consume plan_policies.

CREATE TABLE IF NOT EXISTS public.plan_policies (
  plan_id text PRIMARY KEY REFERENCES public.cat_plan_types(id),
  retention_days int NOT NULL DEFAULT 180 CHECK (retention_days BETWEEN 30 AND 3650),
  max_sedes int NOT NULL DEFAULT 1 CHECK (max_sedes >= 1),
  max_licenses int NOT NULL DEFAULT 1 CHECK (max_licenses >= 1),
  can_use_terminals boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- Seed documentado: basic(180d,1 sede,3 lic), pro(365d,5,30,terminals), enterprise(730d,999,999,terminals)

CREATE TABLE IF NOT EXISTS public.subscription_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  current_plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_id text NOT NULL DEFAULT 'PENDING' REFERENCES public.cat_subscription_statuses(id),
  cycle_start date NULL,
  cycle_end date NULL,
  billing_day int NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  grace_days int NOT NULL DEFAULT 7 CHECK (grace_days BETWEEN 0 AND 60),
  read_only_at timestamptz NULL,
  suspended_at timestamptz NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,   -- FK añadida en Parte 1 §14
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscription_contracts_tenant ON public.subscription_contracts(tenant_id);
-- [AUDIT-CONFLICT] fn_bootstrap_tenant de Parte 1 inserta subscription_contracts(plan_id,...) pero la
-- versión vigente (migración 20260302125000) inserta (current_plan_id, status_id, billing_day, grace_days)
-- con ON CONFLICT (tenant_id). La columna real es current_plan_id; Parte 1 está desactualizada.

CREATE TABLE IF NOT EXISTS public.entitlements (
  tenant_id uuid PRIMARY KEY DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  max_sedes int NOT NULL,
  max_licenses int NOT NULL,
  can_use_terminals boolean NOT NULL,
  effective_from timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_entitlements_tenant ON public.entitlements(tenant_id);

CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  from_plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  to_plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_id text NOT NULL DEFAULT 'CHG-SUBMITTED' REFERENCES public.cat_subscription_change_statuses(id),
  requested_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  idempotency_key text NULL UNIQUE,
  notes text NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_subscription_changes_tenant ON public.subscription_changes(tenant_id);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_number text NULL,
  status_id text NOT NULL DEFAULT 'DRAFT' REFERENCES public.cat_invoice_statuses(id),
  currency text NOT NULL DEFAULT 'PEN',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  tax numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  period_start date NULL,
  period_end date NULL,
  issued_at timestamptz NULL,
  due_at timestamptz NULL,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON public.invoices(tenant_id);

CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  qty int NOT NULL DEFAULT 1 CHECK (qty >= 1),
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON public.invoice_lines(invoice_id);
-- [AUDIT-DEAD?] invoice_lines: sin referencias en frontend ni server. Solo definición estructural.

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  method_type text NOT NULL CHECK (method_type IN ('card_token','bank_transfer','cash','other')),
  provider text NULL,                            -- 'visa','mastercard','yape','plin','manual'
  token_ref text NULL,
  last4 text NULL,
  holder_name text NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant ON public.payment_methods(tenant_id);
-- [AUDIT-DEAD?] payment_methods: sin referencias en frontend ni server.

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid NULL REFERENCES public.invoices(id) ON DELETE SET NULL,
  subscription_change_id uuid NULL REFERENCES public.subscription_changes(id) ON DELETE SET NULL,
  status_id text NOT NULL DEFAULT 'CREATED' REFERENCES public.cat_payment_statuses(id),
  currency text NOT NULL DEFAULT 'PEN',
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  payment_method_id uuid NULL REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  provider text NULL,
  external_payment_id text NULL,
  external_reference text NULL,
  idempotency_key text NULL UNIQUE,
  created_by uuid NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  raw_payload jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant ON public.payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_public_payment_transactions_tenant_created_at
  ON public.payment_transactions(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL,  -- puede ser global
  provider text NOT NULL,
  event_id text NOT NULL,
  signature_valid boolean NOT NULL DEFAULT false,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz NULL,
  payload jsonb NOT NULL,
  UNIQUE (provider, event_id)                    -- idempotencia de webhooks
);
CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_tenant ON public.payment_webhook_events(tenant_id);
-- [AUDIT-DEAD?] payment_webhook_events: sin referencias en frontend ni server (no hay endpoint de webhooks implementado).
```

---

## 5. SCHEMA `public` — AUDITORÍA CORE

```sql
-- [AUDIT-CONFLICT] Existen DOS modelos de audit_logs en las fuentes:
--   (a) Parte 1 §10 (documental, ANTIGUO): columnas schema_name, table_name, operation, record_pk,
--       old_data, new_data, changed_by. Coherente con la versión ANTIGUA de fn_trigger_audit_universal (Parte 1 §11).
--   (b) DB_MAESTRA §2.1 + migraciones 20260302125000 / 20260510100000 (VIGENTE): columnas
--       event_type, resource_name, payload_before, payload_after, actor_id, criticality, retention_until, etc.
--       El código del server (server/security/audit.js) y las RPCs ACE insertan/leen contra el modelo (b).
--   SE RECONSTRUYE EL MODELO (b) COMO VIGENTE. El modelo (a) queda documentado como legacy.
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  sede_id uuid NULL,
  actor_id uuid NULL,
  actor_role_id uuid NULL,
  session_id uuid NULL,
  terminal_id uuid NULL,
  device_id uuid NULL,
  event_id uuid DEFAULT gen_random_uuid(),      -- correlación de eventos
  event_type text NOT NULL,                     -- 'INSERT','UPDATE','DELETE','ONBOARDING_COMPLETED', custom
  resource_name text NOT NULL,
  result text NOT NULL DEFAULT 'success' CHECK (result IN ('success','error')),
  error_code text NULL,
  ip inet NULL,
  user_agent text NULL,
  criticality text NOT NULL DEFAULT 'medium' CHECK (criticality IN ('low','medium','high','critical')),
  payload_before jsonb NULL,
  payload_after jsonb NULL,
  retention_until timestamptz NULL,             -- calculado por plan_policies.retention_days (default 180)
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_public_audit_logs_tenant_created_at ON public.audit_logs(tenant_id, created_at);
```

---

## 6. SCHEMA `public` — MÓDULOS DEL SISTEMA

```sql
-- [AUDIT-OK] Parte 1 §9 + DB_MAESTRA §2.1
CREATE TABLE IF NOT EXISTS public.system_modules (
  codigo text PRIMARY KEY,                      -- 'ong','rrhh','finanzas',...
  nombre text NOT NULL,
  schema_name text NOT NULL,
  current_version text NOT NULL,
  is_core boolean NOT NULL,
  is_transversal boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- [AUDIT-DEAD?] system_modules: sin referencias directas en frontend/server (solo fn_is_module_enabled la usa indirectamente vía tenant_modules).

CREATE TABLE IF NOT EXISTS public.tenant_modules (
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_code text NOT NULL REFERENCES public.system_modules(codigo),
  status_code text REFERENCES public.cat_module_statuses(codigo),
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (tenant_id, module_code)
);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant ON public.tenant_modules(tenant_id);
```

---

## 7. SCHEMA `public` — ACE (ACCESS & CONTEXT ENGINE)

```sql
-- [AUDIT-OK] Migración 20260510000000_ace_fase0_base_structures (fuente autoritativa, verbatim).

CREATE TABLE IF NOT EXISTS public.access_links (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id        uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code             text        NOT NULL UNIQUE,
  slug             text,
  type             text        NOT NULL
                               CHECK (type IN ('VOLUNTEER_JOIN','STAFF_JOIN','BENEFICIARY_JOIN','GENERIC')),
  target_type      text        NOT NULL
                               CHECK (target_type IN ('PROJECT','PROGRAM','ACTIVITY','SEDE','GLOBAL')),
  target_id        uuid,
  assigned_role_id uuid        REFERENCES public.roles(id) ON DELETE SET NULL,
  assigned_sede_id uuid        REFERENCES public.sedes(id) ON DELETE SET NULL,
  onboarding_flow  text,
  max_uses         int         NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  used_count       int         NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  expires_at       timestamptz,
  is_active        boolean     NOT NULL DEFAULT true,
  metadata         jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  created_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by       uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_access_links_tenant ON public.access_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_access_links_code   ON public.access_links(code);
CREATE INDEX IF NOT EXISTS idx_access_links_active ON public.access_links(tenant_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_access_links_target ON public.access_links(tenant_id, target_type, target_id);
-- FASE 4:
CREATE INDEX IF NOT EXISTS idx_access_links_available
  ON public.access_links(code) WHERE is_active = true AND used_count < max_uses;

CREATE TABLE IF NOT EXISTS public.memberships (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  context_type text        NOT NULL CHECK (context_type IN ('PROYECTO','SEDE','PROGRAMA','ACTIVIDAD')),
  context_id   uuid        NOT NULL,
  role_id      uuid        REFERENCES public.roles(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE (tenant_id, user_id, context_type, context_id)
);
CREATE INDEX IF NOT EXISTS idx_memberships_tenant  ON public.memberships(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memberships_user    ON public.memberships(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_context ON public.memberships(tenant_id, context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_memberships_active  ON public.memberships(tenant_id, status) WHERE status = 'active';
-- FASE 3:
CREATE INDEX IF NOT EXISTS idx_memberships_user_active ON public.memberships(user_id, status) WHERE status = 'active';
-- FASE 4:
CREATE INDEX IF NOT EXISTS idx_memberships_active_lookup
  ON public.memberships(tenant_id, user_id, context_id) WHERE status = 'active';

CREATE TABLE IF NOT EXISTS public.dynamic_forms (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    uuid        NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  context_type text,
  form_schema  jsonb       NOT NULL DEFAULT '{}'::jsonb,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_tenant ON public.dynamic_forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_active ON public.dynamic_forms(tenant_id, is_active) WHERE is_active = true;
-- [AUDIT-DEAD?] dynamic_forms: solo tipado en app-database.ts; ningún servicio la consulta aún.

CREATE TABLE IF NOT EXISTS public.role_module_access (
  tenant_id   uuid    NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id     uuid    NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  module_code text    NOT NULL,
  can_view    boolean NOT NULL DEFAULT false,
  can_create  boolean NOT NULL DEFAULT false,
  can_edit    boolean NOT NULL DEFAULT false,
  can_delete  boolean NOT NULL DEFAULT false,
  PRIMARY KEY (role_id, module_code)
);
CREATE INDEX IF NOT EXISTS idx_role_module_access_tenant ON public.role_module_access(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_module_access_role   ON public.role_module_access(role_id);
-- [AUDIT-DEAD?] role_module_access: solo tipado; sin consultas en servicios.

CREATE TABLE IF NOT EXISTS public.role_field_permissions (
  id          uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid    NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id     uuid    NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  entity_name text    NOT NULL,                 -- formato 'schema.tabla'
  field_name  text    NOT NULL,
  can_view    boolean NOT NULL DEFAULT true,
  can_edit    boolean NOT NULL DEFAULT false,
  UNIQUE (role_id, entity_name, field_name)
);
CREATE INDEX IF NOT EXISTS idx_role_field_perms_tenant ON public.role_field_permissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_role_field_perms_role   ON public.role_field_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_field_perms_entity ON public.role_field_permissions(role_id, entity_name);
-- [AUDIT-DEAD?] role_field_permissions: solo tipado; sin consultas en servicios.
```

---

## 8. SCHEMA `ong` — OPERACIONES DE LA ONG

```sql
-- [AUDIT-OK] Parte 2 §2-6 + Parte 4 + migración ONG 20260501_fix_hierarchy. Uso intensivo confirmado
-- (voluntarios: 76 refs, actividades: 69, proyectos: 54 en frontend).

-- Catálogos ONG (sin tenant_id)
CREATE TABLE IF NOT EXISTS ong.estados_voluntario (
  codigo varchar(50) PRIMARY KEY,               -- 'activo','inactivo','suspendido','en_proceso'
  nombre_estado varchar(100) NOT NULL,
  descripcion text NULL,
  orden_visual int NOT NULL
);
CREATE TABLE IF NOT EXISTS ong.unidades_medida (
  codigo varchar(50) PRIMARY KEY,               -- 'UND','KG','LT','CJA'
  nombre varchar(100) NOT NULL,
  abreviatura varchar(20) NOT NULL
);
CREATE TABLE IF NOT EXISTS ong.estados_objeto (
  codigo varchar(50) PRIMARY KEY,               -- 'disponible','en_uso','dañado','baja'
  nombre varchar(100) NOT NULL,
  descripcion text NULL
);
CREATE TABLE IF NOT EXISTS ong.estados_proyecto (
  codigo varchar(50) PRIMARY KEY,               -- 'planificacion','en_progreso','completado','cancelado'
  nombre_estado varchar(100) NOT NULL,
  orden_visual int NOT NULL
);
CREATE TABLE IF NOT EXISTS ong.tipo_transaccion_inventario (
  codigo varchar(50) PRIMARY KEY,               -- 'ENTRADA','SALIDA','TRASLADO','AJUSTE'
  nombre varchar(100) NOT NULL,
  signo smallint NOT NULL                       -- -1 salida, 1 entrada, 0 neutro
);

-- Estructura operativa
CREATE TABLE IF NOT EXISTS ong.areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(50) NOT NULL,
  nombre_area varchar(150) NOT NULL,
  descripcion text NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  CONSTRAINT uq_ong_areas_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_areas_tenant_nombre UNIQUE (tenant_id, nombre_area)
);

CREATE TABLE IF NOT EXISTS ong.ubicaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(50) NOT NULL,
  nombre_ubicacion varchar(255) NOT NULL,
  direccion text NOT NULL DEFAULT 'Sin dirección',
  latitud numeric(10,7) NULL,
  longitud numeric(10,7) NULL,
  activa boolean NOT NULL DEFAULT true,
  imagen_url text NULL,
  codigo_pais varchar(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  CONSTRAINT uq_ong_ubicaciones_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_ubicaciones_tenant_nombre UNIQUE (tenant_id, nombre_ubicacion)
);

CREATE TABLE IF NOT EXISTS ong.items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(100) NOT NULL,
  nombre_item varchar(255) NOT NULL,
  descripcion text NOT NULL,
  codigo_unidad_medida varchar(50) NOT NULL REFERENCES ong.unidades_medida(codigo),
  codigo_estado_objeto varchar(50) NOT NULL REFERENCES ong.estados_objeto(codigo),
  sku varchar(100) NULL,
  imagen_url text NULL,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_items_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_items_tenant_nombre UNIQUE (tenant_id, nombre_item)
);

-- Personas
CREATE TABLE IF NOT EXISTS ong.voluntarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  iam_user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  numero_documento varchar(50) NOT NULL,
  tipo_documento varchar(10) REFERENCES public.cat_tipos_documento(codigo),
  genero varchar(10) REFERENCES public.cat_generos(codigo),
  codigo_pais varchar(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  nombre varchar(150) NOT NULL,
  apellido varchar(150) NOT NULL,
  fecha_nacimiento date NULL,
  email varchar(255) NULL CHECK (email IS NULL OR position('@' IN email) > 1),
  telefono varchar(50) NULL,
  ruta_foto text NULL,
  codigo_estado varchar(50) NOT NULL REFERENCES ong.estados_voluntario(codigo),
  observaciones text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_voluntarios_tenant_tipo_numdoc UNIQUE (tenant_id, tipo_documento, numero_documento),
  CONSTRAINT uq_ong_voluntarios_tenant_email UNIQUE (tenant_id, email)
);
-- [AUDIT-DOUBT] fn_complete_access_onboarding inserta voluntarios con numero_documento='PENDIENTE' cuando
-- falta metadata: puede chocar con uq_ong_voluntarios_tenant_tipo_numdoc si hay 2+ onboardings sin documento
-- y mismo tipo_documento NULL... (NULL en tipo_documento hace el UNIQUE no aplicable en PG estándar). Revisión manual.
-- [AUDIT-NOTE] iam_user_id NO tiene UNIQUE (confirmado explícitamente en comentario de migración 20260510100000).

CREATE TABLE IF NOT EXISTS ong.beneficiarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_documento varchar(50) NULL,
  tipo_documento varchar(10) REFERENCES public.cat_tipos_documento(codigo),
  codigo_pais varchar(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  nombre varchar(150) NOT NULL,
  apellido varchar(150) NOT NULL,
  fecha_nacimiento date NULL,
  genero varchar(10) NULL REFERENCES public.cat_generos(codigo),
  telefono varchar(50) NULL,
  direccion text NULL,
  foto_url text NULL,
  observaciones text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_beneficiarios_tenant_tipo_numdoc UNIQUE (tenant_id, tipo_documento, numero_documento)
);

-- Jerarquía Proyecto → Actividad → Tarea (orden canónico POST-migración 20260501)
CREATE TABLE IF NOT EXISTS ong.proyectos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(50) NOT NULL,
  nombre_proyecto varchar(255) NOT NULL,
  descripcion text NOT NULL,
  fecha_inicio date NULL,
  fecha_fin date NULL,
  id_area uuid NOT NULL REFERENCES ong.areas(id),
  codigo_estado varchar(50) NOT NULL REFERENCES ong.estados_proyecto(codigo),
  presupuesto numeric(18,2) NOT NULL DEFAULT 0 CHECK (presupuesto >= 0),
  imagen_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_proyectos_tenant_codigo UNIQUE (tenant_id, codigo)
);

-- [AUDIT-CONFLICT] JERARQUÍA:
--   Versión ORIGINAL (Parte 2 §5): tareas.id_proyecto NOT NULL (tarea hija de proyecto) y
--   actividades.id_tarea NOT NULL (actividad hija de tarea). Cadena: Proyecto → Tarea → Actividad.
--   Versión VIGENTE (ONG/supabase/migrations/20260501_fix_hierarchy_actividades_tareas.sql):
--   actividades.id_proyecto (NULL, FK proyectos ON DELETE CASCADE) y tareas.id_actividad (NULL, FK actividades
--   ON DELETE SET NULL). Cadena: Proyecto → Actividad → Tarea. Columnas antiguas ELIMINADAS (DROP COLUMN).
--   Las tareas existentes quedaron con id_actividad = NULL hasta reasignación manual vía UI (paso 3 de la migración).
CREATE TABLE IF NOT EXISTS ong.actividades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto uuid NULL REFERENCES ong.proyectos(id) ON DELETE CASCADE,   -- migración 20260501
  titulo varchar(200) NOT NULL,
  descripcion text NULL,                                                  -- Parte 4 §3
  codigo_estado varchar(50) NOT NULL DEFAULT 'pendiente',                 -- Parte 4 §3
  fecha_inicio timestamptz NULL,
  fecha_fin timestamptz NULL,
  id_ubicacion uuid NULL REFERENCES ong.ubicaciones(id) ON DELETE SET NULL,
  horas_estimadas numeric(5,2) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  CONSTRAINT ck_ong_actividades_codigo_estado
    CHECK (codigo_estado IN ('pendiente','planificada','en_progreso','completada','cancelada'))
);
CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_estado ON ong.actividades (tenant_id, codigo_estado);
CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_fechas ON ong.actividades (tenant_id, fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_actividades_id_proyecto ON ong.actividades(id_proyecto);

CREATE TABLE IF NOT EXISTS ong.tareas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NULL REFERENCES ong.actividades(id) ON DELETE SET NULL, -- migración 20260501
  titulo varchar(200) NOT NULL,
  descripcion text NULL,
  estado varchar(50) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','en_progreso','completada','cancelada')),
  fecha_limite date NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE INDEX IF NOT EXISTS idx_tareas_id_actividad ON ong.tareas(id_actividad);

-- Operaciones de actividades
CREATE TABLE IF NOT EXISTS ong.horas_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id),
  id_voluntario uuid NOT NULL,                  -- [AUDIT-DOUBT] sin FK explícita a ong.voluntarios en Parte 2; Parte 3 §C pudo añadirla. Revisión manual.
  horas_registradas numeric(5,2) NOT NULL CHECK (horas_registradas > 0),
  fecha date NOT NULL,
  estado_aprobacion varchar(50) DEFAULT 'pendiente'
    CHECK (estado_aprobacion IN ('pendiente','aprobada','rechazada')),
  aprobado_por uuid NULL,
  id_aprobacion uuid NULL REFERENCES ong.aprobaciones(id) ON DELETE SET NULL,  -- Parte 4 §5
  comentario_resolucion text NULL,                                             -- Parte 4 §5
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS ong.asignaciones_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id),
  id_voluntario uuid NOT NULL,
  rol_en_actividad varchar(100) NULL,
  is_deleted boolean NOT NULL DEFAULT false,    -- Parte 4 §2 (soft-delete)
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS ong.evidencias_actividad (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id),
  id_voluntario uuid NOT NULL,
  url_archivo text NOT NULL,
  tipo_evidencia varchar(50) DEFAULT 'foto',
  comentario text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- [AUDIT-OK] Parte 4 §4 (verbatim)
CREATE TABLE IF NOT EXISTS ong.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id) ON DELETE CASCADE,
  fecha_operacion date NOT NULL DEFAULT CURRENT_DATE,
  check_in_at timestamptz NULL,
  check_out_at timestamptz NULL,
  origen_registro varchar(30) NOT NULL DEFAULT 'scan' CHECK (origen_registro IN ('scan','manual','import')),
  estado varchar(30) NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente','tardanza','ausente','justificado','pendiente')),
  observacion text NULL,
  qr_payload text NULL,
  id_card_id uuid NULL,                         -- FK diferida: fk_ong_asistencias_id_card (tras crear id_cards)
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_ong_asistencia_unica_abierta UNIQUE (tenant_id, id_actividad, id_voluntario, fecha_operacion)
);
CREATE INDEX IF NOT EXISTS idx_ong_asistencias_tenant_fecha ON ong.asistencias (tenant_id, fecha_operacion, estado);
ALTER TABLE IF EXISTS ong.asistencias
  ADD CONSTRAINT fk_ong_asistencias_id_card
  FOREIGN KEY (id_card_id) REFERENCES ong.id_cards(id) ON DELETE SET NULL;
-- [AUDIT-SYNTAX] El ADD CONSTRAINT anterior NO es idempotente en el script fuente (Parte 4 §9): re-ejecutar falla por duplicado.

-- [AUDIT-OK] Parte 4 §5 — Bandeja genérica de aprobaciones
CREATE TABLE IF NOT EXISTS ong.aprobaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  modulo varchar(50) NOT NULL,
  entidad_schema varchar(100) NOT NULL,
  entidad_tabla varchar(100) NOT NULL,
  entidad_id uuid NOT NULL,
  tipo_aprobacion varchar(50) NOT NULL CHECK (tipo_aprobacion IN ('hora','evidencia','admision','finanza','otro')),
  estado varchar(30) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada','devuelta')),
  comentario text NULL,
  solicitado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resuelto_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_ong_aprobaciones_tenant_estado ON ong.aprobaciones (tenant_id, estado, tipo_aprobacion);

-- Proyectos — relaciones
CREATE TABLE IF NOT EXISTS ong.recursos_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto uuid NOT NULL REFERENCES ong.proyectos(id),
  id_item uuid NOT NULL REFERENCES ong.items(id),
  cantidad_requerida numeric NOT NULL,
  cantidad_asignada numeric NULL,
  is_deleted boolean NOT NULL DEFAULT false,    -- Parte 4 §2
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS ong.asignaciones_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto uuid NOT NULL REFERENCES ong.proyectos(id),
  id_voluntario uuid NOT NULL,
  rol_en_proyecto varchar(100) NULL,
  fecha_ingreso date NULL,
  activo boolean NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS ong.participaciones_proyecto (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto uuid NOT NULL REFERENCES ong.proyectos(id),
  id_beneficiario uuid NOT NULL,
  observaciones text NULL,
  fecha_vinculacion date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- [AUDIT-DEAD?] Las 3 tablas siguientes (Parte 2 §5) NO aparecen en frontend/server ni en DB_MAESTRA:
CREATE TABLE IF NOT EXISTS ong.activity_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id),
  descripcion_requisito text NOT NULL,
  es_obligatorio boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE TABLE IF NOT EXISTS ong.logros_beneficiario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_beneficiario uuid NOT NULL,
  titulo_logro varchar(200) NOT NULL,
  fecha_logro date NOT NULL,
  descripcion text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE TABLE IF NOT EXISTS ong.supervisiones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto uuid NOT NULL,
  supervisor_id uuid NOT NULL,
  fecha_asignacion date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- Inventario — movimientos
CREATE TABLE IF NOT EXISTS ong.transacciones_inventario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_item uuid NOT NULL REFERENCES ong.items(id),
  codigo_tipo_transaccion varchar(50) NOT NULL REFERENCES ong.tipo_transaccion_inventario(codigo),
  cantidad numeric NOT NULL,
  id_ubicacion_origen uuid NULL REFERENCES ong.ubicaciones(id),
  id_ubicacion_destino uuid NULL REFERENCES ong.ubicaciones(id),
  fecha_transaccion timestamptz NULL,
  registrado_por uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- Índices tenant (Parte 2 §7)
CREATE INDEX IF NOT EXISTS idx_ong_areas_tenant ON ong.areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_ubic_tenant ON ong.ubicaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_items_tenant ON ong.items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_voluntarios_tenant ON ong.voluntarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_benef_tenant ON ong.beneficiarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_proyectos_tenant ON ong.proyectos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_tareas_tenant ON ong.tareas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant ON ong.actividades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_horas_actividad_tenant ON ong.horas_actividad(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_asignaciones_actividad_tenant ON ong.asignaciones_actividad(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_participaciones_proyecto_tenant ON ong.participaciones_proyecto(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_transacciones_inventario_tenant ON ong.transacciones_inventario(tenant_id);
-- Índices de hardening (Parte 3 §E)
CREATE INDEX IF NOT EXISTS idx_ong_voluntarios_tenant_numdoc ON ong.voluntarios(tenant_id, numero_documento);
CREATE INDEX IF NOT EXISTS idx_ong_beneficiarios_tenant_numdoc ON ong.beneficiarios(tenant_id, numero_documento);
CREATE INDEX IF NOT EXISTS idx_ong_tareas_tenant_created_at ON ong.tareas(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_created_at ON ong.actividades(tenant_id, created_at);

-- Credenciales ID (Parte 4 §9 + ONG/supabase/Configuracion_Supabase.md)
CREATE TABLE IF NOT EXISTS ong.id_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre varchar(150) NOT NULL,
  base_image_url text NOT NULL,
  template_width integer NOT NULL CHECK (template_width > 0),
  template_height integer NOT NULL CHECK (template_height > 0),
  template_config jsonb NULL,                   -- añadida por Configuracion_Supabase.md (schema V2: {version:2, metadata, layers})
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ong.id_card_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_template uuid NOT NULL REFERENCES ong.id_card_templates(id) ON DELETE CASCADE,
  field_key varchar(50) NOT NULL CHECK (field_key IN ('foto','nombre','dni','codigo','qr')),
  pos_x numeric(10,2) NOT NULL,
  pos_y numeric(10,2) NOT NULL,
  width numeric(10,2) NULL,
  height numeric(10,2) NULL,
  font_size numeric(10,2) NULL,
  font_family varchar(100) NULL,
  font_weight varchar(50) NULL,
  color_hex varchar(20) NULL,
  z_index integer NOT NULL DEFAULT 1,           -- [AUDIT-CONFLICT] DB_MAESTRA documenta DEFAULT 0; Parte 4 (ejecutable) usa DEFAULT 1.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_id_card_template_field UNIQUE (id_template, field_key)
);

CREATE TABLE IF NOT EXISTS ong.id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id) ON DELETE CASCADE,
  id_template uuid NOT NULL REFERENCES ong.id_card_templates(id) ON DELETE RESTRICT,
  card_code varchar(50) NOT NULL,
  qr_payload text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  estado varchar(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa','revocada','expirada')),
  image_render_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_id_cards_code UNIQUE (tenant_id, card_code),
  CONSTRAINT uq_ong_id_cards_voluntario UNIQUE (tenant_id, id_voluntario)   -- 1 credencial activa por voluntario
);
```

---

## 9. SCHEMA `rrhh` — RECURSOS HUMANOS / ADMISIÓN

```sql
-- [AUDIT-OK] Parte 2 §12 + Parte 4 §7-8 + DB_MAESTRA §2.3. Uso confirmado (solicitudes_admision: 30 refs).

CREATE TABLE IF NOT EXISTS rrhh.solicitudes_admision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombres text NOT NULL,
  apellidos text NOT NULL,
  email text NOT NULL,
  estado text NULL CHECK (estado IN ('nueva','en_entrevista','aprobada','rechazada')),
  fecha_solicitud timestamptz NULL,
  notas text NULL,
  id_voluntario_vinculado uuid NULL REFERENCES ong.voluntarios(id) ON DELETE SET NULL,  -- Parte 4 §7
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE INDEX IF NOT EXISTS idx_rrhh_solicitudes_tenant_fecha ON rrhh.solicitudes_admision(tenant_id, fecha_solicitud); -- Parte 3 §E

CREATE TABLE IF NOT EXISTS rrhh.documentos_admision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_solicitud uuid NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  tipo_documento text NOT NULL,
  archivo_url text NOT NULL,
  verificado boolean NULL,
  verified_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,   -- Parte 4 §7
  verified_at timestamptz NULL,                                          -- Parte 4 §7
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.entrevistas_admision (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_solicitud uuid NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  entrevistador_id uuid NOT NULL REFERENCES auth.users(id),
  fecha_entrevista timestamptz NOT NULL,
  comentarios text NULL,
  resultado text NULL CHECK (resultado IN ('apto','no_apto','pendiente')),
  puntaje numeric(5,2) NULL CHECK (puntaje IS NULL OR (puntaje >= 0 AND puntaje <= 100)),  -- Parte 4 §7
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.admission_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre_requisito text NOT NULL,
  descripcion text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-DEAD?] admission_requirements / admission_requirement_reviews: no aparecen en los GRANT de la
-- migración 20260331 ni en servicios frontend detectados. Posible funcionalidad no implementada aún.

CREATE TABLE IF NOT EXISTS rrhh.admission_requirement_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud uuid NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  id_requisito uuid NOT NULL REFERENCES rrhh.admission_requirements(id),
  estado text NULL,
  revisado_por uuid NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.admision_estado_historial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud uuid NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  estado_anterior text NULL,
  estado_nuevo text NOT NULL,
  comentario text NULL,
  cambiado_por uuid NOT NULL REFERENCES auth.users(id),
  fecha_cambio timestamptz NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rrhh.onboarding_pasos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre_paso text NOT NULL,
  orden int NOT NULL,
  obligatorio boolean NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.onboarding_voluntario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  id_paso uuid NOT NULL REFERENCES rrhh.onboarding_pasos(id),
  completado boolean NULL DEFAULT false,
  fecha_completado timestamptz NULL,
  evidencia_url text NULL,                      -- Parte 4 §7
  is_deleted boolean NOT NULL DEFAULT false,    -- Parte 4 §2
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.habilidades (
  codigo text PRIMARY KEY,
  nombre text NOT NULL
);

CREATE TABLE IF NOT EXISTS rrhh.voluntario_habilidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  codigo_habilidad text NOT NULL REFERENCES rrhh.habilidades(codigo),
  nivel text NULL CHECK (nivel IN ('basico','intermedio','avanzado','experto')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.volunteer_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  disponibilidad_json jsonb NULL,
  distancia_max_km numeric NULL,
  quiere_viajar boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-DEAD?] volunteer_preferences: no está en los GRANT de 20260331 ni se detectó consumo en servicios.

CREATE TABLE IF NOT EXISTS rrhh.documentos_voluntario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  tipo_documento text NOT NULL,
  url_archivo text NOT NULL,
  fecha_vencimiento date NULL,
  vigente boolean NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.roles_operativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre_rol text NOT NULL,
  descripcion text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.asignaciones_rol (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  id_rol_operativo uuid NOT NULL REFERENCES rrhh.roles_operativos(id),
  fecha_asignacion date NULL,
  activo boolean NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS rrhh.perfil_coordinador (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id),
  anios_experiencia int NULL,
  departamento_asignado text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- [AUDIT-OK] Parte 4 §8 (verbatim). Origen legacy del motor ACE (migrada a access_links en ACE FASE 2).
CREATE TABLE IF NOT EXISTS rrhh.codigos_registro_voluntario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(32) NOT NULL,
  email_objetivo varchar(255) NULL,
  numero_documento_objetivo varchar(50) NULL,
  nombres_objetivo varchar(150) NULL,
  apellidos_objetivo varchar(150) NULL,
  id_solicitud uuid NULL REFERENCES rrhh.solicitudes_admision(id) ON DELETE SET NULL,
  id_voluntario uuid NULL REFERENCES ong.voluntarios(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  use_count integer NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  estado varchar(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo','consumido','expirado','revocado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_rrhh_codigo_registro UNIQUE (tenant_id, codigo)
);
-- [AUDIT-NOTE] Coexiste con public.access_links (ACE). ACE FASE 2 copió sus registros a access_links
-- pero la tabla legacy sigue viva y sigue siendo escrita por rrhh.fn_generate_registration_code y
-- consumida por la Edge Function consume-volunteer-registration-code. DOBLE FUENTE DE VERDAD — ver AUDIT_REPORT.

CREATE TABLE IF NOT EXISTS rrhh.registro_documentos_postulante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_codigo_registro uuid NOT NULL REFERENCES rrhh.codigos_registro_voluntario(id) ON DELETE CASCADE,
  tipo_documento varchar(50) NOT NULL,
  archivo_url text NOT NULL,
  verificado boolean NOT NULL DEFAULT false,
  verified_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);
```

---

## 10. SCHEMA `finanzas`

```sql
-- [AUDIT-OK] Parte 2 §10 + Parte 4 §10. Uso confirmado (cuentas/categorias/transacciones/comprobantes/aprobaciones_transaccion).

CREATE TABLE IF NOT EXISTS finanzas.cat_tipos_cuenta (      -- Parte 4 §10
  codigo varchar(50) PRIMARY KEY,
  nombre varchar(100) NOT NULL UNIQUE
);
-- Seeds: ('banco','Banco'), ('caja_chica','Caja chica'), ('pasarela','Pasarela')

CREATE TABLE IF NOT EXISTS finanzas.cuentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_cuenta varchar(100) NOT NULL,
  tipo_cuenta varchar(50) NOT NULL REFERENCES finanzas.cat_tipos_cuenta(codigo),
  -- [AUDIT-NOTE] CHECK original (banco|caja_chica|pasarela) fue reemplazado por FK en Parte 4 §10
  -- (DROP CONSTRAINT finanzas_cuentas_tipo_cuenta_check + ADD fk_finanzas_cuentas_tipo_cuenta).
  moneda varchar(3) NOT NULL DEFAULT 'USD' REFERENCES public.cat_monedas(codigo),
  saldo_actual numeric(15,2) NOT NULL DEFAULT 0.00,
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS finanzas.categorias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre varchar(100) NOT NULL,
  tipo varchar(20) NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS finanzas.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_cuenta uuid NOT NULL REFERENCES finanzas.cuentas(id),
  id_categoria uuid NOT NULL REFERENCES finanzas.categorias(id),
  tipo varchar(20) NOT NULL CHECK (tipo IN ('ingreso','egreso')),
  monto numeric(15,2) NOT NULL CHECK (monto > 0),
  fecha_transaccion date NOT NULL DEFAULT CURRENT_DATE,
  descripcion text NULL,
  comprobante_url text NULL,
  id_proyecto uuid NULL,                        -- [AUDIT-DOUBT] sin FK a ong.proyectos en el script; Parte 3 §C pudo añadirla. Revisión manual.
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE INDEX IF NOT EXISTS idx_finanzas_transacciones_tenant_fecha ON finanzas.transacciones(tenant_id, fecha_transaccion);

CREATE TABLE IF NOT EXISTS finanzas.comprobantes_financieros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_transaccion uuid NOT NULL REFERENCES finanzas.transacciones(id),
  tipo_comprobante varchar(50) NOT NULL,
  numero_comprobante varchar(100) NOT NULL,
  emisor_ruc_dni varchar(50) NULL,
  emisor_nombre varchar(200) NULL,
  url_archivo text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS finanzas.aprobaciones_transaccion (   -- Parte 4 §10
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id() REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_transaccion uuid NOT NULL REFERENCES finanzas.transacciones(id) ON DELETE CASCADE,
  estado varchar(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobada','rechazada')),
  comentario text NULL,
  solicitado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resuelto_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fin_cuentas_tenant ON finanzas.cuentas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_categorias_tenant ON finanzas.categorias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_transacciones_tenant ON finanzas.transacciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_comprobantes_tenant ON finanzas.comprobantes_financieros(tenant_id);
```

---

## 11. SCHEMA `donaciones` — [AUDIT-DEAD?] MÓDULO COMPLETO SIN USO

```sql
-- [AUDIT-DEAD?] Evidencia: 0 referencias en src/, ONG/src, server/. No aparece en app-database.ts,
-- ni en los GRANT de 20260331, ni en DB_MAESTRA §2 (que ni lo lista en su TOC). Solo existe en Parte 2 §11
-- y en el preflight de Parte 3. Conservar y decidir en revisión manual.

CREATE TABLE IF NOT EXISTS donaciones.donantes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre varchar(150) NOT NULL,
  apellidos varchar(150) NULL,
  email varchar(255) NULL,
  telefono varchar(50) NULL,
  tipo_donante varchar(50) DEFAULT 'individual' CHECK (tipo_donante IN ('individual','corporativo','fundacion')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS donaciones.campanas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre varchar(200) NOT NULL,
  meta_recaudacion numeric(15,2) NOT NULL DEFAULT 0.00,
  fecha_inicio date NOT NULL,
  fecha_fin date NULL,
  estado varchar(50) DEFAULT 'activa' CHECK (estado IN ('planificada','activa','finalizada')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS donaciones.ingresos_donacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante uuid NOT NULL REFERENCES donaciones.donantes(id),
  id_campana uuid NULL REFERENCES donaciones.campanas(id),
  monto numeric(15,2) NOT NULL CHECK (monto > 0),
  fecha_donacion date NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago varchar(50) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
CREATE INDEX IF NOT EXISTS idx_donaciones_ingresos_tenant_fecha ON donaciones.ingresos_donacion(tenant_id, fecha_donacion); -- Parte 3 §E

CREATE TABLE IF NOT EXISTS donaciones.donor_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante uuid NOT NULL REFERENCES donaciones.donantes(id),
  tipo_interaccion varchar(50) CHECK (tipo_interaccion IN ('llamada','email','reunion','evento')),
  notas text NOT NULL,
  fecha_interaccion timestamptz DEFAULT now(),
  realizado_por uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donaciones.donor_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante uuid NOT NULL REFERENCES donaciones.donantes(id),
  id_campana uuid NULL REFERENCES donaciones.campanas(id),
  monto_prometido numeric(15,2) NOT NULL,
  fecha_promesa date NOT NULL,
  fecha_esperada_pago date NULL,
  estado varchar(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','cumplida','cancelada')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
```

---

## 12. SCHEMA `clinico`

```sql
-- [AUDIT-OK] Parte 2 §13 + Parte 4 §6. Uso confirmado (fichas_medicas, ficha_sensible_voluntario,
-- perfil_nino, perfil_adulto_mayor, accesos_sensibles_log, accesos_sensibles_voluntario_log).

CREATE TABLE IF NOT EXISTS clinico.fichas_medicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario uuid NOT NULL,                -- [AUDIT-DOUBT] sin FK explícita a ong.beneficiarios en Parte 2. Revisión manual.
  tipos_sangre varchar(10) NULL,
  alergias text NULL,
  condiciones_preexistentes text NULL,
  medicacion_actual text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS clinico.accesos_sensibles_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_ficha uuid NOT NULL REFERENCES clinico.fichas_medicas(id),
  usuario_id uuid NOT NULL,
  motivo text NULL,
  fecha_acceso timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinico.perfil_nino (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario uuid NOT NULL UNIQUE,
  nombre_tutor varchar(200) NOT NULL,
  telefono_tutor varchar(50) NULL,
  colegio varchar(200) NULL,
  grado_escolar varchar(50) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS clinico.perfil_adulto_mayor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario uuid NOT NULL UNIQUE,
  movilidad_reducida boolean DEFAULT false,
  vive_solo boolean DEFAULT false,
  contacto_emergencia varchar(200) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS clinico.ficha_sensible_voluntario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario uuid NOT NULL UNIQUE,
  condiciones_medicas text NULL,
  contacto_emergencia varchar(200) NULL,
  telefono_emergencia varchar(50) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

-- [AUDIT-OK] Parte 4 §6 (verbatim)
CREATE TABLE IF NOT EXISTS clinico.accesos_sensibles_voluntario_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_ficha_voluntario uuid NOT NULL REFERENCES clinico.ficha_sensible_voluntario(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  ip inet NULL,
  user_agent text NULL,
  fecha_acceso timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
```

---

## 13. SCHEMA `academico`

```sql
-- [AUDIT-OK] Parte 2 §14 + migración ONG 20260426. Uso confirmado (cursos, inscripciones, certificados).

CREATE TABLE IF NOT EXISTS academico.cursos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_curso varchar(200) NOT NULL,
  descripcion text NULL,
  horas_certificacion int DEFAULT 0,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS academico.inscripciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_curso uuid NOT NULL REFERENCES academico.cursos(id),
  id_voluntario uuid NOT NULL,
  estado varchar(50) DEFAULT 'inscrito' CHECK (estado IN ('inscrito','aprobado','reprobado')),
  nota numeric(4,2) NULL,                       -- migración ONG 20260426 (escala vigesimal 0-20)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  CONSTRAINT inscripciones_nota_rango CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20))
);
-- [AUDIT-SYNTAX] La migración 20260426 usa "ADD CONSTRAINT IF NOT EXISTS": PostgreSQL NO soporta
-- IF NOT EXISTS en ADD CONSTRAINT. Tal como está escrita, esa sentencia falla. Requiere revisión manual
-- (probablemente fue ejecutada a mano corregida, o nunca se aplicó el CHECK).

CREATE TABLE IF NOT EXISTS academico.certificados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_inscripcion uuid NOT NULL REFERENCES academico.inscripciones(id),
  url_certificado text NOT NULL,
  fecha_emision date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS academico.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_inscripcion uuid NOT NULL REFERENCES academico.inscripciones(id),
  fecha_clase date NOT NULL,
  asistio boolean DEFAULT false,
  minutos_asistidos int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-DEAD?] academico.asistencias: sin referencias detectadas en servicios (las asistencias usadas son ong.asistencias).
```

---

## 14. SCHEMA `gamificacion` — [AUDIT-DEAD?] MÓDULO COMPLETO SIN USO

```sql
-- [AUDIT-DEAD?] Evidencia: 0 referencias en frontend/server/app-database.ts/GRANTs/DB_MAESTRA. Solo Parte 2 §15.

CREATE TABLE IF NOT EXISTS gamificacion.insignias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre varchar(100) NOT NULL,
  descripcion text NULL,
  icono_url text NULL,
  puntos_requeridos int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.puntos_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario uuid NOT NULL,
  puntos_otorgados int NOT NULL,
  motivo text NOT NULL,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.volunteer_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario uuid NOT NULL,
  id_insignia uuid NOT NULL REFERENCES gamificacion.insignias(id),
  fecha_otorgamiento timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.gamification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  evento_trigger varchar(100) NOT NULL,
  puntos_a_otorgar int NOT NULL,
  id_insignia_premio uuid NULL REFERENCES gamificacion.insignias(id),
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.kudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  emisor_id uuid NOT NULL,
  receptor_id uuid NOT NULL,
  mensaje text NOT NULL,
  fecha timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
```

---

## 15. SCHEMA `impacto` — [AUDIT-DEAD?] MÓDULO COMPLETO SIN USO

```sql
-- [AUDIT-DEAD?] Evidencia: 0 referencias en frontend/server/app-database.ts/GRANTs/DB_MAESTRA. Solo Parte 2 §16.

CREATE TABLE IF NOT EXISTS impacto.ods_globales (
  ods_numero int PRIMARY KEY CHECK (ods_numero BETWEEN 1 AND 17),
  nombre varchar(200) NOT NULL,
  descripcion text NULL
);
-- Seed parcial: ODS 1-4. [AUDIT-NOTE] Solo 4 de 17 ODS seeded — seed incompleto.

CREATE TABLE IF NOT EXISTS impacto.kpi_indicadores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_kpi varchar(200) NOT NULL,
  unidad_medida varchar(50) NULL,
  meta_anual numeric(15,2) NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS impacto.kpi_mediciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_kpi uuid NOT NULL REFERENCES impacto.kpi_indicadores(id),
  valor_medido numeric(15,2) NOT NULL,
  fecha_medicion date NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS impacto.project_ods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_proyecto uuid NOT NULL,
  ods_numero int NOT NULL REFERENCES impacto.ods_globales(ods_numero),
  impacto_esperado text NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS impacto.kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_kpi uuid NOT NULL REFERENCES impacto.kpi_indicadores(id),
  periodo varchar(50) NOT NULL,
  valor_meta numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-NOTE] impacto.ods_globales tiene RLS habilitada con política SELECT-only para authenticated:
-- al ser catálogo global sin tenant_id, INSERT/UPDATE/DELETE quedan bloqueados para clientes (correcto).
```

---

## 16. SCHEMA `comunicaciones`

```sql
-- [AUDIT-OK] Parte 2 §17 + Parte 4 §11. Uso confirmado: historial_notificaciones (19 refs),
-- plantillas_notificacion, canales_notificacion.

CREATE TABLE IF NOT EXISTS comunicaciones.user_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_usuario uuid NOT NULL,
  device_token text NOT NULL,
  plataforma varchar(50) CHECK (plataforma IN ('ios','android','web')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-DEAD?] user_devices: sin uso detectado (no confundir con public.devices, que sí se usa).

CREATE TABLE IF NOT EXISTS comunicaciones.historial_notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_usuario uuid NOT NULL,
  titulo varchar(200) NOT NULL,
  mensaje text NOT NULL,
  leida boolean DEFAULT false,
  codigo_canal varchar(50) NULL,                             -- Parte 4 §11
  estado_entrega varchar(30) NOT NULL DEFAULT 'pendiente',   -- Parte 4 §11
  error_mensaje text NULL,                                   -- Parte 4 §11
  id_plantilla uuid NULL,                                    -- Parte 4 §11 (sin FK)
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,                -- Parte 4 §11
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  entidad varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  accion varchar(20) CHECK (accion IN ('INSERT','UPDATE','DELETE')),
  estado varchar(50) DEFAULT 'pendiente' CHECK (estado IN ('pendiente','procesado','error')),
  client_timestamp timestamptz NOT NULL,
  server_received_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);
-- [AUDIT-DEAD?] sync_queue: sin uso detectado (offline-sync no implementado).

CREATE TABLE IF NOT EXISTS comunicaciones.canales_notificacion (
  codigo varchar(50) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);
-- Seeds: ('email','Correo Electrónico'), ('push','Push App Móvil'), ('sms','Mensaje de Texto SMS')

CREATE TABLE IF NOT EXISTS comunicaciones.plantillas_notificacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  codigo_canal varchar(50) NOT NULL REFERENCES comunicaciones.canales_notificacion(codigo),
  nombre_plantilla varchar(150) NOT NULL,
  asunto text NULL,
  cuerpo_html text NULL,
  cuerpo_texto text NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,              -- Parte 4 §11
  codigo_evento varchar(100) NULL,                           -- Parte 4 §11
  activa boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.entity_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  entidad varchar(100) NOT NULL,
  registro_id uuid NOT NULL,
  version bigint NOT NULL DEFAULT 1,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  created_by uuid NULL,
  updated_by uuid NULL,
  UNIQUE (tenant_id, entidad, registro_id)
);
-- [AUDIT-DEAD?] entity_versions: sin uso detectado.
```

---

## 17. SCHEMA `auditoria`

```sql
-- [AUDIT-OK] Parte 2 §18. Uso confirmado: src/.../gobernanza/audit.service.ts lee auditoria.audit_log.
-- [AUDIT-DOUBT] Ningún trigger del repo escribe en auditoria.audit_log (los triggers escriben en
-- public.audit_logs). El único 'source' declarado es DEFAULT 'trigger'. Origen de datos: requiere revisión manual.

CREATE TABLE IF NOT EXISTS auditoria.audit_log (
  id_audit uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id(),
  table_name text NOT NULL,
  record_pk text NULL,
  action text NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  before_json jsonb NULL,
  after_json jsonb NULL,
  auth_user_id uuid NULL,
  event_at timestamptz NOT NULL DEFAULT now(),
  ip inet NULL,
  user_agent text NULL,
  correlation_id uuid NULL,
  source text NOT NULL DEFAULT 'trigger'
);
-- [AUDIT-NOTE] La migración ACE FASE 1 confirma explícitamente: "auditoria.logs_accesos NO existe".
```

---

## 18. FUNCIONES

### 18.1 `public.fn_current_tenant_id()` — VERSIÓN VIGENTE

```sql
-- [AUDIT-CONFLICT] Dos definiciones históricas:
--   (a) Parte 1 §11 (ANTIGUA): SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
--       (dependía de una variable de sesión que ningún código del repo establece → siempre NULL).
--   (b) Migraciones 20260302125000 / 20260305110000 / 20260305_rls_hardening (VIGENTE): lee profiles.
-- La versión (b) se redefine idénticamente en 3 migraciones distintas (redundancia idempotente).
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.fn_current_tenant_id() TO authenticated, service_role, anon;
```

### 18.2 `public.fn_set_updated_at()` — trigger genérico

```sql
-- [AUDIT-OK] Parte 1 §11. Prerrequisito verificado por guard de ACE FASE 0.
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

### 18.3 `public.fn_is_tenant_admin()`

```sql
-- [AUDIT-OK] Parte 1 §11. Usada masivamente en políticas RLS y frontend (18 llamadas RPC).
CREATE OR REPLACE FUNCTION public.fn_is_tenant_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_sedes urs
    JOIN public.role_permissions rp ON rp.role_id = urs.role_id
    WHERE urs.user_id = auth.uid()
      AND urs.tenant_id = public.fn_current_tenant_id()
      AND rp.permission = 'iam.admin'
  )
$$;
```

### 18.4 `public.fn_has_permission(...)` — [AUDIT-CONFLICT / AUDIT-DOUBT]

```sql
-- Definición encontrada en el repo (Parte 1 §11) — UN solo parámetro:
CREATE OR REPLACE FUNCTION public.fn_has_permission(p_permission text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_sedes urs
    JOIN public.role_permissions rp ON rp.role_id = urs.role_id
    WHERE urs.user_id = auth.uid()
      AND urs.tenant_id = public.fn_current_tenant_id()
      AND rp.permission = p_permission
  )
$$;
-- [AUDIT-DOUBT] CONTRADICCIÓN DE FIRMA:
--   * Migración ONG 20260331 hace: GRANT EXECUTE ON FUNCTION public.fn_has_permission(text, uuid)
--   * Todas las políticas RLS de hardening y ACE llaman: fn_has_permission('permiso', null)  → 2 argumentos
--   * Parte 4 (fn_generate_registration_code, fn_register_attendance_scan) llama con 1 argumento.
--   La definición de la versión (text, uuid) — presumiblemente (p_permission text, p_sede_id uuid DEFAULT NULL) —
--   NO existe en ningún archivo del repositorio. Si el 2º parámetro no tiene DEFAULT, las llamadas con
--   1 argumento fallarían. Requiere revisión manual contra la BD real.
```

### 18.5 `public.fn_validate_permission_exists()` — trigger

```sql
-- [AUDIT-OK] Parte 1 §11.
CREATE OR REPLACE FUNCTION public.fn_validate_permission_exists()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.cat_permissions p WHERE p.id = NEW.permission) THEN
    RAISE EXCEPTION 'Permiso no registrado en cat_permissions: %', NEW.permission;
  END IF;
  RETURN NEW;
END;
$$;
```

### 18.6 `public.fn_trigger_audit_universal()` — VERSIÓN VIGENTE

```sql
-- [AUDIT-CONFLICT] Dos versiones:
--   (a) Parte 1 §11 (ANTIGUA): sin argumentos TG_ARGV, insertaba en audit_logs(schema_name, table_name,
--       operation, record_pk, old_data, new_data, changed_by) → columnas del modelo legacy de audit_logs.
--   (b) Migración 20260302125000 (VIGENTE): usa TG_ARGV[0] = nombre de la columna tenant; omite el insert
--       si tenant_id es NULL; calcula retention_until por plan. SE RECONSTRUYE (b):
CREATE OR REPLACE FUNCTION public.fn_trigger_audit_universal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_col text := tg_argv[0];
  v_tenant_id uuid;
BEGIN
  IF v_tenant_col IS NULL THEN
    RAISE EXCEPTION 'Audit trigger requires tenant column name in TG_ARGV[0]';
  END IF;

  IF tg_op IN ('INSERT','UPDATE') THEN
    EXECUTE format('select ($1).%I::uuid', v_tenant_col) INTO v_tenant_id USING new;
  ELSE
    EXECUTE format('select ($1).%I::uuid', v_tenant_col) INTO v_tenant_id USING old;
  END IF;

  -- Pre-onboarding: profile con tenant_id NULL no se audita (audit_logs.tenant_id es NOT NULL).
  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.audit_logs(
    tenant_id, actor_id, event_type, resource_name,
    payload_before, payload_after, ip, user_agent, retention_until
  )
  VALUES (
    v_tenant_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    CASE WHEN tg_op = 'INSERT' THEN NULL ELSE to_jsonb(old) END,
    CASE WHEN tg_op = 'DELETE' THEN NULL ELSE to_jsonb(new) END,
    NULL, NULL,
    now() + make_interval(days =>
      COALESCE((SELECT pp.retention_days
                FROM public.tenants t
                JOIN public.plan_policies pp ON pp.plan_id = t.plan_id
                WHERE t.id = v_tenant_id LIMIT 1), 180))
  );
  RETURN NULL;
END;
$$;
```

### 18.7 `public.fn_is_module_enabled(p_module_code text)`

```sql
-- [AUDIT-OK] Parte 1 §11. [AUDIT-DEAD?] Sin llamadas detectadas en frontend/server/políticas.
CREATE OR REPLACE FUNCTION public.fn_is_module_enabled(p_module_code text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_modules tm
    WHERE tm.tenant_id = public.fn_current_tenant_id()
      AND tm.module_code = p_module_code
      AND tm.status_code = 'enabled'
  )
$$;
```

### 18.8 `public.fn_bootstrap_tenant(...)` — VERSIÓN VIGENTE (5 parámetros)

```sql
-- [AUDIT-CONFLICT] Parte 1 §11 define una versión ANTIGUA de 4 parámetros (p_name, p_tax_id,
-- p_industry_type_id, p_plan_id) sin validaciones ni SECURITY DEFINER. La VIGENTE es la de
-- migración 20260302125000 (5 parámetros, idempotente, verificada por schema_guard):
CREATE OR REPLACE FUNCTION public.fn_bootstrap_tenant(
  p_tenant_name text,
  p_tax_id text,
  p_industry_type_id text,
  p_plan_id text DEFAULT 'basic',
  p_billing_day int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Cuerpo completo en supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql:
--  1) valida auth.uid(), nombre, RUC (^[0-9]{11}$), billing_day 1-28
--  2) idempotencia: si profiles.tenant_id ya existe, lo retorna
--  3) INSERT tenants (status FIN-ACTIVE) → 4) upsert profile → 5) sede 'Principal'
--  6) rol Owner (hierarchy_level 0, system) → 7) role_permissions = TODOS los cat_permissions
--  8) user_roles_sedes → 9) subscription_contracts (ACTIVE, grace 7) → 10) entitlements desde plan_policies
$$;
GRANT EXECUTE ON FUNCTION public.fn_bootstrap_tenant(text, text, text, text, int) TO authenticated, service_role;
```

### 18.9 `public.fn_complete_access_onboarding(p_access_code text, p_metadata jsonb DEFAULT '{}')` — ACE FASE 1

```sql
-- [AUDIT-OK] Migración 20260510100000 (verbatim en el archivo). RETURNS jsonb, SECURITY DEFINER,
-- SET search_path = public, ong, rrhh.
-- Flujo: SELECT FOR UPDATE del link → valida activo/expiración/límite → upsert profiles →
-- upsert memberships → insert user_roles_sedes (si link trae rol+sede) → registro operativo
-- (VOLUNTEER_JOIN → ong.voluntarios con codigo_estado='en_proceso'; STAFF_JOIN → rrhh.solicitudes_admision
-- estado='nueva'; BENEFICIARY_JOIN/GENERIC → solo membresía) → used_count++ → audit_logs('ONBOARDING_COMPLETED').
GRANT EXECUTE ON FUNCTION public.fn_complete_access_onboarding(text, jsonb) TO authenticated, service_role, anon;
-- [AUDIT-DEAD?] El frontend solo llama fn_validate_access_code (ace.service.ts); NO se encontró
-- llamada a fn_complete_access_onboarding en servicios (solo su tipo en app-database.ts). Integración FASE 6
-- declarada en commit 315c234 — verificar si el flujo UI la invoca de otra forma. Requiere revisión manual.
```

### 18.10 `public.fn_sync_urs_to_membership()` — ACE FASE 2

```sql
-- [AUDIT-OK] Migración 20260510200000 (verbatim en el archivo). RETURNS trigger, SECURITY DEFINER.
-- INSERT: upsert membership SEDE. UPDATE: si cambió sede, desactiva/actualiza membresía vieja con "rol
-- heredero" (menor hierarchy_level) y activa la nueva. DELETE: rol heredero o status='inactive'.
```

### 18.11 `public.fn_validate_access_code(p_code text)` — ACE FASE 3

```sql
-- [AUDIT-OK] Migración 20260510210000 (verbatim). RETURNS jsonb, SECURITY DEFINER, validación anónima
-- pre-registro. Devuelve {valid, reason | type, target_type, onboarding_flow, expires_at}; nunca datos sensibles.
GRANT EXECUTE ON FUNCTION public.fn_validate_access_code(text) TO anon, authenticated, service_role;
-- Uso confirmado: src/modules/ong/app/services/ace/ace.service.ts:227
```

### 18.12 `public.fn_has_context_access(p_user_id uuid, p_context_id uuid)` — ACE FASE 4

```sql
-- [AUDIT-OK] Migración 20260510220000 (verbatim). SQL STABLE SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.fn_has_context_access(p_user_id uuid, p_context_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = public.fn_current_tenant_id()
      AND user_id = p_user_id
      AND context_id = p_context_id
      AND status = 'active'
  );
$$;
GRANT EXECUTE ON FUNCTION public.fn_has_context_access(uuid, uuid) TO authenticated, service_role;
-- [AUDIT-DEAD?] Diseñada para futuras políticas RLS de tablas operativas; hoy NINGUNA política la usa.
```

### 18.13 `rrhh.fn_generate_registration_code(...)`

```sql
-- [AUDIT-OK] Parte 4 §12 (verbatim). SECURITY DEFINER. Usada por frontend (2 llamadas RPC).
CREATE OR REPLACE FUNCTION rrhh.fn_generate_registration_code(
  p_email varchar, p_numero_documento varchar, p_nombres varchar, p_apellidos varchar,
  p_id_solicitud uuid, p_expires_in_minutes integer DEFAULT 1440
)
RETURNS rrhh.codigos_registro_voluntario
LANGUAGE plpgsql SECURITY DEFINER AS $$
-- Autoriza con fn_has_permission('volunteers.invite') OR fn_is_tenant_admin();
-- genera código hex de 12 chars (gen_random_bytes) e inserta en rrhh.codigos_registro_voluntario.
$$;
GRANT EXECUTE ON FUNCTION rrhh.fn_generate_registration_code(varchar,varchar,varchar,varchar,uuid,integer) TO authenticated;
-- [AUDIT-NOTE] Escribe en la tabla LEGACY, no en access_links (ACE). Los códigos nuevos NO llegan a ACE
-- salvo re-ejecución del snapshot FASE 2. Doble fuente de verdad activa.
```

### 18.14 `ong.fn_register_attendance_scan(p_qr_payload text, p_id_actividad uuid, p_scan_time timestamptz DEFAULT now())`

```sql
-- [AUDIT-OK] Parte 4 §12 (verbatim). RETURNS ong.asistencias, SECURITY DEFINER. Usada por frontend (2 refs).
-- Autoriza con fn_has_permission('attendance.scan') OR fn_is_tenant_admin(); busca id_card activa por
-- qr_payload; primer scan = check_in, segundo = check_out (COALESCE).
GRANT EXECUTE ON FUNCTION ong.fn_register_attendance_scan(text, uuid, timestamptz) TO authenticated;
```

### 18.15 `public.fn_remote_revoke_app_session(p_session_id uuid, p_reason text)`

```sql
-- [AUDIT-OK] Parte 4 §12 (verbatim). RETURNS public.sessions, SECURITY DEFINER. Usada por frontend (3 refs).
-- Autoriza con fn_has_permission('settings.sessions.terminate') OR fn_is_tenant_admin();
-- marca revoked_at/revoke_reason en public.sessions del tenant actual.
GRANT EXECUTE ON FUNCTION public.fn_remote_revoke_app_session(uuid, text) TO authenticated;
```

---

## 19. TRIGGERS

```sql
-- [AUDIT-OK] Parte 1 §12 — validación y auditoría IAM
CREATE TRIGGER trg_role_permissions_validate_permission
  BEFORE INSERT OR UPDATE ON public.role_permissions
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_permission_exists();

-- [AUDIT-CONFLICT] Auditoría de user_roles_sedes — DOS triggers históricos sobre la misma tabla:
--   (a) trg_user_roles_sedes_audit (Parte 1 §12): EXECUTE FUNCTION fn_trigger_audit_universal()  ← SIN argumento
--   (b) tr_audit_urs (migraciones 20260305*): EXECUTE FUNCTION fn_trigger_audit_universal('tenant_id') ← VIGENTE
--   La versión vigente de la función EXIGE TG_ARGV[0]; si (a) sigue existiendo en la BD, cada INSERT/UPDATE/DELETE
--   sobre user_roles_sedes lanzaría la excepción 'Audit trigger requires tenant column name'. REVISIÓN MANUAL URGENTE.
CREATE TRIGGER tr_audit_urs
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles_sedes
  FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_audit_universal('tenant_id');

-- [AUDIT-OK] ACE FASE 2 — sincronización legacy
CREATE TRIGGER tr_sync_user_roles_sedes
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles_sedes
  FOR EACH ROW EXECUTE FUNCTION public.fn_sync_urs_to_membership();

-- [AUDIT-DOUBT] tr_audit_profiles: el schema_guard (20260305100000) EXIGE que exista un trigger llamado
-- 'tr_audit_profiles' sobre public.profiles, pero NINGÚN archivo del repo lo crea. O fue creado manualmente
-- en la BD remota, o el schema_guard falla en un despliegue limpio. Requiere revisión manual.
-- CREATE TRIGGER tr_audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles
--   FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_audit_universal('tenant_id');   -- (reconstrucción probable)

-- [AUDIT-OK] Parte 1 §12 — updated_at en core (patrón BEFORE UPDATE ... fn_set_updated_at):
--   trg_public_tenants_set_updated_at              ON public.tenants
--   trg_public_sedes_set_updated_at                ON public.sedes
--   trg_public_profiles_set_updated_at             ON public.profiles
--   trg_public_roles_set_updated_at                ON public.roles
--   trg_public_subscription_contracts_set_updated_at ON public.subscription_contracts
--   trg_public_entitlements_set_updated_at         ON public.entitlements
--   trg_public_subscription_changes_set_updated_at ON public.subscription_changes
--   trg_public_invoices_set_updated_at             ON public.invoices
--   trg_public_payment_methods_set_updated_at      ON public.payment_methods
--   trg_public_payment_transactions_set_updated_at ON public.payment_transactions
--   trg_public_tenant_modules_set_updated_at       ON public.tenant_modules

-- [AUDIT-OK] ACE FASE 0 — updated_at:
--   tr_access_links_updated_at   BEFORE UPDATE ON public.access_links   → fn_set_updated_at()
--   tr_memberships_updated_at    BEFORE UPDATE ON public.memberships    → fn_set_updated_at()
--   tr_dynamic_forms_updated_at  BEFORE UPDATE ON public.dynamic_forms  → fn_set_updated_at()

-- [AUDIT-OK] ACE FASE 0 — auditoría forense (AFTER INSERT OR UPDATE OR DELETE ... fn_trigger_audit_universal('tenant_id')):
--   tr_audit_access_links, tr_audit_memberships, tr_audit_dynamic_forms,
--   tr_audit_role_module_access, tr_audit_role_field_permissions
-- [AUDIT-DOUBT] role_module_access y role_field_permissions NO tienen columna updated_at ni created_at;
-- el trigger de auditoría funciona (usa to_jsonb) pero no hay trigger updated_at (coherente).

-- [AUDIT-DOUBT] Parte 3 §B2 declara la intención de crear triggers updated_at para TODAS las tablas de
-- módulos (ong.*, rrhh.*, finanzas.*, etc.) mediante bloque DO dinámico. No se pudo verificar la lista final
-- de triggers generados. Requiere revisión manual (pg_trigger en la BD real).
```

---

## 20. VISTAS

```sql
-- [AUDIT-OK] ÚNICA vista del proyecto — ACE FASE 4 (migración 20260510220000, verbatim):
CREATE VIEW public.v_user_session_context
  WITH (security_invoker = true)          -- PostgreSQL 15+: respeta RLS del caller
AS
SELECT
  p.id  AS user_id,
  p.tenant_id,
  p.full_name,
  p.tipo_documento,
  p.numero_documento,
  p.genero,
  jsonb_agg(
    jsonb_build_object(
      'context_type', m.context_type,
      'context_id',   m.context_id,
      'role_id',      m.role_id,
      'role_name',    r.name,
      'joined_at',    m.joined_at
    ) ORDER BY m.joined_at
  ) FILTER (WHERE m.id IS NOT NULL) AS active_memberships
FROM public.profiles p
LEFT JOIN public.memberships m
       ON m.user_id = p.id AND m.tenant_id = p.tenant_id AND m.status = 'active'
LEFT JOIN public.roles r ON r.id = m.role_id
WHERE p.id = auth.uid()                    -- restringida al usuario autenticado
GROUP BY p.id, p.tenant_id, p.full_name, p.tipo_documento, p.numero_documento, p.genero;

GRANT SELECT ON public.v_user_session_context TO authenticated;
-- Uso confirmado: src/modules/ong/app/services/ace/ace.service.ts:246
-- Dependencias: profiles, memberships, roles, auth.uid()
```

---

## 21. POLÍTICAS RLS (INVENTARIO COMPLETO)

> RLS habilitada en TODAS las tablas de los 11 schemas (Parte 1 §15, Parte 2, ACE FASE 0).
> `public.tenants`, `public.invoice_lines` y `public.system_modules`: [AUDIT-DOUBT] Parte 1 §15 no incluye
> `ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY` ni políticas para tenants/invoice_lines/system_modules,
> aunque DB_MAESTRA afirma "RLS: solo lectura al propio tenant" para tenants. Requiere revisión manual.

### 21.1 Catálogos `public` (SELECT-only para authenticated) — Parte 1 §15
`p_cat_industry_types_select`, `p_cat_plan_types_select`, `p_cat_tenant_statuses_select`, `p_cat_subscription_statuses_select`, `p_cat_subscription_change_statuses_select`, `p_cat_invoice_statuses_select`, `p_cat_payment_statuses_select`, `p_cat_permissions_select`, `p_cat_generos_select`, `p_cat_paises_select`, `p_cat_monedas_select`, `p_cat_tipos_documento_select`, `p_cat_module_statuses_select` — todas `FOR SELECT TO authenticated USING (true)`.

### 21.2 Endurecimiento de catálogos (migraciones 20260305*) — patrón read + bloqueo explícito de escritura
Sobre `cat_permissions`, `cat_industry_types`, `cat_plan_types`, `plan_policies`:
```sql
CREATE POLICY p_<tabla>_read         ON public.<tabla> FOR SELECT TO authenticated USING (true);
CREATE POLICY p_<tabla>_insert_block ON public.<tabla> FOR INSERT TO authenticated WITH CHECK (false);
CREATE POLICY p_<tabla>_update_block ON public.<tabla> FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
CREATE POLICY p_<tabla>_delete_block ON public.<tabla> FOR DELETE TO authenticated USING (false);
REVOKE ALL ON TABLE public.<tabla> FROM anon;
GRANT SELECT ON TABLE public.<tabla> TO authenticated;
-- [AUDIT-NOTE] Estas políticas COEXISTEN con p_cat_*_select de Parte 1 (nunca se dropearon los nombres
-- antiguos salvo p_cat_permissions_read/p_cat_permissions_no_write). Redundancia inofensiva pero confusa.
```

### 21.3 `public.profiles` (versión vigente: 20260305110000 + 20260305_rls_hardening)
```sql
CREATE POLICY p_profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (tenant_id = public.fn_current_tenant_id()
         AND (id = auth.uid() OR public.fn_has_permission('iam.users.read', null) OR public.fn_is_tenant_admin()));
CREATE POLICY p_profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid() AND tenant_id = public.fn_current_tenant_id());
CREATE POLICY p_profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (tenant_id = public.fn_current_tenant_id()
         AND (id = auth.uid() OR public.fn_has_permission('iam.users.manage', null) OR public.fn_is_tenant_admin()))
  WITH CHECK (tenant_id = public.fn_current_tenant_id());
-- [AUDIT-CONFLICT] AUDIT-07 propone p_profiles_insert con "tenant_id IS NULL" (pre-onboarding);
-- la migración exige tenant_id = fn_current_tenant_id(). Con profile aún inexistente, fn_current_tenant_id()
-- devuelve NULL y NULL = NULL es NULL → INSERT de bootstrap desde cliente queda BLOQUEADO por RLS
-- (fn_bootstrap_tenant lo evita por SECURITY DEFINER). Coherente pero frágil; documentado.
-- [AUDIT-NOTE] Políticas antiguas de Parte 1 (p_profiles_tenant_select, p_profiles_tenant_update_self)
-- pueden seguir existiendo en la BD: Parte 1 las creó y ninguna migración las dropea. Revisión manual.
```

### 21.4 `public.user_roles_sedes` (vigente: 20260305110000)
```sql
CREATE POLICY p_urs_select ON public.user_roles_sedes FOR SELECT TO authenticated
  USING (tenant_id = public.fn_current_tenant_id());
CREATE POLICY p_urs_insert ON public.user_roles_sedes FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.fn_current_tenant_id()
              AND (public.fn_has_permission('iam.user_roles.manage', null) OR public.fn_is_tenant_admin()));
CREATE POLICY p_urs_update ON public.user_roles_sedes FOR UPDATE TO authenticated
  USING (tenant_id = public.fn_current_tenant_id()
         AND (public.fn_has_permission('iam.user_roles.manage', null) OR public.fn_is_tenant_admin()))
  WITH CHECK (tenant_id = public.fn_current_tenant_id());
CREATE POLICY p_urs_delete ON public.user_roles_sedes FOR DELETE TO authenticated
  USING (tenant_id = public.fn_current_tenant_id()
         AND (public.fn_has_permission('iam.user_roles.manage', null) OR public.fn_is_tenant_admin()));
-- Nota: p_urs_write (nombre legacy) se dropea explícitamente. p_user_roles_sedes_tenant_all (Parte 1) no se dropea. Revisión manual.
```

### 21.5 `public.mfa_challenges` (migración 20260301120000)
```sql
CREATE POLICY p_mfa_challenges_select    ON public.mfa_challenges FOR SELECT
  USING (tenant_id = public.fn_current_tenant_id() AND user_id = auth.uid());
CREATE POLICY p_mfa_challenges_no_insert ON public.mfa_challenges FOR INSERT WITH CHECK (false);
CREATE POLICY p_mfa_challenges_no_update ON public.mfa_challenges FOR UPDATE USING (false) WITH CHECK (false);
CREATE POLICY p_mfa_challenges_no_delete ON public.mfa_challenges FOR DELETE USING (false);
-- Escritura solo vía service_role (server/security/risk-engine.js).
```

### 21.6 Tablas tenant-scoped `public` (Parte 1 §15) — patrón `FOR ALL`
`p_sedes_tenant_all`, `p_roles_tenant_all`, `p_role_permissions_tenant_select` + `p_role_permissions_tenant_write`, `p_user_roles_sedes_tenant_all` (superseded), `p_role_access_constraints_tenant_all`, `p_mfa_challenges_tenant_all` (superseded), `p_devices_tenant_all`, `p_terminals_tenant_all`, `p_sessions_tenant_all`, `p_auth_events_tenant_all`, `p_subscription_contracts_tenant_all`, `p_entitlements_tenant_all`, `p_subscription_changes_tenant_all`, `p_invoices_tenant_all`, `p_payment_methods_tenant_all`, `p_payment_transactions_tenant_all`, `p_payment_webhook_events_tenant_all`, `p_tenant_modules_tenant_all`, `p_audit_logs_tenant_select` — patrón general:
```sql
CREATE POLICY p_<tabla>_tenant_all ON public.<tabla> FOR ALL TO authenticated
  USING (tenant_id = public.fn_current_tenant_id())
  WITH CHECK (tenant_id = public.fn_current_tenant_id());
```
`[AUDIT-NOTE]` `p_audit_logs_tenant_select` es solo SELECT (escritura únicamente vía trigger SECURITY DEFINER).

### 21.7 Cobertura defensiva 20260305_rls_hardening §D — [AUDIT-DEAD?]
Genera políticas `p_<t>_tenant_select/insert/update/delete` para `users, projects, activities, tasks, payments, billing, subscriptions` **solo si existen**. Ninguna de esas tablas existe en este proyecto (nombres en inglés de otro modelo) → bloque sin efecto. Evidencia de copy/paste desde otra especificación.

### 21.8 ACE (migración 20260510210000) — 20 políticas por operación
`p_access_links_select/insert/update/delete`, `p_memberships_select/insert/update/delete`, `p_dynamic_forms_select/insert/update/delete`, `p_role_module_access_select/insert/update/delete`, `p_role_field_perms_select/insert/update/delete` — patrón: tenant + (`fn_has_permission('ace.<recurso>.read|manage', null)` OR `fn_is_tenant_admin()`); `memberships_select` añade `user_id = auth.uid()`; `dynamic_forms_select` solo exige tenant + `is_active = true`.

### 21.9 Schemas de módulos (Parte 2) — patrón `FOR ALL` por tenant
- `ong`: `p_ong_cat_vol_select`, `p_ong_cat_med_select`, `p_ong_cat_obj_select`, `p_ong_cat_proy_select`, `p_ong_tipo_transaccion_inventario_select` (catálogos, SELECT true) + `p_ong_<tabla>_all` para areas, ubicaciones, items, voluntarios, beneficiarios, proyectos, tareas, actividades, horas_actividad, asignaciones_actividad, evidencias_actividad, recursos_proyecto, asignaciones_proyecto, participaciones_proyecto, activity_requirements, logros_beneficiario, supervisiones, transacciones_inventario.
- `finanzas`: `p_fin_cuentas_all`, `p_fin_categorias_all`, `p_fin_transacciones_all`, `p_fin_comprobantes_all`. [AUDIT-DOUBT] `finanzas.cat_tipos_cuenta` y `finanzas.aprobaciones_transaccion` (Parte 4) NO tienen política RLS en los scripts → si RLS no está habilitada heredan grants; si está habilitada sin política, quedan inaccesibles. Revisión manual.
- `donaciones`: `p_don_donantes_all`, `p_don_campanas_all`, `p_don_ingresos_all`, `p_don_interactions_all`, `p_don_pledges_all`.
- `rrhh`: `p_rrhh_habilidades_select` (catálogo) + `p_rrhh_<tabla>_all` para solicitudes_admision, documentos_admision, voluntario_habilidades, volunteer_preferences, documentos_voluntario, entrevistas_admision, onboarding_pasos, onboarding_voluntario, admission_requirements, admission_requirement_reviews, admision_estado_historial, roles_operativos, asignaciones_rol, perfil_coordinador. [AUDIT-DOUBT] `rrhh.codigos_registro_voluntario` y `rrhh.registro_documentos_postulante` (Parte 4): sin políticas RLS visibles en los scripts. Revisión manual.
- `clinico`: `p_clinico_fichas_medicas_all`, `p_clinico_accesos_sensibles_log_all`, `p_clinico_perfil_nino_all`, `p_clinico_perfil_adulto_mayor_all`, `p_clinico_ficha_sensible_voluntario_all`. [AUDIT-DOUBT] `clinico.accesos_sensibles_voluntario_log` (Parte 4): sin política visible. Revisión manual.
- `academico`: `p_aca_cursos_all`, `p_aca_inscripciones_all`, `p_aca_certificados_all`, `p_aca_asistencias_all`.
- `gamificacion`: `p_gam_insignias_all`, `p_gam_puntos_ledger_all`, `p_gam_volunteer_badges_all`, `p_gam_rules_all`, `p_gam_kudos_all`.
- `impacto`: `p_imp_ods_select` (SELECT true) + `p_imp_kpi_indicadores_all`, `p_imp_kpi_mediciones_all`, `p_imp_project_ods_all`, `p_imp_kpi_targets_all`.
- `comunicaciones`: `p_com_canales_select` (SELECT true) + `p_com_user_devices_all`, `p_com_historial_all`, `p_com_sync_queue_all`, `p_com_plantillas_all`, `p_com_entity_versions_all`.
- `auditoria`: `p_aud_audit_log_all` — [AUDIT-NOTE] es `FOR ALL` (permite INSERT/UPDATE/DELETE del tenant sobre su propia bitácora "inmutable"): contradice el propósito forense. El GRANT 20260331 solo da SELECT, lo que mitiga en la práctica.
- `ong.id_card_templates` (Configuracion_Supabase.md): `"Templates — leer propio tenant"` (SELECT tenant) + `"Templates — crear/editar con permiso"` (FOR ALL tenant + `fn_has_permission('manage_id_cards')`). [AUDIT-CONFLICT] El permiso `manage_id_cards` NO existe en cat_permissions (los seeds definen `idcards.manage`). Con el trigger de validación esto no impide la política (no valida strings de políticas) pero la condición nunca será verdadera salvo para admin → posible bug funcional.

---

## 22. GRANTS Y PERMISOS

```sql
-- [AUDIT-OK] Migración ONG 20260331 (= parche final de Parte 4):
GRANT USAGE ON SCHEMA rrhh, clinico, finanzas, comunicaciones, auditoria TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rrhh, clinico, finanzas, comunicaciones, auditoria TO authenticated;
-- [AUDIT-DOUBT] No hay GRANT USAGE explícito para schemas ong y academico en el repo, pese a uso intensivo
-- del frontend con .schema("ong"). Debió otorgarse manualmente o en scripts no versionados. Revisión manual.

-- RRHH
GRANT SELECT ON TABLE rrhh.habilidades, rrhh.roles_operativos, rrhh.onboarding_pasos,
  rrhh.codigos_registro_voluntario, rrhh.registro_documentos_postulante TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE rrhh.voluntario_habilidades, rrhh.asignaciones_rol,
  rrhh.documentos_voluntario, rrhh.perfil_coordinador, rrhh.solicitudes_admision,
  rrhh.documentos_admision, rrhh.entrevistas_admision, rrhh.onboarding_voluntario TO authenticated;
GRANT EXECUTE ON FUNCTION rrhh.fn_generate_registration_code(varchar,varchar,varchar,varchar,uuid,integer) TO authenticated;

-- CLINICO
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE clinico.fichas_medicas, clinico.ficha_sensible_voluntario,
  clinico.perfil_nino, clinico.perfil_adulto_mayor TO authenticated;
GRANT SELECT, INSERT ON TABLE clinico.accesos_sensibles_log, clinico.accesos_sensibles_voluntario_log TO authenticated;

-- FINANZAS
GRANT SELECT ON TABLE finanzas.cat_tipos_cuenta TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE finanzas.cuentas, finanzas.categorias,
  finanzas.transacciones, finanzas.aprobaciones_transaccion, finanzas.comprobantes_financieros TO authenticated;

-- COMUNICACIONES
GRANT SELECT ON TABLE comunicaciones.canales_notificacion, comunicaciones.historial_notificaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE comunicaciones.plantillas_notificacion TO authenticated;

-- AUDITORIA
GRANT SELECT ON TABLE auditoria.audit_log TO authenticated;

-- RPCs core
GRANT EXECUTE ON FUNCTION public.fn_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_has_permission(text, uuid) TO authenticated;   -- [AUDIT-DOUBT] firma no definida en repo
GRANT EXECUTE ON FUNCTION public.fn_is_tenant_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_remote_revoke_app_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION ong.fn_register_attendance_scan(text, uuid, timestamptz) TO authenticated;

-- ACE FASE 0:
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_links, public.memberships, public.dynamic_forms,
  public.role_module_access, public.role_field_permissions TO service_role;
```

---

## 23. SUPABASE STORAGE

```sql
-- BUCKET 1: 'avatars' (público) — Parte 4 final. [AUDIT-SYNTAX] INSERT sin ON CONFLICT (no idempotente).
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
CREATE POLICY "Public read access"    ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated upload"  ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');
-- Migración ONG 20260426 documenta (comentadas) políticas adicionales avatars_public_read /
-- avatars_authenticated_upload / avatars_authenticated_update → NUNCA activas. [AUDIT-DEAD?]

-- BUCKET 2: 'evidence' (privado, particionado por tenant) — migración ONG 20260401
INSERT INTO storage.buckets (id, name, public)
SELECT 'evidence', 'evidence', false WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'evidence');
CREATE POLICY "Tenant evidence read"   ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text);
CREATE POLICY "Tenant evidence upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text);
CREATE POLICY "Tenant evidence update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text)
  WITH CHECK (bucket_id = 'evidence' AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text);
-- [AUDIT-NOTE] No hay política DELETE para 'evidence' → los objetos no pueden borrarse desde cliente (¿intencional?).

-- BUCKET 3: 'id_templates' (público) — ONG/supabase/Configuracion_Supabase.md
INSERT INTO storage.buckets (id, name, public) VALUES ('id_templates', 'id_templates', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Acceso Público Plantillas" ON storage.objects FOR SELECT USING (bucket_id = 'id_templates');
CREATE POLICY "Subida Autenticados"       ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'id_templates' AND auth.role() = 'authenticated');
CREATE POLICY "Actualización Autenticados" ON storage.objects FOR UPDATE USING (bucket_id = 'id_templates' AND auth.uid() = owner);
CREATE POLICY "Eliminación Autenticados"   ON storage.objects FOR DELETE USING (bucket_id = 'id_templates' AND auth.uid() = owner);
```

---

## 24. SEEDS ESTRUCTURALES

```sql
-- cat_permissions — Parte 4 §1 (40 permisos de módulos ONG):
--   home.read | projects.read/manage | operation.activities.read/manage | operation.hours.read/manage/approve
--   operation.attendance.read/manage | operation.evidence.read/manage/approve | admission.read/manage/approve
--   resources.inventory.read/manage | resources.finance.read/manage/approve | notifications.read/manage
--   governance.catalogs.read | governance.audit.read | governance.sensitive.read | governance.retention.read
--   settings.users.read/manage | settings.roles.read/manage | settings.sessions.read/terminate
--   clinico.volunteer_sensitive.read | idcards.read/manage | volunteers.invite/register | attendance.scan
-- cat_permissions — ACE (FASES 0-4): ace.access_links.read/manage, ace.memberships.read/manage,
--   ace.forms.read/manage, ace.perms.read/manage, ace.onboarding.execute, ace.sync.legacy, ace.context.check
-- plan_policies: basic(180,1,3,false), pro(365,5,30,true), enterprise(730,999,999,true)
-- cat_module_statuses: enabled/disabled/paused (Parte 3 §H)
-- finanzas.cat_tipos_cuenta: banco/caja_chica/pasarela (Parte 4 §10)
-- comunicaciones.canales_notificacion: email/push/sms (Parte 2 §17)
-- impacto.ods_globales: ODS 1-4 (incompleto; faltan 5-17) (Parte 2 §16)
-- [AUDIT-DOUBT] Seeds de cat_industry_types, cat_plan_types, cat_tenant_statuses, cat_*_statuses,
-- cat_generos, cat_paises, cat_monedas, cat_tipos_documento, ong.estados_*, ong.unidades_medida,
-- ong.tipo_transaccion_inventario, rrhh.habilidades: los valores exactos NO están en los scripts del repo
-- (solo documentados como comentario en DB_MAESTRA). Requiere revisión manual (export de datos de catálogo).
```

---

## 25. OBJETOS REFERENCIADOS PERO NO DEFINIDOS EN EL REPOSITORIO

| Objeto | Referenciado por | Estado |
|---|---|---|
| `public.fn_has_permission(text, uuid)` (firma 2 args) | GRANT 20260331; políticas RLS 20260305*/ACE | **Requiere revisión manual** — definición ausente |
| Trigger `tr_audit_profiles` sobre `public.profiles` | schema_guard 20260305100000 (lo exige) | **Requiere revisión manual** — CREATE ausente |
| Columnas `profiles.tipo_documento/numero_documento/genero` | fn_complete_access_onboarding, vista ACE, app-database.ts | Migración de origen ausente |
| Seeds de catálogos base (industry, planes, estados, géneros, países, monedas, documentos) | fn_bootstrap_tenant, FKs | Script de seed ausente |
| GRANT USAGE ON SCHEMA `ong`, `academico` a authenticated | frontend `.schema("ong")`/`.schema("academico")` | Script ausente |
| `rrhh.codigos_registro_voluntario` políticas RLS | GRANT SELECT 20260331 | Políticas ausentes en scripts |
| Edge Functions (despliegue): `admin-provision-user`, `admin-revoke-user-sessions`, `consume-volunteer-registration-code` | `ONG/supabase/functions/**`, invocadas por frontend vía `functions.invoke` | Código presente; configuración de despliegue no versionada |

---

*Fin de DATABASE_MASTER_SCRIPT.md — ver DATABASE_DICTIONARY.md (diccionario por objeto) y AUDIT_REPORT.md (hallazgos y prioridades).*
