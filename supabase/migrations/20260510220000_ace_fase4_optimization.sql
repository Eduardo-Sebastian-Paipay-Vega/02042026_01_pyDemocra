-- ACE FASE 4 — Optimización y escalabilidad
-- Fecha: 2026-05-10
--
-- Correcciones sobre el diseño propuesto:
--   - profiles.role no existe; se reemplaza por campos reales en la vista
--   - Vista creada con security_invoker=true (PostgreSQL 15+) para respetar RLS
--     de profiles y memberships; sin ello correría como postgres (owner) y bypassearía RLS
--   - Vista añade WHERE p.id = auth.uid() — sin esto cualquier usuario podría ver
--     todos los perfiles (incluso con RLS, es buena práctica ser explícito)
--   - idx_access_links_code ya existe (FASE 0) — se crea la variante parcial nueva
--   - fn_has_context_access añade tenant_id + set search_path + SECURITY DEFINER
--     para poder usarla en políticas RLS de tablas como ong.proyectos sin recursión
--   - idx_memberships_active_lookup ampliado con tenant_id para correcta selectividad

begin;

-- ============================================================
-- 1. ÍNDICES PARCIALES (adicionales a los de FASE 0 y FASE 3)
-- ============================================================

-- Búsqueda directa de membresías activas para un user+context específico.
-- Cubre la consulta interna de fn_has_context_access y futuros predicados de RLS.
-- Los índices existentes (FASE 0) cubren (tenant_id,user_id) y (tenant_id,status WHERE active),
-- pero ninguno cubre el triple (tenant_id, user_id, context_id) en activas.
create index if not exists idx_memberships_active_lookup
  on public.memberships(tenant_id, user_id, context_id)
  where status = 'active';

-- Links disponibles para el flujo de onboarding.
-- idx_access_links_code (FASE 0) cubre (code) en toda la tabla.
-- Esta variante parcial es más pequeña y cubre exactamente la condición de
-- fn_complete_access_onboarding: WHERE code=$1 AND is_active=true.
create index if not exists idx_access_links_available
  on public.access_links(code)
  where is_active = true and used_count < max_uses;

-- ============================================================
-- 2. fn_has_context_access — verificación de membresía contextual
--    SECURITY DEFINER: puede usarse en políticas RLS de otras tablas
--    (ej: ong.proyectos) sin que la RLS de memberships cause recursión.
--    La seguridad de tenant se impone con fn_current_tenant_id() interno.
-- ============================================================
create or replace function public.fn_has_context_access(
  p_user_id    uuid,
  p_context_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from   public.memberships
    where  tenant_id   = public.fn_current_tenant_id()
      and  user_id     = p_user_id
      and  context_id  = p_context_id
      and  status      = 'active'
  );
$$;

grant execute on function public.fn_has_context_access(uuid, uuid)
  to authenticated, service_role;

-- ============================================================
-- 3. Vista v_user_session_context — perfil hidratado del usuario actual
--
--    security_invoker = true (PostgreSQL 15):
--      La vista se ejecuta con los permisos del CALLER, por lo que
--      las políticas RLS de profiles y memberships se aplican normalmente.
--      Sin esto correría como el owner (postgres) e ignoraría RLS.
--
--    WHERE p.id = auth.uid():
--      Restringe la vista al usuario autenticado actual. El frontend
--      solo ve su propio contexto, no el de otros usuarios del tenant.
-- ============================================================
drop view if exists public.v_user_session_context;

create view public.v_user_session_context
  with (security_invoker = true)
as
select
  p.id                as user_id,
  p.tenant_id,
  p.full_name,
  p.tipo_documento,
  p.numero_documento,
  p.genero,
  jsonb_agg(
    jsonb_build_object(
      'context_type', m.context_type,
      'context_id',   m.context_id,
      'role_id',      m.role_id,
      'role_name',    r.name,
      'joined_at',    m.joined_at
    ) order by m.joined_at
  ) filter (where m.id is not null) as active_memberships
from   public.profiles p
left   join public.memberships m
         on m.user_id    = p.id
        and m.tenant_id  = p.tenant_id
        and m.status     = 'active'
left   join public.roles r on r.id = m.role_id
where  p.id = auth.uid()
group  by p.id, p.tenant_id, p.full_name,
          p.tipo_documento, p.numero_documento, p.genero;

grant select on public.v_user_session_context to authenticated;

-- ============================================================
-- 4. cat_permissions seeds para FASE 4
-- ============================================================
insert into public.cat_permissions (id, description, module) values
  ('ace.context.check', 'Verificar acceso contextual de un usuario (fn_has_context_access)', 'ace')
on conflict (id) do nothing;

commit;
