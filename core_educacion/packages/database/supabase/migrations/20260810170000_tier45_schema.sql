-- ==============================================================================
-- Migración EDUCACION OS: Esquemas TIER 4 & 5 (Deep Tech & Analytics)
-- Fecha: 2026-08-10
-- Notas: Refactorizado con PostgreSQL Schemas estrictos
-- ==============================================================================

-- 1. CREACIÓN DE SCHEMAS
CREATE SCHEMA IF NOT EXISTS educa;
CREATE SCHEMA IF NOT EXISTS ia;
CREATE SCHEMA IF NOT EXISTS finanzas;
CREATE SCHEMA IF NOT EXISTS institution;
CREATE SCHEMA IF NOT EXISTS bienestar;
CREATE SCHEMA IF NOT EXISTS identidad;

-- ------------------------------------------------------------------------------
-- DOMINIO: EDUCA (Evaluaciones Avanzadas y Gamificación)
-- ------------------------------------------------------------------------------
CREATE TABLE educa.cat_irt_assessments (
    assessment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    theta_skill_level DECIMAL(5,4) NOT NULL,
    confidence_interval DECIMAL(5,4) NOT NULL,
    items_answered_json JSONB NOT NULL,
    fecha_evaluacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.peer_review_assignments (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    evaluador_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    entregable_id UUID NOT NULL,
    nota_asignada DECIMAL(5,2),
    sesgo_calibrado DECIMAL(5,2),
    feedback_texto TEXT
);

CREATE TABLE educa.item_bank_questions (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    materia_code VARCHAR(50) NOT NULL,
    enunciado TEXT NOT NULL,
    parametro_a_discriminacion DECIMAL(4,2),
    parametro_b_dificultad DECIMAL(4,2),
    generado_por_llm BOOLEAN DEFAULT FALSE
);

CREATE TABLE educa.student_clans (
    clan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    nombre_clan VARCHAR(100) NOT NULL,
    xp_acumulado INT DEFAULT 0,
    racha_semanal INT DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.curriculum_convalidations (
    convalidation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    institucion_origen VARCHAR(255) NOT NULL,
    porcentaje_coincidencia DECIMAL(5,2) NOT NULL,
    matriz_equivalencias_json JSONB NOT NULL,
    coordinador_firma_id UUID REFERENCES core.usuarios(usuario_id),
    fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE educa.co_curricular_student_clubs (
    club_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    nombre_club VARCHAR(100) NOT NULL,
    presidente_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    presupuesto_asignado DECIMAL(10,2) DEFAULT 0.00
);

CREATE TABLE educa.service_learning_projects (
    project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    ong_aliada VARCHAR(150) NOT NULL,
    titulo_proyecto VARCHAR(200) NOT NULL,
    horas_convalidadas INT NOT NULL
);

-- ------------------------------------------------------------------------------
-- DOMINIO: IA (Inteligencia Artificial)
-- ------------------------------------------------------------------------------
CREATE TABLE ia.proctoring_ai_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    proctoring_score DECIMAL(5,2) NOT NULL,
    flags_incidencias_json JSONB NOT NULL,
    fecha_supervision TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- DOMINIO: FINANZAS (Nómina y Becas)
-- ------------------------------------------------------------------------------
CREATE TABLE finanzas.faculty_lifecycle_payroll (
    payroll_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    profesor_id UUID NOT NULL REFERENCES core.profesores(profesor_id),
    horas_dictadas DECIMAL(6,2) NOT NULL,
    tarifa_hora DECIMAL(8,2) NOT NULL,
    monto_total DECIMAL(10,2) NOT NULL,
    estado_pago VARCHAR(50) DEFAULT 'PENDIENTE'
);

CREATE TABLE finanzas.scholarship_financial_aids (
    scholarship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    porcentaje_descuento DECIMAL(5,2) NOT NULL,
    puntaje_vulnerabilidad DECIMAL(5,2) NOT NULL,
    estado_beca VARCHAR(50) DEFAULT 'ACTIVA'
);

CREATE TABLE finanzas.local_payment_transactions (
    transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    apoderado_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    monto DECIMAL(10,2) NOT NULL,
    proveedor_pago VARCHAR(50) NOT NULL,
    webhook_signature VARCHAR(255) NOT NULL,
    estado VARCHAR(50) DEFAULT 'APROBADO',
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ------------------------------------------------------------------------------
-- DOMINIO: INSTITUTION (Gobernanza e Infraestructura)
-- ------------------------------------------------------------------------------
CREATE TABLE institution.schedule_genetic_optimizations (
    optimization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    periodo_academico VARCHAR(50) NOT NULL,
    matriz_horarios_json JSONB NOT NULL,
    fitness_score DECIMAL(5,2) NOT NULL,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution.board_governance_resolutions (
    resolution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    titulo_acta VARCHAR(255) NOT NULL,
    documento_hash VARCHAR(255) NOT NULL,
    quorum_validado BOOLEAN DEFAULT TRUE,
    fecha_firma TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution.asset_predictive_maintenances (
    asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    nombre_equipo VARCHAR(150) NOT NULL,
    qr_rfid_tag VARCHAR(100) UNIQUE NOT NULL,
    riesgo_fallo_porcentaje DECIMAL(5,2),
    fecha_proximo_mantenimiento DATE
);

CREATE TABLE institution.facility_reservations (
    reservation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    solicitante_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    espacio_nombre VARCHAR(150) NOT NULL,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado VARCHAR(50) DEFAULT 'CONFIRMADA',
    codigo_qr_acceso VARCHAR(255) NOT NULL
);

CREATE TABLE institution.emergency_crisis_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    tipo_emergencia VARCHAR(50) NOT NULL,
    zonas_afectadas JSONB NOT NULL,
    evacuados_conteo INT DEFAULT 0,
    fecha_activacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution.public_audit_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    periodo_academico VARCHAR(50) NOT NULL,
    indicadores_anonimizados_json JSONB NOT NULL,
    hash_criptografico VARCHAR(255) NOT NULL,
    fecha_publicacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE institution.esg_impact_dashboards (
    esg_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    papel_ahorrado_hojas INT NOT NULL,
    score_diversidad DECIMAL(5,2) NOT NULL,
    certificado_gri_hash VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------------------------
-- DOMINIO: BIENESTAR (Salud Mental e Inclusión)
-- ------------------------------------------------------------------------------
CREATE TABLE bienestar.psycho_aptitude_reports (
    report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    perfil_habilidades_blandas_json JSONB NOT NULL,
    alerta_vulnerabilidad BOOLEAN DEFAULT FALSE,
    fecha_test TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bienestar.mental_health_radar_alerts (
    alert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    nivel_riesgo VARCHAR(50) NOT NULL,
    atencion_asignada BOOLEAN DEFAULT FALSE,
    fecha_alerta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bienestar.inclusion_iep_plans (
    iep_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID NOT NULL REFERENCES core.estudiantes(estudiante_id),
    diagnostico_nee VARCHAR(255) NOT NULL,
    adaptaciones_json JSONB NOT NULL,
    fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bienestar.accessibility_user_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    estudiante_id UUID UNIQUE NOT NULL REFERENCES core.estudiantes(estudiante_id),
    modo_dislexia BOOLEAN DEFAULT FALSE,
    subtitulos_lsa BOOLEAN DEFAULT FALSE,
    lectura_por_voz BOOLEAN DEFAULT FALSE,
    lengua_originaria VARCHAR(50) DEFAULT 'es'
);

CREATE TABLE bienestar.climate_sentiment_surveys (
    survey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    enps_score INT NOT NULL,
    mapa_calor_sentimiento_json JSONB NOT NULL,
    fecha_encuesta DATE DEFAULT CURRENT_DATE
);

CREATE TABLE bienestar.safe_social_mediations (
    post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    autor_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    contenido_texto TEXT NOT NULL,
    toxicity_score DECIMAL(4,3) NOT NULL,
    estado_moderacion VARCHAR(50) DEFAULT 'APROBADO'
);

-- ------------------------------------------------------------------------------
-- DOMINIO: IDENTIDAD
-- ------------------------------------------------------------------------------
CREATE TABLE identidad.alumni_lifelong_directory (
    alumni_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    exalumno_id UUID NOT NULL REFERENCES core.usuarios(usuario_id),
    anio_graduacion INT NOT NULL,
    empresa_actual VARCHAR(150),
    carnet_digital_hash VARCHAR(255) NOT NULL
);


-- ==============================================================================
-- 2. HABILITACIÓN DE ROW-LEVEL SECURITY (RLS)
-- ==============================================================================
ALTER TABLE educa.cat_irt_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.peer_review_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.item_bank_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.student_clans ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.curriculum_convalidations ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.co_curricular_student_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE educa.service_learning_projects ENABLE ROW LEVEL SECURITY;

ALTER TABLE ia.proctoring_ai_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE finanzas.faculty_lifecycle_payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.scholarship_financial_aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE finanzas.local_payment_transactions ENABLE ROW LEVEL SECURITY;

ALTER TABLE institution.schedule_genetic_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.board_governance_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.asset_predictive_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.facility_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.emergency_crisis_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.public_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE institution.esg_impact_dashboards ENABLE ROW LEVEL SECURITY;

ALTER TABLE bienestar.psycho_aptitude_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE bienestar.mental_health_radar_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bienestar.inclusion_iep_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE bienestar.accessibility_user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bienestar.climate_sentiment_surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE bienestar.safe_social_mediations ENABLE ROW LEVEL SECURITY;

ALTER TABLE identidad.alumni_lifelong_directory ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. POLÍTICAS RLS (Inyección Multi-Tenant apuntando al esquema core)
-- ==============================================================================
CREATE POLICY rls_cat_irt ON educa.cat_irt_assessments USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_peer_review ON educa.peer_review_assignments USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_item_bank ON educa.item_bank_questions USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_clans ON educa.student_clans USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_convalidations ON educa.curriculum_convalidations USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_student_clubs ON educa.co_curricular_student_clubs USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_service_learning ON educa.service_learning_projects USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_proctoring ON ia.proctoring_ai_sessions USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_faculty_payroll ON finanzas.faculty_lifecycle_payroll USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_scholarships_aid ON finanzas.scholarship_financial_aids USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_payments ON finanzas.local_payment_transactions USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_schedules_opt ON institution.schedule_genetic_optimizations USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_board_governance ON institution.board_governance_resolutions USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_assets_maint ON institution.asset_predictive_maintenances USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_facilities ON institution.facility_reservations USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_emergency_crisis ON institution.emergency_crisis_events USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_public_audit ON institution.public_audit_reports USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_esg_dashboards ON institution.esg_impact_dashboards USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_psycho_aptitude ON bienestar.psycho_aptitude_reports USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_mental_health ON bienestar.mental_health_radar_alerts USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_inclusion_iep ON bienestar.inclusion_iep_plans USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_accessibility ON bienestar.accessibility_user_profiles USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_climate_sentiment ON bienestar.climate_sentiment_surveys USING (tenant_id = current_setting('app.current_tenant')::uuid);
CREATE POLICY rls_safe_social ON bienestar.safe_social_mediations USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY rls_alumni_directory ON identidad.alumni_lifelong_directory USING (tenant_id = current_setting('app.current_tenant')::uuid);
