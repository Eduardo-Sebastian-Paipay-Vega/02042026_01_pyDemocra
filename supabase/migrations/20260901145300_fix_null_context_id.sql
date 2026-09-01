begin;

-- ============================================================
-- fn_complete_access_onboarding (UPDATED)
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

  -- 1. Bloquear el link
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

  -- 2. Upsert en public.profiles
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

  -- 3. Upsert membresía contextual
  insert into public.memberships (
    tenant_id, user_id, context_type, context_id, role_id, status
  ) values (
    v_link.tenant_id, v_user_id,
    v_link.target_type, coalesce(v_link.target_id, v_link.tenant_id),
    v_link.assigned_role_id, 'active'
  )
  on conflict (tenant_id, user_id, context_type, context_id) do update
    set status     = 'active',
        role_id    = excluded.role_id,
        updated_at = now()
  returning id into v_membership_id;

  -- 4. IAM: asignar rol en sede
  if v_link.assigned_role_id is not null and v_link.assigned_sede_id is not null then
    insert into public.user_roles_sedes (
      tenant_id, user_id, role_id, sede_id
    ) values (
      v_link.tenant_id, v_user_id,
      v_link.assigned_role_id, v_link.assigned_sede_id
    )
    on conflict do nothing;
  end if;

  -- 5. Registro operativo según tipo de link
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
    where tenant_id = v_link.tenant_id and iam_user_id = v_user_id
    limit 1;

    if v_entity_id is null then
      insert into ong.voluntarios (
        tenant_id, iam_user_id, nombre, apellido, numero_documento, codigo_estado
      ) values (
        v_link.tenant_id, v_user_id, 
        coalesce(v_nombre, 'Voluntario'), coalesce(v_apellido, 'Invitado'), 
        coalesce(v_num_doc, 'SN'), 'ACTIVO'
      )
      returning id into v_entity_id;
    end if;
  elsif v_link.type = 'STAFF_JOIN' then
    select id into v_entity_id
    from rrhh.solicitudes_admision
    where tenant_id = v_link.tenant_id and email = v_email
    limit 1;

    if v_entity_id is null then
      insert into rrhh.solicitudes_admision (
        tenant_id, email, nombres, apellidos, documento_identidad, 
        estado_evaluacion, status_code, score_total
      ) values (
        v_link.tenant_id, coalesce(v_email, 'sin-correo@democra.pro'),
        coalesce(v_nombre, 'Staff'), coalesce(v_apellido, 'Invitado'),
        v_num_doc, 'aprobado', 'admitido', 100
      )
      returning id into v_entity_id;
    else
      update rrhh.solicitudes_admision
      set estado_evaluacion = 'aprobado',
          status_code = 'admitido'
      where id = v_entity_id;
    end if;
  end if;

  -- 6. Actualizar contadores del link
  update public.access_links
  set used_count = used_count + 1
  where id = v_link.id;

  -- 7. Log
  insert into public.audit_logs (
    tenant_id, user_id, action, entity_type, entity_id, details
  ) values (
    v_link.tenant_id, v_user_id, 'LINK_ONBOARDING', 'access_links', v_link.id,
    jsonb_build_object(
      'code', p_access_code,
      'membership_id', v_membership_id,
      'entity_id', v_entity_id,
      'link_type', v_link.type
    )
  );

  return jsonb_build_object(
    'success', true,
    'membership_id', v_membership_id,
    'entity_id', v_entity_id,
    'tenant_id', v_link.tenant_id,
    'link_type', v_link.type
  );
end;
$$;
commit;
