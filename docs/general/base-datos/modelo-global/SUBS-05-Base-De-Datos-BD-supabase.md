-- =============================================================================
-- ARQUITECTURA MAESTRA V3 (COMPLETA): SAAS MULTI-TENANT + IAM + SUBS + AUDIT + RLS
-- Para Supabase / PostgreSQL
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 0) EXTENSIONES
-- ---------------------------------------------------------------------------
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- 1) CATÁLOGOS (DICCIONARIOS)
-- ---------------------------------------------------------------------------

create table if not exists public.cat_industry_types (
  id text primary key,              -- 'retail', 'gym', 'health', etc.
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.cat_plan_types (
  id text primary key,              -- 'basic', 'pro', 'enterprise'
  description text not null,
  created_at timestamptz not null default now()
);

-- Estados financieros/operativos del tenant (más completo)
create table if not exists public.cat_tenant_statuses (
  id text primary key,              -- 'FIN-ACTIVE','FIN-GRACE','FIN-READONLY','FIN-SUSPENDED','FIN-INCONSISTENT','FIN-PENDING'
  description text not null,
  created_at timestamptz not null default now()
);

-- Estado de suscripción (contrato)
create table if not exists public.cat_subscription_statuses (
  id text primary key,              -- 'ACTIVE','GRACE','READONLY','SUSPENDED','PENDING','CANCELLED'
  description text not null,
  created_at timestamptz not null default now()
);

-- FSM de cambios de plan / cambios financieros
create table if not exists public.cat_subscription_change_statuses (
  id text primary key,              -- 'CHG-SUBMITTED','CHG-AWAITING-CONFIRMATION','CHG-APPLIED','CHG-FAILED','CHG-CONFLICT'
  description text not null,
  created_at timestamptz not null default now()
);

-- Estado de factura
create table if not exists public.cat_invoice_statuses (
  id text primary key,              -- 'DRAFT','ISSUED','PAID','VOID','OVERDUE'
  description text not null,
  created_at timestamptz not null default now()
);

-- Estado de intento/transacción de pago (almacenamiento)
create table if not exists public.cat_payment_statuses (
  id text primary key,              -- 'CREATED','PENDING','SUCCEEDED','FAILED','CANCELLED','REFUNDED','CHARGEBACK'
  description text not null,
  created_at timestamptz not null default now()
);

-- Valores iniciales (idempotente)
insert into public.cat_industry_types(id, description)
values
  ('retail','Retail'),
  ('gym','Gimnasio'),
  ('health','Salud')
on conflict (id) do nothing;

insert into public.cat_plan_types(id, description)
values
  ('basic','Básico'),
  ('pro','Pro'),
  ('enterprise','Enterprise')
on conflict (id) do nothing;

insert into public.cat_tenant_statuses(id, description)
values
  ('FIN-PENDING','Pendiente / Onboarding'),
  ('FIN-ACTIVE','Activo'),
  ('FIN-GRACE','Periodo de gracia'),
  ('FIN-READONLY','Solo lectura'),
  ('FIN-SUSPENDED','Suspendido'),
  ('FIN-INCONSISTENT','Inconsistente (bloquea cambios financieros)')
on conflict (id) do nothing;

insert into public.cat_subscription_statuses(id, description)
values
  ('PENDING','Pendiente'),
  ('ACTIVE','Activa'),
  ('GRACE','Gracia'),
  ('READONLY','Solo lectura'),
  ('SUSPENDED','Suspendida'),
  ('CANCELLED','Cancelada')
on conflict (id) do nothing;

insert into public.cat_subscription_change_statuses(id, description)
values
  ('CHG-SUBMITTED','Cambio registrado'),
  ('CHG-AWAITING-CONFIRMATION','Esperando confirmación (ej. pago)'),
  ('CHG-APPLIED','Aplicado'),
  ('CHG-FAILED','Falló'),
  ('CHG-CONFLICT','En conflicto')
on conflict (id) do nothing;

insert into public.cat_invoice_statuses(id, description)
values
  ('DRAFT','Borrador'),
  ('ISSUED','Emitida'),
  ('PAID','Pagada'),
  ('VOID','Anulada'),
  ('OVERDUE','Vencida')
on conflict (id) do nothing;

insert into public.cat_payment_statuses(id, description)
values
  ('CREATED','Creado'),
  ('PENDING','Pendiente'),
  ('SUCCEEDED','Exitoso'),
  ('FAILED','Fallido'),
  ('CANCELLED','Cancelado'),
  ('REFUNDED','Reembolsado'),
  ('CHARGEBACK','Contracargo')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2) CORE: TENANTS + SEDES
