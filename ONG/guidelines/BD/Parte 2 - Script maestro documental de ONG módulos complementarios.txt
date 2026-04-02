-- =============================================================================
-- SCRIPT MAESTRO DOCUMENTAL
-- PARTE 2: ONG + MÓDULOS COMPLEMENTARIOS
-- Consolidado documental basado en:
--   - ONG - script - 3 - MODULOS-FIN
--   - Refacciones del script SUBS
--   - Arquitectura modular multi-tenant
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. ESQUEMA ONG
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS ong;
SET search_path = ong, public;

-- =============================================================================
-- 2. CATÁLOGOS GLOBALES DEL MÓDULO ONG
-- =============================================================================
CREATE TABLE IF NOT EXISTS ong.estados_voluntario (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre_estado VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  orden_visual INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ong.unidades_medida (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  abreviatura VARCHAR(20) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ong.estados_objeto (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE,
  descripcion TEXT NULL
);

CREATE TABLE IF NOT EXISTS ong.estados_proyecto (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre_estado VARCHAR(100) NOT NULL UNIQUE,
  orden_visual INT NOT NULL DEFAULT 0
);

-- =============================================================================
-- 3. CONFIGURACIÓN ONG
-- =============================================================================
CREATE TABLE IF NOT EXISTS ong.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nombre_area VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  CONSTRAINT uq_ong_areas_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_areas_tenant_nombre UNIQUE (tenant_id, nombre_area)
);

CREATE TABLE IF NOT EXISTS ong.ubicaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nombre_ubicacion VARCHAR(255) NOT NULL,
  direccion TEXT NOT NULL DEFAULT 'Sin dirección',
  latitud NUMERIC(10,7) NULL,
  longitud NUMERIC(10,7) NULL,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  imagen_url TEXT NULL,
  codigo_pais VARCHAR(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  CONSTRAINT uq_ong_ubicaciones_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_ubicaciones_tenant_nombre UNIQUE (tenant_id, nombre_ubicacion)
);

-- =============================================================================
-- 4. ENTIDADES PRINCIPALES ONG
-- =============================================================================
CREATE TABLE IF NOT EXISTS ong.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo VARCHAR(100) NOT NULL,
  nombre_item VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  codigo_unidad_medida VARCHAR(50) NOT NULL REFERENCES ong.unidades_medida(codigo),
  codigo_estado_objeto VARCHAR(50) NOT NULL REFERENCES ong.estados_objeto(codigo),
  sku VARCHAR(100) NULL,
  imagen_url TEXT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_items_tenant_codigo UNIQUE (tenant_id, codigo),
  CONSTRAINT uq_ong_items_tenant_nombre UNIQUE (tenant_id, nombre_item)
);

CREATE TABLE IF NOT EXISTS ong.voluntarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  iam_user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  numero_documento VARCHAR(50) NOT NULL,
  tipo_documento VARCHAR(10) REFERENCES public.cat_tipos_documento(codigo),
  genero VARCHAR(10) REFERENCES public.cat_generos(codigo),
  codigo_pais VARCHAR(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE NULL,
  email VARCHAR(255) NULL CHECK (email IS NULL OR position('@' IN email) > 1),
  telefono VARCHAR(50) NULL,
  ruta_foto TEXT NULL,
  codigo_estado VARCHAR(50) NOT NULL REFERENCES ong.estados_voluntario(codigo),
  observaciones TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_voluntarios_tenant_tipo_numdoc UNIQUE (tenant_id, tipo_documento, numero_documento),
  CONSTRAINT uq_ong_voluntarios_tenant_email UNIQUE (tenant_id, email)
);

CREATE TABLE IF NOT EXISTS ong.beneficiarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  numero_documento VARCHAR(50) NULL,
  tipo_documento VARCHAR(10) REFERENCES public.cat_tipos_documento(codigo),
  codigo_pais VARCHAR(2) DEFAULT 'PE' REFERENCES public.cat_paises(codigo),
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE NULL,
  genero VARCHAR(10) NULL REFERENCES public.cat_generos(codigo),
  telefono VARCHAR(50) NULL,
  direccion TEXT NULL,
  foto_url TEXT NULL,
  observaciones TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_beneficiarios_tenant_tipo_numdoc UNIQUE (tenant_id, tipo_documento, numero_documento)
);

CREATE TABLE IF NOT EXISTS ong.proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  codigo VARCHAR(50) NOT NULL,
  nombre_proyecto VARCHAR(255) NOT NULL,
  descripcion TEXT NOT NULL,
  fecha_inicio DATE NULL,
  fecha_fin DATE NULL,
  id_area UUID NOT NULL REFERENCES ong.areas(id),
  codigo_estado VARCHAR(50) NOT NULL REFERENCES ong.estados_proyecto(codigo),
  presupuesto NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (presupuesto >= 0),
  imagen_url TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT uq_ong_proyectos_tenant_codigo UNIQUE (tenant_id, codigo)
);

