-- =============================================================================
-- 00000000000000_core_baseline.sql
-- Democra ONG Platform — Core Compartido e Identidad (baseline de consolidación)
-- =============================================================================
-- Propósito: extraer el DDL de producción/baseline del "Core Compartido e
-- Identidad" (tenancy, perfiles, IAM básico) para servir de punto de partida
-- a la consolidación con el Sistema 2 (GYMsos), que se construyó sobre estas
-- mismas tablas sin incluirlas en su repositorio.
--
-- UBICACIÓN DELIBERADA: este archivo vive en docs/consolidacion/, NO en
-- supabase/migrations/. Este repositorio ya tiene un proyecto Supabase real
-- vinculado (ver .env) donde estas tablas y funciones YA EXISTEN. Si este
-- script se colocara en supabase/migrations/, el CLI de Supabase lo trataría
-- como una migración más de ESTE proyecto: un futuro `supabase db push`
-- fallaría (las políticas CREATE POLICY no son idempotentes: "ya existe") o,
-- peor, sobreescribiría funciones reales con esta reconstrucción documental.
-- Este script está destinado a la base de datos de GYMsos (Sistema 2) o a un
-- entorno nuevo — revisar y mover conscientemente antes de aplicar.
--
-- Fuentes (en orden de autoridad, ver también DATABASE_MASTER_SCRIPT_S1.md,
-- AUDIT_REPORT_S1.md y DATABASE_DICTIONARY_S1.md):
--   1. supabase/migrations/20260302125000_fix_bootstrap_audit_tenant_null.sql
--      → versión VIGENTE de fn_current_tenant_id, fn_trigger_audit_universal,
--        fn_bootstrap_tenant (extraída literal, no reconstruida).
--   2. supabase/migrations/20260301120000_ai_security_copilot.sql
--      → columnas de seguridad añadidas a profiles.
--   3. supabase/migrations/20260305110000_rls_hardening_p0.sql
--      → endurecimiento RLS aplicado sobre profiles/user_roles_sedes/catálogos.
--   4. DATABASE_MASTER_SCRIPT_S1.md §1-2 → DDL de tablas core (tenants, sedes,
--      profiles, roles, role_permissions, user_roles_sedes, catálogos).
--
-- Convención de marcado heredada de la auditoría:
--   [AUDIT-OK]      confirmado por ≥2 fuentes coherentes o extraído literal de migración.
--   [AUDIT-DOUBT]   no confirmado contra la BD real / sin script de seed versionado.
--   [AUDIT-GAP]     objeto o dato que la auditoría documenta como AUSENTE del repo;
--                   se deja constancia explícita en vez de inventarlo.
--
-- FUERA DE ALCANCE DE ESTE SCRIPT (deliberado, no un olvido):
--   - fn_has_permission(text, uuid) y fn_is_tenant_admin(): referenciadas por las
--     políticas RLS "vigentes" de profiles/user_roles_sedes en la auditoría, pero
--     su definición está AUSENTE del repositorio ([AUDIT-GAP], ver AUDIT_REPORT_S1
--     §4 y §25). Las políticas de este script usan una versión reducida que NO
--     las requiere; ver notas junto a cada política.
--   - public.audit_logs, public.plan_policies, public.subscription_contracts,
--     public.entitlements: tablas referenciadas por fn_trigger_audit_universal()
--     y fn_bootstrap_tenant() pero fuera del alcance "Core Compartido e Identidad"
--     pedido. Ambas funciones se CREAN correctamente sin ellas (son plpgsql; el
--     cuerpo no se valida contra el catálogo hasta la primera ejecución), pero
--     FALLARÁN EN TIEMPO DE EJECUCIÓN si se invocan antes de crear esas tablas.
--   - Seeds de public.cat_permissions: el catálogo de permisos documentado en
--     DATABASE_MASTER_SCRIPT_S1.md §24 es específico del dominio ONG (home.read,
--     operation.activities.manage, etc.) y no aplica como "core compartido" entre
--     Democra-ONG y GYMsos. Se crea la tabla vacía para que cada sistema la
--     pueble con su propio catálogo de permisos.
-- =============================================================================


