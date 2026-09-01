-- CONSOLIDATED RECOVERY SCRIPT FOR 15 CRITICAL FUNCTIONS

-- Source: 20260302125000_fix_bootstrap_audit_tenant_null.sql
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

-- Source: 20260305110000_rls_hardening_p0.sql
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

-- Source: 20260305_rls_hardening.sql
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

-- Source: 20260830202500_governance_rpc.sql
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid AS $$
  select p.tenant_id
  from public.profiles p
  where p.id = auth.uid()
  limit 1;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Source: 20260302125000_fix_bootstrap_audit_tenant_null.sql
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

-- Source: 20260302125000_fix_bootstrap_audit_tenant_null.sql
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

-- Source: 20260302130000_fn_bootstrap_tenant_v2.sql
CREATE OR REPLACE FUNCTION public.fn_bootstrap_tenant_v2(
    p_user_id UUID DEFAULT auth.uid(),
    p_full_name TEXT DEFAULT NULL,
    p_doc_type TEXT DEFAULT 'DNI',
    p_doc_number TEXT DEFAULT NULL,
    p_phone_number TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_verify_token_hash TEXT DEFAULT NULL,
    p_tax_id VARCHAR(11) DEFAULT NULL,
    p_razon_social TEXT DEFAULT NULL,
    p_trade_name TEXT DEFAULT NULL,
    p_industry_type_id TEXT DEFAULT 'ONG',
    p_address TEXT DEFAULT 'Sede Matriz Principal',
    p_plan_id TEXT DEFAULT 'basic',
    p_billing_day INT DEFAULT 1,
    p_fingerprint TEXT DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_user_id UUID := COALESCE(p_user_id, auth.uid());
    v_existing_tenant_id UUID;
    v_tenant_id UUID := gen_random_uuid();
    v_sede_id UUID := gen_random_uuid();
    v_role_owner_id UUID := gen_random_uuid();
    v_max_licenses INT := 5;
    v_max_sedes INT := 1;
    v_can_use_terminals BOOLEAN := false;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado' USING ERRCODE = 'INVALID_AUTHORIZATION_SPECULATION';
    END IF;

    IF p_razon_social IS NULL OR trim(p_razon_social) = '' THEN
        RAISE EXCEPTION 'La razon social (p_razon_social) es requerida' USING ERRCODE = 'INVALID_PARAMETER_VALUE';
    END IF;

    IF p_tax_id IS NULL OR p_tax_id !~ '^[0-9]{11}$' THEN
        RAISE EXCEPTION 'El tax_id (RUC) % debe constar de 11 digitos numericos', p_tax_id USING ERRCODE = 'INVALID_PARAMETER_VALUE';
    END IF;

    -- Idempotencia: si el usuario ya posee un tenant_id asignado, lo retorna sin duplicar
    SELECT p.tenant_id INTO v_existing_tenant_id
    FROM public.profiles p
    WHERE p.id = v_user_id
    LIMIT 1;

    IF v_existing_tenant_id IS NOT NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'tenant_id', v_existing_tenant_id,
            'user_id', v_user_id,
            'message', 'El usuario ya cuenta con una organizacion asignada.'
        );
    END IF;

    -- 1. Validar unicidad de RUC registrado previamente
    IF EXISTS (SELECT 1 FROM public.tenants WHERE tax_id = p_tax_id) THEN
        RAISE EXCEPTION 'El RUC % ya se encuentra registrado en la plataforma.', p_tax_id
            USING ERRCODE = 'UNIQUE_VIOLATION';
    END IF;

    -- 2. Crear Organizacion (Tenant)
    INSERT INTO public.tenants (
        id, name, trade_name, tax_id, industry_type_id, 
        plan_id, status_financial_id, billing_day, max_licenses, created_at
    ) VALUES (
        v_tenant_id, p_razon_social, p_trade_name, p_tax_id, p_industry_type_id,
        p_plan_id, 'FIN-ACTIVE', LEAST(GREATEST(COALESCE(p_billing_day, 1), 1), 28), v_max_licenses, NOW()
    );

    -- 3. Crear o Actualizar Perfil del Usuario Dueno
    INSERT INTO public.profiles (
        id, tenant_id, full_name, doc_type, doc_number, phone_number,
        avatar_url, email_verified, verify_token_hash, updated_at
    ) VALUES (
        v_user_id, v_tenant_id, p_full_name, p_doc_type, p_doc_number, p_phone_number,
        p_avatar_url, true, p_verify_token_hash, NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        tenant_id = v_tenant_id,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        doc_type = COALESCE(EXCLUDED.doc_type, profiles.doc_type),
        doc_number = COALESCE(EXCLUDED.doc_number, profiles.doc_number),
        phone_number = COALESCE(EXCLUDED.phone_number, profiles.phone_number),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        email_verified = true,
        updated_at = NOW();

    -- 4. Crear Sede Matriz 'Principal'
    INSERT INTO public.sedes (
        id, tenant_id, name, address, is_active, created_at
    ) VALUES (
        v_sede_id, v_tenant_id, 'Principal', COALESCE(p_address, 'Sede Matriz Principal'), true, NOW()
    );

    -- 5. Crear Rol Administrador 'Owner' (Jerarquia 0)
    INSERT INTO public.roles (
        id, tenant_id, name, hierarchy_level, is_system_role, created_at
    ) VALUES (
        v_role_owner_id, v_tenant_id, 'Owner', 0, true, NOW()
    );

    -- 6. Copiar Permisos de Catalogo a Rol Owner
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT v_role_owner_id, id FROM public.cat_permissions
    ON CONFLICT DO NOTHING;

    -- 7. Asignacion Tripartita (Usuario + Rol Owner + Sede Principal + Tenant)
    INSERT INTO public.user_roles_sedes (
        tenant_id, user_id, role_id, sede_id, created_at
    ) VALUES (
        v_tenant_id, v_user_id, v_role_owner_id, v_sede_id, NOW()
    )
    ON CONFLICT DO NOTHING;

    -- 8. Contrato de Suscripcion Inicial
    INSERT INTO public.subscription_contracts (
        id, tenant_id, current_plan_id, status_id, billing_day, grace_days, created_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, p_plan_id, 'ACTIVE', COALESCE(p_billing_day, 1), 7, NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        current_plan_id = EXCLUDED.current_plan_id,
        updated_at = NOW();

    -- 9. Entitlements y Limite del Plan
    INSERT INTO public.entitlements (
        id, tenant_id, max_sedes, max_licenses, can_use_terminals, created_at
    ) VALUES (
        gen_random_uuid(), v_tenant_id, v_max_sedes, v_max_licenses, v_can_use_terminals, NOW()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        max_sedes = EXCLUDED.max_sedes,
        max_licenses = EXCLUDED.max_licenses,
        updated_at = NOW();

    -- 10. Construir respuesta JSON de confirmacion
    v_result := jsonb_build_object(
        'success', true,
        'tenant_id', v_tenant_id,
        'user_id', v_user_id,
        'sede_id', v_sede_id,
        'role_id', v_role_owner_id,
        'message', 'Bootstrapping v2.0 de la organizacion completado exitosamente.'
    );

    RETURN v_result;

EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Error durante el onboarding del tenant: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
END;
$$;

-- Source: 20260510100000_ace_fase1_onboarding_rpc.sql
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

-- Source: 20260510200000_ace_fase2_legacy_sync.sql
create or replace function public.fn_sync_urs_to_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_remaining_role_id uuid;
begin
  -- ── INSERT ─────────────────────────────────────────────────
  if tg_op = 'INSERT' then
    insert into public.memberships (
      tenant_id, user_id, context_type, context_id, role_id, status
    ) values (
      new.tenant_id, new.user_id, 'SEDE', new.sede_id, new.role_id, 'active'
    )
    on conflict (tenant_id, user_id, context_type, context_id) do update
      set role_id    = excluded.role_id,
          status     = 'active',
          updated_at = now();

  -- ── UPDATE ─────────────────────────────────────────────────
  elsif tg_op = 'UPDATE' then
    if old.sede_id is distinct from new.sede_id then
      -- Sede cambió: desactivar membresía de la sede vieja (si ya no quedan roles ahí)
      select urs2.role_id into v_remaining_role_id
      from public.user_roles_sedes urs2
      join public.roles r2 on r2.id = urs2.role_id
      where urs2.tenant_id = old.tenant_id
        and urs2.user_id   = old.user_id
        and urs2.sede_id   = old.sede_id
      order by r2.hierarchy_level asc
      limit 1;

      if v_remaining_role_id is not null then
        update public.memberships
        set role_id = v_remaining_role_id, updated_at = now()
        where tenant_id    = old.tenant_id
          and user_id      = old.user_id
          and context_type = 'SEDE'
          and context_id   = old.sede_id;
      else
        update public.memberships
        set status = 'inactive', updated_at = now()
        where tenant_id    = old.tenant_id
          and user_id      = old.user_id
          and context_type = 'SEDE'
          and context_id   = old.sede_id;
      end if;

      -- Crear/activar membresía en la nueva sede
      insert into public.memberships (
        tenant_id, user_id, context_type, context_id, role_id, status
      ) values (
        new.tenant_id, new.user_id, 'SEDE', new.sede_id, new.role_id, 'active'
      )
      on conflict (tenant_id, user_id, context_type, context_id) do update
        set role_id = excluded.role_id, status = 'active', updated_at = now();

    else
      -- Misma sede: actualizar rol si cambió
      if old.role_id is distinct from new.role_id then
        update public.memberships
        set role_id = new.role_id, updated_at = now()
        where tenant_id    = new.tenant_id
          and user_id      = new.user_id
          and context_type = 'SEDE'
          and context_id   = new.sede_id;
      end if;
    end if;

  -- ── DELETE ─────────────────────────────────────────────────
  elsif tg_op = 'DELETE' then
    -- ¿Queda algún otro rol para el mismo user+sede?
    select urs2.role_id into v_remaining_role_id
    from public.user_roles_sedes urs2
    join public.roles r2 on r2.id = urs2.role_id
    where urs2.tenant_id = old.tenant_id
      and urs2.user_id   = old.user_id
      and urs2.sede_id   = old.sede_id
    order by r2.hierarchy_level asc
    limit 1;

    if v_remaining_role_id is not null then
      -- Actualizar la membresía al rol heredero
      update public.memberships
      set role_id = v_remaining_role_id, updated_at = now()
      where tenant_id    = old.tenant_id
        and user_id      = old.user_id
        and context_type = 'SEDE'
        and context_id   = old.sede_id;
    else
      -- Sin roles restantes: marcar membresía como inactiva
      update public.memberships
      set status = 'inactive', updated_at = now()
      where tenant_id    = old.tenant_id
        and user_id      = old.user_id
        and context_type = 'SEDE'
        and context_id   = old.sede_id;
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

-- Source: 20260510210000_ace_fase3_rls_policies.sql
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

-- Source: 20260510220000_ace_fase4_optimization.sql
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

-- Source: 20260706120000_fn_get_user_redirect_target.sql
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

-- Source: 20260823000000_sessions_api_tokens.sql
CREATE OR REPLACE FUNCTION public.get_my_sessions()
RETURNS TABLE (
  id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  factor_id uuid,
  aal auth.aal_level,
  not_after timestamptz,
  user_agent text,
  ip text
)
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id, s.created_at, s.updated_at, s.factor_id, s.aal, s.not_after, s.user_agent, s.ip
  FROM auth.sessions s
  WHERE s.user_id = auth.uid()
  ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Source: 20260823000000_sessions_api_tokens.sql
CREATE OR REPLACE FUNCTION public.delete_my_session(p_session_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM auth.sessions 
  WHERE id = p_session_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Source: 20260823000001_api_tokens.sql
CREATE OR REPLACE FUNCTION public.create_api_token(p_name text, p_tenant_id uuid)
RETURNS text
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_raw_token text;
  v_token_hash text;
  v_prefix text;
BEGIN
  -- Generate 32 bytes of secure random hex + democra prefix
  v_raw_token := 'dmc_' || encode(gen_random_bytes(24), 'hex');
  v_prefix := substring(v_raw_token from 1 for 8);
  v_token_hash := crypt(v_raw_token, gen_salt('bf'));

  INSERT INTO public.api_tokens (user_id, tenant_id, name, token_hash, prefix)
  VALUES (auth.uid(), p_tenant_id, p_name, v_token_hash, v_prefix);

  RETURN v_raw_token;
END;
$$ LANGUAGE plpgsql;

-- Source: 20260823000001_api_tokens.sql
CREATE OR REPLACE FUNCTION public.delete_api_token(p_token_id uuid)
RETURNS void
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  DELETE FROM public.api_tokens 
  WHERE id = p_token_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- Source: 20260830202500_governance_rpc.sql
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

-- Source: 20260830202500_governance_rpc.sql
CREATE OR REPLACE FUNCTION public.fn_is_tenant_admin()
RETURNS boolean AS $$
  select public.fn_has_permission('iam.admin'::text, null::uuid);
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

