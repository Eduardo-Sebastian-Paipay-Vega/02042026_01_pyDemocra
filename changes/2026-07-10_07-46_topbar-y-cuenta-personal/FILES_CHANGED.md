# Archivos modificados

## Modificados
- `ong/src/lib/db/ong/app-database.ts` — agrega `avatar_url` a
  `PublicProfileRow` y la firma de `fn_update_my_avatar` a
  `PublicFunctions`.
- `ong/src/app/tenant/bootstrap.ts` — incluye `avatar_url` en el `select` de
  `profiles` y en `TenantContextValue.profile.avatarUrl`.
- `ong/src/app/components/layout/AppShell.tsx` — pasa `userAvatarUrl`,
  `onProfileClick`, `onSettingsClick` al `Topbar`.
- `ong/src/app/components/layout/Topbar.tsx` — nuevo componente interno
  `UserAvatar` + `getInitials`; prop `tenantLogoUrl` (siempre null hoy);
  fix de truncamiento/overlap responsivo; `onSelect` real en "Perfil" y
  "Configuración".
- `ong/src/app/routes.tsx` — agrega rutas `account/profile` y
  `account/settings` bajo `/app/ong`, más los `lazy()` correspondientes.

## Creados
- `ong/src/app/pages/MyProfile.tsx` — vista de solo lectura de la cuenta.
- `ong/src/app/pages/MyAccountSettings.tsx` — vista de edición (nombre y
  foto).
- `ong/src/app/services/account/myAccount.service.ts` — `getMyProfile`,
  `updateMyFullName`, `updateMyAvatar`.
- `changes/2026-07-10_07-46_topbar-y-cuenta-personal/CHANGELOG.md`
- `changes/2026-07-10_07-46_topbar-y-cuenta-personal/SUMMARY.md`
- `changes/2026-07-10_07-46_topbar-y-cuenta-personal/FILES_CHANGED.md`

## Eliminados
Ninguno.

## Carpetas afectadas
- `ong/src/lib/db/ong/`
- `ong/src/app/tenant/`
- `ong/src/app/components/layout/`
- `ong/src/app/pages/` (2 archivos nuevos)
- `ong/src/app/services/account/` (nueva)
- `ong/src/app/routes.tsx`
- `changes/2026-07-10_07-46_topbar-y-cuenta-personal/` (nueva).
