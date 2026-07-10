# Changelog — Branding oficial en Login y pantalla de carga del Tenant

## Fecha y hora
2026-07-10, 07:30

## Objetivo del cambio
Homologar visualmente la pantalla de Login (`/login`) y la pantalla de carga
del tenant (`/ong/`) con la identidad ya establecida en la Landing Page,
sustituyendo los recursos genéricos/provisionales por el isotipo oficial de
Democra y agregando un botón auxiliar de asistencia en Login.

## Contexto del problema
- REQ-002 (`REQ002.md`): Login usaba un ícono SVG genérico de capas azules
  sobre fondo negro plano, sin relación visual con la Landing Page.
- REQ-003 (`REQ003.md`): la pantalla de carga del tenant usaba un spinner
  circular genérico de `lucide-react` sobre fondo liso, sin identidad de
  marca ni animación corporativa.

## Motivo de la modificación
El usuario pidió unificar la línea gráfica de todo el flujo de entrada
(Landing → Login → carga del tenant) usando el logotipo real del repositorio
en vez de placeholders, y agregar un punto de contacto de ayuda visible en el
formulario de acceso.

## Solución implementada
- `src/app/LoginGateway.tsx`: se reemplazó el fondo plano `#050505` por el
  mismo componente `<GradientBackground />` que usa la Landing Page (blobs
  radiales azul/violeta + grano de película + viñeta), la tarjeta pasó de
  fondo sólido a vidrio esmerilado (`rgba(255,255,255,0.02)` + `backdrop-blur`)
  igual que las tarjetas de estadísticas de `TrustSection`, el ícono SVG
  genérico se sustituyó por `<img src="/Imagen/Iconos/logo_cua1.png">` (el
  mismo isotipo ya usado en `src/pages/nosotros/NosotrosPage.tsx`), y se
  agregó un botón `type="button"` "¿Necesitas ayuda para ingresar?" que abre
  el mismo canal de WhatsApp de soporte ya usado en
  `src/pages/landing/ContactModal.tsx` (`wa.me/51953714752`) vía
  `window.open` (no anidado en un `<a>`, que sería HTML inválido). La lógica
  de `handleSubmit`, validación de campos y el toggle de mostrar/ocultar
  contraseña no se tocaron.
- `ong/src/app/tenant/screens.tsx`: se quitó el `LoaderCircle` en spin y se
  agregó un componente local `TenantLoadingLogo` que renderiza el mismo
  isotipo con una animación CSS de flotación sutil (`tenantLogoFloat`,
  ±4px/±2% cada 2.6s), respetando `prefers-reduced-motion: reduce`. Se
  definió el keyframe con un `<style>` local en vez de tocar CSS global,
  porque `ong/src` no importa `src/styles/*` (donde ya existe un patrón
  equivalente, `logoBreath`, usado por el resto del sitio) y modificar ese
  archivo global habría sido un cambio fuera del alcance del requerimiento.
  Los textos "Cargando contexto del tenant" / "Estamos resolviendo..." y el
  fondo con tokens `var(--t-surface)`/`var(--t-border)` no se modificaron
  (ya usan el sistema de diseño estándar de la app).

## Riesgos identificados
- El botón de ayuda de Login abre un chat de WhatsApp orientado a ventas en
  el resto del sitio; se usó un mensaje prellenado distinto ("necesito ayuda
  para ingresar") para que el contexto sea correcto para quien lo reciba del
  otro lado.
- `<GradientBackground />` usa `useScroll()` de `motion/react`; en una
  pantalla de un solo viewport sin scroll esto es válido (el progreso queda
  fijo en 0 y las animaciones de posición/escala de los blobs, que no
  dependen del scroll, siguen funcionando con normalidad).

## Impacto esperado
Login y la pantalla de carga del tenant muestran el logotipo real de
Democra con micro-animaciones, coherentes con la Landing Page. Ningún cambio
de lógica de negocio, autenticación o bootstrap del tenant.

## Módulos afectados
- Auth / Login (`src/app/LoginGateway.tsx`).
- Tenant bootstrap (`ong/src/app/tenant/screens.tsx`).

## Dependencias involucradas
Ninguna nueva. Se reutilizó `GradientBackground` (ya existente en
`src/pages/landing/components/`) y el asset ya presente en
`public/Imagen/Iconos/logo_cua1.png`.

## Posibles efectos secundarios
Ninguno detectado sobre el flujo de autenticación (`handleSubmit`,
`fn_get_user_redirect_target`) ni sobre el bootstrap del tenant
(`TenantStatusScreen`, `TenantFinancialBanner`, `TenantInlineAccessDenied`),
que no fueron tocados.

## Estado del cambio
Completado. Verificado con `tsc --noEmit` (0 errores nuevos en los archivos
tocados). Sin verificación visual con navegador headless en esta sesión
(misma limitación de entorno documentada en la tanda anterior).
