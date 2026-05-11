-- ACE FASE 0 — Access & Context Engine™: estructuras base
-- Fecha: 2026-05-10
-- Tablas: access_links, memberships, dynamic_forms, role_module_access, role_field_permissions
-- Permisos: cat_permissions seeds para módulo 'ace'

begin;

-- ============================================================
-- GUARD: prereqs deben existir antes de continuar
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_set_updated_at'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACE FASE 0 prereq missing: function public.fn_set_updated_at() not found';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_trigger_audit_universal'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACE FASE 0 prereq missing: function public.fn_trigger_audit_universal() not found';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_current_tenant_id'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACE FASE 0 prereq missing: function public.fn_current_tenant_id() not found';
  end if;
end $$;

-- ============================================================
-- 1) MOTOR DE VINCULACIÓN: public.access_links
-- ============================================================
create table if not exists public.access_links (
  id               uuid        primary key default gen_random_uuid(),
  tenant_id        uuid        not null references public.tenants(id) on delete cascade,
  code             text        not null unique,
  slug             text,
  type             text        not null
                               check (type in ('VOLUNTEER_JOIN','STAFF_JOIN','BENEFICIARY_JOIN','GENERIC')),
  target_type      text        not null
                               check (target_type in ('PROJECT','PROGRAM','ACTIVITY','SEDE','GLOBAL')),
  target_id        uuid,
  assigned_role_id uuid        references public.roles(id) on delete set null,
  assigned_sede_id uuid        references public.sedes(id) on delete set null,
  onboarding_flow  text,
  max_uses         int         not null default 1 check (max_uses >= 1),
  used_count       int         not null default 0 check (used_count >= 0),
  expires_at       timestamptz,
  is_active        boolean     not null default true,
  metadata         jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  created_by       uuid        references auth.users(id) on delete set null,
  updated_by       uuid        references auth.users(id) on delete set null
);

create index if not exists idx_access_links_tenant  on public.access_links(tenant_id);
create index if not exists idx_access_links_code    on public.access_links(code);
create index if not exists idx_access_links_active  on public.access_links(tenant_id, is_active) where is_active = true;
create index if not exists idx_access_links_target  on public.access_links(tenant_id, target_type, target_id);

-- ============================================================
-- 2) MOTOR DE MEMBRESÍAS: public.memberships
-- ============================================================
create table if not exists public.memberships (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid        not null references public.tenants(id) on delete cascade,
  user_id      uuid        not null references public.profiles(id) on delete cascade,
  context_type text        not null check (context_type in ('PROYECTO','SEDE','PROGRAMA','ACTIVIDAD')),
  context_id   uuid        not null,
  role_id      uuid        references public.roles(id) on delete set null,
  status       text        not null default 'active' check (status in ('active','inactive','pending')),
  joined_at    timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid        references auth.users(id) on delete set null,
  unique(tenant_id, user_id, context_type, context_id)
);

create index if not exists idx_memberships_tenant  on public.memberships(tenant_id);
create index if not exists idx_memberships_user    on public.memberships(tenant_id, user_id);
create index if not exists idx_memberships_context on public.memberships(tenant_id, context_type, context_id);
create index if not exists idx_memberships_active  on public.memberships(tenant_id, status) where status = 'active';

-- ============================================================
-- 3) FORMULARIOS DINÁMICOS: public.dynamic_forms
-- ============================================================
create table if not exists public.dynamic_forms (
  id           uuid        primary key default gen_random_uuid(),
  tenant_id    uuid        not null references public.tenants(id) on delete cascade,
  name         text        not null,
  context_type text,
  form_schema  jsonb       not null default '{}'::jsonb,
  is_active    boolean     not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  created_by   uuid        references auth.users(id) on delete set null,
  updated_by   uuid        references auth.users(id) on delete set null
);

create index if not exists idx_dynamic_forms_tenant on public.dynamic_forms(tenant_id);
create index if not exists idx_dynamic_forms_active on public.dynamic_forms(tenant_id, is_active) where is_active = true;

-- ============================================================
-- 4) PERMISOS GRANULARES POR MÓDULO: public.role_module_access
-- ============================================================
create table if not exists public.role_module_access (
  tenant_id   uuid    not null references public.tenants(id) on delete cascade,
  role_id     uuid    not null references public.roles(id) on delete cascade,
  module_code text    not null,
  can_view    boolean not null default false,
  can_create  boolean not null default false,
  can_edit    boolean not null default false,
  can_delete  boolean not null default false,
  primary key (role_id, module_code)
);

