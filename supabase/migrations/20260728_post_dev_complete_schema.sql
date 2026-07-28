-- =============================================================================
-- MIGRACIÓN POST-DESARROLLO COMPLETA SUPABASE / POSTGRESQL (DEMOCRA)
-- Fecha: 2026-07-28
-- Módulos: M01 - M16 (Persistencia Relacional Defensiva, RLS, Índices e Inmutabilidad)
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- M01: MOTOR DE REPUTACIÓN Y GAMIFICACIÓN (RF-006, RF-007)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_reputation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID,
    reputation_score NUMERIC(5,2) DEFAULT 0.00,
    rank_title TEXT DEFAULT 'Novato',
    badge_code TEXT DEFAULT 'BRONZE',
    badge_name TEXT DEFAULT 'Insignia de Bronce',
    attendances_count INT DEFAULT 0,
    on_time_count INT DEFAULT 0,
    justified_absences INT DEFAULT 0,
    unjustified_absences INT DEFAULT 0,
    total_hours NUMERIC(8,2) DEFAULT 0.00,
    average_rating NUMERIC(3,2) DEFAULT 5.00,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS volunteer_id UUID;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS rank_title TEXT DEFAULT 'Novato';
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS badge_code TEXT DEFAULT 'BRONZE';
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS badge_name TEXT DEFAULT 'Insignia de Bronce';
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS attendances_count INT DEFAULT 0;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS on_time_count INT DEFAULT 0;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS justified_absences INT DEFAULT 0;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS unjustified_absences INT DEFAULT 0;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS total_hours NUMERIC(8,2) DEFAULT 0.00;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 5.00;
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE volunteer_reputation ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_volunteer_reputation_volunteer_id ON volunteer_reputation(volunteer_id);
ALTER TABLE volunteer_reputation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura publica o autenticada de reputacion" ON volunteer_reputation;
CREATE POLICY "Lectura publica o autenticada de reputacion"
    ON volunteer_reputation FOR SELECT
    USING (auth.role() = 'authenticated');

-- -----------------------------------------------------------------------------
-- M02: CANDIDATOS Y VALIDACIÓN OCR DOCUMENTAL (RF-013)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS candidate_ocr_scoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID,
    extracted_full_name TEXT,
    extracted_document_number TEXT,
    full_name_similarity NUMERIC(5,2) DEFAULT 0.00,
    levenshtein_distance INT DEFAULT 0,
    document_match BOOLEAN DEFAULT FALSE,
    ocr_confidence_percentage NUMERIC(5,2) DEFAULT 0.00,
    total_score NUMERIC(5,2) DEFAULT 0.00,
    recommendation TEXT DEFAULT 'REVISION_MANUAL',
    scored_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS candidate_id UUID;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS extracted_full_name TEXT;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS extracted_document_number TEXT;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS full_name_similarity NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS levenshtein_distance INT DEFAULT 0;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS document_match BOOLEAN DEFAULT FALSE;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS ocr_confidence_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS total_score NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS recommendation TEXT DEFAULT 'REVISION_MANUAL';
