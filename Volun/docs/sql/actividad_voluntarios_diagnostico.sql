-- Diagnostico SQL (Supabase / Postgres)
-- Tabla: public.actividad_voluntarios

-- 1) Columnas reales
select
  column_name,
  data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'actividad_voluntarios'
order by ordinal_position;

-- 2) Foreign keys principales (actividad_voluntarios / actividades / evidencias)
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
  and tc.table_name in ('actividad_voluntarios', 'actividades', 'evidencias')
order by tc.table_name, tc.constraint_name, kcu.ordinal_position;

