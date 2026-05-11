-- ACE FASE 3 — Row Level Security: políticas y optimización
-- Fecha: 2026-05-10
--
-- Correcciones sobre el diseño propuesto:
--   - profiles.role no existe; se usa fn_has_permission() + fn_is_tenant_admin()
--     (definidas en la migración inicial del remoto, usadas en los hardenings)
--   - RLS ya habilitada en FASE 0; no se repite
--   - "Public can read link by code" eliminada: expondría todos los links activos
--     de todos los tenants a cualquier usuario → brecha de seguridad
--   - fn_complete_access_onboarding es SECURITY DEFINER, no necesita SELECT anon
--     en la tabla; se agrega grant a 'anon' directamente en la función
--   - Políticas FOR ALL reemplazadas por políticas específicas por operación
--   - idx_access_links_code ya existe (FASE 0); no se duplica
--   - Se añade fn_validate_access_code para validación anónima de links

begin;

-- ============================================================
-- GUARD: prereqs de funciones de seguridad
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_has_permission'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACE FASE 3 prereq missing: function public.fn_has_permission() not found';
  end if;

  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'fn_is_tenant_admin'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'ACE FASE 3 prereq missing: function public.fn_is_tenant_admin() not found';
  end if;
end $$;

-- ============================================================
-- 1. POLÍTICAS: public.access_links
--
--    SELECT: solo usuarios autenticados del mismo tenant con permiso.
--            No hay política anon sobre la tabla — la validación anónima
--            se hace mediante fn_validate_access_code() (SECURITY DEFINER).
--    INSERT/UPDATE/DELETE: requiere ace.access_links.manage o admin.
-- ============================================================
drop policy if exists p_access_links_select  on public.access_links;
drop policy if exists p_access_links_insert  on public.access_links;
drop policy if exists p_access_links_update  on public.access_links;
drop policy if exists p_access_links_delete  on public.access_links;

create policy p_access_links_select
  on public.access_links for select
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.access_links.read', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_access_links_insert
  on public.access_links for insert
  to authenticated
  with check (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.access_links.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_access_links_update
  on public.access_links for update
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.access_links.manage', null)
      or public.fn_is_tenant_admin()
    )
  )
  with check (
    tenant_id = public.fn_current_tenant_id()
  );

create policy p_access_links_delete
  on public.access_links for delete
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.access_links.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

-- ============================================================
-- 2. POLÍTICAS: public.memberships
--
--    SELECT: el propio usuario ve sus membresías activas;
--            usuarios con permiso de lectura ven todo el tenant.
--    WRITE: requiere ace.memberships.manage o admin.
-- ============================================================
drop policy if exists p_memberships_select on public.memberships;
drop policy if exists p_memberships_insert on public.memberships;
drop policy if exists p_memberships_update on public.memberships;
drop policy if exists p_memberships_delete on public.memberships;

create policy p_memberships_select
  on public.memberships for select
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      user_id = auth.uid()
      or public.fn_has_permission('ace.memberships.read', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_memberships_insert
  on public.memberships for insert
  to authenticated
  with check (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.memberships.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_memberships_update
  on public.memberships for update
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.memberships.manage', null)
      or public.fn_is_tenant_admin()
    )
  )
  with check (
    tenant_id = public.fn_current_tenant_id()
  );

create policy p_memberships_delete
  on public.memberships for delete
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.memberships.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

-- ============================================================
-- 3. POLÍTICAS: public.dynamic_forms
--
--    SELECT: cualquier usuario autenticado del tenant puede leer
--            formularios activos (para poder rellenarlos).
--    WRITE: requiere ace.forms.manage o admin.
-- ============================================================
drop policy if exists p_dynamic_forms_select on public.dynamic_forms;
drop policy if exists p_dynamic_forms_insert on public.dynamic_forms;
drop policy if exists p_dynamic_forms_update on public.dynamic_forms;
drop policy if exists p_dynamic_forms_delete on public.dynamic_forms;

create policy p_dynamic_forms_select
  on public.dynamic_forms for select
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and is_active = true
  );

