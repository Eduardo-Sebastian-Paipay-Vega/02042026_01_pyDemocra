-- AUDIT-07 RLS recomendado
-- Fecha: 2026-03-04 (America/Lima)
-- Commit auditado: fde837c
-- Alcance: hardening multi-tenant RLS + políticas de mínimo privilegio
-- Nota: script propuesto (no ejecutado por este audit).

begin;
set search_path = public;

-- -----------------------------------------------------------------------------
-- 0) fn_current_tenant_id robusta (evita recursion RLS en profiles)
-- -----------------------------------------------------------------------------
create or replace function public.fn_current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$;

grant execute on function public.fn_current_tenant_id() to authenticated, service_role, anon;

-- -----------------------------------------------------------------------------
-- 1) Hardening de profiles (quitar with check true)
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists p_profiles_select on public.profiles;
create policy p_profiles_select
on public.profiles
for select
to authenticated
using (
  tenant_id = public.fn_current_tenant_id()
  and (
    id = auth.uid()
    or public.fn_has_permission('iam.users.read', null)
    or public.fn_is_tenant_admin()
  )
);

drop policy if exists p_profiles_insert on public.profiles;
create policy p_profiles_insert
on public.profiles
for insert
to authenticated
with check (
  id = auth.uid()
  and tenant_id is null
);

drop policy if exists p_profiles_update on public.profiles;
create policy p_profiles_update
on public.profiles
for update
to authenticated
using (
  tenant_id = public.fn_current_tenant_id()
  and (
    id = auth.uid()
    or public.fn_has_permission('iam.users.manage', null)
    or public.fn_is_tenant_admin()
  )
)
with check (
  tenant_id = public.fn_current_tenant_id()
);

-- -----------------------------------------------------------------------------
-- 2) user_roles_sedes: tenant_id obligatorio + policies estrictas + trigger audit
-- -----------------------------------------------------------------------------
alter table public.user_roles_sedes
  add column if not exists tenant_id uuid;

update public.user_roles_sedes urs
set tenant_id = r.tenant_id
from public.roles r
where r.id = urs.role_id
  and urs.tenant_id is null;

alter table public.user_roles_sedes
  alter column tenant_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'fk_user_roles_sedes_tenant'
      and conrelid = 'public.user_roles_sedes'::regclass
  ) then
    alter table public.user_roles_sedes
      add constraint fk_user_roles_sedes_tenant
      foreign key (tenant_id) references public.tenants(id) on delete cascade;
  end if;
end $$;

create index if not exists idx_urs_tenant on public.user_roles_sedes(tenant_id);

alter table public.user_roles_sedes enable row level security;

drop policy if exists p_urs_select on public.user_roles_sedes;
drop policy if exists p_urs_insert on public.user_roles_sedes;
drop policy if exists p_urs_update on public.user_roles_sedes;
drop policy if exists p_urs_delete on public.user_roles_sedes;
drop policy if exists p_urs_write on public.user_roles_sedes;

create policy p_urs_select
on public.user_roles_sedes
for select
to authenticated
using (tenant_id = public.fn_current_tenant_id());

create policy p_urs_insert
on public.user_roles_sedes
for insert
to authenticated
with check (
  tenant_id = public.fn_current_tenant_id()
  and (
    public.fn_has_permission('iam.user_roles.manage', null)
    or public.fn_is_tenant_admin()
  )
);

create policy p_urs_update
on public.user_roles_sedes
for update
to authenticated
using (
  tenant_id = public.fn_current_tenant_id()
  and (
    public.fn_has_permission('iam.user_roles.manage', null)
    or public.fn_is_tenant_admin()
  )
)
with check (tenant_id = public.fn_current_tenant_id());

create policy p_urs_delete
on public.user_roles_sedes
for delete
to authenticated
using (
  tenant_id = public.fn_current_tenant_id()
  and (
    public.fn_has_permission('iam.user_roles.manage', null)
    or public.fn_is_tenant_admin()
  )
);

drop trigger if exists tr_audit_urs on public.user_roles_sedes;
create trigger tr_audit_urs
after insert or update or delete on public.user_roles_sedes
for each row execute function public.fn_trigger_audit_universal('tenant_id');

-- -----------------------------------------------------------------------------
-- 3) cat_permissions: lectura solo autenticados, sin escritura cliente
-- -----------------------------------------------------------------------------
alter table public.cat_permissions enable row level security;