ALTER TABLE candidate_ocr_scoring ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_candidate_ocr_candidate_id ON candidate_ocr_scoring(candidate_id);
ALTER TABLE candidate_ocr_scoring ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M03: REGISTRO Y SELLADO DE FIRMAS BIOMÉTRICAS (RF-020)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biometric_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signature_id TEXT,
    signer_id UUID,
    document_type TEXT DEFAULT 'CONSENTIMIENTO_INFORMADO',
    sha256_seal TEXT,
    signature_size_bytes INT DEFAULT 0,
    ip_address TEXT,
    user_agent TEXT,
    status TEXT DEFAULT 'SELLADO_INMUTABLE',
    sealed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS signature_id TEXT;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS signer_id UUID;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'CONSENTIMIENTO_INFORMADO';
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS sha256_seal TEXT;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS signature_size_bytes INT DEFAULT 0;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS user_agent TEXT;
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SELLADO_INMUTABLE';
ALTER TABLE biometric_signatures ADD COLUMN IF NOT EXISTS sealed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_biometric_signatures_signer_id ON biometric_signatures(signer_id);
CREATE INDEX IF NOT EXISTS idx_biometric_signatures_seal ON biometric_signatures(sha256_seal);
ALTER TABLE biometric_signatures ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M05 / M04: MARCACIONALES GPS Y GEOFENCING HAVERSINE (RF-028, RF-033)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_geofence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    event_id UUID,
    user_latitude NUMERIC(10,8),
    user_longitude NUMERIC(11,8),
    target_latitude NUMERIC(10,8),
    target_longitude NUMERIC(11,8),
    calculated_distance_meters NUMERIC(10,2),
    max_radius_meters NUMERIC(10,2) DEFAULT 100.00,
    is_valid BOOLEAN DEFAULT FALSE,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS event_id UUID;
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS user_latitude NUMERIC(10,8);
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS user_longitude NUMERIC(11,8);
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS target_latitude NUMERIC(10,8);
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS target_longitude NUMERIC(11,8);
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS calculated_distance_meters NUMERIC(10,2);
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS max_radius_meters NUMERIC(10,2) DEFAULT 100.00;
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS is_valid BOOLEAN DEFAULT FALSE;
ALTER TABLE attendance_geofence_logs ADD COLUMN IF NOT EXISTS logged_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_geofence_logs_user_event ON attendance_geofence_logs(user_id, event_id);
ALTER TABLE attendance_geofence_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M06: TRANSFERENCIAS INTER-SEDES Y ÓRDENES DE COMPRA (RF-038, RF-040)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_id TEXT,
    source_sede_id UUID,
    target_sede_id UUID,
    item_id UUID,
    quantity INT,
    requested_by UUID,
    approved_by UUID,
    status TEXT DEFAULT 'SOLICITADO',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    dispatched_at TIMESTAMPTZ
);

ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS transfer_id TEXT;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS source_sede_id UUID;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS target_sede_id UUID;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS quantity INT;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS approved_by UUID;
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'SOLICITADO';
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE inventory_transfers ADD COLUMN IF NOT EXISTS dispatched_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS auto_purchase_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id TEXT,
    item_id UUID,
    item_name TEXT,
    current_global_stock INT,
    min_stock_threshold INT,
    suggested_order_quantity INT,
    status TEXT DEFAULT 'ORDEN_DE_COMPRA_GENERADA',
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS purchase_order_id TEXT;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS item_id UUID;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS item_name TEXT;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS current_global_stock INT;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS min_stock_threshold INT;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS suggested_order_quantity INT;
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ORDEN_DE_COMPRA_GENERADA';
ALTER TABLE auto_purchase_orders ADD COLUMN IF NOT EXISTS generated_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_transfers_sedes ON inventory_transfers(source_sede_id, target_sede_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_item ON auto_purchase_orders(item_id);
ALTER TABLE inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE auto_purchase_orders ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M07: CONCILIACIÓN BANCARIA Y EXTRACTOS OFX / CSV (RF-045)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_format TEXT,
    total_transactions INT DEFAULT 0,
    matched_count INT DEFAULT 0,
    unmatched_bank_count INT DEFAULT 0,
    match_rate_percentage NUMERIC(5,2) DEFAULT 0.00,
    reconciled_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS statement_format TEXT;
ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS total_transactions INT DEFAULT 0;
ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS matched_count INT DEFAULT 0;
ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS unmatched_bank_count INT DEFAULT 0;
ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS match_rate_percentage NUMERIC(5,2) DEFAULT 0.00;
ALTER TABLE bank_statements ADD COLUMN IF NOT EXISTS reconciled_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS bank_reconciliation_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    statement_id UUID,
    bank_operation_code TEXT,
    bank_amount NUMERIC(12,2),
    system_voucher_id UUID,
    status TEXT DEFAULT 'CONCILIADO',
    matched_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS statement_id UUID;
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS bank_operation_code TEXT;
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS bank_amount NUMERIC(12,2);
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS system_voucher_id UUID;
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'CONCILIADO';
ALTER TABLE bank_reconciliation_matches ADD COLUMN IF NOT EXISTS matched_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_reconciliation_matches_statement ON bank_reconciliation_matches(statement_id);
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_reconciliation_matches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M08: EVALUACIONES Y CUESTIONARIOS LMS (RF-048 A RF-054)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lms_exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT,
    course_id UUID,
    user_id UUID,
    status TEXT DEFAULT 'EN_PROGRESO',
    started_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    score_percentage NUMERIC(5,2),
    passed BOOLEAN
);

ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS course_id UUID;
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'EN_PROGRESO';
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS score_percentage NUMERIC(5,2);
ALTER TABLE lms_exam_sessions ADD COLUMN IF NOT EXISTS passed BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_lms_sessions_user ON lms_exam_sessions(user_id, course_id);
ALTER TABLE lms_exam_sessions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M09: REGISTRO DE NOTIFICACIONES MULTICANAL (RF-055 A RF-058)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS multichannel_notifications_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID,
    channel TEXT,
    template_name TEXT,
    status TEXT DEFAULT 'ENVIADO',
    provider_response_id TEXT,
    error_message TEXT,
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS recipient_id UUID;
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS channel TEXT;
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS template_name TEXT;
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ENVIADO';
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS provider_response_id TEXT;
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE multichannel_notifications_log ADD COLUMN IF NOT EXISTS sent_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON multichannel_notifications_log(recipient_id);
ALTER TABLE multichannel_notifications_log ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M10: PROVEEDORES SSO SAML 2.0 Y MAPEO RBAC (RF-064)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sso_saml_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_domain TEXT,
    idp_issuer TEXT,
    sso_login_url TEXT,
    x509_certificate TEXT,
    rbac_default_role TEXT DEFAULT 'VOLUNTARIO',
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS tenant_domain TEXT;
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS idp_issuer TEXT;
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS sso_login_url TEXT;
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS x509_certificate TEXT;
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS rbac_default_role TEXT DEFAULT 'VOLUNTARIO';
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT TRUE;
ALTER TABLE sso_saml_configurations ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE sso_saml_configurations ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M11: BI PREDICTIVO Y REPORTES ASÍNCRONOS (RF-071, RF-073)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS volunteer_attrition_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID,
    risk_score INT,
    risk_level TEXT,
    recommended_action TEXT,
    days_since_last_activity INT,
    attendance_rate_percentage INT,
    evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS volunteer_id UUID;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS risk_score INT;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS risk_level TEXT;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS recommended_action TEXT;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS days_since_last_activity INT;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS attendance_rate_percentage INT;
