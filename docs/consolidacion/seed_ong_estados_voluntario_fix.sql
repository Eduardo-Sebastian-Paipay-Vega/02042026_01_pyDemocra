-- =============================================================================
-- seed_ong_estados_voluntario_fix.sql
-- Fix: catálogo ong.estados_voluntario incompleto (falta 'en_proceso')
-- =============================================================================
-- Reportado en producción: al canjear un código de acceso vía /join, el
-- registro fallaba con:
--   "violación de la restricción de clave externa
--    voluntarios_codigo_estado_fkey en la tabla voluntarios"
--
-- Causa raíz confirmada: fn_complete_access_onboarding() (ver
-- supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql y
-- docs/consolidacion/ace_fix_membership_context_type_mapping.sql) inserta
-- codigo_estado = 'en_proceso' por defecto para todo voluntario creado por
-- onboarding. El propio comentario de columna de la tabla documenta 4
-- valores esperados ('activo','inactivo','suspendido','en_proceso' — ver
-- DATABASE_MASTER_SCRIPT_S1.md:718), pero el script de seed documentado
-- (docs/ong/scripts/Parte 2 - Script maestro documental de ONG módulos
-- complementarios.md:536-540) solo inserta 3 de los 4: 'activo', 'inactivo',
-- 'suspendido' — 'en_proceso' nunca se sembró, por eso la FK rebota apenas
-- alguien completa un onboarding vía código de acceso.
--
-- UBICACIÓN: docs/consolidacion/, no supabase/migrations/ (mismo criterio
-- que el resto de este directorio) — aplicar manualmente contra el proyecto
-- Supabase real cuando se decida.
-- =============================================================================

INSERT INTO ong.estados_voluntario (codigo, nombre_estado, descripcion, orden_visual) VALUES
  ('en_proceso', 'En proceso',  'Registro recien creado, pendiente de revision por un administrador.', 1),
  ('activo',     'Activo',      'Voluntario habilitado para participar en actividades.',                2),
  ('inactivo',   'Inactivo',    'Voluntario sin participacion activa actualmente.',                      3),
  ('suspendido', 'Suspendido',  'Voluntario con acceso restringido temporalmente.',                      4)
ON CONFLICT (codigo) DO NOTHING;
