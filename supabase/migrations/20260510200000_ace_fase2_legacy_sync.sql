-- ACE FASE 2 — Sincronización legacy → Access & Context Engine
-- Fecha: 2026-05-10
--
-- Correcciones sobre el diseño propuesto:
--   1. Tabla real: rrhh.codigos_registro_voluntario (no rrhh.codigos_registro)
--   2. access_links.type solo acepta VOLUNTEER_JOIN|STAFF_JOIN|BENEFICIARY_JOIN|GENERIC
--      → se usa VOLUNTEER_JOIN para los códigos de admisión
--   3. access_links.target_type solo acepta PROJECT|PROGRAM|ACTIVITY|SEDE|GLOBAL (inglés)
--      → se usa GLOBAL; id_solicitud va en metadata (no es un PROGRAM semántico)
--   4. memberships UNIQUE(tenant_id,user_id,context_type,context_id): user_roles_sedes
--      permite múltiples roles por sede → migración usa DISTINCT ON + hierarchy_level ASC
--      para conservar el rol más privilegiado (menor número = más poder)
--   5. Trigger ampliado: INSERT / UPDATE / DELETE con lógica de "rol heredero" al borrar

begin;

-- ============================================================
-- 1. MIGRACIÓN: user_roles_sedes → memberships
--    Snapshot del estado actual. Para cada (user, sede), conserva
--    el rol con menor hierarchy_level (más privilegiado).
-- ============================================================
insert into public.memberships (
  tenant_id, user_id, context_type, context_id, role_id, status, joined_at
)
select distinct on (urs.tenant_id, urs.user_id, urs.sede_id)
  urs.tenant_id,
  urs.user_id,
  'SEDE'::text,
  urs.sede_id,
  urs.role_id,
  'active',
  urs.created_at
from public.user_roles_sedes urs
join public.roles r on r.id = urs.role_id
order by urs.tenant_id, urs.user_id, urs.sede_id, r.hierarchy_level asc
on conflict (tenant_id, user_id, context_type, context_id) do update
  set role_id    = excluded.role_id,
      status     = 'active',
      updated_at = now();

-- ============================================================
-- 2. FUNCIÓN DE SINCRONIZACIÓN: user_roles_sedes ↔ memberships
-- ============================================================
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

-- Trigger (idempotente)
drop trigger if exists tr_sync_user_roles_sedes on public.user_roles_sedes;
create trigger tr_sync_user_roles_sedes
  after insert or update or delete on public.user_roles_sedes
  for each row execute function public.fn_sync_urs_to_membership();

-- ============================================================
-- 3. MIGRACIÓN: rrhh.codigos_registro_voluntario → access_links
--    Solo registros con max_uses >= 1 (CHECK de FASE 0).
--    target_type = GLOBAL porque id_solicitud no es un PROGRAM;
--    toda la información de admisión va en metadata jsonb.
-- ============================================================
insert into public.access_links (
  tenant_id,
  code,
  type,
  target_type,
  target_id,
  assigned_role_id,
  max_uses,
  used_count,
  expires_at,
  is_active,
  metadata,
  created_by
)
select
  crv.tenant_id,
  crv.codigo,
  'VOLUNTEER_JOIN'::text,
  'GLOBAL'::text,
  null,           -- target_id: no aplica semánticamente; id_solicitud va en metadata
  null,           -- rol se define en el flujo de admisión específico
  crv.max_uses,
  crv.use_count,
  crv.expires_at,
  (crv.estado = 'activo'),   -- is_active: true solo si estado='activo'
  jsonb_build_object(
    'legacy_source',         'rrhh.codigos_registro_voluntario',
    'legacy_id',             crv.id,
    'legacy_estado',         crv.estado,
    'id_solicitud',          crv.id_solicitud,
    'id_voluntario',         crv.id_voluntario,
    'email_objetivo',        crv.email_objetivo,
    'numero_documento_obj',  crv.numero_documento_objetivo,
    'nombres_objetivo',      crv.nombres_objetivo,
    'apellidos_objetivo',    crv.apellidos_objetivo
  ),
  crv.created_by
from rrhh.codigos_registro_voluntario crv
where crv.max_uses >= 1
on conflict (code) do nothing;

-- ============================================================
-- 4. Permiso cat_permissions para el nuevo trigger/función
-- ============================================================
insert into public.cat_permissions (id, description, module) values
  ('ace.sync.legacy', 'Función interna de sincronización legacy → memberships', 'ace')
on conflict (id) do nothing;

commit;
