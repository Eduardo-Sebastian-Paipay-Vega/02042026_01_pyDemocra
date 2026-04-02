-- GAP-002 RLS hardening P0
-- Fecha: 2026-03-05
-- Base: audit/AUDIT-07-rls-recomendado.sql, audit/AUDIT-08-rls-informe.md

begin;
set search_path = public;

-- -----------------------------------------------------------------------------
-- 1) fn_current_tenant_id robusta para políticas RLS
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
-- 2) profiles: eliminar with check (true) y forzar tenant check
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'Skipping profiles hardening: table public.profiles not found';
  else
    execute 'alter table public.profiles enable row level security';

    execute 'drop policy if exists p_profiles_update on public.profiles';
    execute $sql$
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
      )
    $sql$;
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 3) user_roles_sedes: tenant_id obligatorio + FK + índice + policies estrictas
-- -----------------------------------------------------------------------------
do $$
declare
  v_null_count bigint := 0;
begin
  if to_regclass('public.user_roles_sedes') is null then
    raise notice 'Skipping user_roles_sedes hardening: table public.user_roles_sedes not found';
  else
    execute 'alter table public.user_roles_sedes add column if not exists tenant_id uuid';

    -- Backfill usando roles
    execute $sql$
      update public.user_roles_sedes urs
      set tenant_id = r.tenant_id
      from public.roles r
      where r.id = urs.role_id
        and urs.tenant_id is null
    $sql$;

    -- Backfill fallback usando sedes
    execute $sql$
      update public.user_roles_sedes urs
      set tenant_id = s.tenant_id
      from public.sedes s
      where s.id = urs.sede_id
        and urs.tenant_id is null
    $sql$;

    execute 'select count(*) from public.user_roles_sedes where tenant_id is null' into v_null_count;
    if v_null_count > 0 then
      raise exception using
        errcode = '23502',
        message = 'user_roles_sedes.tenant_id still null after backfill',
        detail = format('rows_with_null_tenant=%s', v_null_count);
    end if;

    execute 'alter table public.user_roles_sedes alter column tenant_id set not null';

    if not exists (
      select 1
      from pg_constraint
      where conname = 'fk_user_roles_sedes_tenant'
        and conrelid = 'public.user_roles_sedes'::regclass
    ) then
      execute 'alter table public.user_roles_sedes add constraint fk_user_roles_sedes_tenant foreign key (tenant_id) references public.tenants(id) on delete cascade';
    end if;

    execute 'create index if not exists idx_urs_tenant on public.user_roles_sedes(tenant_id)';

    execute 'alter table public.user_roles_sedes enable row level security';

    execute 'drop policy if exists p_urs_select on public.user_roles_sedes';
    execute 'drop policy if exists p_urs_insert on public.user_roles_sedes';
    execute 'drop policy if exists p_urs_update on public.user_roles_sedes';
    execute 'drop policy if exists p_urs_delete on public.user_roles_sedes';
    execute 'drop policy if exists p_urs_write on public.user_roles_sedes';

    execute $sql$
      create policy p_urs_select
      on public.user_roles_sedes
      for select
      to authenticated
      using (tenant_id = public.fn_current_tenant_id())
    $sql$;

    execute $sql$
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
      )
    $sql$;

    execute $sql$
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
      with check (
        tenant_id = public.fn_current_tenant_id()
      )
    $sql$;

    execute $sql$
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
      )
    $sql$;

    execute 'drop trigger if exists tr_audit_urs on public.user_roles_sedes';
    execute 'create trigger tr_audit_urs after insert or update or delete on public.user_roles_sedes for each row execute function public.fn_trigger_audit_universal(''tenant_id'')';
  end if;
end
$$;