-- =============================================================================
-- 0. EXTENSIONES
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §0; pgcrypto confirmada también por
-- la migración 20260301120000 (gen_random_uuid() se usa en todo el core).
-- uuid-ossp se documenta como candidata a limpieza (nada usa uuid_generate_v4
-- en el código auditado) pero se incluye por ser parte del baseline documental
-- original; no genera conflicto mantenerla.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- =============================================================================
-- 1. SCHEMAS BASE
-- =============================================================================
-- 'public' ya existe siempre en PostgreSQL/Supabase; no requiere creación.
-- Se crean únicamente los namespaces pedidos para este paso de consolidación;
-- las tablas propias de cada uno se incorporarán en migraciones posteriores.
CREATE SCHEMA IF NOT EXISTS ong;
CREATE SCHEMA IF NOT EXISTS rrhh;
CREATE SCHEMA IF NOT EXISTS finanzas;
CREATE SCHEMA IF NOT EXISTS comunicaciones;
CREATE SCHEMA IF NOT EXISTS auditoria;


-- =============================================================================
-- 2. CATÁLOGOS DE APOYO (dependencias de FK de public.tenants)
-- =============================================================================
-- [AUDIT-OK] Estructura confirmada en DATABASE_MASTER_SCRIPT_S1.md §1.
-- [AUDIT-DOUBT] Los valores de seed de estos 3 catálogos NO están versionados
-- como script ejecutable en el repositorio auditado (solo como comentario de
-- columna en el DDL documental) — ver DATABASE_MASTER_SCRIPT_S1.md §24 y
-- DATABASE_DICTIONARY_S1.md ("Seeds no versionados"). Se seedean aquí los
-- valores documentados porque son un prerrequisito de FK para public.tenants
-- y para que fn_bootstrap_tenant() sea invocable; deben confirmarse contra el
-- catálogo real de producción antes de usar este script en un entorno vivo.

