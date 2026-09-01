-- ============================================================
-- AUDITORÍA REAL DE FUNCIONES DE NEGOCIO
-- Copia esto y pégalo en el SQL Editor de Supabase Dashboard
-- ============================================================

-- Lista TODAS las funciones de los schemas de negocio
-- (excluye schemas internos de Supabase/Postgres)
SELECT 
    n.nspname AS schema,
    p.proname AS function_name,
    pg_get_function_result(p.oid) AS return_type,
    pg_get_function_arguments(p.oid) AS arguments,
    CASE p.prokind
        WHEN 'f' THEN 'FUNCTION'
        WHEN 'p' THEN 'PROCEDURE'
        WHEN 'a' THEN 'AGGREGATE'
        WHEN 'w' THEN 'WINDOW'
    END AS kind
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'gym', 'ong', 'rrhh', 'telemetria', 'academico', 'educ')
ORDER BY n.nspname, p.proname;
