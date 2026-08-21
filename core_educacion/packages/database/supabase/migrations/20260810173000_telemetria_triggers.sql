-- ==============================================================================
-- Migración EDUCACION OS: Sistema de Triggers y Telemetría Automática
-- Fecha: 2026-08-10
-- Notas: Captura eventos de las tablas usables para alimentar estadísticas
-- ==============================================================================

-- 1. CREACIÓN DEL ESQUEMA
CREATE SCHEMA IF NOT EXISTS telemetria;

-- 2. TABLA OPTIMIZADA DE ESTADÍSTICAS
-- Se diseña para alta escritura (Append-Only) y compatibilidad Multi-Tenant
CREATE TABLE telemetria.estadisticas_uso (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES core.institutos(instituto_id),
    tabla_origen VARCHAR(100) NOT NULL,
    operacion VARCHAR(15) NOT NULL, -- INSERT, UPDATE, DELETE
    registro_id UUID NOT NULL, -- El ID del registro modificado/creado
    usuario_id UUID, -- Puede ser null si la tabla no tiene usuario_id ni estudiante_id
    payload_json JSONB NOT NULL,
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Habilitar RLS en Telemetría
ALTER TABLE telemetria.estadisticas_uso ENABLE ROW LEVEL SECURITY;
CREATE POLICY rls_telemetria_estadisticas 
    ON telemetria.estadisticas_uso 
    USING (tenant_id = current_setting('app.current_tenant')::uuid);


-- ==============================================================================
-- 3. FUNCIÓN PL/PGSQL INTELIGENTE (MOTOR DE CAPTURA)
-- ==============================================================================
-- Esta función lee dinámicamente las variables mágicas del entorno de Postgres 
-- y registra el evento sin acoplamiento estricto a las columnas.
CREATE OR REPLACE FUNCTION telemetria.fn_registrar_estadistica()
RETURNS TRIGGER AS $$
DECLARE
    v_tenant_id UUID;
    v_usuario_id UUID := NULL;
    v_registro_id UUID;
BEGIN
    -- Capturar el tenant_id de la tabla origen
    IF (TG_OP = 'DELETE') THEN
        v_tenant_id := OLD.tenant_id;
        v_registro_id := (OLD.*).id; -- Asumimos genéricamente
    ELSE
        v_tenant_id := NEW.tenant_id;
    END IF;

    -- Intentar extraer el ID de la primera columna (Primary Key)
    EXECUTE format('SELECT ($1).%I', TG_ARGV[0]) INTO v_registro_id USING NEW;

    -- Intentar capturar el actor de la acción (si la tabla lo permite)
    BEGIN
        EXECUTE 'SELECT ($1).usuario_id' INTO v_usuario_id USING NEW;
    EXCEPTION WHEN undefined_column THEN
        BEGIN
            EXECUTE 'SELECT ($1).estudiante_id' INTO v_usuario_id USING NEW;
        EXCEPTION WHEN undefined_column THEN
            v_usuario_id := NULL;
        END;
    END;

    -- Insertar el registro de telemetría de forma asíncrona y segura
    INSERT INTO telemetria.estadisticas_uso (
        tenant_id, 
        tabla_origen, 
        operacion, 
        registro_id, 
        usuario_id, 
        payload_json
    ) VALUES (
        v_tenant_id,
        TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
        TG_OP,
        v_registro_id,
        v_usuario_id,
        row_to_json(NEW)::JSONB
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==============================================================================
-- 4. ENGANCHE DE TRIGGERS A TABLAS CLAVE (USABLES)
-- ==============================================================================

-- A. CORE: Registrar retención y movimiento de Usuarios
CREATE TRIGGER trg_stats_usuarios
    AFTER INSERT OR UPDATE ON core.usuarios
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('usuario_id');

-- B. EDUCA: Registrar cuando se califica a un estudiante
CREATE TRIGGER trg_stats_calificaciones
    AFTER INSERT OR UPDATE ON educa.calificaciones
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('calificacion_id');

-- C. EDUCA: Registrar el progreso en XP y Niveles (Gamificación)
CREATE TRIGGER trg_stats_gamificacion
    AFTER UPDATE ON educa.gamificacion
    FOR EACH ROW
    WHEN (OLD.puntos_xp IS DISTINCT FROM NEW.puntos_xp OR OLD.nivel IS DISTINCT FROM NEW.nivel)
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('gamificacion_id');

-- D. FINANZAS: Registrar inyección de ingresos
CREATE TRIGGER trg_stats_pagos
    AFTER INSERT OR UPDATE ON finanzas.pagos
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('pago_id');

-- E. BIENESTAR: Registrar cuando un estudiante entra en radar de riesgo
CREATE TRIGGER trg_stats_salud_mental
    AFTER INSERT OR UPDATE ON bienestar.mental_health_radar_alerts
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('alert_id');

-- F. IA: Registrar eventos de Proctoring e infracciones
CREATE TRIGGER trg_stats_proctoring
    AFTER INSERT ON ia.proctoring_ai_sessions
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('session_id');

-- G. INSTITUTION: Registrar encuestas de clima (Sentimiento)
CREATE TRIGGER trg_stats_clima
    AFTER INSERT ON bienestar.climate_sentiment_surveys
    FOR EACH ROW
    EXECUTE FUNCTION telemetria.fn_registrar_estadistica('survey_id');