-- ---------------------------------------------------------------------------

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tax_id text unique not null,
  industry_type_id text not null references public.cat_industry_types(id),
  plan_id text not null references public.cat_plan_types(id),
  status_financial_id text not null default 'FIN-PENDING' references public.cat_tenant_statuses(id),

  billing_day int not null default 1 check (billing_day between 1 and 28), -- evita meses cortos
  max_licenses int not null default 1 check (max_licenses >= 1),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tenants_status on public.tenants(status_financial_id);

create table if not exists public.sedes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists idx_sedes_tenant on public.sedes(tenant_id);

-- ---------------------------------------------------------------------------
-- 3) IAM: PROFILES, ROLES, PERMISOS, ASIGNACIONES POR SEDE
-- ---------------------------------------------------------------------------

-- Perfil: 1 a 1 con auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete set null,
  full_name text,
  pin_hash text,                                -- hash (nunca pin plano)
  is_blocked boolean not null default false,
  blocked_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_tenant on public.profiles(tenant_id);

-- Roles por tenant
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  hierarchy_level int not null default 100,      -- menor = más poder (0 superadmin tenant)
  is_system_role boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists idx_roles_tenant on public.roles(tenant_id);

-- Permisos normalizados (en vez de text[])
create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission text not null,
  created_at timestamptz not null default now(),
  primary key (role_id, permission)
);

-- Asignación user-role por sede (scope sede)
create table if not exists public.user_roles_sedes (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, role_id, sede_id)
);

create index if not exists idx_urs_tenant on public.user_roles_sedes(tenant_id);
create index if not exists idx_urs_user on public.user_roles_sedes(user_id);
create index if not exists idx_urs_sede on public.user_roles_sedes(sede_id);

-- Restricciones opcionales para roles (condicionados por IP/horario/dispositivo)
create table if not exists public.role_access_constraints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  sede_id uuid references public.sedes(id) on delete cascade,
  ip_cidr cidr,                                 -- ej 192.168.0.0/24
  time_start time,                              -- ventana horaria
  time_end time,
  require_trusted_device boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_rac_role on public.role_access_constraints(role_id);

-- ---------------------------------------------------------------------------
-- 4) IAM OPERATIVO: TERMINALES, DISPOSITIVOS, SESIONES, EVENTOS AUTH/PIN
-- ---------------------------------------------------------------------------

-- Terminales físicos (para modo “terminal” en sede)
create table if not exists public.terminals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  sede_id uuid not null references public.sedes(id) on delete cascade,
  name text not null,
  is_active boolean not null default true,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, sede_id, name)
);

create index if not exists idx_terminals_tenant on public.terminals(tenant_id);

-- Dispositivos (fingerprint, confiable, etc.)
create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  device_fingerprint text not null,             -- hash/fingerprint
  device_type text,                              -- 'web','mobile','terminal'
  is_trusted boolean not null default false,
  last_ip inet,
  last_user_agent text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, device_fingerprint)
);

create index if not exists idx_devices_user on public.devices(user_id);

-- Sesiones (web/terminal/api)
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  terminal_id uuid references public.terminals(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,

  session_type text not null check (session_type in ('web','terminal','api')),
  ip inet,
  user_agent text,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoke_reason text
);

create index if not exists idx_sessions_user on public.sessions(user_id);
create index if not exists idx_sessions_tenant on public.sessions(tenant_id);

-- Eventos de autenticación/PIN (éxito/fallo, bloqueo, etc.)
create table if not exists public.auth_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  session_id uuid references public.sessions(id) on delete set null,
  terminal_id uuid references public.terminals(id) on delete set null,
  device_id uuid references public.devices(id) on delete set null,
  event_type text not null,                      -- 'PIN_OK','PIN_FAIL','LOGIN_OK','LOGIN_FAIL','SESSION_REVOKED', etc.
  result text not null check (result in ('success','error')),
  ip inet,
  user_agent text,
  error_code text,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_events_tenant_time on public.auth_events(tenant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5) SUBS: CONTRATO, ENTITLEMENTS, CAMBIOS (FSM), FACTURACIÓN
