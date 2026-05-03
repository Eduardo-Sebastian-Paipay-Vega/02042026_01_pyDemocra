BEGIN;

SET search_path = public;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1) PERMISOS NUEVOS
-- ============================================================
INSERT INTO public.cat_permissions (id, description, module) VALUES
  ('home.read','Ver dashboard y busqueda global','home'),
  ('projects.read','Ver proyectos','projects'),
  ('projects.manage','Gestionar proyectos','projects'),
  ('operation.activities.read','Ver actividades','operation'),
  ('operation.activities.manage','Gestionar actividades','operation'),
  ('operation.hours.read','Ver horas','operation'),
  ('operation.hours.manage','Gestionar horas','operation'),
  ('operation.hours.approve','Aprobar/rechazar horas','operation'),
  ('operation.attendance.read','Ver asistencias','operation'),
  ('operation.attendance.manage','Gestionar asistencias','operation'),
  ('operation.evidence.read','Ver evidencias','operation'),
  ('operation.evidence.manage','Gestionar evidencias','operation'),
  ('operation.evidence.approve','Validar evidencias','operation'),
  ('admission.read','Ver admision','admission'),
  ('admission.manage','Gestionar admision','admission'),
  ('admission.approve','Aprobar admision','admission'),
  ('resources.inventory.read','Ver inventario','resources'),
  ('resources.inventory.manage','Gestionar inventario','resources'),
  ('resources.finance.read','Ver finanzas','resources'),
  ('resources.finance.manage','Gestionar finanzas','resources'),
  ('resources.finance.approve','Aprobar transacciones financieras','resources'),
  ('notifications.read','Ver notificaciones','notifications'),
  ('notifications.manage','Gestionar notificaciones','notifications'),
  ('governance.catalogs.read','Ver catalogos','governance'),
  ('governance.audit.read','Ver auditoria','governance'),
  ('governance.sensitive.read','Ver accesos sensibles','governance'),
  ('governance.retention.read','Ver restore y retencion','governance'),
  ('settings.users.read','Ver usuarios','settings'),
  ('settings.users.manage','Gestionar usuarios','settings'),
  ('settings.roles.read','Ver roles','settings'),
  ('settings.roles.manage','Gestionar roles','settings'),
  ('settings.sessions.read','Ver sesiones','settings'),
  ('settings.sessions.terminate','Cerrar sesiones remotas','settings'),
  ('clinico.volunteer_sensitive.read','Leer ficha sensible de voluntario','clinico'),
  ('idcards.read','Ver credenciales','idcards'),
  ('idcards.manage','Gestionar credenciales','idcards'),
  ('volunteers.invite','Invitar voluntarios por codigo','volunteers'),
  ('volunteers.register','Completar registro con codigo','volunteers'),
  ('attendance.scan','Registrar asistencia por escaneo','attendance')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2) SOFT DELETE FALTANTE
-- ============================================================
ALTER TABLE IF EXISTS ong.asignaciones_actividad
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS ong.recursos_proyecto
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS rrhh.onboarding_voluntario
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;

-- ============================================================
-- 3) ONG.ACTIVIDADES CON CAMPOS PROPIOS
-- ============================================================
ALTER TABLE IF EXISTS ong.actividades
  ADD COLUMN IF NOT EXISTS descripcion text NULL,
  ADD COLUMN IF NOT EXISTS codigo_estado varchar(50) NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS fecha_inicio timestamptz NULL,
  ADD COLUMN IF NOT EXISTS fecha_fin timestamptz NULL,
  ADD COLUMN IF NOT EXISTS id_ubicacion uuid NULL REFERENCES ong.ubicaciones(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'ck_ong_actividades_codigo_estado'
  ) THEN
    ALTER TABLE ong.actividades
      ADD CONSTRAINT ck_ong_actividades_codigo_estado
      CHECK (codigo_estado IN ('pendiente','planificada','en_progreso','completada','cancelada'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_estado
  ON ong.actividades (tenant_id, codigo_estado);

CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_fechas
  ON ong.actividades (tenant_id, fecha_inicio, fecha_fin);

-- ============================================================
-- 4) TABLA REAL DE ASISTENCIAS
-- ============================================================
CREATE TABLE IF NOT EXISTS ong.asistencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad uuid NOT NULL REFERENCES ong.actividades(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id) ON DELETE CASCADE,
  fecha_operacion date NOT NULL DEFAULT CURRENT_DATE,
  check_in_at timestamptz NULL,
  check_out_at timestamptz NULL,
  origen_registro varchar(30) NOT NULL DEFAULT 'scan'
    CHECK (origen_registro IN ('scan','manual','import')),
  estado varchar(30) NOT NULL DEFAULT 'presente'
    CHECK (estado IN ('presente','tardanza','ausente','justificado','pendiente')),
  observacion text NULL,
  qr_payload text NULL,
  id_card_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  deleted_at timestamptz NULL,
  deleted_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  is_deleted boolean NOT NULL DEFAULT false,
  CONSTRAINT uq_ong_asistencia_unica_abierta
    UNIQUE (tenant_id, id_actividad, id_voluntario, fecha_operacion)
);

