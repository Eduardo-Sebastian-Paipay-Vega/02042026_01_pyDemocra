-- ==========================================
-- EDUCACION OS — SUPABASE LOCAL SEED DATA (DDS FASE 0 & 5)
-- ==========================================

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Insert Initial Tenants
INSERT INTO public.tenants (id, name, slug, is_active, created_at, updated_at)
VALUES 
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Colegio Innova Education', 'innova-edu', true, NOW(), NOW()),
  ('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', 'Academia Pre-Universitaria Democra', 'democra-prep', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Initial Roles Enum or Reference Table if applicable
-- Base Usuarios y Metadatos
INSERT INTO public.users (id, tenant_id, email, password, first_name, last_name, roles, is_active, created_at, updated_at)
VALUES 
  ('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a01', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'admin@innova.edu.pe', crypt('admin123', gen_salt('bf')), 'Eduardo', 'Paipay', ARRAY['TENANT_OWNER', 'DIRECTOR_USER'], true, NOW(), NOW()),
  ('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a02', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'profesor@innova.edu.pe', crypt('profesor123', gen_salt('bf')), 'Carlos', 'Mendoza', ARRAY['TEACHER_USER'], true, NOW(), NOW()),
  ('u0eebc99-9c0b-4ef8-bb6d-6bb9bd380a03', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'estudiante@innova.edu.pe', crypt('estudiante123', gen_salt('bf')), 'Sofia', 'Torres', ARRAY['STUDENT_USER'], true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