-- ---------------------------------------------------------------------------

-- Config por plan (límites y retención)
create table if not exists public.plan_policies (
  plan_id text primary key references public.cat_plan_types(id) on delete cascade,
  retention_days int not null default 180 check (retention_days between 30 and 3650),
  max_sedes int not null default 1 check (max_sedes >= 1),
  max_licenses int not null default 1 check (max_licenses >= 1),
  can_use_terminals boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.plan_policies(plan_id, retention_days, max_sedes, max_licenses, can_use_terminals)
values
  ('basic', 180, 1, 3, false),
  ('pro', 365, 5, 30, true),
  ('enterprise', 730, 999, 999, true)
on conflict (plan_id) do nothing;

-- Contrato de suscripción por tenant (1 activo principal)
create table if not exists public.subscription_contracts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  current_plan_id text not null references public.cat_plan_types(id),
  status_id text not null default 'PENDING' references public.cat_subscription_statuses(id),

  cycle_start date,
  cycle_end date,
  billing_day int not null default 1 check (billing_day between 1 and 28),
  grace_days int not null default 7 check (grace_days between 0 and 60),

  read_only_at timestamptz,                      -- cuando pasa a solo lectura
  suspended_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id)
);

create index if not exists idx_sub_contract_status on public.subscription_contracts(status_id);

-- Entitlements (capacidad efectiva, aplicable tras confirmación)
create table if not exists public.entitlements (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  plan_id text not null references public.cat_plan_types(id),
  max_sedes int not null,
  max_licenses int not null,
  can_use_terminals boolean not null,
  effective_from timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Cambios de suscripción (FSM)
create table if not exists public.subscription_changes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  from_plan_id text not null references public.cat_plan_types(id),
  to_plan_id text not null references public.cat_plan_types(id),
  status_id text not null default 'CHG-SUBMITTED' references public.cat_subscription_change_statuses(id),

  requested_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),

  -- idempotencia: para que el mismo cambio no se procese 2 veces
  idempotency_key text unique,

  notes text
);

create index if not exists idx_sub_changes_tenant on public.subscription_changes(tenant_id);

-- Facturas (invoices) (sin SUNAT aún, pero estructura)
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  invoice_number text,                            -- opcional, puedes numerar después
  status_id text not null default 'DRAFT' references public.cat_invoice_statuses(id),

  currency text not null default 'PEN',
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,

  period_start date,
  period_end date,
  issued_at timestamptz,
  due_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_invoices_tenant_status on public.invoices(tenant_id, status_id);

create table if not exists public.invoice_lines (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  qty int not null default 1 check (qty >= 1),
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);

-- ---------------------------------------------------------------------------
-- 6) PAGOS (ALMACENAMIENTO SIN PASARELA)
-- ---------------------------------------------------------------------------

-- Métodos de pago almacenados (solo referencia/token, nunca tarjeta completa)
create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,

  method_type text not null check (method_type in ('card_token','bank_transfer','cash','other')),
  provider text,                                   -- 'visa','mastercard','yape','plin','manual'
  token_ref text,                                  -- token de pasarela (cuando exista) o referencia manual
  last4 text,                                      -- opcional
  holder_name text,
  is_default boolean not null default false,

  created_at timestamptz not null default now()
);

create index if not exists idx_payment_methods_tenant on public.payment_methods(tenant_id);

-- Intentos / transacciones almacenadas (aunque aún sea manual)
create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete set null,
  subscription_change_id uuid references public.subscription_changes(id) on delete set null,

  status_id text not null default 'CREATED' references public.cat_payment_statuses(id),
  currency text not null default 'PEN',
  amount numeric(12,2) not null check (amount >= 0),

  payment_method_id uuid references public.payment_methods(id) on delete set null,

  -- ids externos para el futuro (pasarela)
  provider text,
  external_payment_id text,
  external_reference text,

  -- idempotencia para que el mismo pago no se duplique
  idempotency_key text unique,

  -- trazabilidad
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  raw_payload jsonb                                 -- guarda lo que quieras (manual o futuro webhook)
);

