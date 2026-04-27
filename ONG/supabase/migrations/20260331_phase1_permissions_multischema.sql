BEGIN;

-- FASE 1 - cierre de permisos multi-schema y permisos funcionales
-- Contratos verificados en:
-- - guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt
-- - guidelines/BD/Parte 4- Script maestro documental de ONG modulos complementarios.txt
-- - src/lib/db/ong/app-database.ts
--
-- Los scripts documentales ya habilitan RLS/policies sobre rrhh, clinico,
-- finanzas, comunicaciones y auditoria. Este cierre agrega el acceso base
-- faltante para authenticated sobre schemas, tablas y RPCs realmente usados
-- por frontend en las rutas de Voluntarios, Admision, Beneficiarios,
-- Ficha medica sensible, Finanzas, Notificaciones y Gobernanza.

GRANT USAGE ON SCHEMA rrhh TO authenticated;
GRANT USAGE ON SCHEMA clinico TO authenticated;
GRANT USAGE ON SCHEMA finanzas TO authenticated;
GRANT USAGE ON SCHEMA comunicaciones TO authenticated;
GRANT USAGE ON SCHEMA auditoria TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA rrhh TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA clinico TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA finanzas TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA comunicaciones TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA auditoria TO authenticated;

-- RRHH
-- Tablas usadas por:
-- - src/app/services/personas/volunteers.service.ts
-- - src/app/services/admision/solicitudesAdmision.service.ts
GRANT SELECT ON TABLE
  rrhh.habilidades,
  rrhh.roles_operativos,
  rrhh.onboarding_pasos,
  rrhh.codigos_registro_voluntario,
  rrhh.registro_documentos_postulante
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  rrhh.voluntario_habilidades,
  rrhh.asignaciones_rol,
  rrhh.documentos_voluntario,
  rrhh.perfil_coordinador,
  rrhh.solicitudes_admision,
  rrhh.documentos_admision,
  rrhh.entrevistas_admision,
  rrhh.onboarding_voluntario
TO authenticated;

GRANT EXECUTE ON FUNCTION rrhh.fn_generate_registration_code(
  varchar,
  varchar,
  varchar,
  varchar,
  uuid,
  integer
) TO authenticated;

-- CLINICO
-- Tablas usadas por:
-- - src/app/services/personas/beneficiaries.service.ts
-- - src/app/services/clinico/medicalRecords.service.ts
-- - src/app/services/gobernanza/sensitiveAccess.service.ts
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  clinico.fichas_medicas,
  clinico.ficha_sensible_voluntario,
  clinico.perfil_nino,
  clinico.perfil_adulto_mayor
TO authenticated;

GRANT SELECT, INSERT ON TABLE
  clinico.accesos_sensibles_log,
  clinico.accesos_sensibles_voluntario_log
TO authenticated;

-- FINANZAS
-- Tablas usadas por:
-- - src/app/services/recursos/cuentasFinancieras.service.ts
-- - src/app/services/recursos/categoriasFinancieras.service.ts
-- - src/app/services/recursos/transaccionesFinancieras.service.ts
-- - src/app/services/recursos/comprobantesFinancieros.service.ts
GRANT SELECT ON TABLE
  finanzas.cat_tipos_cuenta
TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  finanzas.cuentas,
  finanzas.categorias,
  finanzas.transacciones,
  finanzas.aprobaciones_transaccion,
  finanzas.comprobantes_financieros
TO authenticated;

-- COMUNICACIONES / NOTIFICACIONES
-- Tablas usadas por:
-- - src/app/services/notificaciones/templates.service.ts
-- - src/app/services/notificaciones/history.service.ts
GRANT SELECT ON TABLE
  comunicaciones.canales_notificacion,
  comunicaciones.historial_notificaciones
TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE
  comunicaciones.plantillas_notificacion
TO authenticated;

-- AUDITORIA / GOBERNANZA
-- Tabla usada por:
-- - src/app/services/gobernanza/audit.service.ts
GRANT SELECT ON TABLE
  auditoria.audit_log
TO authenticated;

-- RPCs del core y funciones relacionadas que usa el frontend actual.
GRANT EXECUTE ON FUNCTION public.fn_current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_has_permission(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_tenant_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_remote_revoke_app_session(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION ong.fn_register_attendance_scan(text, uuid, timestamptz) TO authenticated;

COMMIT;
