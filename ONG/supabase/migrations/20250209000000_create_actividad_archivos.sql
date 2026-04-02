-- Tabla para referencias a archivos/imágenes de actividades (archivos en Supabase Storage).
-- IMPORTANTE: Crear en Supabase Dashboard (Storage → New bucket) un bucket llamado "actividad-archivos".
-- Puede ser público o privado; si es privado, usar signed URLs para descargar desde el frontend.

CREATE TABLE IF NOT EXISTS actividad_archivos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  id_actividad uuid NOT NULL REFERENCES actividades(id_actividad) ON DELETE CASCADE,
  ruta_storage text NOT NULL,
  nombre_original text NOT NULL,
  tipo text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_actividad_archivos_id_actividad ON actividad_archivos(id_actividad);

COMMENT ON TABLE actividad_archivos IS 'Referencias a archivos/imágenes subidos a Supabase Storage por actividad.';