create index if not exists idx_pay_tx_tenant_status on public.payment_transactions(tenant_id, status_id);

-- “Webhooks” almacenados para futuro (aunque no los uses aún)
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,

  provider text not null,
  event_id text not null,                           -- id único del proveedor
  signature_valid boolean not null default false,
  received_at timestamptz not null default now(),
  processed_at timestamptz,

  payload jsonb not null,

  unique (provider, event_id)                       -- idempotencia base
);

-- ---------------------------------------------------------------------------
-- 7) AUDITORÍA FORENSE (MEJORADA)
-- ---------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),

  -- alcance
  tenant_id uuid not null,
  sede_id uuid,
  actor_id uuid,
  actor_role_id uuid,
  session_id uuid,
  terminal_id uuid,
  device_id uuid,

  -- evento
  event_id uuid default gen_random_uuid(),          -- correlación
  event_type text not null,                         -- 'INSERT','UPDATE','DELETE', o custom
  resource_name text not null,
  result text not null default 'success' check (result in ('success','error')),
  error_code text,

  -- evidencia
  ip inet,
  user_agent text,
  criticality text not null default 'medium' check (criticality in ('low','medium','high','critical')),

  payload_before jsonb,
  payload_after jsonb,

  retention_until timestamptz,                      -- para limpieza por plan
  created_at timestamptz not null default now()
);

create index if not exists idx_audit_tenant_time on public.audit_logs(tenant_id, created_at desc);
create index if not exists idx_audit_resource on public.audit_logs(resource_name);

-- ---------------------------------------------------------------------------
-- 8) HELPERS: updated_at, tenant actual, permisos, auditoría universal robusta
-- ---------------------------------------------------------------------------

-- updated_at auto
create or replace function public.fn_set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Tenant actual del usuario
create or replace function public.fn_current_tenant_id()
returns uuid
language sql
stable
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

-- ¿Usuario tiene permiso? (opcionalmente por sede)
create or replace function public.fn_has_permission(p_permission text, p_sede_id uuid default null)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.user_roles_sedes urs
    join public.roles r on r.id = urs.role_id
    join public.role_permissions rp on rp.role_id = r.id
    where urs.user_id = auth.uid()
      and rp.permission = p_permission
      and r.tenant_id = public.fn_current_tenant_id()
      and (p_sede_id is null or urs.sede_id = p_sede_id)
  );
$$;

-- Permiso “admin del tenant” (atajo)
create or replace function public.fn_is_tenant_admin()
returns boolean
language sql
stable
as $$
  select public.fn_has_permission('iam.admin', null);
$$;

-- Auditoría universal con TG_ARGV[0] = columna tenant (ej 'tenant_id' o 'id')
create or replace function public.fn_trigger_audit_universal()
returns trigger
language plpgsql
security definer
as $$
declare
  v_tenant_col text := tg_argv[0];
  v_tenant_id uuid;
begin
  if v_tenant_col is null then
    raise exception 'Audit trigger requires tenant column name in TG_ARGV[0]';
  end if;

  -- obtener tenant según columna indicada
  if tg_op in ('INSERT','UPDATE') then
    execute format('select ($1).%I::uuid', v_tenant_col) into v_tenant_id using new;
  else
    execute format('select ($1).%I::uuid', v_tenant_col) into v_tenant_id using old;
  end if;

  insert into public.audit_logs(
    tenant_id,
    actor_id,
    event_type,
    resource_name,
    payload_before,
    payload_after,
    ip,
    user_agent,
    retention_until
  )
  values (
    v_tenant_id,
    auth.uid(),
    tg_op,
    tg_table_name,
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end,
    null,
    null,
    -- retención: por plan (si existe contrato)
    now() + make_interval(days =>
      coalesce(
        (select pp.retention_days
         from public.tenants t
         join public.plan_policies pp on pp.plan_id = t.plan_id
         where t.id = v_tenant_id),
        180
      )
    )
  );

  return null; -- AFTER trigger
end;
$$;

-- ---------------------------------------------------------------------------
-- 9) TRIGGERS updated_at
-- ---------------------------------------------------------------------------

