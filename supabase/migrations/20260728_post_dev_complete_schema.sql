-- =============================================================================
-- MIGRACIÓN POST-DESARROLLO COMPLETA SUPABASE / POSTGRESQL (DEMOCRA)
-- Fecha: 2026-07-28
-- Módulos: M01 - M16 (Persistencia Relacional, RLS, Índices e Inmutabilidad)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- M01: MOTOR DE REPUTACIÓN Y GAMIFICACIÓN (RF-006, RF-007)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,
    reputation_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    rank_title TEXT NOT NULL DEFAULT 'Novato',
    badge_code TEXT NOT NULL DEFAULT 'BRONZE',
    badge_name TEXT NOT NULL DEFAULT 'Insignia de Bronce',
    attendances_count INT DEFAULT 0,
    on_time_count INT DEFAULT 0,
    justified_absences INT DEFAULT 0,
    unjustified_absences INT DEFAULT 0,
    total_hours NUMERIC(8,2) DEFAULT 0.00,
    average_rating NUMERIC(3,2) DEFAULT 5.00,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_volunteer_reputation_volunteer_id ON volunteer_reputation(volunteer_id);
ALTER TABLE volunteer_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura publica o autenticada de reputacion"
    ON volunteer_reputation FOR SELECT
    USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- M02: CANDIDATOS Y VALIDACIÓN OCR DOCUMENTAL (RF-013)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_ocr_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL,
    extracted_full_name TEXT,
    extracted_document_number TEXT,
    full_name_similarity NUMERIC(5,2) DEFAULT 0.00,
    levenshtein_distance INT DEFAULT 0,
    document_match BOOLEAN DEFAULT FALSE,
    ocr_confidence_percentage NUMERIC(5,2) DEFAULT 0.00,
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    recommendation TEXT NOT NULL DEFAULT 'REVISION_MANUAL',
    scored_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidate_ocr_candidate_id ON candidate_ocr_scoring(candidate_id);
ALTER TABLE candidate_ocr_scoring ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M03: REGISTRO Y SELLADO DE FIRMAS BIOMÉTRICAS (RF-020)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biometric_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_id TEXT UNIQUE NOT NULL,
    signer_id UUID NOT NULL,
    document_type TEXT NOT NULL DEFAULT 'CONSENTIMIENTO_INFORMADO',
    sha256_seal TEXT NOT NULL,
    signature_size_bytes INT DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'SELLADO_INMUTABLE',
    sealed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biometric_signatures_signer_id ON biometric_signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_biometric_signatures_seal ON biometric_signatures(sha256_seal);
ALTER TABLE biometric_signatures ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M05 / M04: MARCACIONALES GPS Y GEOFENCING HAVERSINE (RF-028, RF-033)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_geofence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    user_latitude NUMERIC(10,8) NOT NULL,
    user_longitude NUMERIC(11,8) NOT NULL,
    target_latitude NUMERIC(10,8) NOT NULL,
    target_longitude NUMERIC(11,8) NOT NULL,
    calculated_distance_meters NUMERIC(10,2) NOT NULL,
    max_radius_meters NUMERIC(10,2) NOT NULL DEFAULT 100.00,
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_geofence_logs_user_event ON attendance_geofence_logs(user_id, event_id);
ALTER TABLE attendance_geofence_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M06: TRANSFERENCIAS INTER-SEDES Y ÓRDENES DE COMPRA (RF-038, RF-040)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id TEXT UNIQUE NOT NULL,
    source_sede_id UUID NOT NULL,
    target_sede_id UUID NOT NULL,
    item_id UUID NOT NULL,
    quantity INT NOT NULL,
    requested_by UUID NOT NULL,
    approved_by UUID,
    status TEXT NOT NULL DEFAULT 'SOLICITADO',
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS auto_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id TEXT UNIQUE NOT NULL,
    item_id UUID NOT NULL,
    item_name TEXT NOT NULL,
    current_global_stock INT NOT NULL,
    min_stock_threshold INT NOT NULL,
    suggested_order_quantity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ORDEN_DE_COMPRA_GENERADA',
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transfers_sedes ON inventory_transfers(source_sede_id, target_sede_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_item ON auto_purchase_orders(item_id);
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_purchase_orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M07: CONCILIACIÓN BANCARIA Y EXTRACTOS OFX / CSV (RF-045)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_format TEXT NOT NULL, -- 'OFX' | 'CSV'
    total_transactions INT DEFAULT 0,
    matched_count INT DEFAULT 0,
    unmatched_bank_count INT DEFAULT 0,
    match_rate_percentage NUMERIC(5,2) DEFAULT 0.00,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bank_reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID REFERENCES bank_statements(id) ON DELETE CASCADE,
    bank_operation_code TEXT NOT NULL,
    bank_amount NUMERIC(12,2) NOT NULL,
    system_voucher_id UUID,
    status TEXT NOT NULL DEFAULT 'CONCILIADO',
    matched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_statement ON bank_reconciliation_matches(statement_id);
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M08: EVALUACIONES Y CUESTIONARIOS LMS (RF-048 A RF-054)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    course_id UUID NOT NULL,
    user_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'EN_PROGRESO',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    score_percentage NUMERIC(5,2),
    passed BOOLEAN
);