-- Tipos de industria del SaaS multi-tenant.
CREATE TABLE IF NOT EXISTS public.cat_industry_types (
  id text PRIMARY KEY,                    -- 'retail','gym','health','ong',...
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Planes comerciales (referenciados por tenants, billing — billing fuera de alcance aquí).
CREATE TABLE IF NOT EXISTS public.cat_plan_types (
  id text PRIMARY KEY,                    -- 'basic','pro','enterprise'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Estados financieros (FSM) del tenant.
CREATE TABLE IF NOT EXISTS public.cat_tenant_statuses (
  id text PRIMARY KEY,                    -- 'FIN-PENDING','FIN-ACTIVE','FIN-GRACE','FIN-READONLY','FIN-SUSPENDED','FIN-INCONSISTENT'
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Registro maestro de permisos. Tabla estructural compartida; cada sistema
-- (Democra-ONG, GYMsos) la puebla con su propio catálogo de permisos —
-- ver nota de alcance al inicio del archivo.
CREATE TABLE IF NOT EXISTS public.cat_permissions (
  id text PRIMARY KEY,                    -- código de permiso, ej. 'iam.admin', 'gym.members.write'
  description text NOT NULL,
  module text NOT NULL DEFAULT 'core',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cat_industry_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_plan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_tenant_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cat_permissions ENABLE ROW LEVEL SECURITY;

-- [AUDIT-OK] Patrón confirmado en DATABASE_MASTER_SCRIPT_S1.md §21.1/21.2:
-- catálogos son de solo lectura para authenticated, sin escritura por API.
-- NOTA: CREATE POLICY no es idempotente en PostgreSQL (no existe "IF NOT
-- EXISTS" para políticas). Cada CREATE POLICY va precedida de su propio
-- DROP POLICY IF EXISTS para que este script pueda re-ejecutarse sin error
-- ante una corrida previa parcial o completa (sintaxis estándar PG16, a
-- diferencia de "ADD CONSTRAINT IF NOT EXISTS", que no existe).
DROP POLICY IF EXISTS p_cat_industry_types_read ON public.cat_industry_types;
CREATE POLICY p_cat_industry_types_read ON public.cat_industry_types
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS p_cat_industry_types_insert_block ON public.cat_industry_types;
CREATE POLICY p_cat_industry_types_insert_block ON public.cat_industry_types
  FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_industry_types_update_block ON public.cat_industry_types;
CREATE POLICY p_cat_industry_types_update_block ON public.cat_industry_types
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_industry_types_delete_block ON public.cat_industry_types;
CREATE POLICY p_cat_industry_types_delete_block ON public.cat_industry_types
  FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS p_cat_plan_types_read ON public.cat_plan_types;
CREATE POLICY p_cat_plan_types_read ON public.cat_plan_types
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS p_cat_plan_types_insert_block ON public.cat_plan_types;
CREATE POLICY p_cat_plan_types_insert_block ON public.cat_plan_types
  FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_plan_types_update_block ON public.cat_plan_types;
CREATE POLICY p_cat_plan_types_update_block ON public.cat_plan_types
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_plan_types_delete_block ON public.cat_plan_types;
CREATE POLICY p_cat_plan_types_delete_block ON public.cat_plan_types
  FOR DELETE TO authenticated USING (false);

DROP POLICY IF EXISTS p_cat_tenant_statuses_select ON public.cat_tenant_statuses;
CREATE POLICY p_cat_tenant_statuses_select ON public.cat_tenant_statuses
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS p_cat_permissions_read ON public.cat_permissions;
CREATE POLICY p_cat_permissions_read ON public.cat_permissions
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS p_cat_permissions_insert_block ON public.cat_permissions;
CREATE POLICY p_cat_permissions_insert_block ON public.cat_permissions
  FOR INSERT TO authenticated WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_permissions_update_block ON public.cat_permissions;
CREATE POLICY p_cat_permissions_update_block ON public.cat_permissions
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS p_cat_permissions_delete_block ON public.cat_permissions;
CREATE POLICY p_cat_permissions_delete_block ON public.cat_permissions
  FOR DELETE TO authenticated USING (false);

REVOKE ALL ON TABLE public.cat_permissions FROM anon;
GRANT SELECT ON TABLE public.cat_permissions TO authenticated;


-- =============================================================================
-- 3. public.tenants — raíz del modelo multi-tenant
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §2. industry_type_id NOT NULL con FK
-- a cat_industry_types soporta cualquier valor sembrado ahí, incluyendo 'gym'
-- (ver seed en §12 de este script).
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tax_id text NOT NULL UNIQUE,                                          -- RUC 11 dígitos, validado en fn_bootstrap_tenant
  industry_type_id text NOT NULL REFERENCES public.cat_industry_types(id),
  plan_id text NOT NULL REFERENCES public.cat_plan_types(id),
  status_financial_id text NOT NULL DEFAULT 'FIN-PENDING' REFERENCES public.cat_tenant_statuses(id),
  billing_day int NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  max_licenses int NOT NULL DEFAULT 1 CHECK (max_licenses >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status_financial_id);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- [AUDIT-GAP] Ninguna fuente auditada (Parte 1 §15, migraciones root) define
-- ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY ni una política para
-- esta tabla, pese a que DB_MAESTRA.md afirma "RLS: solo lectura al propio
-- tenant" (ver AUDIT_REPORT_S1.md §4 y §21, DATABASE_MASTER_SCRIPT_S1.md §21
-- nota superior). RLS se habilita aquí por instrucción explícita de este
-- encargo, pero NO se inventa una política: queda sin políticas (deny-all
-- por defecto de Postgres) hasta que el equipo de consolidación decida el
-- criterio real (candidato razonable: SELECT solo si id = fn_current_tenant_id()).


-- =============================================================================
-- 4. public.profiles — perfil 1:1 con Supabase Auth; ancla de fn_current_tenant_id
-- =============================================================================
-- [AUDIT-OK] Estructura base: DATABASE_MASTER_SCRIPT_S1.md §2.
-- [AUDIT-OK] pin_failed_attempts/pin_last_failed_at/pin_blocked_until/
-- risk_blocked_until: añadidas literalmente por supabase/migrations/
-- 20260301120000_ai_security_copilot.sql (seguridad PIN/riesgo).
-- [AUDIT-DOUBT] tipo_documento/numero_documento/genero: usadas por
-- fn_complete_access_onboarding y la vista ACE v_user_session_context, pero
-- su migración de origen está AUSENTE del repositorio (DATABASE_MASTER_SCRIPT_S1
-- §2 nota, AUDIT_REPORT_S1 §25). Se incluyen porque el propio encargo pide
-- "todas las columnas añadidas por seguridad y flujos de onboarding" y estas
-- están confirmadas por 2 fuentes de código (app-database.ts + la función),
-- aunque no por una migración versionada.
--
-- Requiere: schema `auth` de Supabase Auth (auth.users) ya existente en el
-- proyecto destino. En un Postgres plano sin Supabase Auth, la FK de abajo
-- fallará y debe sustituirse por el mecanismo de identidad equivalente.
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id uuid NULL REFERENCES public.tenants(id) ON DELETE SET NULL,  -- NULL durante pre-onboarding
  full_name text NULL,
  pin_hash text NULL,
  is_blocked boolean NOT NULL DEFAULT false,
  blocked_reason text NULL,
  -- Seguridad PIN/riesgo (migración 20260301120000_ai_security_copilot):
  pin_failed_attempts int NOT NULL DEFAULT 0,
  pin_last_failed_at timestamptz NULL,
  pin_blocked_until timestamptz NULL,
  risk_blocked_until timestamptz NULL,
  -- Onboarding / ACE (sin migración versionada — [AUDIT-DOUBT], ver nota arriba):
  tipo_documento text NULL,
  numero_documento text NULL,
  genero text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_profiles_tenant ON public.profiles(tenant_id);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- =============================================================================
-- 5. fn_current_tenant_id() — versión SECURITY DEFINER vigente (NO legacy)
-- =============================================================================
-- [AUDIT-OK] Extraída literal de supabase/migrations/
-- 20260302125000_fix_bootstrap_audit_tenant_null.sql (idéntica en
-- 20260305110000_rls_hardening_p0.sql). Esta es la versión "B" que el propio
-- AUDIT_REPORT_S1.md §4 marca como vigente, en reemplazo de la versión legacy
-- basada en current_setting('app.current_tenant_id') (Parte 1), que devolvía
-- NULL en todo entorno donde no se configurara esa GUC de sesión y rompía el
-- aislamiento de RLS.
--
-- Requiere que public.profiles ya exista (función LANGUAGE SQL: Postgres
-- valida la referencia a la tabla en el momento de CREATE FUNCTION).
CREATE OR REPLACE FUNCTION public.fn_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.tenant_id
  FROM public.profiles p
  WHERE p.id = auth.uid()
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.fn_current_tenant_id() TO authenticated, service_role, anon;


-- =============================================================================
-- 6. public.sedes — sedes físicas por tenant
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §2. tenant_id se autocompleta con
-- fn_current_tenant_id() si el INSERT no lo especifica explícitamente
-- (fn_bootstrap_tenant sí lo pasa explícito).
CREATE TABLE IF NOT EXISTS public.sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sedes_tenant ON public.sedes(tenant_id);

ALTER TABLE public.sedes ENABLE ROW LEVEL SECURITY;

-- [AUDIT-OK] Patrón confirmado en DATABASE_MASTER_SCRIPT_S1.md §21.6
-- (`p_sedes_tenant_all`), usa solo fn_current_tenant_id() — sin dependencias
-- fuera de este baseline.
DROP POLICY IF EXISTS p_sedes_tenant_all ON public.sedes;
CREATE POLICY p_sedes_tenant_all ON public.sedes
  FOR ALL TO authenticated
  USING (tenant_id = public.fn_current_tenant_id())
  WITH CHECK (tenant_id = public.fn_current_tenant_id());


-- =============================================================================
-- 7. public.roles — roles jerárquicos por tenant
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §2. UNIQUE(tenant_id, name)
-- confirmado por ON CONFLICT (tenant_id, name) en supabase/tests/
-- fase1_onboarding_test.sql.
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  hierarchy_level int NOT NULL DEFAULT 100,     -- 0 = máximo poder (Owner)
  is_system_role boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);

CREATE INDEX IF NOT EXISTS idx_roles_tenant ON public.roles(tenant_id);

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- [AUDIT-OK] Patrón confirmado en DATABASE_MASTER_SCRIPT_S1.md §21.6
-- (`p_roles_tenant_all`).
DROP POLICY IF EXISTS p_roles_tenant_all ON public.roles;
CREATE POLICY p_roles_tenant_all ON public.roles
  FOR ALL TO authenticated
  USING (tenant_id = public.fn_current_tenant_id())
  WITH CHECK (tenant_id = public.fn_current_tenant_id());


-- =============================================================================
-- 8. public.role_permissions — permisos asignados a un rol
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §2. PK compuesta (role_id,
-- permission), confirmada también por DATABASE_DICTIONARY_S1.md §1.2.
-- Nota de alcance: el trigger de validación de `permission` contra
-- cat_permissions (mencionado en DATABASE_MASTER_SCRIPT_S1.md §2 nota, §19)
-- NO se incluye aquí porque no fue solicitado explícitamente en este encargo
-- y su definición completa no forma parte de la lista de funciones pedida.
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- [AUDIT-DOUBT] DATABASE_MASTER_SCRIPT_S1.md §21.6 solo lista los NOMBRES
-- `p_role_permissions_tenant_select` / `p_role_permissions_tenant_write` sin
-- dar el cuerpo SQL exacto (a diferencia de sedes/roles, que sí traen el
-- patrón completo). role_permissions no tiene columna tenant_id propia, así
-- que el aislamiento por tenant solo puede expresarse vía join a roles. La
-- política de abajo es una reconstrucción razonable de esa intención, NO una
-- extracción literal — debe revisarse contra la BD real antes de asumirla
-- como definitiva.
DROP POLICY IF EXISTS p_role_permissions_tenant_select ON public.role_permissions;
CREATE POLICY p_role_permissions_tenant_select ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.tenant_id = public.fn_current_tenant_id()
    )
  );

DROP POLICY IF EXISTS p_role_permissions_tenant_write ON public.role_permissions;
CREATE POLICY p_role_permissions_tenant_write ON public.role_permissions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.tenant_id = public.fn_current_tenant_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.roles r
      WHERE r.id = role_permissions.role_id
        AND r.tenant_id = public.fn_current_tenant_id()
    )
  );


