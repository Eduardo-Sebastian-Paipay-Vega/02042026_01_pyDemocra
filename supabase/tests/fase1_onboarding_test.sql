-- ============================================================
-- FASE 1 — PRUEBA MANUAL de fn_complete_access_onboarding
-- Ejecutar en: Supabase Dashboard → SQL Editor (o psql remoto)
-- ⚠️  NO es una migración. No usar supabase db push con este archivo.
-- ============================================================
--
-- ANTES DE EJECUTAR:
--   1. Sustituye TU_TENANT_ID con un UUID de public.tenants real.
--   2. Sustituye TU_SEDE_ID con un UUID de public.sedes de ese tenant.
--   3. Ejecuta como el service_role (SQL Editor de Supabase lo usa por defecto).
--
-- Para obtener tenant y sede actuales:
--   SELECT id, name FROM public.tenants LIMIT 5;
--   SELECT id, name, tenant_id FROM public.sedes LIMIT 10;
-- ============================================================

-- ─────────────────────────────────────────────────────────
-- PASO 1: Preparar escenario
-- ─────────────────────────────────────────────────────────
DO $$
DECLARE
  v_tenant_id  uuid := 'TU_TENANT_ID'::uuid;  -- ← sustituir
  v_sede_id    uuid := 'TU_SEDE_ID'::uuid;    -- ← sustituir
  v_role_id    uuid;
BEGIN
  -- Crear rol de voluntario si no existe (UNIQUE en tenant_id + name)
  INSERT INTO public.roles (tenant_id, name, hierarchy_level, is_system_role)
  VALUES (v_tenant_id, 'Voluntario Base', 90, false)
  ON CONFLICT (tenant_id, name) DO NOTHING;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE tenant_id = v_tenant_id AND name = 'Voluntario Base'
  LIMIT 1;

  -- Crear link de acceso de prueba
  INSERT INTO public.access_links (
    tenant_id,
    code,
    type,
    target_type,
    target_id,
    assigned_role_id,
    assigned_sede_id,
    max_uses,
    expires_at
  ) VALUES (
    v_tenant_id,
    'TEST-FASE1-VOL',
    'VOLUNTEER_JOIN',
    'SEDE',
    v_sede_id,      -- target_id apunta a la sede (contexto de la membresía)
    v_role_id,
    v_sede_id,
    5,
    now() + interval '1 day'
  )
  ON CONFLICT (code) DO NOTHING;

  RAISE NOTICE 'Escenario listo: link TEST-FASE1-VOL creado para tenant %', v_tenant_id;
END $$;

-- ─────────────────────────────────────────────────────────
-- PASO 2: Ejecutar la función
-- Nota: En Supabase, auth.uid() devuelve el usuario autenticado.
-- Desde el SQL Editor (service_role), auth.uid() es NULL → la función
-- lanzará "Not authenticated". Úsala desde el cliente JS/TS:
--
--   const { data, error } = await supabase.rpc('fn_complete_access_onboarding', {
--     p_access_code: 'TEST-FASE1-VOL',
--     p_metadata: {
--       full_name: 'Juan Pérez',
--       numero_documento: '12345678',
--       email: 'juan@test.com'
--     }
--   })
--
-- O, para probar directo en SQL Editor, simula el uid:
-- ─────────────────────────────────────────────────────────

-- Simulación directa (service_role bypasa RLS pero auth.uid() = null aquí):
-- SELECT public.fn_complete_access_onboarding(
--   'TEST-FASE1-VOL',
--   '{"full_name": "Juan Pérez", "numero_documento": "12345678", "email": "juan@test.com"}'::jsonb
-- );

-- ─────────────────────────────────────────────────────────
-- PASO 3: Verificaciones post-ejecución
-- ─────────────────────────────────────────────────────────

-- ¿Se actualizó el link?
SELECT code, used_count, max_uses, is_active
FROM public.access_links
WHERE code = 'TEST-FASE1-VOL';

-- ¿Se creó la membresía contextual?
SELECT m.id, m.context_type, m.context_id, m.status, m.joined_at, r.name AS role_name
FROM public.memberships m
LEFT JOIN public.roles r ON r.id = m.role_id
WHERE m.context_type = 'SEDE'
ORDER BY m.created_at DESC
LIMIT 5;

-- ¿Se creó el voluntario?
SELECT id, nombre, apellido, numero_documento, codigo_estado, iam_user_id
FROM ong.voluntarios
ORDER BY created_at DESC
LIMIT 5;

-- ¿Se registró en audit_logs?
SELECT event_type, resource_name, payload_after, created_at
FROM public.audit_logs
WHERE event_type = 'ONBOARDING_COMPLETED'
ORDER BY created_at DESC
LIMIT 3;

-- ─────────────────────────────────────────────────────────
-- LIMPIEZA (opcional, solo si quieres limpiar el escenario de prueba)
-- ─────────────────────────────────────────────────────────
-- DELETE FROM public.access_links WHERE code = 'TEST-FASE1-VOL';
-- DELETE FROM public.roles WHERE name = 'Voluntario Base' AND tenant_id = 'TU_TENANT_ID'::uuid;