CREATE INDEX IF NOT EXISTS idx_ong_asistencias_tenant_fecha
  ON ong.asistencias (tenant_id, fecha_operacion, estado);

-- ============================================================
-- 5) TABLA REAL DE APROBACIONES
-- ============================================================
CREATE TABLE IF NOT EXISTS ong.aprobaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  modulo varchar(50) NOT NULL,
  entidad_schema varchar(100) NOT NULL,
  entidad_tabla varchar(100) NOT NULL,
  entidad_id uuid NOT NULL,
  tipo_aprobacion varchar(50) NOT NULL
    CHECK (tipo_aprobacion IN ('hora','evidencia','admision','finanza','otro')),
  estado varchar(30) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','aprobada','rechazada','devuelta')),
  comentario text NULL,
  solicitado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resuelto_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ong_aprobaciones_tenant_estado
  ON ong.aprobaciones (tenant_id, estado, tipo_aprobacion);

ALTER TABLE IF EXISTS ong.horas_actividad
  ADD COLUMN IF NOT EXISTS id_aprobacion uuid NULL REFERENCES ong.aprobaciones(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS comentario_resolucion text NULL;

-- ============================================================
-- 6) BITÁCORA SENSIBLE PARA VOLUNTARIOS
-- ============================================================
CREATE TABLE IF NOT EXISTS clinico.accesos_sensibles_voluntario_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_ficha_voluntario uuid NOT NULL
    REFERENCES clinico.ficha_sensible_voluntario(id) ON DELETE CASCADE,
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo text NOT NULL,
  ip inet NULL,
  user_agent text NULL,
  fecha_acceso timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 7) ADMISION - CAMPOS FALTANTES
-- ============================================================
ALTER TABLE IF EXISTS rrhh.documentos_admision
  ADD COLUMN IF NOT EXISTS verified_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz NULL;

ALTER TABLE IF EXISTS rrhh.entrevistas_admision
  ADD COLUMN IF NOT EXISTS puntaje numeric(5,2) NULL
    CHECK (puntaje IS NULL OR (puntaje >= 0 AND puntaje <= 100));