-- =============================================================================
-- 9. public.user_roles_sedes — asignación usuario–rol–sede (IAM)
-- =============================================================================
-- [AUDIT-OK] DATABASE_MASTER_SCRIPT_S1.md §2. tenant_id NOT NULL + FK
-- 'fk_user_roles_sedes_tenant' impuestos originalmente por la migración
-- 20260305110000_rls_hardening_p0 (aquí ya se define NOT NULL desde el CREATE,
-- por ser DDL de baseline y no un ALTER incremental).
--
-- [AUDIT-GAP] server/routes/iam.js hace .delete().eq("id", assignmentId) sobre
-- esta tabla, pero NINGUNA fuente auditada define una columna `id` — la PK es
-- compuesta (user_id, role_id, sede_id). Posible bug del server o columna
-- añadida fuera del repo; no se inventa aquí una columna `id` sin evidencia.
-- Requiere confirmación manual antes de la consolidación (ver AUDIT_REPORT_S1
-- §8.8).
CREATE TABLE IF NOT EXISTS public.user_roles_sedes (
  tenant_id uuid NOT NULL DEFAULT public.fn_current_tenant_id()
    REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_id uuid NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  sede_id uuid NOT NULL REFERENCES public.sedes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, role_id, sede_id)
);

CREATE INDEX IF NOT EXISTS idx_urs_tenant ON public.user_roles_sedes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_urs_user   ON public.user_roles_sedes(user_id);
CREATE INDEX IF NOT EXISTS idx_urs_sede   ON public.user_roles_sedes(sede_id);

