-- Diagnostico SQL (Supabase / Postgres)
-- Tablas KoBo Sync (modelo relacional)

-- 1) Columnas reales (verificar que existen y sus tipos)
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'kobo_sync_log',
    'kobo_sync_error',
    'kobo_submission_procesada',
    'actividad_voluntarios',
    'evidencias',
    'actividades',
    'usuarios',
    'tipos_actividad',
    'estados'
  )
order by table_name, ordinal_position;

-- 2) Foreign keys principales (si existen)
select
  tc.constraint_name,
  kcu.table_name as source_table,
  kcu.column_name as source_column,
  ccu.table_name as target_table,
  ccu.column_name as target_column,
  rc.update_rule,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name = kcu.constraint_name
  and tc.table_schema = kcu.table_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name = tc.constraint_name
  and ccu.table_schema = tc.table_schema
join information_schema.referential_constraints rc
  on rc.constraint_name = tc.constraint_name
  and rc.constraint_schema = tc.table_schema
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_schema = 'public'
  and tc.table_name in (
    'kobo_submission_procesada',
    'actividad_voluntarios',
    'evidencias',
    'actividades'
  )
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;