drop trigger if exists tr_tenants_updated on public.tenants;
create trigger tr_tenants_updated
before update on public.tenants
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_sedes_updated on public.sedes;
create trigger tr_sedes_updated
before update on public.sedes
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_profiles_updated on public.profiles;
create trigger tr_profiles_updated
before update on public.profiles
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_roles_updated on public.roles;
create trigger tr_roles_updated
before update on public.roles
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_terminals_updated on public.terminals;
create trigger tr_terminals_updated
before update on public.terminals
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_sub_contract_updated on public.subscription_contracts;
create trigger tr_sub_contract_updated
before update on public.subscription_contracts
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_entitlements_updated on public.entitlements;
create trigger tr_entitlements_updated
before update on public.entitlements
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_invoices_updated on public.invoices;
create trigger tr_invoices_updated
before update on public.invoices
for each row execute function public.fn_set_updated_at();

drop trigger if exists tr_pay_tx_updated on public.payment_transactions;
create trigger tr_pay_tx_updated
before update on public.payment_transactions
for each row execute function public.fn_set_updated_at();

-- ---------------------------------------------------------------------------
-- 10) TRIGGERS de auditoría (CORE + IAM + SUBS + PAGOS)
-- ---------------------------------------------------------------------------

-- Tenants: tenant col = 'id'
drop trigger if exists tr_audit_tenants on public.tenants;
create trigger tr_audit_tenants
after insert or update or delete on public.tenants
for each row execute function public.fn_trigger_audit_universal('id');

-- Tenant-scoped normales: tenant col = 'tenant_id'
drop trigger if exists tr_audit_sedes on public.sedes;
create trigger tr_audit_sedes
after insert or update or delete on public.sedes
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_profiles on public.profiles;
create trigger tr_audit_profiles
after insert or update or delete on public.profiles
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_roles on public.roles;
create trigger tr_audit_roles
after insert or update or delete on public.roles
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_urs on public.user_roles_sedes;
create trigger tr_audit_urs
after insert or update or delete on public.user_roles_sedes
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_terminals on public.terminals;
create trigger tr_audit_terminals
after insert or update or delete on public.terminals
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_devices on public.devices;
create trigger tr_audit_devices
after insert or update or delete on public.devices
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_sessions on public.sessions;
create trigger tr_audit_sessions
after insert or update or delete on public.sessions
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_sub_contracts on public.subscription_contracts;
create trigger tr_audit_sub_contracts
after insert or update or delete on public.subscription_contracts
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_entitlements on public.entitlements;
create trigger tr_audit_entitlements
after insert or update or delete on public.entitlements
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_sub_changes on public.subscription_changes;
create trigger tr_audit_sub_changes
after insert or update or delete on public.subscription_changes
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_invoices on public.invoices;
create trigger tr_audit_invoices
after insert or update or delete on public.invoices
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_payment_methods on public.payment_methods;
create trigger tr_audit_payment_methods
after insert or update or delete on public.payment_methods
for each row execute function public.fn_trigger_audit_universal('tenant_id');

drop trigger if exists tr_audit_payment_tx on public.payment_transactions;
create trigger tr_audit_payment_tx
after insert or update or delete on public.payment_transactions
for each row execute function public.fn_trigger_audit_universal('tenant_id');

-- ---------------------------------------------------------------------------
-- 11) RLS: AISLAMIENTO DE DATOS (TENANT + PERMISOS)
-- ---------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.sedes enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles_sedes enable row level security;
alter table public.role_access_constraints enable row level security;

alter table public.terminals enable row level security;
alter table public.devices enable row level security;
alter table public.sessions enable row level security;
alter table public.auth_events enable row level security;

alter table public.subscription_contracts enable row level security;
alter table public.entitlements enable row level security;
alter table public.subscription_changes enable row level security;

alter table public.invoices enable row level security;
alter table public.invoice_lines enable row level security;

alter table public.payment_methods enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_webhook_events enable row level security;

alter table public.audit_logs enable row level security;

-- Tenants: solo el mismo tenant
drop policy if exists p_tenants_select on public.tenants;
create policy p_tenants_select on public.tenants
for select
using (id = public.fn_current_tenant_id());

drop policy if exists p_tenants_update on public.tenants;
create policy p_tenants_update on public.tenants
for update
using (id = public.fn_current_tenant_id() and public.fn_is_tenant_admin())
with check (id = public.fn_current_tenant_id());

-- Sedes: aislamiento por tenant
drop policy if exists p_sedes_all on public.sedes;
create policy p_sedes_all on public.sedes
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