ALTER TABLE public.user_roles_sedes ENABLE ROW LEVEL SECURITY;

-- [AUDIT-OK con reducción documentada] DATABASE_MASTER_SCRIPT_S1.md §21.4 da
-- el cuerpo exacto de p_urs_select/insert/update/delete vigentes, pero
-- insert/update/delete requieren fn_has_permission('iam.user_roles.manage', null)
-- o fn_is_tenant_admin() — ambas [AUDIT-GAP], sin definición en el repo
-- (AUDIT_REPORT_S1 §4, §25) y fuera del alcance de este baseline. Se replica
-- aquí SOLO la política de SELECT (que no depende de esas funciones) y se deja
-- constancia explícita de que insert/update/delete NO tienen política propia
-- todavía: con RLS habilitada y sin políticas para esos comandos, Postgres
-- las deniega por defecto (fail-closed), hasta que la capa de permisos se
-- incorpore en una migración posterior.
DROP POLICY IF EXISTS p_urs_select ON public.user_roles_sedes;
CREATE POLICY p_urs_select ON public.user_roles_sedes
  FOR SELECT TO authenticated
  USING (tenant_id = public.fn_current_tenant_id());


-- =============================================================================
-- 10. fn_trigger_audit_universal() — trigger de auditoría universal (multi-esquema, multi-tenant)
-- =============================================================================
-- [AUDIT-OK] Reescritura sobre la base literal de supabase/migrations/
-- 20260302125000_fix_bootstrap_audit_tenant_null.sql, evolucionada para
-- servir de forma transparente a AMBOS sistemas concurrentes sobre el mismo
-- core: Sistema 1 (ONG — esquemas 'ong'/'rrhh'/'finanzas'/'comunicaciones') y
-- Sistema 2 (GYMsos — esquema 'gym'). Cambios frente a la versión anterior:
--
--   1. YA NO depende de TG_ARGV[0] (nombre de columna de tenant pasado como
--      argumento del trigger). Triggers ya existentes que aún pasen un
--      argumento (p. ej. `EXECUTE FUNCTION fn_trigger_audit_universal('tenant_id')`)
--      siguen funcionando sin error — el argumento queda simplemente sin uso —
--      y las tablas nuevas (incluidas las de 'gym') ya no necesitan declarar
--      ninguno: `CREATE TRIGGER ... EXECUTE FUNCTION fn_trigger_audit_universal();`
--   2. Captura TG_TABLE_SCHEMA además de TG_TABLE_NAME y TG_OP. El modelo
--      VIGENTE de audit_logs (columnas event_type/resource_name/payload_*,
--      ver DATABASE_MASTER_SCRIPT_S1.md §5) NO tiene una columna dedicada
--      `schema_name` (esa pertenece al modelo LEGACY, ver AUDIT_REPORT_S1 §4),
--      así que el esquema de origen se codifica en resource_name como
--      'esquema.tabla' (ej. 'gym.members', 'ong.activities'). Esto evita un
--      ALTER TABLE audit_logs fuera del alcance de esta tarea, y permite
--      distinguir de qué sistema vino cada evento con una simple consulta
--      `WHERE resource_name LIKE 'gym.%'`.
--   3. Resolución de tenant_id ahora se auto-detecta por fila, sin que quien
--      declara el trigger necesite conocer el nombre de la columna:
--        a) Lee 'tenant_id' directamente del payload JSONB ya serializado
--           (NEW primero; OLD como respaldo, relevante en DELETE). El
--           operador ->> retorna NULL si la clave no existe, en vez de
--           lanzar el error "record has no field" que ocurriría accediendo a
--           NEW.tenant_id/OLD.tenant_id directamente en una tabla que no
--           tenga esa columna (caso esperable en tablas nuevas de 'gym').
--        b) Si (a) no resolvió nada (columna ausente o valor NULL), hace
--           fallback a public.profiles vía auth.uid() — igual criterio que
--           fn_current_tenant_id() — para que ningún log quede huérfano de
--           inquilino.
--   4. Mantiene la salvaguarda de la versión anterior: audit_logs.tenant_id
--      es NOT NULL; si tras (a) y (b) el tenant sigue sin resolverse (p. ej.
--      pre-onboarding sin profile aún asignado), la función omite el
--      registro (RETURN NULL) en vez de abortar la transacción del llamador
--      — el mismo bug que corrigió 20260302125000_fix_bootstrap_audit_tenant_null.sql.
--
-- [AUDIT-GAP] (heredado, sin cambios): esta función sigue referenciando
-- public.audit_logs y public.plan_policies, ninguna en el alcance "Core
-- Compartido e Identidad" de este script. CREATE FUNCTION es válido (plpgsql,
-- cuerpo no validado hasta la primera ejecución), pero cualquier trigger que
-- la dispare FALLARÁ en tiempo de ejecución hasta que ambas tablas existan.
CREATE OR REPLACE FUNCTION public.fn_trigger_audit_universal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id       uuid := auth.uid();
  v_payload_before jsonb;
  v_payload_after  jsonb;
  v_tenant_id      uuid;
  v_resource_name  text := format('%I.%I', TG_TABLE_SCHEMA, TG_TABLE_NAME);