create policy p_dynamic_forms_insert
  on public.dynamic_forms for insert
  to authenticated
  with check (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.forms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_dynamic_forms_update
  on public.dynamic_forms for update
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.forms.manage', null)
      or public.fn_is_tenant_admin()
    )
  )
  with check (
    tenant_id = public.fn_current_tenant_id()
  );

create policy p_dynamic_forms_delete
  on public.dynamic_forms for delete
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.forms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

-- ============================================================
-- 4. POLÍTICAS: public.role_module_access
-- ============================================================
drop policy if exists p_role_module_access_select on public.role_module_access;
drop policy if exists p_role_module_access_insert on public.role_module_access;
drop policy if exists p_role_module_access_update on public.role_module_access;
drop policy if exists p_role_module_access_delete on public.role_module_access;

create policy p_role_module_access_select
  on public.role_module_access for select
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.read', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_role_module_access_insert
  on public.role_module_access for insert
  to authenticated
  with check (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_role_module_access_update
  on public.role_module_access for update
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  )
  with check (tenant_id = public.fn_current_tenant_id());

create policy p_role_module_access_delete
  on public.role_module_access for delete
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

-- ============================================================
-- 5. POLÍTICAS: public.role_field_permissions
-- ============================================================
drop policy if exists p_role_field_perms_select on public.role_field_permissions;
drop policy if exists p_role_field_perms_insert on public.role_field_permissions;
drop policy if exists p_role_field_perms_update on public.role_field_permissions;
drop policy if exists p_role_field_perms_delete on public.role_field_permissions;

create policy p_role_field_perms_select
  on public.role_field_permissions for select
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.read', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_role_field_perms_insert
  on public.role_field_permissions for insert
  to authenticated
  with check (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

create policy p_role_field_perms_update
  on public.role_field_permissions for update
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  )
  with check (tenant_id = public.fn_current_tenant_id());

create policy p_role_field_perms_delete
  on public.role_field_permissions for delete
  to authenticated
  using (
    tenant_id = public.fn_current_tenant_id()
    and (
      public.fn_has_permission('ace.perms.manage', null)
      or public.fn_is_tenant_admin()
    )
  );

-- ============================================================
-- 6. ÍNDICE ADICIONAL para RLS de memberships
--    El resto de índices ya existen desde FASE 0.
--    idx_access_links_code ya existe — no se duplica.
-- ============================================================
create index if not exists idx_memberships_user_active
  on public.memberships(user_id, status)
  where status = 'active';

-- ============================================================
-- 7. fn_validate_access_code — validación anónima (pre-auth)
--    Responde: ¿existe el link, es válido, de qué tipo es?
--    No devuelve campos sensibles (assigned_role, metadata, target_id).
--    SECURITY DEFINER: bypasa RLS sobre access_links.
-- ============================================================
create or replace function public.fn_validate_access_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link record;
begin
  select id, type, target_type, expires_at, is_active,
         max_uses, used_count, onboarding_flow
  into   v_link
  from   public.access_links
  where  code = p_code
  limit  1;

  if not found then
    return jsonb_build_object('valid', false, 'reason', 'not_found');
  end if;

  if not v_link.is_active then
    return jsonb_build_object('valid', false, 'reason', 'inactive');
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    return jsonb_build_object('valid', false, 'reason', 'expired');
  end if;

  if v_link.used_count >= v_link.max_uses then
    return jsonb_build_object('valid', false, 'reason', 'limit_reached');
  end if;

  return jsonb_build_object(
    'valid',           true,
    'type',            v_link.type,
    'target_type',     v_link.target_type,
    'onboarding_flow', v_link.onboarding_flow,
    'expires_at',      v_link.expires_at
  );
end;
$$;

-- Accesible por anon (para validar el link antes de registrarse)
grant execute on function public.fn_validate_access_code(text) to anon, authenticated, service_role;

-- También dar acceso anon a fn_complete_access_onboarding
-- (Supabase Auth: el usuario ya existe en auth.users con anon token al registrarse,
--  pero auth.uid() solo es no-null después de session activa)
grant execute on function public.fn_complete_access_onboarding(text, jsonb) to anon;

commit;
