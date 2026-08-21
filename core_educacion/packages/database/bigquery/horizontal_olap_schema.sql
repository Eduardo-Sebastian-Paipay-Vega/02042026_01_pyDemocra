-- ==============================================================================
-- BIGQUERY OLAP SCHEMA (Escalamiento Horizontal - Telemetría IoT & AI)
-- Plataforma: Google Cloud Platform (GCP)
-- ==============================================================================

-- 1. DATASET: IOT TELEMETRY (RF-066: Gemelo Digital de Infraestructura)
-- Ingesta de sensores de aula cada 1 segundo (Partitioned by Date, Clustered by Tenant & Sensor)
CREATE TABLE IF NOT EXISTS `educacion_os_dl.iot_telemetry` (
    tenant_id STRING NOT NULL OPTIONS(description="Tenant UUID"),
    room_id STRING NOT NULL OPTIONS(description="Aula UUID"),
    sensor_mac STRING NOT NULL OPTIONS(description="Dirección MAC del hardware"),
    metric_type STRING NOT NULL OPTIONS(description="CO2, HUMIDITY, TEMP, LUX"),
    metric_value FLOAT64 NOT NULL OPTIONS(description="Lectura bruta"),
    ingested_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(ingested_at)
CLUSTER BY tenant_id, metric_type;

-- 2. DATASET: EYE TRACKING & COGNITIVE (RF-069: Rastreo Biométrico de Atención)
-- Micro-expresiones inferidas en Edge AI, transmitidas a BQ
CREATE TABLE IF NOT EXISTS `educacion_os_dl.cognitive_attention_logs` (
    tenant_id STRING NOT NULL,
    estudiante_id STRING NOT NULL,
    leccion_id STRING NOT NULL,
    focus_level FLOAT64 NOT NULL OPTIONS(description="Score de atención de 0.0 a 1.0"),
    micro_emotion STRING OPTIONS(description="CONFUSED, BORED, FOCUSED"),
    gaze_heatmap_x INT64,
    gaze_heatmap_y INT64,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY tenant_id, estudiante_id;

-- 3. DATASET: ML FEATURE STORE (RF-067: Dropout Predictor)
-- Tablas calculadas en Batch por Dataflow para ser comidas por XGBoost en Vertex AI
CREATE TABLE IF NOT EXISTS `educacion_os_ml.dropout_features` (
    tenant_id STRING NOT NULL,
    estudiante_id STRING NOT NULL,
    calc_date DATE NOT NULL,
    avg_grade_30d FLOAT64,
    absences_30d INT64,
    financial_debt_usd FLOAT64,
    bullying_incidents INT64,
    predicted_dropout_risk FLOAT64,
    shap_factors JSON,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY calc_date
CLUSTER BY tenant_id, estudiante_id;

-- 4. DATASET: GEOFENCE TRACKING (RF-062: Rastreo de Buses)
-- Usando soporte GIS nativo de BigQuery (GEOGRAPHY) para flotas
CREATE TABLE IF NOT EXISTS `educacion_os_dl.fleet_geospatial_tracking` (
    tenant_id STRING NOT NULL,
    bus_id STRING NOT NULL,
    driver_id STRING NOT NULL,
    location GEOGRAPHY NOT NULL OPTIONS(description="WKT Coordinates POINT(lon lat)"),
    speed_kmh FLOAT64,
    event_type STRING OPTIONS(description="MOVING, IDLE, STUDENT_BOARDED, ROUTE_DEVIATION"),
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP()
)
PARTITION BY DATE(timestamp)
CLUSTER BY tenant_id, bus_id;