BEGIN
  -- Serialización universal OLD/NEW a JSONB: to_jsonb() funciona igual sin
  -- importar de qué esquema/tabla venga la fila (ong, rrhh, gym, ...) — por
  -- eso una SOLA función puede ser reusada como trigger por ambos sistemas.
  v_payload_before := CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END;
  v_payload_after  := CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END;

  -- (a) Intento directo: leer 'tenant_id' del payload JSONB ya serializado
  -- (NEW primero; en DELETE, payload_after es NULL y cae a payload_before/OLD).
  -- ->> retorna NULL en vez de lanzar error si la tabla no tiene esa columna,
  -- lo que permite auto-detectar tablas de 'gym' sin columna tenant_id propia.
  v_tenant_id := COALESCE(
    v_payload_after  ->> 'tenant_id',
    v_payload_before ->> 'tenant_id'
  )::uuid;

  -- (b) Fallback multi-tenant: la tabla de origen no tiene tenant_id propio
  -- -> resolver vía profiles usando el actor autenticado, igual criterio que
  -- fn_current_tenant_id(). Así ningún log queda huérfano de inquilino.
  IF v_tenant_id IS NULL THEN
    SELECT p.tenant_id
      INTO v_tenant_id
    FROM public.profiles p
    WHERE p.id = v_actor_id
    LIMIT 1;
  END IF;

  -- Salvaguarda heredada: audit_logs.tenant_id es NOT NULL. Si ni (a) ni (b)
  -- resolvieron un tenant (p. ej. pre-onboarding sin profile asignado aún),
  -- se omite el registro en vez de romper la transacción del llamador.
  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO public.audit_logs(
    tenant_id,
    actor_id,
    event_type,
    resource_name,
    payload_before,
    payload_after,
    ip,
    user_agent,
    retention_until
  )
  VALUES (
    v_tenant_id,
    v_actor_id,
    TG_OP,            -- 'INSERT' | 'UPDATE' | 'DELETE'
    v_resource_name,  -- 'esquema.tabla', ej. 'gym.members' u 'ong.activities'
    v_payload_before,
    v_payload_after,
    NULL,
    NULL,
    now() + make_interval(days =>
      COALESCE(
        (
          SELECT pp.retention_days
          FROM public.tenants t
          JOIN public.plan_policies pp ON pp.plan_id = t.plan_id
          WHERE t.id = v_tenant_id
          LIMIT 1
        ),
        180
      )
    )
  );

  RETURN NULL;
