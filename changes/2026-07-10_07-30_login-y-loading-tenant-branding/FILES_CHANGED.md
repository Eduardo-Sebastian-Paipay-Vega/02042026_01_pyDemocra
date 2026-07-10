# Archivos modificados

## Modificados
- `src/app/LoginGateway.tsx` — importa `GradientBackground` de
  `src/pages/landing/components/GradientBackground`; fondo de la pantalla
  pasa de `#050505` plano a `<GradientBackground />` + capa `relative z-10`;
  tarjeta pasa a estilo vidrio esmerilado; el SVG del isotipo genérico se
  reemplaza por `<img src="/Imagen/Iconos/logo_cua1.png">`; se agrega botón
  `type="button"` "¿Necesitas ayuda para ingresar?" con `onClick` a WhatsApp.
- `ong/src/app/tenant/screens.tsx` — se quita el import de `LoaderCircle`;
  se agrega el componente local `TenantLoadingLogo` (isotipo + animación
  `tenantLogoFloat` con `<style>` local); `TenantBootstrapLoadingScreen` usa
  `<TenantLoadingLogo />` en vez del spinner. `TenantStatusScreen`,
  `TenantFinancialBanner` y `TenantInlineAccessDenied` no se tocaron.

## Creados
- `changes/2026-07-10_07-30_login-y-loading-tenant-branding/CHANGELOG.md`
- `changes/2026-07-10_07-30_login-y-loading-tenant-branding/SUMMARY.md`
- `changes/2026-07-10_07-30_login-y-loading-tenant-branding/FILES_CHANGED.md`

## Eliminados
Ninguno.

## Carpetas afectadas
- `src/app/`
- `ong/src/app/tenant/`
- `changes/2026-07-10_07-30_login-y-loading-tenant-branding/` (nueva).
