-- 20260305_rls_hardening.sql
-- Base de referencia: audit/AUDIT-07-rls-recomendado.sql
-- Prioridad: P0 (audit/AUDIT-06-gaps-y-parches.md)
-- Importante: migración idempotente, segura y compatible con multi-tenant.

begin;
set search_path = public;

-- -----------------------------------------------------------------------------
-- A) Función tenant actual (robusta para RLS)
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
-- B) profiles (P0): elimina riesgo WITH CHECK (true)
-- -----------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.profiles') is null then
    raise notice 'RLS hardening skipped for public.profiles (table not found)';
  else
    execute 'alter table public.profiles enable row level security';

    -- Mantener compatibilidad por roles existentes y reforzar tenant scope
    execute 'drop policy if exists p_profiles_select on public.profiles';
    execute $sql$
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
      )
    $sql$;

    execute 'drop policy if exists p_profiles_insert on public.profiles';
    execute $sql$
      create policy p_profiles_insert
      on public.profiles
      for insert
      to authenticated
      with check (
        id = auth.uid()
        and tenant_id = public.fn_current_tenant_id()
      )
    $sql$;

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
-- C) user_roles_sedes (P0): tenant_id obligatorio + FK + index + políticas
-- -----------------------------------------------------------------------------
do $$
declare
  v_null_count bigint := 0;
begin
  if to_regclass('public.user_roles_sedes') is null then
    raise notice 'RLS hardening skipped for public.user_roles_sedes (table not found)';
  else
    execute 'alter table public.user_roles_sedes add column if not exists tenant_id uuid';

    execute $sql$
      update public.user_roles_sedes urs
      set tenant_id = r.tenant_id
      from public.roles r
      where r.id = urs.role_id
        and urs.tenant_id is null
    $sql$;

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
        message = 'Cannot enforce NOT NULL on user_roles_sedes.tenant_id',
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
-- D) Cobertura mínima de tablas tenant-scoped solicitadas
--     users, projects, activities, tasks, payments, billing, subscriptions
--     (si existen en public y tienen tenant_id)
-- -----------------------------------------------------------------------------
do $$
declare
  v_table text;
  v_tables text[] := array['users','projects','activities','tasks','payments','billing','subscriptions'];
  v_has_tenant boolean;
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      raise notice 'RLS coverage skipped for public.% (table not found)', v_table;
    else
      select exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = v_table
          and column_name = 'tenant_id'
      ) into v_has_tenant;

      if not v_has_tenant then
        raise notice 'RLS coverage skipped for public.% (tenant_id column not found)', v_table;
      else
        execute format('alter table public.%I enable row level security', v_table);

        execute format('drop policy if exists p_%I_tenant_select on public.%I', v_table, v_table);
        execute format('drop policy if exists p_%I_tenant_insert on public.%I', v_table, v_table);
        execute format('drop policy if exists p_%I_tenant_update on public.%I', v_table, v_table);
        execute format('drop policy if exists p_%I_tenant_delete on public.%I', v_table, v_table);

        execute format(
          'create policy p_%I_tenant_select on public.%I for select to authenticated using (tenant_id = public.fn_current_tenant_id())',
          v_table, v_table
        );

        execute format(
          'create policy p_%I_tenant_insert on public.%I for insert to authenticated with check (tenant_id = public.fn_current_tenant_id())',
          v_table, v_table
        );

        execute format(
          'create policy p_%I_tenant_update on public.%I for update to authenticated using (tenant_id = public.fn_current_tenant_id()) with check (tenant_id = public.fn_current_tenant_id())',
          v_table, v_table
        );

        execute format(
          'create policy p_%I_tenant_delete on public.%I for delete to authenticated using (tenant_id = public.fn_current_tenant_id())',
          v_table, v_table
        );
      end if;
    end if;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- E) Catálogos: solo SELECT para authenticated
--     cat_industry_types, cat_plan_types, cat_permissions, plan_policies
-- -----------------------------------------------------------------------------
do $$
declare
  v_table text;
  v_tables text[] := array['cat_industry_types','cat_plan_types','cat_permissions','plan_policies'];
begin
  foreach v_table in array v_tables loop
    if to_regclass('public.' || v_table) is null then
      raise notice 'Catalog RLS skipped for public.% (table not found)', v_table;
    else
      execute format('alter table public.%I enable row level security', v_table);

      execute format('drop policy if exists p_%I_read on public.%I', v_table, v_table);
      execute format('drop policy if exists p_%I_insert_block on public.%I', v_table, v_table);
      execute format('drop policy if exists p_%I_update_block on public.%I', v_table, v_table);
      execute format('drop policy if exists p_%I_delete_block on public.%I', v_table, v_table);

      -- Limpieza de nombres legacy solo en cat_permissions
      if v_table = 'cat_permissions' then
        execute 'drop policy if exists p_cat_permissions_read on public.cat_permissions';
        execute 'drop policy if exists p_cat_permissions_no_write on public.cat_permissions';
      end if;

      execute format(
        'create policy p_%I_read on public.%I for select to authenticated using (true)',
        v_table, v_table
      );
      execute format(
        'create policy p_%I_insert_block on public.%I for insert to authenticated with check (false)',
        v_table, v_table
      );
      execute format(
        'create policy p_%I_update_block on public.%I for update to authenticated using (false) with check (false)',
        v_table, v_table
      );
      execute format(
        'create policy p_%I_delete_block on public.%I for delete to authenticated using (false)',
        v_table, v_table
      );

      execute format('revoke all on table public.%I from anon', v_table);
      execute format('grant select on table public.%I to authenticated', v_table);
    end if;
  end loop;
end
$$;

commit;
