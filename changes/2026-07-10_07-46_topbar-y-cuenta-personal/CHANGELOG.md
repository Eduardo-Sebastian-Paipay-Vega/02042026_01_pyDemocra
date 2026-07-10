# Changelog — Branding del Topbar, avatar real y separación Perfil/Configuración

## Fecha y hora
2026-07-10, 07:46

## Objetivo del cambio
Reflejar en la barra superior del shell (`/ong/app/...`) el logotipo del
tenant, la foto y el nombre real del usuario en vez del correo, corregir el
solapamiento de textos en pantallas angostas, y separar las opciones
"Perfil" (consulta) y "Configuración" (edición) del popup de cuenta en dos
vistas reales.

## Contexto del problema
`dds/MEJORAS/09072026/REQ004.md` y `REQ005.md` reportaron 5 problemas sobre
el mismo `Topbar`/popup de cuenta:
1. Sin logo del tenant en el extremo izquierdo.
2. El nombre largo de la ONG se encima con el título de la sección activa en
   viewports angostos.
3. El widget de perfil muestra el correo (`paipayvegabastian@gmail.com`) y un
   círculo de iniciales fijas ("TP") en vez del nombre y foto reales.
4. El encabezado del popup desplegable repite el mismo problema del correo.
5. Las opciones "Perfil" y "Configuración" no tenían destino ni distinción
   funcional.

## Cruce con el esquema real de producción (dds/MEJORAS/BD_viva_09072026.txt)
Antes de tocar código se validó cada columna/función asumida por los
requerimientos contra el volcado de esquema real:
- `public.profiles.avatar_url text` **sí existe** en producción y tiene
  policies RLS de autoservicio (`profiles_self_select`, `profiles_self_update`,
  ambas con `auth.uid() = id`) — se puede leer/editar sin RPC dedicado.
- `public.fn_update_my_avatar(p_url text) returns jsonb` **sí existe** y es la
  función oficial para persistir la foto.
- `public.tenants` **no tiene ninguna columna de logo** (`logo_url` u
  equivalente). El pedido de REQ004.md#1 no tiene hoy un dato real que
  mostrar — se implementó el slot visual con su fallback de iniciales
  estandarizado, pero pasando siempre `tenantLogoUrl = null` hasta que exista
  la columna. Esto se documenta explícitamente en el código
  (`Topbar.tsx`, prop `tenantLogoUrl`) para que no se asuma erróneamente que
  ya está conectado a datos reales.
- Los tipos generados en `ong/src/lib/db/ong/app-database.ts` no incluían
  `avatar_url` en `PublicProfileRow` ni la función `fn_update_my_avatar` en
  `PublicFunctions` (desactualizados respecto a producción) — se agregaron
  ambos directamente en ese archivo, que es la fuente de tipos ya usada por
  el resto del proyecto.

## Solución implementada
- `ong/src/lib/db/ong/app-database.ts`: se agregó `avatar_url: string | null`
  a `PublicProfileRow` y la firma de `fn_update_my_avatar` a
  `PublicFunctions`.
- `ong/src/app/tenant/bootstrap.ts`: el `select` de `profiles` ahora incluye
  `avatar_url`; `TenantContextValue.profile` expone `avatarUrl`.
- `ong/src/app/components/layout/AppShell.tsx`: pasa `userAvatarUrl`,
  `onProfileClick` y `onSettingsClick` (navegan a
  `/app/ong/account/profile` y `/app/ong/account/settings`) al `Topbar`.
- `ong/src/app/components/layout/Topbar.tsx`:
  - Nuevo componente interno `UserAvatar` (imagen real con fallback de
    iniciales) reutilizado en el slot de logo del tenant, el trigger del
    widget de usuario y el encabezado del dropdown.
  - `userLabel` ahora se usa consistentemente como nombre completo (ya lo
    resolvía así `AppShell`: `fullName ?? email`); el correo deja de ser el
    dato primario mostrado.
  - Fix de solapamiento: `min-w-0` en los contenedores flex que antes no se
    podían encoger, más `truncate`/`title` en el nombre del tenant y el
    título de sección.
  - Los ítems "Perfil" y "Configuración" del dropdown ahora tienen
    `onSelect` real hacia las nuevas rutas. "Cerrar sesión" no se tocó
    (restricción explícita de REQ-005).