ALTER TABLE volunteer_attrition_predictions ADD COLUMN IF NOT EXISTS evaluated_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS async_report_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id TEXT,
    report_type TEXT,
    requested_by UUID,
    status TEXT DEFAULT 'EN_COLA',
    progress_percentage INT DEFAULT 0,
    download_url TEXT,
    enqueued_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS job_id TEXT;
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS report_type TEXT;
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS requested_by UUID;
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'EN_COLA';
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS progress_percentage INT DEFAULT 0;
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS download_url TEXT;
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS enqueued_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE async_report_jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_attrition_predictions_volunteer ON volunteer_attrition_predictions(volunteer_id);
ALTER TABLE volunteer_attrition_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE async_report_jobs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M12: API GATEWAY, WEBHOOKS Y REINTENTOS EXPONENCIALES (RF-076 A RF-078)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS outgoing_webhooks_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT,
    target_url TEXT,
    secret_key TEXT,
    event_types JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS webhook_id TEXT;
ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS secret_key TEXT;
ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS event_types JSONB DEFAULT '[]'::jsonb;
ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE outgoing_webhooks_config ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS outgoing_webhooks_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id TEXT,
    event_type TEXT,
    payload JSONB,
    attempt INT DEFAULT 1,
    http_status INT,
    success BOOLEAN DEFAULT FALSE,
    next_retry_at TIMESTAMPTZ,
    logged_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS webhook_id TEXT;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS event_type TEXT;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS payload JSONB;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS attempt INT DEFAULT 1;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS http_status INT;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT FALSE;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE outgoing_webhooks_logs ADD COLUMN IF NOT EXISTS logged_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_outgoing_webhooks_logs_id ON outgoing_webhooks_logs(webhook_id);
ALTER TABLE outgoing_webhooks_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE outgoing_webhooks_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M13: SINCRONIZACIÓN OFFLINE LOTE Y TOKENS QR HMAC (RF-080 A RF-087)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS offline_sync_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT,
    device_id TEXT,
    total_received INT DEFAULT 0,
    total_processed INT DEFAULT 0,
    total_rejected INT DEFAULT 0,
    sync_completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS batch_id TEXT;
ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS device_id TEXT;
ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS total_received INT DEFAULT 0;
ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS total_processed INT DEFAULT 0;
ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS total_rejected INT DEFAULT 0;
ALTER TABLE offline_sync_batches ADD COLUMN IF NOT EXISTS sync_completed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_offline_sync_device ON offline_sync_batches(device_id);
ALTER TABLE offline_sync_batches ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M14: DONACIONES, PASARELAS DE PAGO Y SUSCRIPCIONES (RF-088 A RF-095)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT,
    gateway_provider TEXT,
    donor_id UUID,
    amount NUMERIC(12,2),
    currency TEXT DEFAULT 'PEN',
    status TEXT DEFAULT 'PENDIENTE',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS transaction_id TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS gateway_provider TEXT;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS donor_id UUID;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(12,2);
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'PEN';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDIENTE';
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS sponsorship_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id TEXT,
    gateway_provider TEXT,
    donor_id UUID,
    beneficiary_id UUID,
    monthly_amount NUMERIC(12,2),
    status TEXT DEFAULT 'ACTIVE',
    started_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS gateway_provider TEXT;
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS donor_id UUID;
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS beneficiary_id UUID;
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS monthly_amount NUMERIC(12,2);
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE';
ALTER TABLE sponsorship_subscriptions ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_payments_donor ON payment_transactions(donor_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_donor ON sponsorship_subscriptions(donor_id);
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorship_subscriptions ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- M15 / M16: CMS Y EXPORTACIÓN PORTABILIDAD GDPR (RF-097, RF-105)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cms_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id TEXT,
    slug TEXT,
    title TEXT,
    clean_html_content TEXT,
    author_id UUID,
    status TEXT DEFAULT 'PUBLICADO',
    published_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS post_id TEXT;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS clean_html_content TEXT;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLICADO';
ALTER TABLE cms_posts ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ DEFAULT NOW();

CREATE TABLE IF NOT EXISTS gdpr_export_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    package_json JSONB,
    exported_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gdpr_export_requests ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE gdpr_export_requests ADD COLUMN IF NOT EXISTS package_json JSONB;
ALTER TABLE gdpr_export_requests ADD COLUMN IF NOT EXISTS exported_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_gdpr_user ON gdpr_export_requests(user_id);
ALTER TABLE cms_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gdpr_export_requests ENABLE ROW LEVEL SECURITY;

COMMIT;
