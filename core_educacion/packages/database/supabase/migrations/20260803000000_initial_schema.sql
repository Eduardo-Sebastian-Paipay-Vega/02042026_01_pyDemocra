-- ==========================================
-- EDUCACION OS — MIGRATION 20260803000000: INITIAL DDL SCHEMA
-- Reference: DDS FASE_5_BASE_DE_DATOS.md
-- ==========================================

-- 1. Create Enums
CREATE TYPE public.user_role AS ENUM (
  'SUPER_ADMIN',
  'TENANT_OWNER',
  'DIRECTOR_USER',
  'ACADEMIC_ADMIN',
  'COORDINATOR_USER',
  'TEACHER_USER',
  'STUDENT_USER',
  'PARENT_USER',
  'TUTOR_USER',
  'FINANCE_ADMIN'
);

CREATE TYPE public.course_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE public.ews_risk_level AS ENUM ('NONE', 'LOW', 'MEDIUM', 'HIGH_RISK_DROPOUT');

-- 2. Tenants Table (Multi-tenant Isolator)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  roles public.user_role[] NOT NULL DEFAULT ARRAY['STUDENT_USER'::public.user_role],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  grade_level VARCHAR(50) NOT NULL,
  status public.course_status NOT NULL DEFAULT 'DRAFT',
  assigned_teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. EWS Risk Alerts Table
CREATE TABLE IF NOT EXISTS public.ews_risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  risk_score NUMERIC(3,2) NOT NULL CHECK (risk_score >= 0.00 AND risk_score <= 1.00),
  risk_level public.ews_risk_level NOT NULL DEFAULT 'NONE',
  trigger_factors TEXT[] NOT NULL DEFAULT '{}',
  suggested_action TEXT NOT NULL,
  is_intervened BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Indexes for Multi-tenant High Performance Querying
CREATE INDEX IF NOT EXISTS idx_users_tenant ON public.users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_courses_tenant ON public.courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ews_tenant_student ON public.ews_risk_alerts(tenant_id, student_id);
