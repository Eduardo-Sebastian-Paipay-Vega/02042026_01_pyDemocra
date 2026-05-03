-- =============================================================================
-- SCRIPT MAESTRO DOCUMENTAL
-- PARTE 3: CIERRE DE MIGRACIONES, HARDENING Y VERIFICACIÓN FINAL
-- Basado en:
--   - MIGRACIÓN 1 (preflight / diagnóstico seguro)
--   - MIGRACIÓN 2 (tenant default + auditoría base + created_by/updated_by)
--   - MIGRACIÓN 3 (diagnóstico defensivo de integridad)
--   - MIGRACIÓN 4 (FKs auth.users + checks + índices)
-- =============================================================================

-- =============================================================================
-- A. PREFLIGHT / DIAGNÓSTICO DOCUMENTAL (LECTURA)
-- =============================================================================
BEGIN;
SET search_path = public;

-- ---------------------------------------------------------------------------
-- A1. Sanity check
-- ---------------------------------------------------------------------------
SELECT
  current_database()                   AS db_name,
  current_user                         AS db_user,
  now()                                AS executed_at,
  current_setting('search_path', true) AS current_search_path;

SELECT
  n.nspname AS schema_name,
  p.proname AS function_name
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN ('fn_current_tenant_id', 'fn_set_updated_at', 'fn_is_module_enabled')
ORDER BY n.nspname, p.proname;

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name IN (
  'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
  'auditoria', 'donaciones', 'clinico', 'academico',
  'gamificacion', 'impacto'
)
ORDER BY schema_name;

-- ---------------------------------------------------------------------------
-- A2. Inventario de tablas
-- ---------------------------------------------------------------------------
SELECT
  t.table_schema,
  t.table_name
FROM information_schema.tables t
WHERE t.table_type = 'BASE TABLE'
  AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
ORDER BY t.table_schema, t.table_name;

-- ---------------------------------------------------------------------------
-- A3. Tablas de negocio sin tenant_id
-- Excluye catálogos globales y catálogos de módulo conocidos
-- ---------------------------------------------------------------------------
WITH business_tables AS (
  SELECT t.table_schema, t.table_name
  FROM information_schema.tables t
  WHERE t.table_type = 'BASE TABLE'
    AND t.table_schema NOT IN ('pg_catalog', 'information_schema')
    AND NOT (
      (t.table_schema = 'public' AND t.table_name LIKE 'cat\_%' ESCAPE '\')
      OR (t.table_schema = 'ong' AND t.table_name IN (
          'estados_voluntario',
          'unidades_medida',
          'estados_objeto',
          'estados_proyecto',
          'tipo_transaccion_inventario'
      ))
      OR (t.table_schema = 'rrhh' AND t.table_name = 'habilidades')
      OR (t.table_schema = 'impacto' AND t.table_name = 'ods_globales')
      OR (t.table_schema = 'comunicaciones' AND t.table_name = 'canales_notificacion')
    )
)
SELECT
  bt.table_schema,
  bt.table_name
FROM business_tables bt
LEFT JOIN information_schema.columns c
  ON c.table_schema = bt.table_schema
 AND c.table_name   = bt.table_name
 AND c.column_name  = 'tenant_id'
WHERE c.column_name IS NULL
ORDER BY bt.table_schema, bt.table_name;

-- ---------------------------------------------------------------------------
-- A4. tenant_id sin DEFAULT public.fn_current_tenant_id()
-- ---------------------------------------------------------------------------
SELECT
  c.table_schema,
  c.table_name,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema IN (
    'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
    'auditoria', 'academico', 'clinico', 'donaciones',
    'gamificacion', 'impacto'
)
  AND c.column_name = 'tenant_id'
  AND NOT (
    (c.table_schema = 'public' AND c.table_name LIKE 'cat\_%' ESCAPE '\')
    OR (c.table_schema = 'ong' AND c.table_name IN (
        'estados_voluntario',
        'unidades_medida',
        'estados_objeto',
        'estados_proyecto',
        'tipo_transaccion_inventario'
    ))
    OR (c.table_schema = 'rrhh' AND c.table_name = 'habilidades')
    OR (c.table_schema = 'impacto' AND c.table_name = 'ods_globales')
    OR (c.table_schema = 'comunicaciones' AND c.table_name = 'canales_notificacion')
  )
  AND (
    c.column_default IS NULL
    OR c.column_default NOT ILIKE '%fn_current_tenant_id%'
  )
ORDER BY c.table_schema, c.table_name;

-- ---------------------------------------------------------------------------
-- A5. Tablas transaccionales sin created_at / updated_at
-- ---------------------------------------------------------------------------
SELECT
  t.table_schema,
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'created_at'
  ) AS has_created_at,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'updated_at'
  ) AS has_updated_at