ALTER TABLE IF EXISTS rrhh.solicitudes_admision
  ADD COLUMN IF NOT EXISTS id_voluntario_vinculado uuid NULL
    REFERENCES ong.voluntarios(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS rrhh.onboarding_voluntario
  ADD COLUMN IF NOT EXISTS evidencia_url text NULL;

-- ============================================================
-- 8) REGISTRO DE VOLUNTARIOS POR CÓDIGO
-- ============================================================
CREATE TABLE IF NOT EXISTS rrhh.codigos_registro_voluntario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo varchar(32) NOT NULL,
  email_objetivo varchar(255) NULL,
  numero_documento_objetivo varchar(50) NULL,
  nombres_objetivo varchar(150) NULL,
  apellidos_objetivo varchar(150) NULL,
  id_solicitud uuid NULL REFERENCES rrhh.solicitudes_admision(id) ON DELETE SET NULL,
  id_voluntario uuid NULL REFERENCES ong.voluntarios(id) ON DELETE SET NULL,
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses > 0),
  use_count integer NOT NULL DEFAULT 0 CHECK (use_count >= 0),
  estado varchar(20) NOT NULL DEFAULT 'activo'
    CHECK (estado IN ('activo','consumido','expirado','revocado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_rrhh_codigo_registro UNIQUE (tenant_id, codigo)
);

CREATE TABLE IF NOT EXISTS rrhh.registro_documentos_postulante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_codigo_registro uuid NOT NULL
    REFERENCES rrhh.codigos_registro_voluntario(id) ON DELETE CASCADE,
  tipo_documento varchar(50) NOT NULL,
  archivo_url text NOT NULL,
  verificado boolean NOT NULL DEFAULT false,
  verified_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

-- ============================================================
-- 9) ID CARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS ong.id_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  nombre varchar(150) NOT NULL,
  base_image_url text NOT NULL,
  template_width integer NOT NULL CHECK (template_width > 0),
  template_height integer NOT NULL CHECK (template_height > 0),
  activa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ong.id_card_template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_template uuid NOT NULL REFERENCES ong.id_card_templates(id) ON DELETE CASCADE,
  field_key varchar(50) NOT NULL CHECK (field_key IN ('foto','nombre','dni','codigo','qr')),
  pos_x numeric(10,2) NOT NULL,
  pos_y numeric(10,2) NOT NULL,
  width numeric(10,2) NULL,
  height numeric(10,2) NULL,
  font_size numeric(10,2) NULL,
  font_family varchar(100) NULL,
  font_weight varchar(50) NULL,
  color_hex varchar(20) NULL,
  z_index integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_id_card_template_field UNIQUE (id_template, field_key)
);

CREATE TABLE IF NOT EXISTS ong.id_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_voluntario uuid NOT NULL REFERENCES ong.voluntarios(id) ON DELETE CASCADE,
  id_template uuid NOT NULL REFERENCES ong.id_card_templates(id) ON DELETE RESTRICT,
  card_code varchar(50) NOT NULL,
  qr_payload text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  estado varchar(20) NOT NULL DEFAULT 'activa'
    CHECK (estado IN ('activa','revocada','expirada')),
  image_render_url text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_id_cards_code UNIQUE (tenant_id, card_code),
  CONSTRAINT uq_ong_id_cards_voluntario UNIQUE (tenant_id, id_voluntario)
);

ALTER TABLE IF EXISTS ong.asistencias
  ADD CONSTRAINT fk_ong_asistencias_id_card
  FOREIGN KEY (id_card_id) REFERENCES ong.id_cards(id) ON DELETE SET NULL;

-- ============================================================
-- 10) FINANZAS
-- ============================================================
CREATE TABLE IF NOT EXISTS finanzas.cat_tipos_cuenta (
  codigo varchar(50) PRIMARY KEY,
  nombre varchar(100) NOT NULL UNIQUE
);

INSERT INTO finanzas.cat_tipos_cuenta(codigo, nombre) VALUES
  ('banco','Banco'),
  ('caja_chica','Caja chica'),
  ('pasarela','Pasarela')
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE IF EXISTS finanzas.cuentas
  DROP CONSTRAINT IF EXISTS finanzas_cuentas_tipo_cuenta_check;

ALTER TABLE IF EXISTS finanzas.cuentas
  ADD CONSTRAINT fk_finanzas_cuentas_tipo_cuenta
  FOREIGN KEY (tipo_cuenta) REFERENCES finanzas.cat_tipos_cuenta(codigo);

CREATE TABLE IF NOT EXISTS finanzas.aprobaciones_transaccion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_transaccion uuid NOT NULL REFERENCES finanzas.transacciones(id) ON DELETE CASCADE,
  estado varchar(20) NOT NULL DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente','aprobada','rechazada')),
  comentario text NULL,
  solicitado_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  resuelto_por uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  requested_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 11) NOTIFICACIONES
-- ============================================================
ALTER TABLE IF EXISTS comunicaciones.plantillas_notificacion
  ADD COLUMN IF NOT EXISTS variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS codigo_evento varchar(100) NULL;

ALTER TABLE IF EXISTS comunicaciones.historial_notificaciones
  ADD COLUMN IF NOT EXISTS codigo_canal varchar(50) NULL,
  ADD COLUMN IF NOT EXISTS estado_entrega varchar(30) NOT NULL DEFAULT 'pendiente',
  ADD COLUMN IF NOT EXISTS error_mensaje text NULL,
  ADD COLUMN IF NOT EXISTS id_plantilla uuid NULL,
  ADD COLUMN IF NOT EXISTS payload jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============================================================
