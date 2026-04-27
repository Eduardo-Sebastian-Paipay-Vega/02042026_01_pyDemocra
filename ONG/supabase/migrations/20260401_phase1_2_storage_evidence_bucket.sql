BEGIN;

-- Infraestructura compartida para formularios que suben documentos/evidencias
-- y necesitan un bucket privado separado del bucket publico avatars.
INSERT INTO storage.buckets (id, name, public)
SELECT 'evidence', 'evidence', false
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'evidence'
);

DROP POLICY IF EXISTS "Tenant evidence read" ON storage.objects;
CREATE POLICY "Tenant evidence read"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text
);

DROP POLICY IF EXISTS "Tenant evidence upload" ON storage.objects;
CREATE POLICY "Tenant evidence upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text
);

DROP POLICY IF EXISTS "Tenant evidence update" ON storage.objects;
CREATE POLICY "Tenant evidence update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text
)
WITH CHECK (
  bucket_id = 'evidence'
  AND (storage.foldername(name))[1] = public.fn_current_tenant_id()::text
);

COMMIT;