END;
$$;


-- =============================================================================
-- 11. fn_bootstrap_tenant() — alta idempotente de tenant (firma completa, 5 parámetros)
-- =============================================================================
-- [AUDIT-OK] Extraída literal de supabase/migrations/
-- 20260302125000_fix_bootstrap_audit_tenant_null.sql. Firma de 5 parámetros
-- (p_tenant_name, p_tax_id, p_industry_type_id, p_plan_id DEFAULT 'basic',
-- p_billing_day DEFAULT 1), SECURITY DEFINER, idempotente: si auth.uid() ya
-- tiene tenant_id asignado en profiles, retorna el existente sin duplicar
-- (ver AUDIT_REPORT_S1 §4 — reemplaza la versión de 4 parámetros sin
-- validación de Parte 1).
--
-- [AUDIT-GAP] Los pasos 7 y 8 del cuerpo (subscription_contracts,
-- entitlements, y el join a plan_policies) referencian tablas de
-- suscripción/billing fuera del alcance de este baseline. Igual que con
-- fn_trigger_audit_universal, el CREATE FUNCTION es válido (plpgsql), pero la
-- función FALLARÁ en tiempo de ejecución en los pasos 7/8 hasta que esas
-- tablas existan. Los pasos 1-6 (tenant, profile, sede, rol Owner, permisos,
-- asignación) sí son ejecutables solo con los objetos de este script.
CREATE OR REPLACE FUNCTION public.fn_bootstrap_tenant(
  p_tenant_name text,
  p_tax_id text,
  p_industry_type_id text,
  p_plan_id text DEFAULT 'basic',
  p_billing_day int DEFAULT 1
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_existing_tenant_id uuid;
  v_tenant_id uuid;
  v_sede_id uuid;
  v_role_owner_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF COALESCE(trim(p_tenant_name), '') = '' THEN
    RAISE EXCEPTION 'tenant_name is required';
  END IF;

  IF p_tax_id IS NULL OR p_tax_id !~ '^[0-9]{11}$' THEN
    RAISE EXCEPTION 'tax_id must be an 11-digit RUC';
  END IF;

  IF p_billing_day IS NULL OR p_billing_day < 1 OR p_billing_day > 28 THEN
    RAISE EXCEPTION 'billing_day must be between 1 and 28';
  END IF;

  -- Idempotencia: si el usuario ya tiene tenant, se retorna el existente.
  SELECT p.tenant_id
    INTO v_existing_tenant_id
  FROM public.profiles p
  WHERE p.id = v_user_id
  LIMIT 1;

  IF v_existing_tenant_id IS NOT NULL THEN
    RETURN v_existing_tenant_id;
  END IF;

  -- 1) Crear tenant primero.
  INSERT INTO public.tenants(name, tax_id, industry_type_id, plan_id, status_financial_id, billing_day, max_licenses)
  VALUES (p_tenant_name, p_tax_id, p_industry_type_id, p_plan_id, 'FIN-ACTIVE', p_billing_day, 1)
  RETURNING id INTO v_tenant_id;

  -- 2) Upsert profile con tenant_id ya resuelto (evita auditoría con tenant null).
  INSERT INTO public.profiles(id, tenant_id, full_name)
  VALUES (v_user_id, v_tenant_id, NULL)
  ON CONFLICT (id) DO UPDATE
    SET tenant_id = excluded.tenant_id;

  -- 3) Crear sede principal.
  INSERT INTO public.sedes(tenant_id, name, is_active)
  VALUES (v_tenant_id, 'Principal', true)
  RETURNING id INTO v_sede_id;

  -- 4) Crear rol Owner.
  INSERT INTO public.roles(tenant_id, name, hierarchy_level, is_system_role)
  VALUES (v_tenant_id, 'Owner', 0, true)
  RETURNING id INTO v_role_owner_id;

  -- 5) Asignar permisos al Owner (no-op si cat_permissions aún no está poblada).
  INSERT INTO public.role_permissions(role_id, permission)
  SELECT v_role_owner_id, p.id
  FROM public.cat_permissions p
  ON CONFLICT DO NOTHING;

  -- 6) Asignar Owner al creador.
  INSERT INTO public.user_roles_sedes(tenant_id, user_id, role_id, sede_id)
  VALUES (v_tenant_id, v_user_id, v_role_owner_id, v_sede_id)
  ON CONFLICT DO NOTHING;

  -- 7) Crear/actualizar contrato — [AUDIT-GAP] requiere public.subscription_contracts (fuera de alcance).
  INSERT INTO public.subscription_contracts(
    tenant_id, current_plan_id, status_id, billing_day, grace_days
  )
  VALUES (v_tenant_id, p_plan_id, 'ACTIVE', p_billing_day, 7)
  ON CONFLICT (tenant_id) DO UPDATE
    SET current_plan_id = excluded.current_plan_id,
        status_id = excluded.status_id,
        billing_day = excluded.billing_day,
        updated_at = now();

  -- 8) Crear/actualizar entitlements — [AUDIT-GAP] requiere public.entitlements y
  --    public.plan_policies (fuera de alcance).
  INSERT INTO public.entitlements(tenant_id, plan_id, max_sedes, max_licenses, can_use_terminals)
  SELECT v_tenant_id, pp.plan_id, pp.max_sedes, pp.max_licenses, pp.can_use_terminals
  FROM public.plan_policies pp
  WHERE pp.plan_id = p_plan_id
  ON CONFLICT (tenant_id) DO UPDATE
    SET plan_id = excluded.plan_id,
        max_sedes = excluded.max_sedes,
        max_licenses = excluded.max_licenses,
        can_use_terminals = excluded.can_use_terminals,
        updated_at = now();

  RETURN v_tenant_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_bootstrap_tenant(text, text, text, text, int) TO authenticated, service_role;


