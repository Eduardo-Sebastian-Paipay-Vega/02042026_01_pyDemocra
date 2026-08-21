-- Fase 4: Migración de Tablas Huérfanas a sus Esquemas Lógicos Correspondientes
-- Esta migración implementa el Enfoque A (Esquemas PostgreSQL) asegurando 
-- el aislamiento de dominios de negocio.

-- 1. Dominio ONG
ALTER TABLE public.volunteer_reputation SET SCHEMA ong;
ALTER TABLE public.volunteer_attrition_predictions SET SCHEMA ong;
ALTER TABLE public.inventory_transfers SET SCHEMA ong;
ALTER TABLE public.attendance_geofence_logs SET SCHEMA ong;

-- 2. Dominio RRHH
ALTER TABLE public.candidate_ocr_scoring SET SCHEMA rrhh;
ALTER TABLE public.biometric_signatures SET SCHEMA rrhh;

-- 3. Dominio Finanzas
ALTER TABLE public.auto_purchase_orders SET SCHEMA finanzas;
ALTER TABLE public.bank_statements SET SCHEMA finanzas;
ALTER TABLE public.bank_reconciliation_matches SET SCHEMA finanzas;
ALTER TABLE public.payment_transactions SET SCHEMA finanzas;
ALTER TABLE public.dynamic_pricing_log SET SCHEMA finanzas;

-- 4. Dominio Donaciones
ALTER TABLE public.sponsorship_subscriptions SET SCHEMA donaciones;

-- 5. Dominio Educa (LMS)
ALTER TABLE public.lms_exam_sessions SET SCHEMA educa;

-- 6. Dominio Gamificación
ALTER TABLE public.battle_pass_progression SET SCHEMA gamificacion;
