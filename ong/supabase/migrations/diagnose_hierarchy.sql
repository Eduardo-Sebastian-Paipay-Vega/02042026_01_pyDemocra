-- ============================================================
-- DIAGNÓSTICO: Estado de la migración de jerarquía
-- Ejecutar en Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Verifica si las columnas nuevas existen
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'ong'
  AND table_name IN ('actividades', 'tareas')
  AND column_name IN ('id_proyecto', 'id_actividad', 'id_tarea')
ORDER BY table_name, column_name;

-- Resultado esperado DESPUÉS de la migración:
--   actividades | id_proyecto  | uuid | YES
--   tareas      | id_actividad | uuid | YES
-- Resultado ANTES de la migración (columnas legacy):
--   actividades | id_tarea     | uuid | NO
--   tareas      | id_proyecto  | uuid | NO

-- 2. Verifica Foreign Keys activas
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name  AS references_table,
  ccu.column_name AS references_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'ong'
  AND tc.table_name IN ('actividades', 'tareas')
ORDER BY tc.table_name, kcu.column_name;

-- 3. Verifica índices de performance
SELECT
  indexname,
  tablename,
  indexdef
FROM pg_indexes
WHERE schemaname = 'ong'
  AND indexname IN ('idx_actividades_id_proyecto', 'idx_tareas_id_actividad')
ORDER BY indexname;

-- 4. Recuento de datos (para saber si hay rows afectadas)
SELECT
  'actividades sin id_proyecto' AS descripcion,
  COUNT(*) AS total
FROM ong.actividades
WHERE id_proyecto IS NULL
UNION ALL
SELECT
  'actividades con id_proyecto' AS descripcion,
  COUNT(*) AS total
FROM ong.actividades
WHERE id_proyecto IS NOT NULL
UNION ALL
SELECT
  'tareas sin id_actividad' AS descripcion,
  COUNT(*) AS total
FROM ong.tareas
WHERE id_actividad IS NULL
UNION ALL
SELECT
  'tareas con id_actividad' AS descripcion,
  COUNT(*) AS total
FROM ong.tareas
WHERE id_actividad IS NOT NULL;