-- =============================================================================
-- 12. SEEDS DE CATÁLOGOS — [AUDIT-DOUBT], ver nota de §2
-- =============================================================================
-- Valores documentados como comentario de columna en DATABASE_MASTER_SCRIPT_S1.md
-- §1-2, sin script de seed ejecutable versionado en el repositorio origen.
-- Se insertan aquí los mínimos necesarios para que fn_bootstrap_tenant() sea
-- invocable end-to-end (pasos 1-6) y para dar soporte explícito a
-- industry_type_id = 'gym' pedido por este encargo. CONFIRMAR contra el
-- catálogo real de producción antes de usar en un entorno vivo.

INSERT INTO public.cat_industry_types (id, description) VALUES
  ('retail', 'Comercio minorista'),
  ('gym', 'Gimnasios y centros deportivos'),
  ('health', 'Salud'),
  ('ong', 'Organizaciones no gubernamentales')
ON CONFLICT (id) DO NOTHING;
-- [AUDIT-DOUBT] La lista fuente termina en "..." (incompleta); pueden existir
-- más valores en producción no documentados en el repo auditado.

INSERT INTO public.cat_plan_types (id, description) VALUES
  ('basic', 'Plan básico'),
  ('pro', 'Plan profesional'),
  ('enterprise', 'Plan empresarial')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.cat_tenant_statuses (id, description) VALUES
  ('FIN-PENDING', 'Pendiente de activación'),
  ('FIN-ACTIVE', 'Activo'),
  ('FIN-GRACE', 'En periodo de gracia'),
  ('FIN-READONLY', 'Solo lectura'),
  ('FIN-SUSPENDED', 'Suspendido'),
  ('FIN-INCONSISTENT', 'Estado inconsistente')
ON CONFLICT (id) DO NOTHING;

-- public.cat_permissions se deja intencionalmente sin seed — ver nota de
-- alcance al inicio del archivo (catálogo específico de cada sistema).


-- =============================================================================
-- FIN DE 00000000000000_core_baseline.sql
-- =============================================================================
-- Resumen de lo NO incluido a propósito (ver notas [AUDIT-GAP] en línea):
--   - fn_has_permission(text, uuid), fn_is_tenant_admin(): sin definición en
--     el repo auditado; políticas reducidas a lo que fn_current_tenant_id()
--     puede resolver por sí sola.
--   - public.audit_logs, public.plan_policies, public.subscription_contracts,
--     public.entitlements: dependencias de fn_trigger_audit_universal() y
--     fn_bootstrap_tenant() fuera del "Core Compartido e Identidad" pedido.
--   - Trigger de validación de role_permissions.permission contra
--     cat_permissions, y el propio trigger tr_audit_profiles / tr_audit_urs
--     (no pedidos explícitamente en este encargo).
--   - Seeds de public.cat_permissions (catálogo específico por sistema).
-- Próximo paso de consolidación sugerido: decidir si estas dependencias se
-- traen en un "01..._core_extensions.sql" antes de que GYMsos empiece a
-- escribir sobre este baseline.