drop policy if exists p_cat_permissions_read on public.cat_permissions;
create policy p_cat_permissions_read
on public.cat_permissions
for select
to authenticated
using (true);

drop policy if exists p_cat_permissions_no_write on public.cat_permissions;
create policy p_cat_permissions_no_write
on public.cat_permissions
for all
to authenticated
using (false)
with check (false);

revoke all on table public.cat_permissions from anon;
grant select on table public.cat_permissions to authenticated;

-- -----------------------------------------------------------------------------
-- 4) Catálogos globales y plan_policies: lectura autenticada, sin write cliente
-- -----------------------------------------------------------------------------

-- cat_industry_types
alter table public.cat_industry_types enable row level security;
drop policy if exists p_cat_industry_types_read on public.cat_industry_types;
create policy p_cat_industry_types_read
on public.cat_industry_types
for select
to authenticated
using (true);
drop policy if exists p_cat_industry_types_insert on public.cat_industry_types;
create policy p_cat_industry_types_insert
on public.cat_industry_types
for insert
to authenticated
with check (false);
drop policy if exists p_cat_industry_types_update on public.cat_industry_types;
create policy p_cat_industry_types_update
on public.cat_industry_types
for update
to authenticated
using (false)
with check (false);
drop policy if exists p_cat_industry_types_delete on public.cat_industry_types;
create policy p_cat_industry_types_delete
on public.cat_industry_types
for delete
to authenticated
using (false);

-- cat_plan_types
alter table public.cat_plan_types enable row level security;
drop policy if exists p_cat_plan_types_read on public.cat_plan_types;
create policy p_cat_plan_types_read
on public.cat_plan_types
for select
to authenticated
using (true);
drop policy if exists p_cat_plan_types_insert on public.cat_plan_types;
create policy p_cat_plan_types_insert
on public.cat_plan_types
for insert
to authenticated
with check (false);
drop policy if exists p_cat_plan_types_update on public.cat_plan_types;
create policy p_cat_plan_types_update
on public.cat_plan_types
for update
to authenticated
using (false)
with check (false);
drop policy if exists p_cat_plan_types_delete on public.cat_plan_types;
create policy p_cat_plan_types_delete
on public.cat_plan_types
for delete
to authenticated
using (false);

-- plan_policies
alter table public.plan_policies enable row level security;
drop policy if exists p_plan_policies_read on public.plan_policies;
create policy p_plan_policies_read
on public.plan_policies
for select
to authenticated
using (true);
drop policy if exists p_plan_policies_insert on public.plan_policies;
create policy p_plan_policies_insert
on public.plan_policies
for insert
to authenticated
with check (false);
drop policy if exists p_plan_policies_update on public.plan_policies;
create policy p_plan_policies_update
on public.plan_policies
for update
to authenticated
using (false)
with check (false);
drop policy if exists p_plan_policies_delete on public.plan_policies;
create policy p_plan_policies_delete
on public.plan_policies
for delete
to authenticated
using (false);

-- -----------------------------------------------------------------------------
-- 5) mfa_challenges: policy explícita solo autenticado + no write cliente
-- -----------------------------------------------------------------------------
alter table public.mfa_challenges enable row level security;

drop policy if exists p_mfa_challenges_select on public.mfa_challenges;
create policy p_mfa_challenges_select
on public.mfa_challenges
for select
to authenticated
using (
  tenant_id = public.fn_current_tenant_id()
  and user_id = auth.uid()
);

drop policy if exists p_mfa_challenges_no_insert on public.mfa_challenges;
create policy p_mfa_challenges_no_insert
on public.mfa_challenges
for insert
to authenticated
with check (false);

drop policy if exists p_mfa_challenges_no_update on public.mfa_challenges;
create policy p_mfa_challenges_no_update
on public.mfa_challenges
for update
to authenticated
using (false)
with check (false);

drop policy if exists p_mfa_challenges_no_delete on public.mfa_challenges;
create policy p_mfa_challenges_no_delete
on public.mfa_challenges
for delete
to authenticated
using (false);

commit;

-- -----------------------------------------------------------------------------
-- Rollback rápido (manual):
-- 1) Restaurar políticas previas p_profiles_*, p_urs_*, p_cat_permissions_read, etc.
-- 2) Si afecta onboarding, mantener solo fn_bootstrap_tenant en modo transitorio.
-- -----------------------------------------------------------------------------
