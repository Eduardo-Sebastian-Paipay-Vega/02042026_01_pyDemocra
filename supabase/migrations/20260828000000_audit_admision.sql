-- Migration: 20260828000000_audit_admision.sql
-- Objetivo: Implementar plan de remediacion de auditoria de admision 2026-08-28

-- 1. Actualizar rrhh.documentos_admision
ALTER TABLE rrhh.documentos_admision 
  ADD COLUMN estado_validacion VARCHAR(50) DEFAULT 'PENDIENTE',
  ADD COLUMN comentarios_rechazo TEXT;

-- Constraint para validar el estado del documento
ALTER TABLE rrhh.documentos_admision
  ADD CONSTRAINT documentos_admision_estado_validacion_check
  CHECK (estado_validacion IN ('PENDIENTE', 'APROBADO', 'RECHAZADO'));

-- Para datos historicos (ya existentes) convertimos verified -> estado_validacion
UPDATE rrhh.documentos_admision
SET estado_validacion = CASE 
  WHEN verified = true THEN 'APROBADO'
  ELSE 'PENDIENTE'
END;

-- Eliminamos la columna verified
ALTER TABLE rrhh.documentos_admision DROP COLUMN verified;

-- 2. Actualizar rrhh.solicitudes_admision
-- Anadir soft deletes
ALTER TABLE rrhh.solicitudes_admision 
  ADD COLUMN is_deleted BOOLEAN DEFAULT false,
  ADD COLUMN deleted_at TIMESTAMPTZ,
  ADD COLUMN deleted_by UUID;

ALTER TABLE rrhh.solicitudes_admision
  ADD CONSTRAINT solicitudes_admision_deleted_by_fkey FOREIGN KEY (deleted_by) REFERENCES auth.users(id);

-- Constraint para estado de solicitud
ALTER TABLE rrhh.solicitudes_admision
  ADD CONSTRAINT solicitudes_admision_estado_check
  CHECK (estado IN ('PENDIENTE', 'EN_REVISION', 'ENTREVISTA', 'APROBADA', 'RECHAZADA', 'CONVERTIDA'));

-- Asegurar RLS en rrhh.solicitudes_admision
ALTER TABLE rrhh.solicitudes_admision ENABLE ROW LEVEL SECURITY;

-- Politica para permitir acceso a las solicitudes que no esten borradas y que coincidan con el tenant_id
DROP POLICY IF EXISTS p_rrhh_solicitudes_admision_tenant_all ON rrhh.solicitudes_admision;
CREATE POLICY p_rrhh_solicitudes_admision_tenant_all ON rrhh.solicitudes_admision
  FOR ALL TO authenticated
  USING (tenant_id = fn_current_tenant_id() AND is_deleted = false)
  WITH CHECK (tenant_id = fn_current_tenant_id() AND is_deleted = false);
