-- ACE FIX — memberships.context_type/context_id no soportan GLOBAL
-- Fecha: 2026-07-04
--
-- UBICACIÓN DELIBERADA: docs/consolidacion/, NO supabase/migrations/. Este
-- repo tiene un proyecto Supabase real vinculado; un `supabase db push`
-- aplicaría este archivo automáticamente si viviera en migrations/. Es una
-- ALTER TABLE + reescritura de una función SECURITY DEFINER que ya existe en
-- producción — se deja aquí para que se revise y se aplique manualmente
-- (SQL Editor o `supabase db push` tras copiarlo a migrations/) cuando se
-- decida, no automáticamente en el próximo push.
--
-- Bug 1: fn_complete_access_onboarding() inserta v_link.target_type
-- (valores en inglés: PROJECT|PROGRAM|ACTIVITY|SEDE|GLOBAL, ver access_links
-- CHECK) directamente en memberships.context_type, cuya CHECK solo admite
-- español (PROYECTO|SEDE|PROGRAMA|ACTIVIDAD) y NO incluye 'GLOBAL'. Como
-- 'GLOBAL' es justamente el target_type que usan los links de auto-registro
-- (VOLUNTEER_JOIN/STAFF_JOIN/BENEFICIARY_JOIN/GENERIC sin sede/proyecto
-- puntual — ver migración 20260510200000_ace_fase2_legacy_sync.sql, que ya
-- usa GLOBAL con ese mismo razonamiento), CUALQUIER onboarding por código sin
-- contexto específico fallaba con "violates check constraint
-- memberships_context_type_check" y por lo tanto NUNCA asignaba el rol.
--
-- Bug 2 (mismo caso GLOBAL): memberships.context_id es NOT NULL, pero un
-- access_link con target_type='GLOBAL' tiene target_id=NULL a propósito (no
-- aplica un proyecto/programa/actividad/sede puntual). Se usa tenant_id como
-- valor de context_id para memberships GLOBAL — da una fila estable por
-- (tenant, usuario, 'GLOBAL') coherente con el UNIQUE(tenant_id, user_id,
-- context_type, context_id) existente, sin relajar el NOT NULL de la tabla.

begin;

-- 1) Ampliar memberships.context_type para admitir 'GLOBAL' (sin target
--    puntual: proyecto/programa/actividad/sede específicos).
alter table public.memberships
  drop constraint if exists memberships_context_type_check;

alter table public.memberships
  add constraint memberships_context_type_check
  check (context_type in ('PROYECTO', 'SEDE', 'PROGRAMA', 'ACTIVIDAD', 'GLOBAL'));

