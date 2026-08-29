-- Migración para añadir soporte de imágenes a los cursos
-- Permite almacenar la URL de la imagen del curso que se muestra en el catálogo (Dashboard/UI)

ALTER TABLE academico.cursos 
ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- Comentario descriptivo para la BD
COMMENT ON COLUMN academico.cursos.imagen_url IS 'URL pública del logo o portada del curso';