- Páginas nuevas `ong/src/app/pages/MyProfile.tsx` (solo lectura: nombre,
  foto, organización, tipo/número de documento, género) y
  `ong/src/app/pages/MyAccountSettings.tsx` (edición: nombre + foto, con
  `ImageUploadField` ya existente en el proyecto).
- `ong/src/app/services/account/myAccount.service.ts` (nuevo): `getMyProfile`
  (SELECT directo, RLS-permitido), `updateMyFullName` (UPDATE directo,
  RLS-permitido) y `updateMyAvatar` (sube el archivo al bucket `avatars` ya
  usado para fotos de personas — `getPeoplePhotoUploadBucket()`, ver
  `services/personas/form-adapters.ts` — y luego llama a
  `fn_update_my_avatar`).
- `ong/src/app/routes.tsx`: dos rutas nuevas bajo `/app/ong/account/*`, sin
  gate de permisos de módulo (son la cuenta propia del usuario ya
  autenticado, no un recurso de negocio).

## Riesgos identificados
- El slot de logo del tenant no muestra nada real todavía (no hay columna en
  producción); si se agrega la columna en el futuro sin volver a este
  archivo, seguirá mostrando el fallback de iniciales hasta que alguien
  conecte `tenantLogoUrl` a la nueva columna — documentado explícitamente en
  el código para que no pase desapercibido.
- `updateMyFullName` hace un UPDATE directo a `profiles` desde el cliente
  (autorizado por RLS `auth.uid() = id`); no pasa por una función
  `SECURITY DEFINER`, a diferencia del patrón usado para el avatar. Es
  intencional: la policy ya lo permite y no existe una función RPC
  equivalente para nombre en el esquema real (confirmado en el cruce con
  `BD_viva_09072026.txt`).

## Impacto esperado
Identidad real del usuario visible en todo el shell autenticado; sección de
cuenta propia navegable y funcional; sin más solapamientos de texto en
pantallas angostas.

## Módulos afectados
- `ong/src/app/components/layout/Topbar.tsx`, `AppShell.tsx`.
- `ong/src/app/tenant/bootstrap.ts`.
- `ong/src/lib/db/ong/app-database.ts`.
- `ong/src/app/pages/MyProfile.tsx`, `MyAccountSettings.tsx` (nuevos).
- `ong/src/app/services/account/myAccount.service.ts` (nuevo).
- `ong/src/app/routes.tsx`.

## Dependencias involucradas
Ninguna nueva. Se reutilizó `ImageUploadField`, `uploadFileToStorage` y
`getPeoplePhotoUploadBucket` ya existentes.

## Posibles efectos secundarios
El bootstrap cachea el contexto del tenant en almacenamiento local
(`readBootstrapCacheForUser`); usuarios con una foto guardada previa a este
cambio no verán su avatar hasta que la caché expire o vuelvan a iniciar
sesión (mismo comportamiento que cualquier otro campo agregado al contexto
cacheado, no es un caso nuevo introducido por este cambio).

## Estado del cambio
Completado. Verificado con `tsc --noEmit` (0 errores nuevos en los archivos
tocados). No se realizó verificación visual con navegador headless ni prueba
manual end-to-end de la subida de avatar contra Supabase real en esta sesión
(misma limitación de entorno de las tandas anteriores) — se recomienda una
prueba manual de `MyAccountSettings` (subir foto, cambiar nombre, confirmar
que se refleja en el Topbar) antes de considerar esta tanda 100% verificada
en producción.
