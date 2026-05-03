-- =============================================================================
-- SCRIPT MAESTRO DOCUMENTAL
-- PARTE 1: CORE / SUBS / PUBLIC
-- Plataforma SaaS Modular Multi-Tenant
-- Consolidado documental basado en:
--   - SUBS script completo
--   - Arquitectura base
--   - Migración 2 (tenant default + auditoría base)
--   - Migración 4 (FKs auth.users + checks + índices)
-- =============================================================================

BEGIN;
SET search_path = public;

-- =============================================================================
-- 0. EXTENSIONES
-- =============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. CATÁLOGOS GLOBALES CORE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cat_industry_types (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_plan_types (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_tenant_statuses (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_subscription_statuses (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_subscription_change_statuses (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_invoice_statuses (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_payment_statuses (
  id text PRIMARY KEY,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.cat_permissions (
  id text PRIMARY KEY,
  description text NOT NULL,
  module text NOT NULL DEFAULT 'core',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2. CATÁLOGOS GLOBALES UNIVERSALES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cat_generos (
  codigo varchar(10) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cat_paises (
  codigo varchar(2) PRIMARY KEY,
  nombre varchar(150) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.cat_monedas (
  codigo varchar(3) PRIMARY KEY,
  nombre varchar(100) NOT NULL,
  simbolo varchar(10) NULL
);

CREATE TABLE IF NOT EXISTS public.cat_tipos_documento (
  codigo varchar(10) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);

-- =============================================================================
-- 3. SEEDS DE CATÁLOGOS CORE
-- =============================================================================

INSERT INTO public.cat_industry_types(id, description) VALUES
  ('retail','Retail'),
  ('gym','Gimnasio'),
  ('health','Salud')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_plan_types(id, description) VALUES
  ('basic','Básico'),
  ('pro','Pro'),
  ('enterprise','Enterprise')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_tenant_statuses(id, description) VALUES
  ('FIN-PENDING','Pendiente / Onboarding'),
  ('FIN-ACTIVE','Activo'),
  ('FIN-GRACE','Periodo de gracia'),
  ('FIN-READONLY','Solo lectura'),
  ('FIN-SUSPENDED','Suspendido'),
  ('FIN-INCONSISTENT','Inconsistente (bloquea cambios financieros)')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_subscription_statuses(id, description) VALUES
  ('PENDING','Pendiente'),
  ('ACTIVE','Activa'),
  ('GRACE','Gracia'),
  ('READONLY','Solo lectura'),
  ('SUSPENDED','Suspendida'),
  ('CANCELLED','Cancelada')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_subscription_change_statuses(id, description) VALUES
  ('CHG-SUBMITTED','Cambio registrado'),
  ('CHG-AWAITING-CONFIRMATION','Esperando confirmación'),
  ('CHG-APPLIED','Aplicado'),
  ('CHG-FAILED','Falló'),
  ('CHG-CONFLICT','En conflicto')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_invoice_statuses(id, description) VALUES
  ('DRAFT','Borrador'),
  ('ISSUED','Emitida'),
  ('PAID','Pagada'),
  ('VOID','Anulada'),
  ('OVERDUE','Vencida')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_payment_statuses(id, description) VALUES
  ('CREATED','Creado'),
  ('PENDING','Pendiente'),
  ('SUCCEEDED','Exitoso'),
  ('FAILED','Fallido'),
  ('CANCELLED','Cancelado'),
  ('REFUNDED','Reembolsado'),
  ('CHARGEBACK','Contracargo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_permissions(id, description, module) VALUES
  ('tenant.read', 'Ver datos del tenant', 'core'),
  ('tenant.update', 'Modificar configuración del tenant', 'core'),
  ('sedes.read', 'Ver sedes', 'core'),
  ('sedes.manage', 'Crear/editar/desactivar sedes', 'core'),
  ('iam.admin', 'Administrador total del tenant (atajo)', 'iam'),
  ('iam.users.read', 'Ver usuarios del tenant', 'iam'),
  ('iam.users.manage', 'Gestionar usuarios', 'iam'),
  ('iam.roles.read', 'Ver roles', 'iam'),
  ('iam.roles.manage', 'Crear/editar/eliminar roles', 'iam'),
  ('iam.user_roles.manage', 'Asignar roles por sede', 'iam'),
  ('iam.audit.read', 'Leer auditoría/bitácora', 'iam'),
  ('iam.sessions.terminate', 'Cerrar sesiones', 'iam'),
  ('devices.read', 'Ver dispositivos', 'iam'),
  ('devices.manage', 'Gestionar dispositivos', 'iam'),
  ('terminals.read', 'Ver terminales', 'iam'),
  ('terminals.manage', 'Gestionar terminales', 'iam'),
  ('subs.read', 'Ver suscripción/plan/estado', 'subs'),
  ('subs.manage', 'Gestionar suscripción', 'subs'),
  ('billing.invoices.read', 'Ver facturas', 'billing'),
  ('billing.invoices.manage', 'Gestionar facturas', 'billing'),
  ('billing.payments.read', 'Ver pagos/transacciones', 'billing'),
  ('billing.payments.manage', 'Registrar/gestionar pagos', 'billing')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_generos(codigo, nombre) VALUES
  ('M','Masculino'),
  ('F','Femenino'),
  ('O','Otro')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.cat_paises(codigo, nombre) VALUES
  ('PE','Perú')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.cat_monedas(codigo, nombre, simbolo) VALUES
  ('PEN','Sol peruano','S/'),
  ('USD','Dólar estadounidense','$')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO public.cat_tipos_documento(codigo, nombre) VALUES
  ('DNI','Documento Nacional de Identidad'),
  ('CE','Carné de Extranjería'),
  ('PAS','Pasaporte'),
  ('RUC','Registro Único de Contribuyentes')
ON CONFLICT (codigo) DO NOTHING;

-- =============================================================================
-- 4. CORE: TENANTS + SEDES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text UNIQUE NOT NULL,
  industry_type_id text NOT NULL REFERENCES public.cat_industry_types(id),
  plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_financial_id text NOT NULL DEFAULT 'FIN-PENDING'
    REFERENCES public.cat_tenant_statuses(id),
  billing_day int NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  max_licenses int NOT NULL DEFAULT 1 CHECK (max_licenses >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status
  ON public.tenants(status_financial_id);

CREATE TABLE IF NOT EXISTS public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sedes_tenant
  ON public.sedes(tenant_id);

-- =============================================================================
-- 5. IAM: PROFILES, ROLES, PERMISSIONS, ASIGNACIONES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE SET NULL,
  full_name text,
  pin_hash text,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text,
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_last_failed_at timestamptz,
  pin_blocked_until timestamptz,
  risk_blocked_until timestamptz,
  tipo_documento varchar(10) REFERENCES public.cat_tipos_documento(codigo),
  numero_documento varchar(50),
  genero varchar(10) REFERENCES public.cat_generos(codigo),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant
  ON public.profiles(tenant_id);

CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  hierarchy_level int NOT NULL DEFAULT 100,
  is_system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant
  ON public.roles(tenant_id);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission)
);

CREATE TABLE IF NOT EXISTS public.user_roles_sedes (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id, sede_id)
);

CREATE INDEX IF NOT EXISTS idx_urs_tenant
  ON public.user_roles_sedes(tenant_id);

CREATE INDEX IF NOT EXISTS idx_urs_user
  ON public.user_roles_sedes(user_id);

CREATE INDEX IF NOT EXISTS idx_urs_sede
  ON public.user_roles_sedes(sede_id);

CREATE TABLE IF NOT EXISTS public.role_access_constraints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  sede_id uuid REFERENCES public.sedes(id) ON DELETE CASCADE,
  ip_cidr cidr,
  time_start time,
  time_end time,
  require_trusted_device boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rac_role
  ON public.role_access_constraints(role_id);

-- =============================================================================
-- 6. DISPOSITIVOS, MFA, TERMINALES, SESIONES, EVENTOS
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.mfa_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email_otp', 'app_otp', 'sms_otp')),
  code_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  risk_level text NOT NULL CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_tenant_user
  ON public.mfa_challenges (tenant_id, user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_active
  ON public.mfa_challenges (tenant_id, user_id, expires_at)
  WHERE verified_at IS NULL;

CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  device_fingerprint text NOT NULL,
  is_trusted boolean NOT NULL DEFAULT false,
  last_ip inet,
  last_user_agent text,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_devices_tenant
  ON public.devices(tenant_id);

CREATE TABLE IF NOT EXISTS public.terminals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_terminals_tenant
  ON public.terminals(tenant_id);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  terminal_id uuid REFERENCES public.terminals(id) ON DELETE SET NULL,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  session_type text NOT NULL CHECK (session_type IN ('web','terminal','api')),
  ip inet,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  revoke_reason text
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON public.sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_sessions_tenant
  ON public.sessions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_public_sessions_tenant_created_at
  ON public.sessions(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.auth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  terminal_id uuid REFERENCES public.terminals(id) ON DELETE SET NULL,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  result text NOT NULL CHECK (result IN ('success','error')),
  ip inet,
  user_agent text,
  error_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_events_tenant_time
  ON public.auth_events(tenant_id, created_at DESC);

-- =============================================================================
-- 7. SUBSCRIPCIÓN Y POLÍTICAS DE PLAN
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.plan_policies (
  plan_id text PRIMARY KEY REFERENCES public.cat_plan_types(id) ON DELETE CASCADE,
  retention_days int NOT NULL DEFAULT 180 CHECK (retention_days BETWEEN 30 AND 3650),
  max_sedes int NOT NULL DEFAULT 1 CHECK (max_sedes >= 1),
  max_licenses int NOT NULL DEFAULT 1 CHECK (max_licenses >= 1),
  can_use_terminals boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.plan_policies (
  plan_id, retention_days, max_sedes, max_licenses, can_use_terminals
) VALUES
  ('basic', 180, 1, 3, false),
  ('pro', 365, 5, 15, true),
  ('enterprise', 1095, 999, 999, true)
ON CONFLICT (plan_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.subscription_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_id text NOT NULL REFERENCES public.cat_subscription_statuses(id),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT true,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_subscription_contracts_tenant
  ON public.subscription_contracts(tenant_id);

CREATE TABLE IF NOT EXISTS public.entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_entitlements_tenant
  ON public.entitlements(tenant_id);

CREATE TABLE IF NOT EXISTS public.subscription_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES public.subscription_contracts(id) ON DELETE CASCADE,
  old_plan_id text REFERENCES public.cat_plan_types(id),
  new_plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_id text NOT NULL REFERENCES public.cat_subscription_change_statuses(id),
  requested_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_subscription_changes_tenant
  ON public.subscription_changes(tenant_id);

-- =============================================================================
-- 8. BILLING
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  contract_id uuid REFERENCES public.subscription_contracts(id) ON DELETE SET NULL,
  status_id text NOT NULL REFERENCES public.cat_invoice_statuses(id),
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  subtotal numeric(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax numeric(18,2) NOT NULL DEFAULT 0 CHECK (tax >= 0),
  total numeric(18,2) NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant
  ON public.invoices(tenant_id);

CREATE TABLE IF NOT EXISTS public.invoice_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(18,2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price numeric(18,2) NOT NULL DEFAULT 0 CHECK (unit_price >= 0),
  line_total numeric(18,2) NOT NULL DEFAULT 0 CHECK (line_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice
  ON public.invoice_lines(invoice_id);

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  method_type text NOT NULL,
  external_ref text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid
);

CREATE INDEX IF NOT EXISTS idx_payment_methods_tenant
  ON public.payment_methods(tenant_id);

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  payment_method_id uuid REFERENCES public.payment_methods(id) ON DELETE SET NULL,
  provider text NOT NULL,
  provider_tx_id text,
  amount numeric(18,2) NOT NULL CHECK (amount >= 0),
  currency varchar(3),
  status_id text NOT NULL REFERENCES public.cat_payment_statuses(id),
  paid_at timestamptz,
  response_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  CONSTRAINT fk_payment_currency
    FOREIGN KEY (currency) REFERENCES public.cat_monedas(codigo)
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_tenant
  ON public.payment_transactions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_public_payment_transactions_tenant_created_at
  ON public.payment_transactions(tenant_id, created_at);

CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  event_id text,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_webhook_events_tenant
  ON public.payment_webhook_events(tenant_id);

-- =============================================================================
-- 9. REGISTRO DE MÓDULOS Y ACTIVACIÓN POR TENANT
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.cat_module_statuses (
  codigo varchar(30) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);

INSERT INTO public.cat_module_statuses(codigo, nombre) VALUES
  ('enabled', 'Habilitado'),
  ('disabled', 'Deshabilitado'),
  ('paused', 'Pausado')
ON CONFLICT (codigo) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.system_modules (
  codigo varchar(50) PRIMARY KEY,
  nombre varchar(150) NOT NULL,
  schema_name varchar(100) NOT NULL,
  current_version varchar(50) NOT NULL,
  is_core boolean NOT NULL DEFAULT false,
  is_transversal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tenant_modules (
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  module_code varchar(50) NOT NULL REFERENCES public.system_modules(codigo) ON DELETE CASCADE,
  status_code varchar(30) NOT NULL REFERENCES public.cat_module_statuses(codigo),
  activated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  updated_by uuid,
  PRIMARY KEY (tenant_id, module_code)
);

CREATE INDEX IF NOT EXISTS idx_tenant_modules_tenant
  ON public.tenant_modules(tenant_id);

-- =============================================================================
-- 10. AUDITORÍA
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  schema_name text NOT NULL,
  table_name text NOT NULL,
  operation text NOT NULL,
  record_pk text,
  old_data jsonb,
  new_data jsonb,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant
  ON public.audit_logs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_public_audit_logs_tenant_created_at
  ON public.audit_logs(tenant_id, created_at);

-- =============================================================================
-- 11. FUNCIONES CORE
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('app.current_tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_is_tenant_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_sedes urs
    JOIN public.role_permissions rp
      ON rp.role_id = urs.role_id
    WHERE urs.user_id = auth.uid()
      AND urs.tenant_id = public.fn_current_tenant_id()
      AND rp.permission = 'iam.admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.fn_has_permission(p_permission text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles_sedes urs
    JOIN public.role_permissions rp
      ON rp.role_id = urs.role_id
    WHERE urs.user_id = auth.uid()
      AND urs.tenant_id = public.fn_current_tenant_id()
      AND rp.permission = p_permission
  )
$$;

CREATE OR REPLACE FUNCTION public.fn_validate_permission_exists()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.cat_permissions p
    WHERE p.id = NEW.permission
  ) THEN
    RAISE EXCEPTION 'Permiso no registrado en cat_permissions: %', NEW.permission;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_trigger_audit_universal()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_pk text;
  v_tenant uuid;
BEGIN
  BEGIN
    v_pk := COALESCE(NEW.id::text, OLD.id::text);
  EXCEPTION WHEN others THEN
    v_pk := NULL;
  END;

  BEGIN
    v_tenant := COALESCE(NEW.tenant_id, OLD.tenant_id);
  EXCEPTION WHEN others THEN
    v_tenant := NULL;
  END;

  INSERT INTO public.audit_logs(
    tenant_id,
    schema_name,
    table_name,
    operation,
    record_pk,
    old_data,
    new_data,
    changed_by,
    created_at
  )
  VALUES (
    v_tenant,
    TG_TABLE_SCHEMA,
    TG_TABLE_NAME,
    TG_OP,
    v_pk,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    auth.uid(),
    now()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_is_module_enabled(p_module_code text)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_modules tm
    WHERE tm.tenant_id = public.fn_current_tenant_id()
      AND tm.module_code = p_module_code
      AND tm.status_code = 'enabled'
  )
$$;

-- Bootstrap básico documental
CREATE OR REPLACE FUNCTION public.fn_bootstrap_tenant(
  p_name text,
  p_tax_id text,
  p_industry_type_id text,
  p_plan_id text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  INSERT INTO public.tenants(
    name, tax_id, industry_type_id, plan_id
  )
  VALUES (
    p_name, p_tax_id, p_industry_type_id, p_plan_id
  )
  RETURNING id INTO v_tenant_id;

  INSERT INTO public.subscription_contracts(
    tenant_id, plan_id, status_id
  )
  VALUES (
    v_tenant_id, p_plan_id, 'PENDING'
  );

  RETURN v_tenant_id;
END;
$$;

-- =============================================================================
-- 12. TRIGGERS
-- =============================================================================

DROP TRIGGER IF EXISTS trg_role_permissions_validate_permission
  ON public.role_permissions;

CREATE TRIGGER trg_role_permissions_validate_permission
BEFORE INSERT OR UPDATE ON public.role_permissions
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_permission_exists();

DROP TRIGGER IF EXISTS trg_user_roles_sedes_audit
  ON public.user_roles_sedes;

CREATE TRIGGER trg_user_roles_sedes_audit
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles_sedes
FOR EACH ROW
EXECUTE FUNCTION public.fn_trigger_audit_universal();

-- updated_at triggers
DROP TRIGGER IF EXISTS trg_public_tenants_set_updated_at ON public.tenants;
CREATE TRIGGER trg_public_tenants_set_updated_at
BEFORE UPDATE ON public.tenants
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_sedes_set_updated_at ON public.sedes;
CREATE TRIGGER trg_public_sedes_set_updated_at
BEFORE UPDATE ON public.sedes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_profiles_set_updated_at ON public.profiles;
CREATE TRIGGER trg_public_profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_roles_set_updated_at ON public.roles;
CREATE TRIGGER trg_public_roles_set_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_subscription_contracts_set_updated_at ON public.subscription_contracts;
CREATE TRIGGER trg_public_subscription_contracts_set_updated_at
BEFORE UPDATE ON public.subscription_contracts
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_entitlements_set_updated_at ON public.entitlements;
CREATE TRIGGER trg_public_entitlements_set_updated_at
BEFORE UPDATE ON public.entitlements
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_subscription_changes_set_updated_at ON public.subscription_changes;
CREATE TRIGGER trg_public_subscription_changes_set_updated_at
BEFORE UPDATE ON public.subscription_changes
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_invoices_set_updated_at ON public.invoices;
CREATE TRIGGER trg_public_invoices_set_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_payment_methods_set_updated_at ON public.payment_methods;
CREATE TRIGGER trg_public_payment_methods_set_updated_at
BEFORE UPDATE ON public.payment_methods
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_payment_transactions_set_updated_at ON public.payment_transactions;
CREATE TRIGGER trg_public_payment_transactions_set_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_public_tenant_modules_set_updated_at ON public.tenant_modules;
CREATE TRIGGER trg_public_tenant_modules_set_updated_at
BEFORE UPDATE ON public.tenant_modules
FOR EACH ROW
EXECUTE FUNCTION public.fn_set_updated_at();

-- =============================================================================
-- 13. NORMALIZACIÓN DE tenant_id DEFAULT
-- Aplicado como criterio documental del core
-- =============================================================================

ALTER TABLE public.sedes
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.roles
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.user_roles_sedes
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.role_access_constraints
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.mfa_challenges
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.devices
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.terminals
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.sessions
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.auth_events
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.subscription_contracts
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.entitlements
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.subscription_changes
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.invoices
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.payment_methods
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.payment_transactions
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

ALTER TABLE public.tenant_modules
  ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id();

-- =============================================================================
-- 14. FKS DE created_by / updated_by HACIA auth.users
-- =============================================================================

ALTER TABLE public.subscription_contracts
  ADD CONSTRAINT IF NOT EXISTS fk_public_subscription_contracts_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.subscription_contracts
  ADD CONSTRAINT IF NOT EXISTS fk_public_subscription_contracts_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.entitlements
  ADD CONSTRAINT IF NOT EXISTS fk_public_entitlements_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.entitlements
  ADD CONSTRAINT IF NOT EXISTS fk_public_entitlements_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.subscription_changes
  ADD CONSTRAINT IF NOT EXISTS fk_public_subscription_changes_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.subscription_changes
  ADD CONSTRAINT IF NOT EXISTS fk_public_subscription_changes_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD CONSTRAINT IF NOT EXISTS fk_public_invoices_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  ADD CONSTRAINT IF NOT EXISTS fk_public_invoices_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.payment_methods
  ADD CONSTRAINT IF NOT EXISTS fk_public_payment_methods_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.payment_methods
  ADD CONSTRAINT IF NOT EXISTS fk_public_payment_methods_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT IF NOT EXISTS fk_public_payment_transactions_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.payment_transactions
  ADD CONSTRAINT IF NOT EXISTS fk_public_payment_transactions_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tenant_modules
  ADD CONSTRAINT IF NOT EXISTS fk_public_tenant_modules_created_by_auth_users
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.tenant_modules
  ADD CONSTRAINT IF NOT EXISTS fk_public_tenant_modules_updated_by_auth_users
  FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT IF NOT EXISTS fk_public_audit_logs_changed_by_auth_users
  FOREIGN KEY (changed_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- =============================================================================
-- 15. RLS
-- =============================================================================

ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles_sedes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_access_constraints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.terminals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Catálogos: lectura para autenticados
ALTER TABLE public.cat_industry_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_plan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tenant_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_subscription_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_subscription_change_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_invoice_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_payment_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_generos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_paises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_monedas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tipos_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_module_statuses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_cat_industry_types_select ON public.cat_industry_types;
CREATE POLICY p_cat_industry_types_select
ON public.cat_industry_types
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_plan_types_select ON public.cat_plan_types;
CREATE POLICY p_cat_plan_types_select
ON public.cat_plan_types
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_tenant_statuses_select ON public.cat_tenant_statuses;
CREATE POLICY p_cat_tenant_statuses_select
ON public.cat_tenant_statuses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_subscription_statuses_select ON public.cat_subscription_statuses;
CREATE POLICY p_cat_subscription_statuses_select
ON public.cat_subscription_statuses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_subscription_change_statuses_select ON public.cat_subscription_change_statuses;
CREATE POLICY p_cat_subscription_change_statuses_select
ON public.cat_subscription_change_statuses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_invoice_statuses_select ON public.cat_invoice_statuses;
CREATE POLICY p_cat_invoice_statuses_select
ON public.cat_invoice_statuses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_payment_statuses_select ON public.cat_payment_statuses;
CREATE POLICY p_cat_payment_statuses_select
ON public.cat_payment_statuses
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_permissions_select ON public.cat_permissions;
CREATE POLICY p_cat_permissions_select
ON public.cat_permissions
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_generos_select ON public.cat_generos;
CREATE POLICY p_cat_generos_select
ON public.cat_generos
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_paises_select ON public.cat_paises;
CREATE POLICY p_cat_paises_select
ON public.cat_paises
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_monedas_select ON public.cat_monedas;
CREATE POLICY p_cat_monedas_select
ON public.cat_monedas
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_tipos_documento_select ON public.cat_tipos_documento;
CREATE POLICY p_cat_tipos_documento_select
ON public.cat_tipos_documento
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS p_cat_module_statuses_select ON public.cat_module_statuses;
CREATE POLICY p_cat_module_statuses_select
ON public.cat_module_statuses
FOR SELECT
TO authenticated
USING (true);

-- Policies multi-tenant
DROP POLICY IF EXISTS p_sedes_tenant_all ON public.sedes;
CREATE POLICY p_sedes_tenant_all
ON public.sedes
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_profiles_tenant_select ON public.profiles;
CREATE POLICY p_profiles_tenant_select
ON public.profiles
FOR SELECT
TO authenticated
USING (
  tenant_id = public.fn_current_tenant_id()
  OR id = auth.uid()
);

DROP POLICY IF EXISTS p_profiles_tenant_update_self ON public.profiles;
CREATE POLICY p_profiles_tenant_update_self
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  tenant_id = public.fn_current_tenant_id()
  AND id = auth.uid()
)
WITH CHECK (
  tenant_id = public.fn_current_tenant_id()
  AND id = auth.uid()
);

DROP POLICY IF EXISTS p_roles_tenant_all ON public.roles;
CREATE POLICY p_roles_tenant_all
ON public.roles
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_role_permissions_tenant_select ON public.role_permissions;
CREATE POLICY p_role_permissions_tenant_select
ON public.role_permissions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_id
      AND r.tenant_id = public.fn_current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_role_permissions_tenant_write ON public.role_permissions;
CREATE POLICY p_role_permissions_tenant_write
ON public.role_permissions
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_id
      AND r.tenant_id = public.fn_current_tenant_id()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.roles r
    WHERE r.id = role_id
      AND r.tenant_id = public.fn_current_tenant_id()
  )
);

DROP POLICY IF EXISTS p_user_roles_sedes_tenant_all ON public.user_roles_sedes;
CREATE POLICY p_user_roles_sedes_tenant_all
ON public.user_roles_sedes
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_role_access_constraints_tenant_all ON public.role_access_constraints;
CREATE POLICY p_role_access_constraints_tenant_all
ON public.role_access_constraints
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_mfa_challenges_tenant_all ON public.mfa_challenges;
CREATE POLICY p_mfa_challenges_tenant_all
ON public.mfa_challenges
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_devices_tenant_all ON public.devices;
CREATE POLICY p_devices_tenant_all
ON public.devices
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_terminals_tenant_all ON public.terminals;
CREATE POLICY p_terminals_tenant_all
ON public.terminals
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_sessions_tenant_all ON public.sessions;
CREATE POLICY p_sessions_tenant_all
ON public.sessions
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_auth_events_tenant_all ON public.auth_events;
CREATE POLICY p_auth_events_tenant_all
ON public.auth_events
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_subscription_contracts_tenant_all ON public.subscription_contracts;
CREATE POLICY p_subscription_contracts_tenant_all
ON public.subscription_contracts
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_entitlements_tenant_all ON public.entitlements;
CREATE POLICY p_entitlements_tenant_all
ON public.entitlements
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_subscription_changes_tenant_all ON public.subscription_changes;
CREATE POLICY p_subscription_changes_tenant_all
ON public.subscription_changes
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_invoices_tenant_all ON public.invoices;
CREATE POLICY p_invoices_tenant_all
ON public.invoices
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_payment_methods_tenant_all ON public.payment_methods;
CREATE POLICY p_payment_methods_tenant_all
ON public.payment_methods
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_payment_transactions_tenant_all ON public.payment_transactions;
CREATE POLICY p_payment_transactions_tenant_all
ON public.payment_transactions
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_payment_webhook_events_tenant_all ON public.payment_webhook_events;
CREATE POLICY p_payment_webhook_events_tenant_all
ON public.payment_webhook_events
FOR ALL
TO authenticated
USING (
  tenant_id IS NULL OR tenant_id = public.fn_current_tenant_id()
)
WITH CHECK (
  tenant_id IS NULL OR tenant_id = public.fn_current_tenant_id()
);

DROP POLICY IF EXISTS p_tenant_modules_tenant_all ON public.tenant_modules;
CREATE POLICY p_tenant_modules_tenant_all
ON public.tenant_modules
FOR ALL
TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_audit_logs_tenant_select ON public.audit_logs;
CREATE POLICY p_audit_logs_tenant_select
ON public.audit_logs
FOR SELECT
TO authenticated
USING (tenant_id = public.fn_current_tenant_id());

-- endurecimiento: sin inserts/updates/deletes directos desde cliente
REVOKE INSERT, UPDATE, DELETE ON public.audit_logs FROM authenticated;

COMMIT;