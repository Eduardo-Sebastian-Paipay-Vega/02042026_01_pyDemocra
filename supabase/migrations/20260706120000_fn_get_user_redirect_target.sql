-- fn_get_user_redirect_target — RPC de enrutamiento post-login para el MPA
-- Fecha: 2026-07-06
--
-- Contexto: src/app/LoginGateway.tsx necesitaba decidir si redirigir a /ong/
-- según la industria del tenant del usuario, pero public.tenants tiene RLS
-- activado SIN ninguna política (deny-all deliberado, ver
-- docs/consolidacion/00000000000000_core_baseline.sql:206-214) — el cliente
-- no puede leer industry_type_id directamente. Esta función expone solo el
-- dato mínimo necesario (el destino), sin dar acceso de lectura a la tabla.
--
-- Contrato: devuelve el industry_type_id del tenant del usuario autenticado
-- ('ong', 'gym', ...), o 'root' si el perfil no tiene tenant asignado
-- (pre-onboarding) o si no existe fila en public.profiles para auth.uid().
-- El llamador decide qué hacer con cada valor: hoy solo 'ong' tiene un
-- destino real (/ong/); cualquier otro valor ('root', 'gym', o futuro) debe
-- tratarse como "sin acceso a un módulo disponible", no asumir que existe.
--
-- Deliberadamente sin parámetros: sigue el mismo patrón que
-- public.fn_current_tenant_id() (supabase/migrations/20260302125000_fix_
-- bootstrap_audit_tenant_null.sql) — resuelve la identidad con auth.uid()
-- internamente en vez de aceptar un user_id provisto por el cliente. Una
-- SECURITY DEFINER que confiara en un ID pasado por el llamador permitiría
-- a cualquier usuario autenticado consultar el destino de cualquier otro.

begin;

create or replace function public.fn_get_user_redirect_target()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select t.industry_type_id
      from public.profiles p
      left join public.tenants t on t.id = p.tenant_id
      where p.id = auth.uid()
    ),
    'root'
  );
$$;

comment on function public.fn_get_user_redirect_target() is
  'Devuelve el industry_type_id del tenant del usuario autenticado (auth.uid()), o ''root'' si no tiene tenant asignado o no existe perfil. Sin parámetros: nunca confía en un user_id provisto por el cliente.';

-- Grant deliberadamente más estrecho que fn_current_tenant_id() (que incluye
-- anon y service_role en el baseline): esta función solo tiene sentido para
-- una sesión ya autenticada. anon siempre recibiría 'root' de todos modos
-- (auth.uid() es NULL sin sesión), y no hay caso de uso server-side que la
-- necesite bajo service_role.
grant execute on function public.fn_get_user_redirect_target() to authenticated;

commit;