-- =============================================================================
-- 5. EJECUCIÓN DE PROYECTOS ONG
-- =============================================================================
CREATE TABLE IF NOT EXISTS ong.tareas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto UUID NOT NULL REFERENCES ong.proyectos(id),
  titulo VARCHAR(200) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(50) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')),
  fecha_limite DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.actividades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_tarea UUID NOT NULL REFERENCES ong.tareas(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  horas_estimadas NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.horas_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad UUID NOT NULL REFERENCES ong.actividades(id),
  id_voluntario UUID NOT NULL,
  horas_registradas NUMERIC(5,2) NOT NULL CHECK (horas_registradas > 0),
  fecha DATE NOT NULL,
  estado_aprobacion VARCHAR(50) DEFAULT 'pendiente'
    CHECK (estado_aprobacion IN ('pendiente', 'aprobada', 'rechazada')),
  aprobado_por UUID NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.asignaciones_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad UUID NOT NULL REFERENCES ong.actividades(id),
  id_voluntario UUID NOT NULL,
  rol_en_actividad VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.evidencias_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad UUID NOT NULL REFERENCES ong.actividades(id),
  id_voluntario UUID NOT NULL,
  url_archivo TEXT NOT NULL,
  tipo_evidencia VARCHAR(50) DEFAULT 'foto',
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.recursos_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto UUID NOT NULL REFERENCES ong.proyectos(id),
  id_item UUID NOT NULL REFERENCES ong.items(id),
  cantidad_requerida NUMERIC(10,2) NOT NULL,
  cantidad_asignada NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.asignaciones_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto UUID NOT NULL REFERENCES ong.proyectos(id),
  id_voluntario UUID NOT NULL,
  rol_en_proyecto VARCHAR(100),
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.participaciones_proyecto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto UUID NOT NULL REFERENCES ong.proyectos(id),
  id_beneficiario UUID NOT NULL,
  observaciones TEXT,
  fecha_vinculacion DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.activity_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_actividad UUID NOT NULL REFERENCES ong.actividades(id),
  descripcion_requisito TEXT NOT NULL,
  es_obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.logros_beneficiario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_beneficiario UUID NOT NULL,
  titulo_logro VARCHAR(200) NOT NULL,
  fecha_logro DATE NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS ong.supervisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_proyecto UUID NOT NULL,
  supervisor_id UUID NOT NULL,
  fecha_asignacion DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

-- =============================================================================
-- 6. INVENTARIO ONG
-- =============================================================================
CREATE TABLE IF NOT EXISTS ong.tipo_transaccion_inventario (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  signo INT NOT NULL CHECK (signo IN (1, -1, 0))
);

CREATE TABLE IF NOT EXISTS ong.transacciones_inventario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  id_item UUID NOT NULL REFERENCES ong.items(id),
  codigo_tipo_transaccion VARCHAR(50) NOT NULL REFERENCES ong.tipo_transaccion_inventario(codigo),
  cantidad NUMERIC(10,2) NOT NULL CHECK (cantidad > 0),
  id_ubicacion_origen UUID NULL REFERENCES ong.ubicaciones(id),
  id_ubicacion_destino UUID NULL REFERENCES ong.ubicaciones(id),
  fecha_transaccion TIMESTAMPTZ DEFAULT now(),
  registrado_por UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

-- =============================================================================
-- 7. ÍNDICES ONG
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_ong_areas_tenant ON ong.areas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_ubic_tenant ON ong.ubicaciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_items_tenant ON ong.items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_voluntarios_tenant ON ong.voluntarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_benef_tenant ON ong.beneficiarios(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_proyectos_tenant ON ong.proyectos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_tareas_tenant ON ong.tareas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant ON ong.actividades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_horas_actividad_tenant ON ong.horas_actividad(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_asignaciones_actividad_tenant ON ong.asignaciones_actividad(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_participaciones_proyecto_tenant ON ong.participaciones_proyecto(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ong_transacciones_inventario_tenant ON ong.transacciones_inventario(tenant_id);

-- =============================================================================
-- 8. RLS ONG
-- =============================================================================
ALTER TABLE ong.estados_voluntario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.unidades_medida ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.estados_objeto ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.estados_proyecto ENABLE ROW LEVEL SECURITY;

ALTER TABLE ong.areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.beneficiarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.tareas ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.actividades ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.horas_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.asignaciones_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.evidencias_actividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.recursos_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.asignaciones_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.participaciones_proyecto ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.activity_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.logros_beneficiario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.supervisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.tipo_transaccion_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE ong.transacciones_inventario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_ong_cat_vol_select ON ong.estados_voluntario;
CREATE POLICY p_ong_cat_vol_select ON ong.estados_voluntario
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_ong_cat_med_select ON ong.unidades_medida;
CREATE POLICY p_ong_cat_med_select ON ong.unidades_medida
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_ong_cat_obj_select ON ong.estados_objeto;
CREATE POLICY p_ong_cat_obj_select ON ong.estados_objeto
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_ong_cat_proy_select ON ong.estados_proyecto;
CREATE POLICY p_ong_cat_proy_select ON ong.estados_proyecto
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_ong_tipo_transaccion_inventario_select ON ong.tipo_transaccion_inventario;
CREATE POLICY p_ong_tipo_transaccion_inventario_select ON ong.tipo_transaccion_inventario
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_ong_areas_all ON ong.areas;
CREATE POLICY p_ong_areas_all ON ong.areas
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_ubicaciones_all ON ong.ubicaciones;
CREATE POLICY p_ong_ubicaciones_all ON ong.ubicaciones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_items_all ON ong.items;
CREATE POLICY p_ong_items_all ON ong.items
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_voluntarios_all ON ong.voluntarios;
CREATE POLICY p_ong_voluntarios_all ON ong.voluntarios
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_beneficiarios_all ON ong.beneficiarios;
CREATE POLICY p_ong_beneficiarios_all ON ong.beneficiarios
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_proyectos_all ON ong.proyectos;
CREATE POLICY p_ong_proyectos_all ON ong.proyectos
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_tareas_all ON ong.tareas;
CREATE POLICY p_ong_tareas_all ON ong.tareas
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_actividades_all ON ong.actividades;
CREATE POLICY p_ong_actividades_all ON ong.actividades
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_horas_actividad_all ON ong.horas_actividad;
CREATE POLICY p_ong_horas_actividad_all ON ong.horas_actividad
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_asignaciones_actividad_all ON ong.asignaciones_actividad;
CREATE POLICY p_ong_asignaciones_actividad_all ON ong.asignaciones_actividad
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_evidencias_actividad_all ON ong.evidencias_actividad;
CREATE POLICY p_ong_evidencias_actividad_all ON ong.evidencias_actividad
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_recursos_proyecto_all ON ong.recursos_proyecto;
CREATE POLICY p_ong_recursos_proyecto_all ON ong.recursos_proyecto
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_asignaciones_proyecto_all ON ong.asignaciones_proyecto;
CREATE POLICY p_ong_asignaciones_proyecto_all ON ong.asignaciones_proyecto
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_participaciones_proyecto_all ON ong.participaciones_proyecto;
CREATE POLICY p_ong_participaciones_proyecto_all ON ong.participaciones_proyecto
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_activity_requirements_all ON ong.activity_requirements;
CREATE POLICY p_ong_activity_requirements_all ON ong.activity_requirements
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_logros_beneficiario_all ON ong.logros_beneficiario;
CREATE POLICY p_ong_logros_beneficiario_all ON ong.logros_beneficiario
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_supervisiones_all ON ong.supervisiones;
CREATE POLICY p_ong_supervisiones_all ON ong.supervisiones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_ong_transacciones_inventario_all ON ong.transacciones_inventario;
CREATE POLICY p_ong_transacciones_inventario_all ON ong.transacciones_inventario
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

-- =============================================================================
-- 9. SEEDS ONG
-- =============================================================================
INSERT INTO ong.estados_voluntario (codigo, nombre_estado, orden_visual) VALUES
  ('activo', 'Activo', 1),
  ('inactivo', 'Inactivo', 2),
  ('suspendido', 'Suspendido', 3)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ong.unidades_medida (codigo, nombre, abreviatura) VALUES
  ('unidad', 'Unidad', 'und'),
  ('caja', 'Caja', 'cja'),
  ('kg', 'Kilogramo', 'kg'),
  ('litro', 'Litro', 'L')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ong.estados_objeto (codigo, nombre, descripcion) VALUES
  ('nuevo', 'Nuevo', 'Sin uso previo'),
  ('usado', 'Usado', 'Operativo pero usado'),
  ('danado', 'Dañado', 'Requiere atención')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ong.estados_proyecto (codigo, nombre_estado, orden_visual) VALUES
  ('planificacion', 'En Planificación', 1),
  ('ejecucion', 'En Ejecución', 2),
  ('completado', 'Completado', 3),
  ('cancelado', 'Cancelado', 4)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO ong.tipo_transaccion_inventario (codigo, nombre, signo) VALUES
  ('ingreso_donacion', 'Ingreso por Donación', 1),
  ('salida_proyecto', 'Salida para Proyecto', -1),
  ('merma', 'Pérdida/Merma', -1)
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

-- =============================================================================
-- 10. ESQUEMA FINANZAS
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS finanzas;
SET search_path = finanzas, public;

CREATE TABLE IF NOT EXISTS finanzas.cuentas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_cuenta VARCHAR(100) NOT NULL,
  tipo_cuenta VARCHAR(50) NOT NULL CHECK (tipo_cuenta IN ('banco', 'caja_chica', 'pasarela')),
  moneda VARCHAR(3) NOT NULL DEFAULT 'USD' REFERENCES public.cat_monedas(codigo),
  saldo_actual NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS finanzas.categorias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre VARCHAR(100) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS finanzas.transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_cuenta UUID NOT NULL REFERENCES finanzas.cuentas(id),
  id_categoria UUID NOT NULL REFERENCES finanzas.categorias(id),
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha_transaccion DATE NOT NULL DEFAULT CURRENT_DATE,
  descripcion TEXT,
  comprobante_url TEXT,
  id_proyecto UUID NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS finanzas.comprobantes_financieros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_transaccion UUID NOT NULL REFERENCES finanzas.transacciones(id),
  tipo_comprobante VARCHAR(50) NOT NULL,
  numero_comprobante VARCHAR(100) NOT NULL,
  emisor_ruc_dni VARCHAR(50),
  emisor_nombre VARCHAR(200),
  url_archivo TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE finanzas.cuentas ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.comprobantes_financieros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_fin_cuentas_all ON finanzas.cuentas;
CREATE POLICY p_fin_cuentas_all ON finanzas.cuentas
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_fin_categorias_all ON finanzas.categorias;
CREATE POLICY p_fin_categorias_all ON finanzas.categorias
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_fin_transacciones_all ON finanzas.transacciones;
CREATE POLICY p_fin_transacciones_all ON finanzas.transacciones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_fin_comprobantes_all ON finanzas.comprobantes_financieros;
CREATE POLICY p_fin_comprobantes_all ON finanzas.comprobantes_financieros
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

CREATE INDEX IF NOT EXISTS idx_fin_cuentas_tenant ON finanzas.cuentas(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_categorias_tenant ON finanzas.categorias(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_transacciones_tenant ON finanzas.transacciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fin_comprobantes_tenant ON finanzas.comprobantes_financieros(tenant_id);

COMMIT;

-- =============================================================================
-- 11. ESQUEMA DONACIONES
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS donaciones;
SET search_path = donaciones, public;

CREATE TABLE IF NOT EXISTS donaciones.donantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150),
  email VARCHAR(255),
  telefono VARCHAR(50),
  tipo_donante VARCHAR(50) DEFAULT 'individual'
    CHECK (tipo_donante IN ('individual', 'corporativo', 'fundacion')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS donaciones.campanas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre VARCHAR(200) NOT NULL,
  meta_recaudacion NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  estado VARCHAR(50) DEFAULT 'activa'
    CHECK (estado IN ('planificada', 'activa', 'finalizada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS donaciones.ingresos_donacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante UUID NOT NULL REFERENCES donaciones.donantes(id),
  id_campana UUID NULL REFERENCES donaciones.campanas(id),
  monto NUMERIC(15,2) NOT NULL CHECK (monto > 0),
  fecha_donacion DATE NOT NULL DEFAULT CURRENT_DATE,
  metodo_pago VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS donaciones.donor_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante UUID NOT NULL REFERENCES donaciones.donantes(id),
  tipo_interaccion VARCHAR(50) CHECK (tipo_interaccion IN ('llamada', 'email', 'reunion', 'evento')),
  notas TEXT NOT NULL,
  fecha_interaccion TIMESTAMPTZ DEFAULT now(),
  realizado_por UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS donaciones.donor_pledges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_donante UUID NOT NULL REFERENCES donaciones.donantes(id),
  id_campana UUID NULL REFERENCES donaciones.campanas(id),
  monto_prometido NUMERIC(15,2) NOT NULL,
  fecha_promesa DATE NOT NULL,
  fecha_esperada_pago DATE,
  estado VARCHAR(50) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'cumplida', 'cancelada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE donaciones.donantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones.campanas ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones.ingresos_donacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones.donor_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE donaciones.donor_pledges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_don_donantes_all ON donaciones.donantes;
CREATE POLICY p_don_donantes_all ON donaciones.donantes
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_don_campanas_all ON donaciones.campanas;
CREATE POLICY p_don_campanas_all ON donaciones.campanas
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_don_ingresos_all ON donaciones.ingresos_donacion;
CREATE POLICY p_don_ingresos_all ON donaciones.ingresos_donacion
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_don_interactions_all ON donaciones.donor_interactions;
CREATE POLICY p_don_interactions_all ON donaciones.donor_interactions
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_don_pledges_all ON donaciones.donor_pledges;
CREATE POLICY p_don_pledges_all ON donaciones.donor_pledges
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;

-- =============================================================================
-- 12. ESQUEMA RRHH
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS rrhh;
SET search_path = rrhh, public;

CREATE TABLE IF NOT EXISTS rrhh.solicitudes_admision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombres VARCHAR(150) NOT NULL,
  apellidos VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL,
  estado VARCHAR(50) DEFAULT 'nueva'
    CHECK (estado IN ('nueva', 'en_entrevista', 'aprobada', 'rechazada')),
  fecha_solicitud TIMESTAMPTZ DEFAULT now(),
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.documentos_admision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud UUID NOT NULL REFERENCES rrhh.solicitudes_admision(id) ON DELETE CASCADE,
  tipo_documento VARCHAR(50) NOT NULL,
  archivo_url TEXT NOT NULL,
  verificado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.habilidades (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS rrhh.voluntario_habilidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  codigo_habilidad VARCHAR(50) NOT NULL REFERENCES rrhh.habilidades(codigo),
  nivel VARCHAR(50) CHECK (nivel IN ('basico', 'intermedio', 'avanzado', 'experto')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.volunteer_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL UNIQUE,
  disponibilidad_json JSONB,
  distancia_max_km INT,
  quiere_viajar BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.documentos_voluntario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  tipo_documento VARCHAR(50) NOT NULL,
  url_archivo TEXT NOT NULL,
  fecha_vencimiento DATE,
  vigente BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.entrevistas_admision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud UUID NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  entrevistador_id UUID NOT NULL,
  fecha_entrevista TIMESTAMPTZ NOT NULL,
  comentarios TEXT,
  resultado VARCHAR(50) CHECK (resultado IN ('apto', 'no_apto', 'pendiente')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.onboarding_pasos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_paso VARCHAR(100) NOT NULL,
  orden INT NOT NULL,
  obligatorio BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.onboarding_voluntario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  id_paso UUID NOT NULL REFERENCES rrhh.onboarding_pasos(id),
  completado BOOLEAN DEFAULT false,
  fecha_completado TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.admission_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_requisito VARCHAR(200) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.admission_requirement_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud UUID NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  id_requisito UUID NOT NULL REFERENCES rrhh.admission_requirements(id),
  estado VARCHAR(50) DEFAULT 'pendiente',
  revisado_por UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.admision_estado_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_solicitud UUID NOT NULL REFERENCES rrhh.solicitudes_admision(id),
  estado_anterior VARCHAR(50),
  estado_nuevo VARCHAR(50) NOT NULL,
  comentario TEXT,
  cambiado_por UUID NOT NULL,
  fecha_cambio TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rrhh.roles_operativos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_rol VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.asignaciones_rol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  id_rol_operativo UUID NOT NULL REFERENCES rrhh.roles_operativos(id),
  fecha_asignacion DATE DEFAULT CURRENT_DATE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS rrhh.perfil_coordinador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL UNIQUE,
  anios_experiencia INT DEFAULT 0,
  departamento_asignado VARCHAR(150),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE rrhh.habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.solicitudes_admision ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.documentos_admision ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.voluntario_habilidades ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.volunteer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.documentos_voluntario ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.entrevistas_admision ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.onboarding_pasos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.onboarding_voluntario ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.admission_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.admission_requirement_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.admision_estado_historial ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.roles_operativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.asignaciones_rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE rrhh.perfil_coordinador ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_rrhh_habilidades_select ON rrhh.habilidades;
CREATE POLICY p_rrhh_habilidades_select ON rrhh.habilidades
FOR SELECT TO authenticated USING (true);

-- Tenant policies RRHH
DROP POLICY IF EXISTS p_rrhh_solicitudes_all ON rrhh.solicitudes_admision;
CREATE POLICY p_rrhh_solicitudes_all ON rrhh.solicitudes_admision
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_documentos_admision_all ON rrhh.documentos_admision;
CREATE POLICY p_rrhh_documentos_admision_all ON rrhh.documentos_admision
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_voluntario_habilidades_all ON rrhh.voluntario_habilidades;
CREATE POLICY p_rrhh_voluntario_habilidades_all ON rrhh.voluntario_habilidades
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_volunteer_preferences_all ON rrhh.volunteer_preferences;
CREATE POLICY p_rrhh_volunteer_preferences_all ON rrhh.volunteer_preferences
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_documentos_voluntario_all ON rrhh.documentos_voluntario;
CREATE POLICY p_rrhh_documentos_voluntario_all ON rrhh.documentos_voluntario
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_entrevistas_all ON rrhh.entrevistas_admision;
CREATE POLICY p_rrhh_entrevistas_all ON rrhh.entrevistas_admision
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_onboarding_pasos_all ON rrhh.onboarding_pasos;
CREATE POLICY p_rrhh_onboarding_pasos_all ON rrhh.onboarding_pasos
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_onboarding_voluntario_all ON rrhh.onboarding_voluntario;
CREATE POLICY p_rrhh_onboarding_voluntario_all ON rrhh.onboarding_voluntario
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_admission_requirements_all ON rrhh.admission_requirements;
CREATE POLICY p_rrhh_admission_requirements_all ON rrhh.admission_requirements
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_admission_requirement_reviews_all ON rrhh.admission_requirement_reviews;
CREATE POLICY p_rrhh_admission_requirement_reviews_all ON rrhh.admission_requirement_reviews
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_admision_estado_historial_all ON rrhh.admision_estado_historial;
CREATE POLICY p_rrhh_admision_estado_historial_all ON rrhh.admision_estado_historial
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_roles_operativos_all ON rrhh.roles_operativos;
CREATE POLICY p_rrhh_roles_operativos_all ON rrhh.roles_operativos
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_asignaciones_rol_all ON rrhh.asignaciones_rol;
CREATE POLICY p_rrhh_asignaciones_rol_all ON rrhh.asignaciones_rol
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_rrhh_perfil_coordinador_all ON rrhh.perfil_coordinador;
CREATE POLICY p_rrhh_perfil_coordinador_all ON rrhh.perfil_coordinador
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;

-- =============================================================================
-- 13. ESQUEMA CLINICO
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS clinico;
SET search_path = clinico, public;

CREATE TABLE IF NOT EXISTS clinico.fichas_medicas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario UUID NOT NULL,
  tipos_sangre VARCHAR(10),
  alergias TEXT,
  condiciones_preexistentes TEXT,
  medicacion_actual TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS clinico.accesos_sensibles_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_ficha UUID NOT NULL REFERENCES clinico.fichas_medicas(id),
  usuario_id UUID NOT NULL,
  motivo TEXT,
  fecha_acceso TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clinico.perfil_nino (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario UUID NOT NULL UNIQUE,
  nombre_tutor VARCHAR(200) NOT NULL,
  telefono_tutor VARCHAR(50),
  colegio VARCHAR(200),
  grado_escolar VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS clinico.perfil_adulto_mayor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_beneficiario UUID NOT NULL UNIQUE,
  movilidad_reducida BOOLEAN DEFAULT false,
  vive_solo BOOLEAN DEFAULT false,
  contacto_emergencia VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS clinico.ficha_sensible_voluntario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL UNIQUE,
  condiciones_medicas TEXT,
  contacto_emergencia VARCHAR(200),
  telefono_emergencia VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE clinico.fichas_medicas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.accesos_sensibles_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.perfil_nino ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.perfil_adulto_mayor ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinico.ficha_sensible_voluntario ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_clinico_fichas_medicas_all ON clinico.fichas_medicas;
CREATE POLICY p_clinico_fichas_medicas_all ON clinico.fichas_medicas
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_clinico_accesos_sensibles_log_all ON clinico.accesos_sensibles_log;
CREATE POLICY p_clinico_accesos_sensibles_log_all ON clinico.accesos_sensibles_log
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_clinico_perfil_nino_all ON clinico.perfil_nino;
CREATE POLICY p_clinico_perfil_nino_all ON clinico.perfil_nino
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_clinico_perfil_adulto_mayor_all ON clinico.perfil_adulto_mayor;
CREATE POLICY p_clinico_perfil_adulto_mayor_all ON clinico.perfil_adulto_mayor
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_clinico_ficha_sensible_voluntario_all ON clinico.ficha_sensible_voluntario;
CREATE POLICY p_clinico_ficha_sensible_voluntario_all ON clinico.ficha_sensible_voluntario
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;

-- =============================================================================
-- 14. ESQUEMA ACADEMICO
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS academico;
SET search_path = academico, public;

CREATE TABLE IF NOT EXISTS academico.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_curso VARCHAR(200) NOT NULL,
  descripcion TEXT,
  horas_certificacion INT DEFAULT 0,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS academico.inscripciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_curso UUID NOT NULL REFERENCES academico.cursos(id),
  id_voluntario UUID NOT NULL,
  estado VARCHAR(50) DEFAULT 'inscrito'
    CHECK (estado IN ('inscrito', 'aprobado', 'reprobado')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS academico.certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_inscripcion UUID NOT NULL REFERENCES academico.inscripciones(id),
  url_certificado TEXT NOT NULL,
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS academico.asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_inscripcion UUID NOT NULL REFERENCES academico.inscripciones(id),
  fecha_clase DATE NOT NULL,
  asistio BOOLEAN DEFAULT false,
  minutos_asistidos INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE academico.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE academico.inscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE academico.certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE academico.asistencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_aca_cursos_all ON academico.cursos;
CREATE POLICY p_aca_cursos_all ON academico.cursos
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_aca_inscripciones_all ON academico.inscripciones;
CREATE POLICY p_aca_inscripciones_all ON academico.inscripciones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_aca_certificados_all ON academico.certificados;
CREATE POLICY p_aca_certificados_all ON academico.certificados
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_aca_asistencias_all ON academico.asistencias;
CREATE POLICY p_aca_asistencias_all ON academico.asistencias
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;

-- =============================================================================
-- 15. ESQUEMA GAMIFICACION
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS gamificacion;
SET search_path = gamificacion, public;

CREATE TABLE IF NOT EXISTS gamificacion.insignias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  icono_url TEXT,
  puntos_requeridos INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.puntos_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  puntos_otorgados INT NOT NULL,
  motivo TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.volunteer_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_voluntario UUID NOT NULL,
  id_insignia UUID NOT NULL REFERENCES gamificacion.insignias(id),
  fecha_otorgamiento TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.gamification_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  evento_trigger VARCHAR(100) NOT NULL,
  puntos_a_otorgar INT NOT NULL,
  id_insignia_premio UUID NULL REFERENCES gamificacion.insignias(id),
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS gamificacion.kudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  emisor_id UUID NOT NULL,
  receptor_id UUID NOT NULL,
  mensaje TEXT NOT NULL,
  fecha TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE gamificacion.insignias ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacion.puntos_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacion.volunteer_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacion.gamification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamificacion.kudos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_gam_insignias_all ON gamificacion.insignias;
CREATE POLICY p_gam_insignias_all ON gamificacion.insignias
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_gam_puntos_ledger_all ON gamificacion.puntos_ledger;
CREATE POLICY p_gam_puntos_ledger_all ON gamificacion.puntos_ledger
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_gam_volunteer_badges_all ON gamificacion.volunteer_badges;
CREATE POLICY p_gam_volunteer_badges_all ON gamificacion.volunteer_badges
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_gam_rules_all ON gamificacion.gamification_rules;
CREATE POLICY p_gam_rules_all ON gamificacion.gamification_rules
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_gam_kudos_all ON gamificacion.kudos;
CREATE POLICY p_gam_kudos_all ON gamificacion.kudos
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;

-- =============================================================================
-- 16. ESQUEMA IMPACTO
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS impacto;
SET search_path = impacto, public;

CREATE TABLE IF NOT EXISTS impacto.ods_globales (
  ods_numero INT PRIMARY KEY CHECK (ods_numero BETWEEN 1 AND 17),
  nombre VARCHAR(200) NOT NULL,
  descripcion TEXT
);

CREATE TABLE IF NOT EXISTS impacto.kpi_indicadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  nombre_kpi VARCHAR(200) NOT NULL,
  unidad_medida VARCHAR(50),
  meta_anual NUMERIC(15,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS impacto.kpi_mediciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_kpi UUID NOT NULL REFERENCES impacto.kpi_indicadores(id),
  valor_medido NUMERIC(15,2) NOT NULL,
  fecha_medicion DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS impacto.project_ods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_proyecto UUID NOT NULL,
  ods_numero INT NOT NULL REFERENCES impacto.ods_globales(ods_numero),
  impacto_esperado TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS impacto.kpi_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_kpi UUID NOT NULL REFERENCES impacto.kpi_indicadores(id),
  periodo VARCHAR(50) NOT NULL,
  valor_meta NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

ALTER TABLE impacto.ods_globales ENABLE ROW LEVEL SECURITY;
ALTER TABLE impacto.kpi_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE impacto.kpi_mediciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE impacto.project_ods ENABLE ROW LEVEL SECURITY;
ALTER TABLE impacto.kpi_targets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_imp_ods_select ON impacto.ods_globales;
CREATE POLICY p_imp_ods_select ON impacto.ods_globales
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_imp_kpi_indicadores_all ON impacto.kpi_indicadores;
CREATE POLICY p_imp_kpi_indicadores_all ON impacto.kpi_indicadores
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_imp_kpi_mediciones_all ON impacto.kpi_mediciones;
CREATE POLICY p_imp_kpi_mediciones_all ON impacto.kpi_mediciones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_imp_project_ods_all ON impacto.project_ods;
CREATE POLICY p_imp_project_ods_all ON impacto.project_ods
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_imp_kpi_targets_all ON impacto.kpi_targets;
CREATE POLICY p_imp_kpi_targets_all ON impacto.kpi_targets
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

INSERT INTO impacto.ods_globales (ods_numero, nombre) VALUES
  (1, 'Fin de la pobreza'),
  (2, 'Hambre cero'),
  (3, 'Salud y bienestar'),
  (4, 'Educación de calidad')
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- 17. ESQUEMA COMUNICACIONES
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS comunicaciones;
SET search_path = comunicaciones, public;

CREATE TABLE IF NOT EXISTS comunicaciones.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_usuario UUID NOT NULL,
  device_token TEXT NOT NULL,
  plataforma VARCHAR(50) CHECK (plataforma IN ('ios', 'android', 'web')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.historial_notificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  id_usuario UUID NOT NULL,
  titulo VARCHAR(200) NOT NULL,
  mensaje TEXT NOT NULL,
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  entidad VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  accion VARCHAR(20) CHECK (accion IN ('INSERT', 'UPDATE', 'DELETE')),
  estado VARCHAR(50) DEFAULT 'pendiente'
    CHECK (estado IN ('pendiente', 'procesado', 'error')),
  client_timestamp TIMESTAMPTZ NOT NULL,
  server_received_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.canales_notificacion (
  codigo VARCHAR(50) PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.plantillas_notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  codigo_canal VARCHAR(50) NOT NULL REFERENCES comunicaciones.canales_notificacion(codigo),
  nombre_plantilla VARCHAR(150) NOT NULL,
  asunto TEXT,
  cuerpo_html TEXT,
  cuerpo_texto TEXT,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL
);

CREATE TABLE IF NOT EXISTS comunicaciones.entity_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  entidad VARCHAR(100) NOT NULL,
  registro_id UUID NOT NULL,
  version BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID NULL,
  updated_by UUID NULL,
  UNIQUE (tenant_id, entidad, registro_id)
);

ALTER TABLE comunicaciones.user_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones.historial_notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones.sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones.canales_notificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones.plantillas_notificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE comunicaciones.entity_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_com_canales_select ON comunicaciones.canales_notificacion;
CREATE POLICY p_com_canales_select ON comunicaciones.canales_notificacion
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_com_user_devices_all ON comunicaciones.user_devices;
CREATE POLICY p_com_user_devices_all ON comunicaciones.user_devices
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_com_historial_all ON comunicaciones.historial_notificaciones;
CREATE POLICY p_com_historial_all ON comunicaciones.historial_notificaciones
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_com_sync_queue_all ON comunicaciones.sync_queue;
CREATE POLICY p_com_sync_queue_all ON comunicaciones.sync_queue
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_com_plantillas_all ON comunicaciones.plantillas_notificacion;
CREATE POLICY p_com_plantillas_all ON comunicaciones.plantillas_notificacion
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

DROP POLICY IF EXISTS p_com_entity_versions_all ON comunicaciones.entity_versions;
CREATE POLICY p_com_entity_versions_all ON comunicaciones.entity_versions
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

INSERT INTO comunicaciones.canales_notificacion (codigo, nombre) VALUES
  ('email', 'Correo Electrónico'),
  ('push', 'Push App Móvil'),
  ('sms', 'Mensaje de Texto SMS')
ON CONFLICT DO NOTHING;

COMMIT;

-- =============================================================================
-- 18. ESQUEMA AUDITORIA
-- =============================================================================
BEGIN;
CREATE SCHEMA IF NOT EXISTS auditoria;
SET search_path = auditoria, public;

CREATE TABLE IF NOT EXISTS auditoria.audit_log (
  id_audit UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT public.fn_current_tenant_id(),
  table_name TEXT NOT NULL,
  record_pk TEXT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT','UPDATE','DELETE')),
  before_json JSONB NULL,
  after_json JSONB NULL,
  auth_user_id UUID NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip INET NULL,
  user_agent TEXT NULL,
  correlation_id UUID NULL,
  source TEXT NOT NULL DEFAULT 'trigger'
);

ALTER TABLE auditoria.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS p_aud_audit_log_all ON auditoria.audit_log;
CREATE POLICY p_aud_audit_log_all ON auditoria.audit_log
FOR ALL TO authenticated
USING (tenant_id = public.fn_current_tenant_id())
WITH CHECK (tenant_id = public.fn_current_tenant_id());

COMMIT;