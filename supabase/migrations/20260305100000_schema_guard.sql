-- GAP-001 schema_guard
-- Fecha: 2026-03-05
-- Objetivo: fallar despliegue si faltan objetos críticos del baseline de seguridad/onboarding.

begin;

set search_path = public;

do $$
declare
  v_missing text[] := array[]::text[];
begin
  -- funciones críticas
  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_bootstrap_tenant'
      and pg_get_function_identity_arguments(p.oid) = 'p_tenant_name text, p_tax_id text, p_industry_type_id text, p_plan_id text, p_billing_day integer'
  ) then
    v_missing := array_append(v_missing, 'function public.fn_bootstrap_tenant(text,text,text,text,int)');
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_trigger_audit_universal'
  ) then
    v_missing := array_append(v_missing, 'function public.fn_trigger_audit_universal()');
  end if;

  if not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'fn_current_tenant_id'
  ) then
    v_missing := array_append(v_missing, 'function public.fn_current_tenant_id()');
  end if;

  -- tabla crítica
  if to_regclass('public.mfa_challenges') is null then
    v_missing := array_append(v_missing, 'table public.mfa_challenges');
  end if;

  -- trigger crítico de auditoría
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'profiles'
      and t.tgname = 'tr_audit_profiles'
      and not t.tgisinternal
  ) then
    v_missing := array_append(v_missing, 'trigger public.tr_audit_profiles');
  end if;

  -- policies claves
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'p_profiles_update'
  ) then
    v_missing := array_append(v_missing, 'policy public.p_profiles_update');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles_sedes'
      and policyname in ('p_urs_select', 'p_urs_write')
  ) then
    v_missing := array_append(v_missing, 'policy public.p_urs_select|p_urs_write');
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'mfa_challenges'
      and policyname = 'p_mfa_challenges_select'
  ) then
    v_missing := array_append(v_missing, 'policy public.p_mfa_challenges_select');
  end if;

  if array_length(v_missing, 1) is not null then
    raise exception using
      errcode = 'P0001',
      message = 'schema_guard failed: missing required objects',
      detail = array_to_string(v_missing, '; ');
  end if;
end
$$;

commit;
