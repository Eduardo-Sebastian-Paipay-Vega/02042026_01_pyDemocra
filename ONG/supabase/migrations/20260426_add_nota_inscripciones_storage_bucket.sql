-- ============================================================
-- Migración: campo nota en inscripciones + bucket de assets
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar campo nota a academico.inscripciones
ALTER TABLE academico.inscripciones
  ADD COLUMN IF NOT EXISTS nota NUMERIC(4,2);

-- Restricción de rango 0-20 (escala vigesimal peruana)
ALTER TABLE academico.inscripciones
  ADD CONSTRAINT IF NOT EXISTS inscripciones_nota_rango
    CHECK (nota IS NULL OR (nota >= 0 AND nota <= 20));

-- ============================================================
-- 2. Bucket de Supabase Storage para assets públicos
--    (imágenes de proyectos, items, ubicaciones)
--    Ejecutar desde Supabase Dashboard > Storage > New bucket
--    o via Management API:
--
--    Nombre del bucket: avatars
--    Público: true
--    (el bucket "avatars" ya debe existir si se crearon voluntarios;
--     si no existe, crearlo con las políticas de abajo)
-- ============================================================

-- Política RLS para lecturas públicas en el bucket avatars
-- (solo si el bucket es nuevo)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- CREATE POLICY IF NOT EXISTS "avatars_public_read"
--   ON storage.objects
--   FOR SELECT USING (bucket_id = 'avatars');

-- CREATE POLICY IF NOT EXISTS "avatars_authenticated_upload"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'avatars');

-- CREATE POLICY IF NOT EXISTS "avatars_authenticated_update"
--   ON storage.objects
--   FOR UPDATE
--   TO authenticated
--   USING (bucket_id = 'avatars');
