# FILES_CHANGED — Extensión de ACE en ONG: códigos de acceso y asignación automática de roles

## Creados

- `ONG/src/app/services/ace/ace.service.ts` — CRUD de `access_links`/`memberships`, `validateAccessCode`, `completeAccessOnboarding`, `listAssignableRoles`, `listAssignableSedes`.
- `ONG/src/app/modules/settings/hooks/useAccessLinks.ts` — hook de estado para la lista de códigos.
- `ONG/src/app/modules/settings/hooks/useMemberships.ts` — hook de estado para membresías.
- `ONG/src/app/pages/AccessControl.tsx` — pantalla de administración: crear/revocar códigos (con selector de rol y sede), ver membresías.
- `ONG/src/app/pages/landing/AccessCodeRedeemPage.tsx` — página pública `/join`: valida código, crea cuenta, consume el código y asigna el rol.
- `docs/consolidacion/ace_fix_membership_context_type_mapping.sql` — fix de referencia (no aplicado) para 2 bugs en `fn_complete_access_onboarding()`.

## Modificados

- `ONG/src/lib/db/ong/app-database.ts` — se agregaron los tipos `PublicAccessLinkRow`, `PublicMembershipRow` y las funciones RPC `fn_validate_access_code`/`fn_complete_access_onboarding` a `PublicFunctions`/`PublicTables`.
- `ONG/src/app/tenant/navigation.tsx` — nuevo `TenantRouteId` `"access-control"` y su entrada en `ROUTES` (grupo "Configuracion", permiso `ace.access_links.manage`); import de `Link2` agregado.
- `ONG/src/app/routes.tsx` — lazy-import y rutas para `AccessControl` (`/app/ong/settings/access-control`) y `AccessCodeRedeemPage` (`/join`). **Nota:** este archivo ya tenía cambios previos sin relación (migración "MPA unificada" en curso, no realizada en este trabajo) — ambos conjuntos de cambios quedan en el mismo commit por ser el mismo archivo; ver CHANGELOG.md para el detalle de qué es de quién.

## Eliminados

Ninguno.

## Carpetas afectadas

- `ONG/src/app/services/ace/`
- `ONG/src/app/modules/settings/hooks/`
- `ONG/src/app/pages/`
- `ONG/src/app/pages/landing/`
- `ONG/src/app/tenant/`
- `ONG/src/lib/db/ong/`
- `docs/consolidacion/`
- `changes/`