FROM information_schema.tables t
WHERE t.table_type = 'BASE TABLE'
  AND t.table_schema IN (
    'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
    'auditoria', 'academico', 'clinico', 'donaciones',
    'gamificacion', 'impacto'
  )
  AND NOT (
    (t.table_schema = 'public' AND t.table_name LIKE 'cat\_%' ESCAPE '\')
    OR (t.table_schema = 'ong' AND t.table_name IN (
        'estados_voluntario',
        'unidades_medida',
        'estados_objeto',
        'estados_proyecto',
        'tipo_transaccion_inventario'
    ))
    OR (t.table_schema = 'rrhh' AND t.table_name = 'habilidades')
    OR (t.table_schema = 'impacto' AND t.table_name = 'ods_globales')
    OR (t.table_schema = 'comunicaciones' AND t.table_name = 'canales_notificacion')
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'tenant_id'
  )
ORDER BY t.table_schema, t.table_name;

-- ---------------------------------------------------------------------------
-- A6. Tablas transaccionales sin created_by / updated_by
-- ---------------------------------------------------------------------------
SELECT
  t.table_schema,
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'created_by'
  ) AS has_created_by,
  EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'updated_by'
  ) AS has_updated_by
FROM information_schema.tables t
WHERE t.table_type = 'BASE TABLE'
  AND t.table_schema IN (
    'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
    'auditoria', 'academico', 'clinico', 'donaciones',
    'gamificacion', 'impacto'
  )
  AND NOT (
    (t.table_schema = 'public' AND t.table_name LIKE 'cat\_%' ESCAPE '\')
    OR (t.table_schema = 'ong' AND t.table_name IN (
        'estados_voluntario',
        'unidades_medida',
        'estados_objeto',
        'estados_proyecto',
        'tipo_transaccion_inventario'
    ))
    OR (t.table_schema = 'rrhh' AND t.table_name = 'habilidades')
    OR (t.table_schema = 'impacto' AND t.table_name = 'ods_globales')
    OR (t.table_schema = 'comunicaciones' AND t.table_name = 'canales_notificacion')
  )
  AND EXISTS (
    SELECT 1
    FROM information_schema.columns c
    WHERE c.table_schema = t.table_schema
      AND c.table_name   = t.table_name
      AND c.column_name  = 'tenant_id'
  )
ORDER BY t.table_schema, t.table_name;

-- ---------------------------------------------------------------------------
-- A7. Tablas con tenant_id y RLS desactivado
-- ---------------------------------------------------------------------------
WITH tables_with_tenant AS (
  SELECT DISTINCT c.table_schema, c.table_name
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema
   AND t.table_name   = c.table_name
  WHERE t.table_type = 'BASE TABLE'
    AND c.column_name = 'tenant_id'
    AND c.table_schema IN (
      'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
      'auditoria', 'academico', 'clinico', 'donaciones',
      'gamificacion', 'impacto'
    )
)
SELECT
  n.nspname AS table_schema,
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN tables_with_tenant twt
  ON twt.table_schema = n.nspname
 AND twt.table_name   = c.relname
WHERE c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY n.nspname, c.relname;

COMMIT;

-- =============================================================================
-- B. NORMALIZACIÓN DEFENSIVA FINAL
-- tenant_id default + auditoría temporal + trazabilidad humana
-- =============================================================================
BEGIN;
SET search_path = public;

-- ---------------------------------------------------------------------------
-- B1. tenant_id DEFAULT fn_current_tenant_id()
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      c.table_schema,
      c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name   = c.table_name
    WHERE t.table_type = 'BASE TABLE'
      AND c.column_name = 'tenant_id'
      AND c.table_schema IN (
        'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
        'auditoria', 'academico', 'clinico', 'donaciones',
        'gamificacion', 'impacto'
      )
      AND NOT (
        (c.table_schema = 'public' AND c.table_name LIKE 'cat\_%' ESCAPE '\')
        OR (c.table_schema = 'ong' AND c.table_name IN (
            'estados_voluntario',
            'unidades_medida',
            'estados_objeto',
            'estados_proyecto',
            'tipo_transaccion_inventario'
        ))
        OR (c.table_schema = 'rrhh' AND c.table_name = 'habilidades')
        OR (c.table_schema = 'impacto' AND c.table_name = 'ods_globales')
        OR (c.table_schema = 'comunicaciones' AND c.table_name = 'canales_notificacion')
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ALTER COLUMN tenant_id SET DEFAULT public.fn_current_tenant_id()',
      r.table_schema, r.table_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- B2. created_at + updated_at
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      t.table_schema,
      t.table_name
    FROM information_schema.tables t
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema IN (
        'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
        'auditoria', 'academico', 'clinico', 'donaciones',
        'gamificacion', 'impacto'
      )
      AND NOT (
        (t.table_schema = 'public' AND t.table_name LIKE 'cat\_%' ESCAPE '\')
        OR (t.table_schema = 'ong' AND t.table_name IN (
            'estados_voluntario',
            'unidades_medida',
            'estados_objeto',
            'estados_proyecto',
            'tipo_transaccion_inventario'
        ))
        OR (t.table_schema = 'rrhh' AND t.table_name = 'habilidades')
        OR (t.table_schema = 'impacto' AND t.table_name = 'ods_globales')
        OR (t.table_schema = 'comunicaciones' AND t.table_name = 'canales_notificacion')
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema
          AND c.table_name   = t.table_name
          AND c.column_name  = 'tenant_id'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now()',
      r.table_schema, r.table_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now()',
      r.table_schema, r.table_name
    );
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- B3. Triggers updated_at
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
  v_trigger_name text;
BEGIN
  FOR r IN
    SELECT
      c.table_schema,
      c.table_name
    FROM information_schema.columns c
    WHERE c.column_name = 'updated_at'
      AND c.table_schema IN (
        'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
        'auditoria', 'academico', 'clinico', 'donaciones',
        'gamificacion', 'impacto'
      )
    GROUP BY c.table_schema, c.table_name
  LOOP
    v_trigger_name := format('trg_%s_%s_set_updated_at', r.table_schema, r.table_name);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_trigger trg
      WHERE trg.tgname = v_trigger_name
        AND trg.tgrelid = format('%I.%I', r.table_schema, r.table_name)::regclass
        AND NOT trg.tgisinternal
    ) THEN
      EXECUTE format(
        'CREATE TRIGGER %I
           BEFORE UPDATE ON %I.%I
           FOR EACH ROW
           EXECUTE FUNCTION public.fn_set_updated_at()',
        v_trigger_name, r.table_schema, r.table_name
      );
    END IF;
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- B4. created_by + updated_by
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT
      t.table_schema,
      t.table_name
    FROM information_schema.tables t
    WHERE t.table_type = 'BASE TABLE'
      AND t.table_schema IN (
        'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
        'auditoria', 'academico', 'clinico', 'donaciones',
        'gamificacion', 'impacto'
      )
      AND NOT (
        (t.table_schema = 'public' AND t.table_name LIKE 'cat\_%' ESCAPE '\')
        OR (t.table_schema = 'ong' AND t.table_name IN (
            'estados_voluntario',
            'unidades_medida',
            'estados_objeto',
            'estados_proyecto',
            'tipo_transaccion_inventario'
        ))
        OR (t.table_schema = 'rrhh' AND t.table_name = 'habilidades')
        OR (t.table_schema = 'impacto' AND t.table_name = 'ods_globales')
        OR (t.table_schema = 'comunicaciones' AND t.table_name = 'canales_notificacion')
      )
      AND EXISTS (
        SELECT 1
        FROM information_schema.columns c
        WHERE c.table_schema = t.table_schema
          AND c.table_name   = t.table_name
          AND c.column_name  = 'tenant_id'
      )
  LOOP
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS created_by uuid',
      r.table_schema, r.table_name
    );
    EXECUTE format(
      'ALTER TABLE %I.%I ADD COLUMN IF NOT EXISTS updated_by uuid',
      r.table_schema, r.table_name
    );
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- C. INTEGRIDAD REFERENCIAL HUMANA
-- FKs genéricas contra auth.users para created_by / updated_by / aprobado_por
-- =============================================================================
BEGIN;

DO $$
DECLARE
  r record;
  v_constraint_name text;
  v_orphan_count bigint;
BEGIN
  FOR r IN
    SELECT
      c.table_schema,
      c.table_name,
      c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name   = c.table_name
    WHERE t.table_type = 'BASE TABLE'
      AND c.table_schema IN (
        'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
        'auditoria', 'academico', 'clinico', 'donaciones',
        'gamificacion', 'impacto'
      )
      AND c.column_name IN ('created_by', 'updated_by', 'aprobado_por')
      AND c.data_type = 'uuid'
    ORDER BY c.table_schema, c.table_name, c.column_name
  LOOP
    v_constraint_name := 'fk_' || substr(md5(r.table_schema || '.' || r.table_name || '.' || r.column_name || '->auth.users'), 1, 24);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = v_constraint_name
    ) THEN
      EXECUTE format(
        'ALTER TABLE %I.%I
           ADD CONSTRAINT %I
           FOREIGN KEY (%I)
           REFERENCES auth.users(id)
           ON DELETE SET NULL
           NOT VALID',
        r.table_schema, r.table_name, v_constraint_name, r.column_name
      );
    END IF;

    EXECUTE format(
      'SELECT COUNT(*)
       FROM %I.%I t
       LEFT JOIN auth.users u ON u.id = t.%I
       WHERE t.%I IS NOT NULL
         AND u.id IS NULL',
      r.table_schema, r.table_name, r.column_name, r.column_name
    )
    INTO v_orphan_count;

    IF v_orphan_count = 0 THEN
      BEGIN
        EXECUTE format(
          'ALTER TABLE %I.%I VALIDATE CONSTRAINT %I',
          r.table_schema, r.table_name, v_constraint_name
        );
      EXCEPTION
        WHEN others THEN
          RAISE NOTICE 'No se pudo validar constraint % en %.%: %',
            v_constraint_name, r.table_schema, r.table_name, SQLERRM;
      END;
    ELSE
      RAISE NOTICE 'Constraint % en %.% quedó NOT VALID por % huérfanos en columna %',
        v_constraint_name, r.table_schema, r.table_name, v_orphan_count, r.column_name;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- D. CHECKS DEFENSIVOS DE TEXTO NO VACÍO
-- =============================================================================
BEGIN;

DO $$
DECLARE
  r record;
  v_constraint_name text;
  v_bad_count bigint;
BEGIN
  FOR r IN
    SELECT *
    FROM (
      VALUES
        ('ong','voluntarios','numero_documento','btrim(numero_documento) <> '''''),
        ('ong','beneficiarios','numero_documento','btrim(numero_documento) <> '''''),
        ('ong','areas','codigo','btrim(codigo) <> '''''),
        ('ong','ubicaciones','codigo','btrim(codigo) <> '''''),
        ('ong','proyectos','codigo','btrim(codigo) <> ''''')
    ) AS x(table_schema, table_name, column_name, expr)
  LOOP
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = r.table_schema
        AND table_name   = r.table_name
        AND column_name  = r.column_name
    ) THEN
      v_constraint_name := 'ck_' || substr(md5(r.table_schema || '.' || r.table_name || '.' || r.column_name || '.nonnulltext'), 1, 24);

      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = v_constraint_name
      ) THEN
        EXECUTE format(
          'ALTER TABLE %I.%I
             ADD CONSTRAINT %I
             CHECK (%s)
             NOT VALID',
          r.table_schema, r.table_name, v_constraint_name, r.expr
        );
      END IF;

      EXECUTE format(
        'SELECT COUNT(*)
         FROM %I.%I
         WHERE %I IS NOT NULL
           AND NOT (%s)',
        r.table_schema, r.table_name, r.column_name, r.expr
      )
      INTO v_bad_count;

      IF v_bad_count = 0 THEN
        BEGIN
          EXECUTE format(
            'ALTER TABLE %I.%I VALIDATE CONSTRAINT %I',
            r.table_schema, r.table_name, v_constraint_name
          );
        EXCEPTION
          WHEN others THEN
            RAISE NOTICE 'No se pudo validar check % en %.%: %',
              v_constraint_name, r.table_schema, r.table_name, SQLERRM;
        END;
      ELSE
        RAISE NOTICE 'Check % en %.% quedó NOT VALID por % registros inválidos',
          v_constraint_name, r.table_schema, r.table_name, v_bad_count;
      END IF;
    END IF;
  END LOOP;
END $$;

COMMIT;

-- =============================================================================
-- E. ÍNDICES ESTRATÉGICOS DE HARDENING
-- =============================================================================
BEGIN;

DO $$
BEGIN
  -- Core
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='audit_logs' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='audit_logs' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_public_audit_logs_tenant_created_at
      ON public.audit_logs (tenant_id, created_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sessions' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='sessions' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_public_sessions_tenant_created_at
      ON public.sessions (tenant_id, created_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payment_transactions' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='payment_transactions' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_public_payment_transactions_tenant_created_at
      ON public.payment_transactions (tenant_id, created_at);
  END IF;

  -- ONG
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='voluntarios' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='voluntarios' AND column_name='numero_documento'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ong_voluntarios_tenant_numdoc
      ON ong.voluntarios (tenant_id, numero_documento);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='beneficiarios' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='beneficiarios' AND column_name='numero_documento'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ong_beneficiarios_tenant_numdoc
      ON ong.beneficiarios (tenant_id, numero_documento);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='tareas' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='tareas' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ong_tareas_tenant_created_at
      ON ong.tareas (tenant_id, created_at);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='actividades' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='actividades' AND column_name='created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ong_actividades_tenant_created_at
      ON ong.actividades (tenant_id, created_at);
  END IF;

  -- Finanzas
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='finanzas' AND table_name='transacciones' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='finanzas' AND table_name='transacciones' AND column_name='fecha_transaccion'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_finanzas_transacciones_tenant_fecha
      ON finanzas.transacciones (tenant_id, fecha_transaccion);
  END IF;

  -- RRHH
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='rrhh' AND table_name='solicitudes_admision' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='rrhh' AND table_name='solicitudes_admision' AND column_name='fecha_solicitud'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_rrhh_solicitudes_tenant_fecha
      ON rrhh.solicitudes_admision (tenant_id, fecha_solicitud);
  END IF;

  -- Donaciones
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='donaciones' AND table_name='ingresos_donacion' AND column_name='tenant_id'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='donaciones' AND table_name='ingresos_donacion' AND column_name='fecha_donacion'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_donaciones_ingresos_tenant_fecha
      ON donaciones.ingresos_donacion (tenant_id, fecha_donacion);
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- F. DIAGNÓSTICO DEFENSIVO DE INTEGRIDAD
-- =============================================================================

-- ---------------------------------------------------------------------------
-- F1. Inventario de columnas relacionales clave
-- ---------------------------------------------------------------------------
SELECT
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema IN ('ong', 'rrhh', 'finanzas')
  AND (
    column_name LIKE 'id\_%' ESCAPE '\'
    OR column_name IN ('tenant_id', 'created_by', 'updated_by')
  )
ORDER BY table_schema, table_name, ordinal_position;

-- ---------------------------------------------------------------------------
-- F2. Huérfanos confirmados en relaciones clave
-- ---------------------------------------------------------------------------

-- ong.proyectos.id_area -> ong.areas.id
SELECT 'ong.proyectos.id_area -> ong.areas.id' AS check_name, p.id, p.tenant_id, p.id_area
FROM ong.proyectos p
LEFT JOIN ong.areas a ON a.id = p.id_area
WHERE p.id_area IS NOT NULL
  AND a.id IS NULL;

-- ong.tareas.id_proyecto -> ong.proyectos.id
SELECT 'ong.tareas.id_proyecto -> ong.proyectos.id' AS check_name, t.id, t.tenant_id, t.id_proyecto
FROM ong.tareas t
LEFT JOIN ong.proyectos p ON p.id = t.id_proyecto
WHERE t.id_proyecto IS NOT NULL
  AND p.id IS NULL;

-- ong.asignaciones_actividad.id_actividad -> ong.actividades.id
SELECT 'ong.asignaciones_actividad.id_actividad -> ong.actividades.id' AS check_name, aa.id, aa.tenant_id, aa.id_actividad
FROM ong.asignaciones_actividad aa
LEFT JOIN ong.actividades a ON a.id = aa.id_actividad
WHERE aa.id_actividad IS NOT NULL
  AND a.id IS NULL;

-- ong.asignaciones_actividad.id_voluntario -> ong.voluntarios.id
SELECT 'ong.asignaciones_actividad.id_voluntario -> ong.voluntarios.id' AS check_name, aa.id, aa.tenant_id, aa.id_voluntario
FROM ong.asignaciones_actividad aa
LEFT JOIN ong.voluntarios v ON v.id = aa.id_voluntario
WHERE aa.id_voluntario IS NOT NULL
  AND v.id IS NULL;

-- ong.participaciones_proyecto.id_beneficiario -> ong.beneficiarios.id
SELECT 'ong.participaciones_proyecto.id_beneficiario -> ong.beneficiarios.id' AS check_name, pp.id, pp.tenant_id, pp.id_beneficiario
FROM ong.participaciones_proyecto pp
LEFT JOIN ong.beneficiarios b ON b.id = pp.id_beneficiario
WHERE pp.id_beneficiario IS NOT NULL
  AND b.id IS NULL;

-- rrhh.documentos_voluntario.id_voluntario -> ong.voluntarios.id
SELECT 'rrhh.documentos_voluntario.id_voluntario -> ong.voluntarios.id' AS check_name, dv.id, dv.tenant_id, dv.id_voluntario
FROM rrhh.documentos_voluntario dv
LEFT JOIN ong.voluntarios v ON v.id = dv.id_voluntario
WHERE dv.id_voluntario IS NOT NULL
  AND v.id IS NULL;

-- finanzas.transacciones.id_cuenta -> finanzas.cuentas.id
SELECT 'finanzas.transacciones.id_cuenta -> finanzas.cuentas.id' AS check_name, t.id, t.tenant_id, t.id_cuenta
FROM finanzas.transacciones t
LEFT JOIN finanzas.cuentas c ON c.id = t.id_cuenta
WHERE t.id_cuenta IS NOT NULL
  AND c.id IS NULL;

-- finanzas.transacciones.id_categoria -> finanzas.categorias.id
SELECT 'finanzas.transacciones.id_categoria -> finanzas.categorias.id' AS check_name, t.id, t.tenant_id, t.id_categoria
FROM finanzas.transacciones t
LEFT JOIN finanzas.categorias c ON c.id = t.id_categoria
WHERE t.id_categoria IS NOT NULL
  AND c.id IS NULL;

-- finanzas.comprobantes_financieros.id_transaccion -> finanzas.transacciones.id
SELECT 'finanzas.comprobantes_financieros.id_transaccion -> finanzas.transacciones.id' AS check_name, cf.id, cf.tenant_id, cf.id_transaccion
FROM finanzas.comprobantes_financieros cf
LEFT JOIN finanzas.transacciones t ON t.id = cf.id_transaccion
WHERE cf.id_transaccion IS NOT NULL
  AND t.id IS NULL;

-- ---------------------------------------------------------------------------
-- F3. Duplicados operativos
-- ---------------------------------------------------------------------------
SELECT tenant_id, tipo_documento, numero_documento, COUNT(*) AS total
FROM ong.voluntarios
WHERE numero_documento IS NOT NULL
GROUP BY tenant_id, tipo_documento, numero_documento
HAVING COUNT(*) > 1
ORDER BY total DESC;

SELECT tenant_id, tipo_documento, numero_documento, COUNT(*) AS total
FROM ong.beneficiarios
WHERE numero_documento IS NOT NULL
GROUP BY tenant_id, tipo_documento, numero_documento
HAVING COUNT(*) > 1
ORDER BY total DESC;

SELECT tenant_id, codigo, COUNT(*) AS total
FROM ong.areas
GROUP BY tenant_id, codigo
HAVING COUNT(*) > 1
ORDER BY total DESC;

SELECT tenant_id, codigo, COUNT(*) AS total
FROM ong.ubicaciones
GROUP BY tenant_id, codigo
HAVING COUNT(*) > 1
ORDER BY total DESC;

SELECT tenant_id, codigo, COUNT(*) AS total
FROM ong.proyectos
GROUP BY tenant_id, codigo
HAVING COUNT(*) > 1
ORDER BY total DESC;

-- ---------------------------------------------------------------------------
-- F4. Nulos peligrosos
-- ---------------------------------------------------------------------------
SELECT 'ong.voluntarios.tenant_id' AS check_name, COUNT(*) AS total
FROM ong.voluntarios WHERE tenant_id IS NULL
UNION ALL
SELECT 'ong.beneficiarios.tenant_id', COUNT(*) FROM ong.beneficiarios WHERE tenant_id IS NULL
UNION ALL
SELECT 'ong.proyectos.tenant_id', COUNT(*) FROM ong.proyectos WHERE tenant_id IS NULL
UNION ALL
SELECT 'ong.areas.tenant_id', COUNT(*) FROM ong.areas WHERE tenant_id IS NULL
UNION ALL
SELECT 'ong.ubicaciones.tenant_id', COUNT(*) FROM ong.ubicaciones WHERE tenant_id IS NULL
UNION ALL
SELECT 'finanzas.transacciones.tenant_id', COUNT(*) FROM finanzas.transacciones WHERE tenant_id IS NULL
UNION ALL
SELECT 'rrhh.documentos_voluntario.tenant_id', COUNT(*) FROM rrhh.documentos_voluntario WHERE tenant_id IS NULL;

-- =============================================================================
-- G. REPARACIONES DEFENSIVAS CONOCIDAS
-- Solo para referencias ya detectadas y sin borrado
-- =============================================================================
BEGIN;

DO $$
BEGIN
  -- ONG
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='ong' AND table_name='proyectos' AND column_name='id_area'
  ) THEN
    UPDATE ong.proyectos p
    SET id_area = NULL
    WHERE id_area IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM ong.areas a
        WHERE a.id = p.id_area
      );
  END IF;
END $$;

COMMIT;

-- =============================================================================
-- H. CATÁLOGO GLOBAL DE ESTADOS DE MÓDULO
-- Idempotente, por si el script base vino sin este bloque
-- =============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.cat_module_statuses (
  codigo varchar(30) PRIMARY KEY,
  nombre varchar(100) NOT NULL
);

INSERT INTO public.cat_module_statuses(codigo, nombre) VALUES
  ('enabled', 'Habilitado'),
  ('disabled', 'Deshabilitado'),
  ('paused', 'Pausado')
ON CONFLICT (codigo) DO NOTHING;

COMMIT;

-- =============================================================================
-- I. VERIFICACIÓN FINAL DOCUMENTAL
-- =============================================================================

-- I1. Tablas con tenant_id pero sin DEFAULT fn_current_tenant_id
SELECT
  c.table_schema,
  c.table_name,
  c.column_default
FROM information_schema.columns c
JOIN information_schema.tables t
  ON t.table_schema = c.table_schema
 AND t.table_name   = c.table_name
WHERE t.table_type = 'BASE TABLE'
  AND c.column_name = 'tenant_id'
  AND c.table_schema IN (
    'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
    'auditoria', 'academico', 'clinico', 'donaciones',
    'gamificacion', 'impacto'
  )
  AND NOT (
    (c.table_schema = 'public' AND c.table_name LIKE 'cat\_%' ESCAPE '\')
    OR (c.table_schema = 'ong' AND c.table_name IN (
        'estados_voluntario',
        'unidades_medida',
        'estados_objeto',
        'estados_proyecto',
        'tipo_transaccion_inventario'
    ))
    OR (c.table_schema = 'rrhh' AND c.table_name = 'habilidades')
    OR (c.table_schema = 'impacto' AND c.table_name = 'ods_globales')
    OR (c.table_schema = 'comunicaciones' AND c.table_name = 'canales_notificacion')
  )
  AND (
    c.column_default IS NULL
    OR c.column_default NOT ILIKE '%fn_current_tenant_id%'
  )
ORDER BY c.table_schema, c.table_name;

-- I2. Tablas multi-tenant sin RLS
WITH tables_with_tenant AS (
  SELECT DISTINCT c.table_schema, c.table_name
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema
   AND t.table_name   = c.table_name
  WHERE t.table_type = 'BASE TABLE'
    AND c.column_name = 'tenant_id'
    AND c.table_schema IN (
      'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
      'auditoria', 'academico', 'clinico', 'donaciones',
      'gamificacion', 'impacto'
    )
)
SELECT
  n.nspname AS table_schema,
  c.relname AS table_name
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN tables_with_tenant twt
  ON twt.table_schema = n.nspname
 AND twt.table_name   = c.relname
WHERE c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY n.nspname, c.relname;

-- I3. Tablas multi-tenant sin policy tenant estándar
WITH target_tables AS (
  SELECT DISTINCT c.table_schema, c.table_name
  FROM information_schema.columns c
  JOIN information_schema.tables t
    ON t.table_schema = c.table_schema
   AND t.table_name   = c.table_name
  WHERE t.table_type = 'BASE TABLE'
    AND c.column_name = 'tenant_id'
    AND c.table_schema IN (
      'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
      'auditoria', 'academico', 'clinico', 'donaciones',
      'gamificacion', 'impacto'
    )
)
SELECT
  tt.table_schema,
  tt.table_name,
  COUNT(pol.policyname) AS total_policies
FROM target_tables tt
LEFT JOIN pg_policies pol
  ON pol.schemaname = tt.table_schema
 AND pol.tablename  = tt.table_name
GROUP BY tt.table_schema, tt.table_name
HAVING COUNT(pol.policyname) = 0
ORDER BY tt.table_schema, tt.table_name;

-- I4. Columnas de trazabilidad humana sin FK a auth.users
SELECT
  c.table_schema,
  c.table_name,
  c.column_name
FROM information_schema.columns c
LEFT JOIN (
  SELECT
    ns.nspname AS table_schema,
    cl.relname AS table_name,
    at.attname AS column_name
  FROM pg_constraint co
  JOIN pg_class cl
    ON cl.oid = co.conrelid
  JOIN pg_namespace ns
    ON ns.oid = cl.relnamespace
  JOIN unnest(co.conkey) AS ck(attnum)
    ON true
  JOIN pg_attribute at
    ON at.attrelid = co.conrelid
   AND at.attnum   = ck.attnum
  WHERE co.contype = 'f'
    AND co.confrelid = 'auth.users'::regclass
) fk
  ON fk.table_schema = c.table_schema
 AND fk.table_name   = c.table_name
 AND fk.column_name  = c.column_name
WHERE c.table_schema IN (
    'public', 'ong', 'finanzas', 'rrhh', 'comunicaciones',
    'auditoria', 'academico', 'clinico', 'donaciones',
    'gamificacion', 'impacto'
  )
  AND c.column_name IN ('created_by', 'updated_by', 'aprobado_por')
  AND c.data_type = 'uuid'
  AND fk.column_name IS NULL
ORDER BY c.table_schema, c.table_name, c.column_name;