-- 2) fn_complete_access_onboarding: traducir target_type (inglés, de
--    access_links) al vocabulario de context_type (español, de memberships)
--    en vez de asumir que son el mismo string. Único cambio funcional: el
--    paso 3 (upsert de membresía) ahora usa v_context_type en vez de
--    v_link.target_type directo. Todo lo demás es idéntico a la versión de
--    20260510100000_ace_fase1_onboarding_rpc.sql.
create or replace function public.fn_complete_access_onboarding(
  p_access_code text,
  p_metadata    jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, ong, rrhh
as $$
declare
  v_link          record;
  v_user_id       uuid    := auth.uid();
  v_membership_id uuid;
  v_entity_id     uuid;
  v_nombre        text;
  v_apellido      text;
  v_num_doc       text;
  v_email         text;
  v_context_type  text;
  v_context_id    uuid;
begin
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select * into v_link
  from public.access_links
  where code = p_access_code
    and is_active = true
  for update;

  if not found then
    raise exception 'Código de acceso no válido o inactivo'
      using errcode = 'P0001';
  end if;

  if v_link.expires_at is not null and v_link.expires_at < now() then
    update public.access_links set is_active = false where id = v_link.id;
    raise exception 'El código de acceso ha expirado'
      using errcode = 'P0001';
  end if;

  if v_link.used_count >= v_link.max_uses then
    update public.access_links set is_active = false where id = v_link.id;
    raise exception 'El código de acceso ha alcanzado su límite de usos'
      using errcode = 'P0001';
  end if;

  insert into public.profiles (
    id, tenant_id, full_name, tipo_documento, numero_documento
  ) values (
    v_user_id,
    v_link.tenant_id,
    nullif(trim(coalesce(p_metadata->>'full_name', '')), ''),
    nullif(trim(coalesce(p_metadata->>'tipo_documento', '')), ''),
    nullif(trim(coalesce(p_metadata->>'numero_documento', '')), '')
  )
  on conflict (id) do update
    set tenant_id        = excluded.tenant_id,
        full_name        = coalesce(excluded.full_name,        public.profiles.full_name),
        tipo_documento   = coalesce(excluded.tipo_documento,   public.profiles.tipo_documento),
        numero_documento = coalesce(excluded.numero_documento, public.profiles.numero_documento),
        updated_at       = now();

  -- Traducción target_type (access_links, inglés) → context_type (memberships, español).
  -- GLOBAL no tiene equivalente puntual: se preserva tal cual (ahora permitido por el CHECK ampliado).
  v_context_type := case v_link.target_type
    when 'PROJECT'  then 'PROYECTO'
    when 'PROGRAM'  then 'PROGRAMA'
    when 'ACTIVITY' then 'ACTIVIDAD'
    when 'SEDE'     then 'SEDE'
    else 'GLOBAL'
  end;

  -- context_id es NOT NULL; GLOBAL no tiene target_id puntual, se usa el
  -- propio tenant_id como identificador estable del contexto "global".
  v_context_id := coalesce(v_link.target_id, v_link.tenant_id);

  insert into public.memberships (
    tenant_id, user_id, context_type, context_id, role_id, status
  ) values (
    v_link.tenant_id, v_user_id,
    v_context_type, v_context_id,
    v_link.assigned_role_id, 'active'
  )
  on conflict (tenant_id, user_id, context_type, context_id) do update
    set status     = 'active',
        role_id    = excluded.role_id,
        updated_at = now()
  returning id into v_membership_id;

  if v_link.assigned_role_id is not null and v_link.assigned_sede_id is not null then
    insert into public.user_roles_sedes (
      tenant_id, user_id, role_id, sede_id
    ) values (
      v_link.tenant_id, v_user_id,
      v_link.assigned_role_id, v_link.assigned_sede_id
    )
    on conflict do nothing;
  end if;

  v_nombre := nullif(trim(coalesce(
    p_metadata->>'nombre',
    split_part(coalesce(p_metadata->>'full_name', ''), ' ', 1)
  )), '');

  v_apellido := nullif(trim(coalesce(
    p_metadata->>'apellido',
    case
      when strpos(coalesce(p_metadata->>'full_name', ''), ' ') > 0
      then substring(
             coalesce(p_metadata->>'full_name', '')
             from strpos(coalesce(p_metadata->>'full_name', ''), ' ') + 1
           )
      else null
    end
  )), '');

  v_num_doc := nullif(trim(coalesce(p_metadata->>'numero_documento', '')), '');

  v_email := coalesce(
    nullif(trim(coalesce(p_metadata->>'email', '')), ''),
    (select au.email from auth.users au where au.id = v_user_id)
  );

  if v_link.type = 'VOLUNTEER_JOIN' then
    select id into v_entity_id
    from ong.voluntarios
    where tenant_id = v_link.tenant_id
      and iam_user_id = v_user_id
    limit 1;

    if v_entity_id is null then
      insert into ong.voluntarios (
        tenant_id, iam_user_id,
        nombre, apellido, numero_documento,
        codigo_estado, email
      ) values (
        v_link.tenant_id, v_user_id,
        coalesce(v_nombre,   'Sin nombre'),
        coalesce(v_apellido, 'Sin apellido'),
        coalesce(v_num_doc,  'PENDIENTE'),
        'en_proceso',
        v_email
      )
      returning id into v_entity_id;
    end if;

  elsif v_link.type = 'STAFF_JOIN' then
    insert into rrhh.solicitudes_admision (
      tenant_id, nombres, apellidos, email, estado, fecha_solicitud
    ) values (
      v_link.tenant_id,
      coalesce(v_nombre,   'Sin nombre'),
      coalesce(v_apellido, 'Sin apellido'),
      coalesce(v_email,    'sin-email@pendiente.local'),
      'nueva',
      now()
    )
    returning id into v_entity_id;

  end if;

  update public.access_links
  set used_count = used_count + 1,
      is_active  = case when (used_count + 1) >= max_uses then false else true end
  where id = v_link.id;

  insert into public.audit_logs (
    tenant_id, actor_id, event_type, resource_name,
    payload_after, criticality, retention_until
  ) values (
    v_link.tenant_id, v_user_id,
    'ONBOARDING_COMPLETED', 'access_links',
    jsonb_build_object(
      'link_id',       v_link.id,
      'link_code',     v_link.code,
      'link_type',     v_link.type,
      'membership_id', v_membership_id,
      'entity_id',     v_entity_id
    ),
    'medium',
    now() + make_interval(days => coalesce(
      (select pp.retention_days
       from public.tenants t
       join public.plan_policies pp on pp.plan_id = t.plan_id
       where t.id = v_link.tenant_id
       limit 1),
      180
    ))
  );

  return jsonb_build_object(
    'success',       true,
    'membership_id', v_membership_id,
    'entity_id',     v_entity_id,
    'tenant_id',     v_link.tenant_id,
    'link_type',     v_link.type
  );

exception
  when others then
    raise exception '%', sqlerrm using errcode = sqlstate;
end;
$$;

commit;
