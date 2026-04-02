-- Fix onboarding bootstrap + audit null tenant_id
-- Fecha: 2026-03-02
-- Objetivo:
-- 1) evitar recursion/errores al resolver tenant actual en RLS
-- 2) evitar que el trigger de auditoria rompa cuando tenant_id es null
-- 3) reordenar bootstrap para asignar tenant_id al profile antes de operaciones auditables

-- ---------------------------------------------------------------------------
-- A) fn_current_tenant_id seguro para politicas RLS (evita recursion en profiles)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- B) Trigger de auditoria universal:
--    si no hay tenant_id, no inserta en audit_logs (audit_logs.tenant_id es NOT NULL)
-- ---------------------------------------------------------------------------
create or replace function public.fn_trigger_audit_universal()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tenant_col text := tg_argv[0];
  v_tenant_id uuid;
begin
  if v_tenant_col is null then
    raise exception 'Audit trigger requires tenant column name in TG_ARGV[0]';
  end if;

  if tg_op in ('INSERT','UPDATE') then
    execute format('select ($1).%I::uuid', v_tenant_col) into v_tenant_id using new;
  else
    execute format('select ($1).%I::uuid', v_tenant_col) into v_tenant_id using old;
  end if;

  -- Durante pre-onboarding puede existir profile con tenant_id null.
  -- No forzamos escritura en audit_logs para no romper transacciones.
  if v_tenant_id is null then
    return null;
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
    now() + make_interval(days =>
      coalesce(
        (
          select pp.retention_days
          from public.tenants t
          join public.plan_policies pp on pp.plan_id = t.plan_id
          where t.id = v_tenant_id
          limit 1
        ),
        180
      )
    )
  );

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- C) Bootstrap tenant robusto e idempotente
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
  v_existing_tenant_id uuid;
  v_tenant_id uuid;
  v_sede_id uuid;
  v_role_owner_id uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if coalesce(trim(p_tenant_name), '') = '' then
    raise exception 'tenant_name is required';
  end if;

  if p_tax_id is null or p_tax_id !~ '^[0-9]{11}$' then
    raise exception 'tax_id must be an 11-digit RUC';
  end if;

  if p_billing_day is null or p_billing_day < 1 or p_billing_day > 28 then
    raise exception 'billing_day must be between 1 and 28';
  end if;

  -- Idempotencia: si el usuario ya tiene tenant, se retorna el existente.
  select p.tenant_id
    into v_existing_tenant_id
  from public.profiles p
  where p.id = v_user_id
  limit 1;

  if v_existing_tenant_id is not null then
    return v_existing_tenant_id;
  end if;

  -- 1) Crear tenant primero
  insert into public.tenants(name, tax_id, industry_type_id, plan_id, status_financial_id, billing_day, max_licenses)
  values (p_tenant_name, p_tax_id, p_industry_type_id, p_plan_id, 'FIN-ACTIVE', p_billing_day, 1)
  returning id into v_tenant_id;

  -- 2) Upsert profile con tenant_id ya resuelto (evita auditoria con tenant null)
  insert into public.profiles(id, tenant_id, full_name)
  values (v_user_id, v_tenant_id, null)
  on conflict (id) do update
    set tenant_id = excluded.tenant_id;

  -- 3) Crear sede principal
  insert into public.sedes(tenant_id, name, is_active)
  values (v_tenant_id, 'Principal', true)
  returning id into v_sede_id;

  -- 4) Crear rol Owner
  insert into public.roles(tenant_id, name, hierarchy_level, is_system_role)
  values (v_tenant_id, 'Owner', 0, true)
  returning id into v_role_owner_id;

  -- 5) Asignar permisos al Owner
  insert into public.role_permissions(role_id, permission)
  select v_role_owner_id, p.id
  from public.cat_permissions p
  on conflict do nothing;

  -- 6) Asignar Owner al creador
  insert into public.user_roles_sedes(tenant_id, user_id, role_id, sede_id)
  values (v_tenant_id, v_user_id, v_role_owner_id, v_sede_id)
  on conflict do nothing;

  -- 7) Crear/actualizar contrato
  insert into public.subscription_contracts(
    tenant_id, current_plan_id, status_id, billing_day, grace_days
  )
  values (v_tenant_id, p_plan_id, 'ACTIVE', p_billing_day, 7)
  on conflict (tenant_id) do update
    set current_plan_id = excluded.current_plan_id,
        status_id = excluded.status_id,
        billing_day = excluded.billing_day,
        updated_at = now();

  -- 8) Crear/actualizar entitlements
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

grant execute on function public.fn_bootstrap_tenant(text, text, text, text, int) to authenticated, service_role;
