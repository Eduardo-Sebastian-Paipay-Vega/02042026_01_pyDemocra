## KoBo Sync (Backend Env)

Para habilitar la sincronizacion KoBo -> Supabase (sin configurar nada en el front), define estas variables de entorno en la Edge Function:

- `KOBO_BASE_URL` (opcional, default `https://kf.kobotoolbox.org`)
  - Puede ser `https://kf.kobotoolbox.org` o `https://kf.kobotoolbox.org/api/v2`
- `KOBO_ASSET_UID` (requerido)
- `KOBO_FORMULARIO_CODIGO` (requerido)
- `KOBO_TOKEN` (requerido, sensible)
  - Legacy: `KOBO_API_KEY` (si ya existe en tu entorno)
- `KOBO_SYNC_LIMIT` (opcional, default `1000`)
- `KOBO_TIPO_ACTIVIDAD_NOMBRE` (opcional, default `Voluntariado`)
  - Nombre del registro en `tipos_actividad` que usara la sync para crear/relacionar actividades.

Endpoints relacionados:

Rutas dentro de la Edge Function (se consumen como `/functions/v1/make-server-7052c263<ruta>`):

- `GET  /health`
- `POST /kobo/sync/voluntario` body `{ "id_usuario": 123 }`
- `GET  /voluntarios/:id/historial-horas`
- `GET  /kobo/attachments/proxy?url=...`

Notas:

- No guardar tokens en el front, localStorage o codigo fuente.
- Por defecto, Supabase Edge Functions requiere header `Authorization: Bearer <SUPABASE_ANON_KEY>` (o `apikey`) para evitar `401 Missing authorization header`.
- Los endpoints con `authMiddleware` requieren ademas `X-Access-Token` (token de sesion del sistema).
