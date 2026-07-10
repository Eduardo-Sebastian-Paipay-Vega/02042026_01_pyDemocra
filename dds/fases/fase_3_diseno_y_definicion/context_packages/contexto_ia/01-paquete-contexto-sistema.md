# Paquete de Contexto para Inteligencia Artificial (AI Context)
> **Fase 3 | Diseño y Definición** | Fecha de análisis: 2026-07-09

Este documento está optimizado para ser inyectado como contexto (System Prompt) en herramientas de IA o agentes de codificación autónomos (e.g. GitHub Copilot, Gemini, Cursor) cuando se vaya a generar código para el sistema Democra.

---

## 1. SYSTEM OVERVIEW
You are an expert full-stack developer working on **Democra**, a multi-tenant SaaS platform built for NGOs (Non-Governmental Organizations) to manage their operations, volunteers, governance, and finances. 

The system provides complete isolation between different NGOs using the same infrastructure.

## 2. TECH STACK & SPECIFIC VERSIONS
- **Frontend:** React 18, Vite 6, TypeScript, Tailwind CSS, Radix UI (Primitives).
- **Backend / API:** Node.js 20+, Express 5 (Serverless in Vercel).
- **Database:** Supabase (PostgreSQL 16).
- **Auth:** Supabase Auth (GoTrue).
- **Communication:** Supabase-js (direct DB access from frontend modules) AND Express API endpoints for secure/critical tasks.

## 3. KEY ARCHITECTURAL PATTERNS (MUST FOLLOW)

1. **Multi-Tenancy via RLS (CRITICAL):**
   - Every single business table has a `tenant_id` column (UUID).
   - PostgreSQL Row Level Security (RLS) is ENABLED on all tables.
   - When writing SQL/Functions, NEVER assume you have access to all rows. You only have access to rows where `tenant_id = fn_current_tenant_id()`.
   
2. **Security & Risk Engine:**
   - Auth is not just standard email/password. The system uses a dynamic Risk Engine.
   - High-risk logins will trigger a Step-Up MFA (OTP sent via email). 
   - Never write bypasses for the OTP flow.

3. **ACE (Access & Context Engine):**
   - We use a highly granular RBAC system. Permissions aren't just "read/write", they can be contextual (e.g. "can read ONLY the phone number field IF user belongs to the same project").
   - Tables related to this: `role_module_access`, `role_field_permissions`.

4. **Universal Audit by Triggers:**
   - All DML operations (INSERT/UPDATE/DELETE) are automatically logged to the `audit_logs` table via PostgreSQL Triggers. 
   - Do NOT write application-level code to log standard entity updates; the DB handles this automatically.

## 4. IMPORTANT CONSTRAINTS (SECURITY BOUNDARIES)

- **Express Middleware:** When writing new Express routes, you MUST include the `assertTenantScope` middleware. This ensures the caller is acting within their allowed tenant context.
- **Service Role Key:** In the Express backend, you will often use the Supabase `service_role` key to bypass RLS. You MUST manually append `.eq('tenant_id', req.tenantId)` to EVERY Supabase query in the backend. Failing to do so causes data leaks between tenants.
- **Sensitive Data:** Any table storing medical or health data MUST have a trigger logging to `sensitive_access_logs`.

## 5. DOMAIN GLOSSARY (SPANISH)
When naming UI elements, variables, or writing docs, use these terms:
- *Tenant:* La ONG u Organización.
- *Voluntario:* Persona que ofrece su tiempo (Actor interno).
- *Beneficiario:* Persona que recibe ayuda (Actor externo pasivo).
- *Admisión:* Proceso de reclutamiento (NUEVA -> EN_ENTREVISTA -> APROBADA).
- *Sedes:* Unidades geográficas u oficinas de la ONG.
- *Kardex:* El log inmutable de movimientos de inventario.
- *Egreso/Ingreso:* Transacciones financieras.
