-- ==============================================================================
-- Migración EDUCACION OS: Esquema Core Multi-Tenant con Schemas Estrictos
-- ==============================================================================

-- 1. CREACIÓN DE SCHEMAS
CREATE SCHEMA IF NOT EXISTS core;
CREATE SCHEMA IF NOT EXISTS educa;
CREATE SCHEMA IF NOT EXISTS finanzas;
CREATE SCHEMA IF NOT EXISTS identidad;
CREATE SCHEMA IF NOT EXISTS ia;

-- ==============================================================================
-- DOMINIO: CORE (Base del Sistema)
-- ==============================================================================
CREATE TABLE core.institutos (
    instituto_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    dominio VARCHAR(100) UNIQUE,
    configuracion_json JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.roles (
    rol_id VARCHAR(50) PRIMARY KEY,
    descripcion VARCHAR(150),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    permisos_json JSONB
);

CREATE TABLE core.usuarios (
    usuario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    rol_id VARCHAR(50) NOT NULL REFERENCES core.roles(rol_id),
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    auth_provider_id VARCHAR(255),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.estudiantes (
    estudiante_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    usuario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    matricula_codigo VARCHAR(50) UNIQUE NOT NULL,
    grado_actual VARCHAR(20)
);

CREATE TABLE core.profesores (
    profesor_id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    usuario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    especialidad VARCHAR(100)
);

CREATE TABLE core.referrals_conversiones (
    referral_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    referidor_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    referido_email VARCHAR(150) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PENDIENTE',
    recompensa_entregada BOOLEAN DEFAULT FALSE,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE core.audit_trail_immutable_logs (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    usuario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    accion VARCHAR(100) NOT NULL,
    payload_json JSONB NOT NULL,
    hash_sha256 VARCHAR(255) NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMINIO: EDUCA (Gestión Académica)
-- ==============================================================================
CREATE TABLE educa.cursos (
    curso_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    creditos INT DEFAULT 1
);

CREATE TABLE educa.lecciones (
    leccion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    curso_id UUID NOT NULL REFERENCES educa.cursos(curso_id),
    titulo VARCHAR(150) NOT NULL,
    contenido_url VARCHAR(255),
    orden INT NOT NULL
);

CREATE TABLE educa.secciones (
    seccion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    curso_id UUID NOT NULL REFERENCES educa.cursos(curso_id),
    profesor_id UUID NOT NULL REFERENCES core.profesores(profesor_id),
    periodo_academico VARCHAR(50) NOT NULL,
    cupo_maximo INT NOT NULL
);

CREATE TABLE educa.horarios (
    horario_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    seccion_id UUID NOT NULL REFERENCES educa.secciones(seccion_id),
    dia_semana VARCHAR(15) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    salon VARCHAR(50)
);

CREATE TABLE educa.planes_matricula (
    matricula_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    seccion_id UUID NOT NULL REFERENCES educa.secciones(seccion_id),
    estado VARCHAR(50) DEFAULT 'ACTIVO'
);

CREATE TABLE educa.calificaciones (
    calificacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    leccion_id UUID NOT NULL REFERENCES educa.lecciones(leccion_id),
    nota DECIMAL(5,2) NOT NULL,
    feedback TEXT,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.gamificacion (
    gamificacion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    puntos_xp INT DEFAULT 0,
    nivel INT DEFAULT 1,
    medallas_json JSONB,
    ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.documentos (
    documento_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    propietario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    tipo_documento VARCHAR(50) NOT NULL,
    url_archivo VARCHAR(255) NOT NULL,
    firma_digital_hash VARCHAR(255)
);

CREATE TABLE educa.compartidos_logros (
    compartido_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    usuario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    gamificacion_id UUID NOT NULL REFERENCES educa.gamificacion(gamificacion_id),
    red_social VARCHAR(50) NOT NULL,
    url_publicacion VARCHAR(255),
    fecha_compartido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.virtual_lab_simulations (
    simulation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    laboratorio_tipo VARCHAR(100) NOT NULL,
    inputs_json JSONB NOT NULL,
    resultado_obtenido DECIMAL(5,2) NOT NULL,
    fecha_simulacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.attendance_dynamic_qrs (
    qr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    hmac_hash VARCHAR(255) NOT NULL,
    latitud DECIMAL(10,8) NOT NULL,
    longitud DECIMAL(11,8) NOT NULL,
    distancia_metros DECIMAL(8,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'PRESENTE',
    fecha_marcado TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMINIO: FINANZAS
-- ==============================================================================
CREATE TABLE finanzas.pagos (
    pago_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    usuario_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    monto DECIMAL(10,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    estado VARCHAR(20) DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP
);

CREATE TABLE finanzas.marketplace_productos (
    producto_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    vendedor_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    nombre_producto VARCHAR(150) NOT NULL,
    precio DECIMAL(10,2) NOT NULL,
    stock INT DEFAULT 0
);

-- ==============================================================================
-- DOMINIO: IDENTIDAD
-- ==============================================================================
CREATE TABLE identidad.pasaportes_digitales (
    pasaporte_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID UNIQUE NOT NULL REFERENCES core.estudiantes(estudiante_id),
    blockchain_tx_hash VARCHAR(255),
    habilidades_validadas_json JSONB,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- DOMINIO: IA
-- ==============================================================================
CREATE TABLE ia.agentes_ia_ejecuciones (
    ejecucion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    solicitante_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    tipo_agente VARCHAR(50) NOT NULL,
    prompt_json JSONB NOT NULL,
    resultado_json JSONB,
    tiempo_ejecucion_ms INT,
    fecha_ejecucion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==============================================================================
-- HABILITACIÓN ROW LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE core.institutos ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.estudiantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.profesores ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.referrals_conversiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE core.audit_trail_immutable_logs ENABLE ROW LEVEL SECURITY;

ALTER TABLE educa.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.lecciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.secciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.horarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.planes_matricula ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.gamificacion ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.compartidos_logros ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.virtual_lab_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.attendance_dynamic_qrs ENABLE ROW LEVEL SECURITY;

ALTER TABLE finanzas.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.marketplace_productos ENABLE ROW LEVEL SECURITY;

ALTER TABLE identidad.pasaportes_digitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ia.agentes_ia_ejecuciones ENABLE ROW LEVEL SECURITY;


-- ==============================================================================
-- POLÍTICAS DE AISLAMIENTO MULTI-TENANT (1 Política por Tabla)
-- ==============================================================================
CREATE POLICY rls_roles ON core.roles USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_usuarios ON core.usuarios USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_estudiantes ON core.estudiantes USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_profesores ON core.profesores USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_referrals ON core.referrals_conversiones USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_audit ON core.audit_trail_immutable_logs USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_cursos ON educa.cursos USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_lecciones ON educa.lecciones USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_secciones ON educa.secciones USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_horarios ON educa.horarios USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_planes_matricula ON educa.planes_matricula USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_calificaciones ON educa.calificaciones USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_gamificacion ON educa.gamificacion USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_documentos ON educa.documentos USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_compartidos ON educa.compartidos_logros USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_vl_simulations ON educa.virtual_lab_simulations USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_qrs ON educa.attendance_dynamic_qrs USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_pagos ON finanzas.pagos USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_marketplace ON finanzas.marketplace_productos USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_pasaportes ON identidad.pasaportes_digitales USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_agentes_ia ON ia.agentes_ia_ejecuciones USING (tenant_id = current_setting('app.current_tenant')::uuid);
