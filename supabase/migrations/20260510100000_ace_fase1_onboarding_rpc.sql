-- ACE FASE 1 — fn_complete_access_onboarding
-- Fecha: 2026-05-10
-- RPC atómica: procesa un link de acceso y provisiona perfil + IAM + membresía + registro operativo.
--
-- Correcciones sobre el diseño propuesto:
--   - profiles no tiene columna 'role'; se usan solo las columnas reales.
--   - ong.voluntarios usa iam_user_id (no id_perfil); nombre/apellido/numero_documento/codigo_estado son NOT NULL.
--   - Se usa public.audit_logs (tabla real) en vez de auditoria.logs_accesos (no existe).
--   - Se agrega insert en user_roles_sedes para activar IAM real cuando el link trae role+sede.
--   - rrhh.solicitudes_admision.email es NOT NULL; se extrae de auth.users como fallback.

begin;

-- ============================================================
-- fn_complete_access_onboarding
-- ============================================================
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
begin
  -- Guard: usuario autenticado
  if v_user_id is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- ─────────────────────────────────────────────────────────
  -- 1. Bloquear el link para evitar condiciones de carrera (R04)
  -- ─────────────────────────────────────────────────────────
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

  -- ─────────────────────────────────────────────────────────
  -- 2. Upsert en public.profiles
  --    Solo columnas que existen: id, tenant_id, full_name, tipo_documento, numero_documento
  -- ─────────────────────────────────────────────────────────
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

  -- ─────────────────────────────────────────────────────────
  -- 3. Upsert membresía contextual
  -- ─────────────────────────────────────────────────────────
  insert into public.memberships (
    tenant_id, user_id, context_type, context_id, role_id, status
  ) values (
    v_link.tenant_id, v_user_id,
    v_link.target_type, v_link.target_id,
    v_link.assigned_role_id, 'active'
  )
  on conflict (tenant_id, user_id, context_type, context_id) do update
    set status     = 'active',
        role_id    = excluded.role_id,
        updated_at = now()
  returning id into v_membership_id;

  -- ─────────────────────────────────────────────────────────
  -- 4. IAM: asignar rol en sede si el link los especifica
  --    Sin esto el usuario no pasa los checks de RLS reales.
  -- ─────────────────────────────────────────────────────────
  if v_link.assigned_role_id is not null and v_link.assigned_sede_id is not null then
    insert into public.user_roles_sedes (
      tenant_id, user_id, role_id, sede_id
    ) values (
      v_link.tenant_id, v_user_id,
      v_link.assigned_role_id, v_link.assigned_sede_id
    )
    on conflict do nothing;
  end if;

  -- ─────────────────────────────────────────────────────────
  -- 5. Registro operativo según tipo de link
  -- ─────────────────────────────────────────────────────────

  -- Extraer campos comunes de metadata
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

  -- Email: metadata → auth.users (fallback para rrhh que tiene email NOT NULL)
  v_email := coalesce(
    nullif(trim(coalesce(p_metadata->>'email', '')), ''),
    (select au.email from auth.users au where au.id = v_user_id)
  );

  if v_link.type = 'VOLUNTEER_JOIN' then
    -- Verificar si ya es voluntario en este tenant (iam_user_id no tiene UNIQUE constraint)
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
    -- Crea solicitud de admisión en RRHH
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

  -- BENEFICIARY_JOIN y GENERIC: solo membresía, sin registro operativo adicional

  end if;

  -- ─────────────────────────────────────────────────────────
  -- 6. Actualizar contador del link de forma atómica
  -- ─────────────────────────────────────────────────────────
  update public.access_links
  set used_count = used_count + 1,
      is_active  = case when (used_count + 1) >= max_uses then false else true end
  where id = v_link.id;

  -- ─────────────────────────────────────────────────────────
  -- 7. Auditoría en public.audit_logs (tabla real del sistema)
  -- ─────────────────────────────────────────────────────────
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

  -- ─────────────────────────────────────────────────────────
  -- 8. Retorno
  -- ─────────────────────────────────────────────────────────
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

-- ============================================================
-- Grants
-- ============================================================
grant execute on function public.fn_complete_access_onboarding(text, jsonb) to authenticated, service_role;

-- ============================================================
-- cat_permissions seed para la nueva RPC
-- ============================================================
insert into public.cat_permissions (id, description, module) values
  ('ace.onboarding.execute', 'Ejecutar flujo de onboarding por link de acceso', 'ace')
on conflict (id) do nothing;

commit;
