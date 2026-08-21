-- ==========================================
-- EDUCACION OS — SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- Reference: DDS FASE_0_REQUISITOS_Y_SEGURIDAD.md (RBAC/ABAC Zero Trust)
-- ==========================================

-- Enable Row Level Security on all core tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ews_risk_alerts ENABLE ROW LEVEL SECURITY;

-- Helper Function: Extract Tenant ID from JWT Claims
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::UUID;
$$ LANGUAGE sql STABLE;

-- RLS Policy: Users can only see data within their own tenant
CREATE POLICY tenant_isolation_users ON public.users
  FOR ALL
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_courses ON public.courses
  FOR ALL
  USING (tenant_id = public.current_tenant_id());

CREATE POLICY tenant_isolation_ews ON public.ews_risk_alerts
  FOR ALL
  USING (tenant_id = public.current_tenant_id());
