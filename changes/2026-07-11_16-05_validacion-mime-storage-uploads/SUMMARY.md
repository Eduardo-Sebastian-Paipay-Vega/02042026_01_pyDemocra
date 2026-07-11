# SUMMARY — Validación MIME/tamaño en Storage

**Qué se hizo:** Se agregó una validación de tipo MIME (allow-list) y tamaño máximo antes de subir cualquier archivo a Supabase Storage, en las dos copias existentes del helper (`ong/src` y `src/modules/ong`).

**Por qué se hizo:** Era un gap de seguridad real y ya documentado (auditoría interna) — se podía subir cualquier archivo, de cualquier tamaño, sin control alguno.

**Qué beneficio aporta:** Reduce la superficie de ataque de subida de archivos maliciosos o accidentalmente incorrectos, sin requerir cambios en ningún componente de UI existente.

**Qué funcionalidades quedaron afectadas:** Ninguna para uso normal. Fotos ahora deben ser JPEG/PNG/WEBP ≤5MB; documentos/evidencia deben ser esos mismos tipos + PDF ≤10MB — límites que ya eran, en la práctica, lo único que la UI generaba.