-- Profiles: usuario ve su perfil y admins ven todos del tenant
drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select on public.profiles
for select
using (
  tenant_id = public.fn_current_tenant_id()
  and (id = auth.uid() or public.fn_has_permission('iam.users.read', null) or public.fn_is_tenant_admin())
);

drop policy if exists p_profiles_insert on public.profiles;
create policy p_profiles_insert on public.profiles
for insert
with check (id = auth.uid()); -- onboarding básico

drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update on public.profiles
for update
using (
  tenant_id = public.fn_current_tenant_id()
  and (id = auth.uid() or public.fn_has_permission('iam.users.manage', null) or public.fn_is_tenant_admin())
)
with check (true);

-- Roles y permisos: lectura para tenant
drop policy if exists p_roles_select on public.roles;
create policy p_roles_select on public.roles
for select
using (tenant_id = public.fn_current_tenant_id());

-- Roles: políticas de escritura separadas (PostgreSQL estándar)
drop policy if exists p_roles_insert on public.roles;
create policy p_roles_insert on public.roles
for insert
with check (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.roles.manage', null) or public.fn_is_tenant_admin()));

drop policy if exists p_roles_update on public.roles;
create policy p_roles_update on public.roles
for update
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.roles.manage', null) or public.fn_is_tenant_admin()))
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_roles_delete on public.roles;
create policy p_roles_delete on public.roles
for delete
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.roles.manage', null) or public.fn_is_tenant_admin()));

drop policy if exists p_role_permissions_all on public.role_permissions;
create policy p_role_permissions_all on public.role_permissions
for all
using (
  exists (select 1 from public.roles r where r.id = role_permissions.role_id and r.tenant_id = public.fn_current_tenant_id())
)
with check (
  exists (select 1 from public.roles r where r.id = role_permissions.role_id and r.tenant_id = public.fn_current_tenant_id())
);

-- user_roles_sedes: lectura del tenant
drop policy if exists p_urs_select on public.user_roles_sedes;
create policy p_urs_select on public.user_roles_sedes
for select
using (tenant_id = public.fn_current_tenant_id());

-- user_roles_sedes: políticas de escritura separadas
drop policy if exists p_urs_insert on public.user_roles_sedes;
create policy p_urs_insert on public.user_roles_sedes
for insert
with check (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.user_roles.manage', null) or public.fn_is_tenant_admin()));

drop policy if exists p_urs_update on public.user_roles_sedes;
create policy p_urs_update on public.user_roles_sedes
for update
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.user_roles.manage', null) or public.fn_is_tenant_admin()))
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_urs_delete on public.user_roles_sedes;
create policy p_urs_delete on public.user_roles_sedes
for delete
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.user_roles.manage', null) or public.fn_is_tenant_admin()));

-- IAM operativo (aislamiento por tenant)
drop policy if exists p_terminals_all on public.terminals;
create policy p_terminals_all on public.terminals
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_devices_all on public.devices;
create policy p_devices_all on public.devices
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_sessions_all on public.sessions;
create policy p_sessions_all on public.sessions
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_auth_events_select on public.auth_events;
create policy p_auth_events_select on public.auth_events
for select
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.audit.read', null) or public.fn_is_tenant_admin()));

-- SUBS
drop policy if exists p_sub_contract_all on public.subscription_contracts;
create policy p_sub_contract_all on public.subscription_contracts
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_entitlements_all on public.entitlements;
create policy p_entitlements_all on public.entitlements
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_sub_changes_all on public.subscription_changes;
create policy p_sub_changes_all on public.subscription_changes
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

-- Facturación
drop policy if exists p_invoices_all on public.invoices;
create policy p_invoices_all on public.invoices
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_invoice_lines_all on public.invoice_lines;
create policy p_invoice_lines_all on public.invoice_lines
for all
using (
  exists (
    select 1 from public.invoices i
    where i.id = invoice_lines.invoice_id
      and i.tenant_id = public.fn_current_tenant_id()
  )
)
with check (
  exists (
    select 1 from public.invoices i
    where i.id = invoice_lines.invoice_id
      and i.tenant_id = public.fn_current_tenant_id()
  )
);

-- Pagos (almacenamiento)
drop policy if exists p_payment_methods_all on public.payment_methods;
create policy p_payment_methods_all on public.payment_methods
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_payment_tx_all on public.payment_transactions;
create policy p_payment_tx_all on public.payment_transactions
for all
using (tenant_id = public.fn_current_tenant_id())
with check (tenant_id = public.fn_current_tenant_id());

drop policy if exists p_payment_webhooks_select on public.payment_webhook_events;
create policy p_payment_webhooks_select on public.payment_webhook_events
for select
using (tenant_id is null or tenant_id = public.fn_current_tenant_id());

-- Auditoría: solo lectura a admins / permiso
drop policy if exists p_audit_select on public.audit_logs;
create policy p_audit_select on public.audit_logs
for select
using (tenant_id = public.fn_current_tenant_id() and (public.fn_has_permission('iam.audit.read', null) or public.fn_is_tenant_admin()));

-- Bloqueamos insert/update/delete directos a audit_logs (solo por trigger)
drop policy if exists p_audit_no_insert on public.audit_logs;
create policy p_audit_no_insert on public.audit_logs
for insert with check (false);

drop policy if exists p_audit_no_update on public.audit_logs;
create policy p_audit_no_update on public.audit_logs
for update using (false) with check (false);

drop policy if exists p_audit_no_delete on public.audit_logs;
create policy p_audit_no_delete on public.audit_logs
for delete using (false);

-- =============================================================================
-- SUPABASE BOOTSTRAP: Permisos + función para crear tenant completo
-- =============================================================================

-- ---------------------------------------------------------------------------
-- A) Catálogo de permisos (opcional pero recomendado)
-- ---------------------------------------------------------------------------

create table if not exists public.cat_permissions (
  id text primary key,
  description text not null,
  module text not null default 'core',
  created_at timestamptz not null default now()
);

-- Seed base de permisos (puedes ampliar cuando tengas tu matriz final)
insert into public.cat_permissions(id, description, module) values
  -- CORE / TENANT
  ('tenant.read', 'Ver datos del tenant', 'core'),
  ('tenant.update', 'Modificar configuración del tenant', 'core'),

  -- SEDES
  ('sedes.read', 'Ver sedes', 'core'),
  ('sedes.manage', 'Crear/editar/desactivar sedes', 'core'),

  -- IAM
  ('iam.admin', 'Administrador total del tenant (atajo)', 'iam'),
  ('iam.users.read', 'Ver usuarios del tenant', 'iam'),
  ('iam.users.manage', 'Gestionar usuarios (bloquear/desbloquear, etc.)', 'iam'),
  ('iam.roles.read', 'Ver roles', 'iam'),
  ('iam.roles.manage', 'Crear/editar/eliminar roles', 'iam'),
  ('iam.user_roles.manage', 'Asignar roles por sede', 'iam'),
  ('iam.audit.read', 'Leer auditoría/bitácora', 'iam'),
  ('iam.sessions.terminate', 'Cerrar sesiones (expulsión remota)', 'iam'),

  -- TERMINALES / DISPOSITIVOS
  ('devices.read', 'Ver dispositivos', 'iam'),
  ('devices.manage', 'Marcar dispositivo confiable / gestionar', 'iam'),
  ('terminals.read', 'Ver terminales', 'iam'),
  ('terminals.manage', 'Gestionar terminales', 'iam'),

  -- SUBS / BILLING
  ('subs.read', 'Ver suscripción/plan/estado', 'subs'),
  ('subs.manage', 'Gestionar suscripción (cambios plan, etc.)', 'subs'),
  ('billing.invoices.read', 'Ver facturas', 'billing'),
  ('billing.invoices.manage', 'Gestionar facturas', 'billing'),
  ('billing.payments.read', 'Ver pagos/transacciones', 'billing'),
  ('billing.payments.manage', 'Registrar/gestionar pagos', 'billing')

on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- B) Helper: asegurar que role_permissions solo use permisos existentes
-- (Evita typos y permisos “fantasma”)
-- ---------------------------------------------------------------------------
create or replace function public.fn_validate_permission_exists()
returns trigger as $$
begin
  if not exists (select 1 from public.cat_permissions p where p.id = new.permission) then
    raise exception 'Permission % does not exist in cat_permissions', new.permission;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_validate_role_permissions on public.role_permissions;
