-- Funciones RPC para Gobernanza (Lectura de retención y auditoría)
-- Requeridas por la UI para validar permisos granulares sin mostrar advertencias.

-- 1. fn_current_tenant_id
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid AS $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. fn_has_permission (Versión original restaurada)
CREATE OR REPLACE FUNCTION public.fn_has_permission(p_permission text, p_sede_id uuid DEFAULT NULL)
RETURNS boolean AS $$
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
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. fn_is_tenant_admin
CREATE OR REPLACE FUNCTION public.fn_is_tenant_admin()
RETURNS boolean AS $$
  select public.fn_has_permission('iam.admin'::text, null::uuid);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