-- 12) RPCs
-- ============================================================
CREATE OR REPLACE FUNCTION rrhh.fn_generate_registration_code(
  p_email varchar,
  p_numero_documento varchar,
  p_nombres varchar,
  p_apellidos varchar,
  p_id_solicitud uuid,
  p_expires_in_minutes integer DEFAULT 1440
)
RETURNS rrhh.codigos_registro_voluntario
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_row rrhh.codigos_registro_voluntario;
  v_code text;
BEGIN
  IF NOT public.fn_has_permission('volunteers.invite') AND NOT public.fn_is_tenant_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  v_code := upper(substr(encode(gen_random_bytes(8), 'hex'), 1, 12));

  INSERT INTO rrhh.codigos_registro_voluntario(
    tenant_id, codigo, email_objetivo, numero_documento_objetivo, nombres_objetivo,
    apellidos_objetivo, id_solicitud, expires_at, created_by, updated_by
  )
  VALUES (
    public.fn_current_tenant_id(), v_code, p_email, p_numero_documento, p_nombres,
    p_apellidos, p_id_solicitud, now() + make_interval(mins => p_expires_in_minutes),
    auth.uid(), auth.uid()
  )
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION ong.fn_register_attendance_scan(
  p_qr_payload text,
  p_id_actividad uuid,
  p_scan_time timestamptz DEFAULT now()
)
RETURNS ong.asistencias
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_card ong.id_cards;
  v_asistencia ong.asistencias;
BEGIN
  IF NOT public.fn_has_permission('attendance.scan') AND NOT public.fn_is_tenant_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  SELECT *
  INTO v_card
  FROM ong.id_cards
  WHERE tenant_id = public.fn_current_tenant_id()
    AND qr_payload = p_qr_payload
    AND estado = 'activa'
    AND (expires_at IS NULL OR expires_at > p_scan_time)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Credencial no encontrada o inactiva';
  END IF;

  SELECT *
  INTO v_asistencia
  FROM ong.asistencias
  WHERE tenant_id = public.fn_current_tenant_id()
    AND id_actividad = p_id_actividad
    AND id_voluntario = v_card.id_voluntario
    AND fecha_operacion = p_scan_time::date
    AND is_deleted = false
  LIMIT 1
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO ong.asistencias(
      tenant_id, id_actividad, id_voluntario, fecha_operacion,
      check_in_at, origen_registro, estado, qr_payload, id_card_id,
      created_by, updated_by
    )
    VALUES(
      public.fn_current_tenant_id(), p_id_actividad, v_card.id_voluntario, p_scan_time::date,
      p_scan_time, 'scan', 'presente', p_qr_payload, v_card.id,
      auth.uid(), auth.uid()
    )
    RETURNING * INTO v_asistencia;
  ELSE
    UPDATE ong.asistencias
    SET check_out_at = COALESCE(v_asistencia.check_out_at, p_scan_time),
        updated_at = now(),
        updated_by = auth.uid()
    WHERE id = v_asistencia.id
    RETURNING * INTO v_asistencia;
  END IF;

  RETURN v_asistencia;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_remote_revoke_app_session(
  p_session_id uuid,
  p_reason text
)
RETURNS public.sessions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session public.sessions;
BEGIN
  IF NOT public.fn_has_permission('settings.sessions.terminate') AND NOT public.fn_is_tenant_admin() THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  UPDATE public.sessions
  SET revoked_at = now(),
      revoke_reason = p_reason
  WHERE id = p_session_id
    AND tenant_id = public.fn_current_tenant_id()
  RETURNING * INTO v_session;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sesion no encontrada';
  END IF;

  RETURN v_session;
END;
$$;

COMMIT;



-- PARCHE

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



-- storege de supabase

-- Crear bucket para imágenes
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Política de lectura pública
create policy "Public read access"
on storage.objects
for select
using (bucket_id = 'avatars');

-- Política de subida autenticada
create policy "Authenticated upload"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'avatars');