create trigger tr_validate_role_permissions
before insert or update on public.role_permissions
for each row execute function public.fn_validate_permission_exists();

-- ---------------------------------------------------------------------------
-- C) RLS: habilitar también en cat_permissions (solo lectura)
-- ---------------------------------------------------------------------------
alter table public.cat_permissions enable row level security;

drop policy if exists p_cat_permissions_read on public.cat_permissions;
create policy p_cat_permissions_read
on public.cat_permissions
for select
using (true);

-- ---------------------------------------------------------------------------
-- D) BOOTSTRAP: función para crear tenant completo desde el usuario autenticado
-- Recomendación: llamar esta función desde tu app cuando el usuario "crea su empresa"
-- ---------------------------------------------------------------------------

create or replace function public.fn_bootstrap_tenant(
  p_tenant_name text,
  p_tax_id text,
  p_industry_type_id text,
  p_plan_id text default 'basic',
  p_billing_day int default 1
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_tenant_id uuid;
  v_sede_id uuid;
  v_role_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- 1) Asegurar que exista profile (si no, lo crea)
  insert into public.profiles(id, full_name)
  values (v_user_id, null)
  on conflict (id) do nothing;

  -- 2) Crear tenant
  insert into public.tenants(name, tax_id, industry_type_id, plan_id, status_financial_id, billing_day, max_licenses)
  values (p_tenant_name, p_tax_id, p_industry_type_id, p_plan_id, 'FIN-ACTIVE', p_billing_day, 1)
  returning id into v_tenant_id;

  -- 3) Setear tenant_id del usuario creador
  update public.profiles
  set tenant_id = v_tenant_id
  where id = v_user_id;

  -- 4) Crear sede principal
  insert into public.sedes(tenant_id, name, is_active)
  values (v_tenant_id, 'Principal', true)
  returning id into v_sede_id;

  -- 5) Crear rol Owner (máximo nivel)
  insert into public.roles(tenant_id, name, hierarchy_level, is_system_role)
  values (v_tenant_id, 'Owner', 0, true)
  returning id into v_role_owner_id;

  -- 6) Asignar TODOS los permisos existentes al Owner
  insert into public.role_permissions(role_id, permission)
  select v_role_owner_id, p.id
  from public.cat_permissions p
  on conflict do nothing;

  -- 7) Asignar Owner al creador en la sede principal
  insert into public.user_roles_sedes(tenant_id, user_id, role_id, sede_id)
  values (v_tenant_id, v_user_id, v_role_owner_id, v_sede_id)
  on conflict do nothing;

  -- 8) Crear contrato de suscripción (1 por tenant)
  insert into public.subscription_contracts(
    tenant_id, current_plan_id, status_id, billing_day, grace_days
  )
  values (v_tenant_id, p_plan_id, 'ACTIVE', p_billing_day, 7)
  on conflict (tenant_id) do update
    set current_plan_id = excluded.current_plan_id,
        status_id = excluded.status_id,
        billing_day = excluded.billing_day,
        updated_at = now();

  -- 9) Crear entitlements basados en plan_policies
  insert into public.entitlements(tenant_id, plan_id, max_sedes, max_licenses, can_use_terminals)
  select v_tenant_id, pp.plan_id, pp.max_sedes, pp.max_licenses, pp.can_use_terminals
  from public.plan_policies pp
  where pp.plan_id = p_plan_id
  on conflict (tenant_id) do update
    set plan_id = excluded.plan_id,
        max_sedes = excluded.max_sedes,
        max_licenses = excluded.max_licenses,
        can_use_terminals = excluded.can_use_terminals,
        updated_at = now();

  return v_tenant_id;
end;
$$;

-- =============================================================================
-- BLOQUEO: evitar inserts directos a tenants desde el cliente
-- Solo se crea tenant por fn_bootstrap_tenant (RPC).
-- =============================================================================

-- A) Quitar cualquier policy previa que permita INSERT en tenants
drop policy if exists p_tenants_insert on public.tenants;

-- B) Crear policy que BLOQUEA insert
create policy p_tenants_no_insert
on public.tenants
for insert
with check (false);

-- C) También bloquea DELETE (opcional pero recomendado)
drop policy if exists p_tenants_delete on public.tenants;
create policy p_tenants_no_delete
on public.tenants
for delete
using (false);