CREATE INDEX IF NOT EXISTS idx_lms_sessions_user ON lms_exam_sessions(user_id, course_id);
ALTER TABLE lms_exam_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M09: REGISTRO DE NOTIFICACIONES MULTICANAL (RF-055 A RF-058)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS multichannel_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL,
    channel TEXT NOT NULL, -- 'WHATSAPP' | 'SMS' | 'PUSH' | 'EMAIL'
    template_name TEXT,
    status TEXT NOT NULL DEFAULT 'ENVIADO',
    provider_response_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON multichannel_notifications_log(recipient_id);
ALTER TABLE multichannel_notifications_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M10: PROVEEDORES SSO SAML 2.0 Y MAPEO RBAC (RF-064)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sso_saml_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_domain TEXT UNIQUE NOT NULL,
    idp_issuer TEXT NOT NULL,
    sso_login_url TEXT NOT NULL,
    x509_certificate TEXT NOT NULL,
    rbac_default_role TEXT NOT NULL DEFAULT 'VOLUNTARIO',
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE sso_saml_configurations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M11: BI PREDICTIVO Y REPORTES ASÍNCRONOS (RF-071, RF-073)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_attrition_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL,
    risk_score INT NOT NULL,
    risk_level TEXT NOT NULL, -- 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'
    recommended_action TEXT,
    days_since_last_activity INT,
    attendance_rate_percentage INT,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS async_report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT UNIQUE NOT NULL,
    report_type TEXT NOT NULL,
    requested_by UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'EN_COLA',
    progress_percentage INT DEFAULT 0,
    download_url TEXT,
    enqueued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attrition_predictions_volunteer ON volunteer_attrition_predictions(volunteer_id);
ALTER TABLE volunteer_attrition_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_report_jobs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M12: API GATEWAY, WEBHOOKS Y REINTENTOS EXPONENCIALES (RF-076 A RF-078)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outgoing_webhooks_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT UNIQUE NOT NULL,
    target_url TEXT NOT NULL,
    secret_key TEXT NOT NULL,
    event_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outgoing_webhooks_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT REFERENCES outgoing_webhooks_config(webhook_id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    attempt INT DEFAULT 1,
    http_status INT,
    success BOOLEAN NOT NULL DEFAULT FALSE,
    next_retry_at TIMESTAMPTZ,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_logs_id ON outgoing_webhooks_logs(webhook_id);
ALTER TABLE outgoing_webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_webhooks_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M13: SINCRONIZACIÓN OFFLINE LOTE Y TOKENS QR HMAC (RF-080 A RF-087)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT UNIQUE NOT NULL,
    device_id TEXT NOT NULL,
    total_received INT NOT NULL DEFAULT 0,
    total_processed INT NOT NULL DEFAULT 0,
    total_rejected INT NOT NULL DEFAULT 0,
    sync_completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_device ON offline_sync_batches(device_id);
ALTER TABLE offline_sync_batches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M14: DONACIONES, PASARELAS DE PAGO Y SUSCRIPCIONES (RF-088 A RF-095)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT UNIQUE NOT NULL,
    gateway_provider TEXT NOT NULL, -- 'STRIPE' | 'CULQI' | 'MERCADOPAGO'
    donor_id UUID,
    amount NUMERIC(12,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'PEN',
    status TEXT NOT NULL DEFAULT 'PENDIENTE', -- 'PAID' | 'PENDING' | 'FAILED'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sponsorship_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id TEXT UNIQUE NOT NULL,
    gateway_provider TEXT NOT NULL,
    donor_id UUID NOT NULL,
    beneficiary_id UUID NOT NULL,
    monthly_amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_donor ON payment_transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_donor ON sponsorship_subscriptions(donor_id);
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_subscriptions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M15 / M16: CMS Y EXPORTACIÓN PORTABILIDAD GDPR (RF-097, RF-105)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    clean_html_content TEXT NOT NULL,
    author_id UUID NOT NULL,
    status TEXT NOT NULL DEFAULT 'PUBLICADO',
    published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gdpr_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    package_json JSONB NOT NULL,
    exported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_export_requests(user_id);
ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;

COMMIT;