create index if not exists idx_role_module_access_tenant on public.role_module_access(tenant_id);
create index if not exists idx_role_module_access_role   on public.role_module_access(role_id);

-- ============================================================
-- 5) PERMISOS GRANULARES POR CAMPO: public.role_field_permissions
-- ============================================================
create table if not exists public.role_field_permissions (
  id          uuid    primary key default gen_random_uuid(),
  tenant_id   uuid    not null references public.tenants(id) on delete cascade,
  role_id     uuid    not null references public.roles(id) on delete cascade,
  entity_name text    not null,
  field_name  text    not null,
  can_view    boolean not null default true,
  can_edit    boolean not null default false,
  unique(role_id, entity_name, field_name)
);

create index if not exists idx_role_field_perms_tenant on public.role_field_permissions(tenant_id);
create index if not exists idx_role_field_perms_role   on public.role_field_permissions(role_id);
create index if not exists idx_role_field_perms_entity on public.role_field_permissions(role_id, entity_name);

-- ============================================================
-- 6) TRIGGERS updated_at (idempotente — solo access_links, memberships, dynamic_forms)
-- ============================================================
do $$
declare
  v_tables text[] := array['access_links', 'memberships', 'dynamic_forms'];
  v_table  text;
  v_trig   text;
begin
  foreach v_table in array v_tables loop
    v_trig := 'tr_' || v_table || '_updated_at';
    if not exists (
      select 1 from pg_trigger
      where tgname = v_trig
        and tgrelid = ('public.' || v_table)::regclass
    ) then
      execute format(
        'create trigger %I before update on public.%I for each row execute function public.fn_set_updated_at()',
        v_trig, v_table
      );
    end if;
  end loop;
end $$;

-- ============================================================
-- 7) TRIGGERS de auditoría forense (idempotente)
-- ============================================================
do $$
declare
  v_tables text[] := array[
    'access_links', 'memberships', 'dynamic_forms',
    'role_module_access', 'role_field_permissions'
  ];
  v_table  text;
  v_trig   text;
begin
  foreach v_table in array v_tables loop
    v_trig := 'tr_audit_' || v_table;
    if not exists (
      select 1 from pg_trigger
      where tgname = v_trig
        and tgrelid = ('public.' || v_table)::regclass
    ) then
      execute format(
        'create trigger %I after insert or update or delete on public.%I for each row execute function public.fn_trigger_audit_universal(''tenant_id'')',
        v_trig, v_table
      );
    end if;
  end loop;
end $$;

-- ============================================================
-- 8) RLS: habilitar en todas (políticas completas en FASE 3)
-- ============================================================
alter table public.access_links           enable row level security;
alter table public.memberships            enable row level security;
alter table public.dynamic_forms          enable row level security;
alter table public.role_module_access     enable row level security;
alter table public.role_field_permissions enable row level security;

-- ============================================================
-- 9) Grants base
-- ============================================================
grant select, insert, update, delete on public.access_links           to service_role;
grant select, insert, update, delete on public.memberships            to service_role;
grant select, insert, update, delete on public.dynamic_forms          to service_role;
grant select, insert, update, delete on public.role_module_access     to service_role;
grant select, insert, update, delete on public.role_field_permissions to service_role;

-- ============================================================
-- 10) cat_permissions — seeds módulo 'ace' (idempotente)
-- ============================================================
insert into public.cat_permissions (id, description, module) values
  ('ace.access_links.read',   'Ver links de acceso del tenant',             'ace'),
  ('ace.access_links.manage', 'Crear / editar / revocar links de acceso',   'ace'),
  ('ace.memberships.read',    'Ver membresías contextuales del tenant',      'ace'),
  ('ace.memberships.manage',  'Gestionar membresías contextuales',           'ace'),
  ('ace.forms.read',          'Ver formularios dinámicos',                   'ace'),
  ('ace.forms.manage',        'Crear / editar formularios dinámicos',        'ace'),
  ('ace.perms.read',          'Ver configuración de permisos granulares',    'ace'),
  ('ace.perms.manage',        'Gestionar permisos por módulo y por campo',   'ace')
on conflict (id) do nothing;

commit;