-- -----------------------------------------------------------------------------
-- 4) Catálogos read-only para authenticated
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.cat_permissions') is not null then
    execute 'alter table public.cat_permissions enable row level security';
    execute 'drop policy if exists p_cat_permissions_read on public.cat_permissions';
    execute 'drop policy if exists p_cat_permissions_insert_block on public.cat_permissions';
    execute 'drop policy if exists p_cat_permissions_update_block on public.cat_permissions';
    execute 'drop policy if exists p_cat_permissions_delete_block on public.cat_permissions';

    execute 'create policy p_cat_permissions_read on public.cat_permissions for select to authenticated using (true)';
    execute 'create policy p_cat_permissions_insert_block on public.cat_permissions for insert to authenticated with check (false)';
    execute 'create policy p_cat_permissions_update_block on public.cat_permissions for update to authenticated using (false) with check (false)';
    execute 'create policy p_cat_permissions_delete_block on public.cat_permissions for delete to authenticated using (false)';

    execute 'revoke all on table public.cat_permissions from anon';
    execute 'grant select on table public.cat_permissions to authenticated';
  end if;

  if to_regclass('public.cat_industry_types') is not null then
    execute 'alter table public.cat_industry_types enable row level security';
    execute 'drop policy if exists p_cat_industry_types_read on public.cat_industry_types';
    execute 'drop policy if exists p_cat_industry_types_insert_block on public.cat_industry_types';
    execute 'drop policy if exists p_cat_industry_types_update_block on public.cat_industry_types';
    execute 'drop policy if exists p_cat_industry_types_delete_block on public.cat_industry_types';

    execute 'create policy p_cat_industry_types_read on public.cat_industry_types for select to authenticated using (true)';
    execute 'create policy p_cat_industry_types_insert_block on public.cat_industry_types for insert to authenticated with check (false)';
    execute 'create policy p_cat_industry_types_update_block on public.cat_industry_types for update to authenticated using (false) with check (false)';
    execute 'create policy p_cat_industry_types_delete_block on public.cat_industry_types for delete to authenticated using (false)';

    execute 'revoke all on table public.cat_industry_types from anon';
    execute 'grant select on table public.cat_industry_types to authenticated';
  end if;

  if to_regclass('public.cat_plan_types') is not null then
    execute 'alter table public.cat_plan_types enable row level security';
    execute 'drop policy if exists p_cat_plan_types_read on public.cat_plan_types';
    execute 'drop policy if exists p_cat_plan_types_insert_block on public.cat_plan_types';
    execute 'drop policy if exists p_cat_plan_types_update_block on public.cat_plan_types';
    execute 'drop policy if exists p_cat_plan_types_delete_block on public.cat_plan_types';

    execute 'create policy p_cat_plan_types_read on public.cat_plan_types for select to authenticated using (true)';
    execute 'create policy p_cat_plan_types_insert_block on public.cat_plan_types for insert to authenticated with check (false)';
    execute 'create policy p_cat_plan_types_update_block on public.cat_plan_types for update to authenticated using (false) with check (false)';
    execute 'create policy p_cat_plan_types_delete_block on public.cat_plan_types for delete to authenticated using (false)';

    execute 'revoke all on table public.cat_plan_types from anon';
    execute 'grant select on table public.cat_plan_types to authenticated';
  end if;

  if to_regclass('public.plan_policies') is not null then
    execute 'alter table public.plan_policies enable row level security';
    execute 'drop policy if exists p_plan_policies_read on public.plan_policies';
    execute 'drop policy if exists p_plan_policies_insert_block on public.plan_policies';
    execute 'drop policy if exists p_plan_policies_update_block on public.plan_policies';
    execute 'drop policy if exists p_plan_policies_delete_block on public.plan_policies';

    execute 'create policy p_plan_policies_read on public.plan_policies for select to authenticated using (true)';
    execute 'create policy p_plan_policies_insert_block on public.plan_policies for insert to authenticated with check (false)';
    execute 'create policy p_plan_policies_update_block on public.plan_policies for update to authenticated using (false) with check (false)';
    execute 'create policy p_plan_policies_delete_block on public.plan_policies for delete to authenticated using (false)';

    execute 'revoke all on table public.plan_policies from anon';
    execute 'grant select on table public.plan_policies to authenticated';
  end if;
end
$$;

commit;
