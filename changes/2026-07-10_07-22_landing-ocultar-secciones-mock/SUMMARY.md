# Resumen ejecutivo

## Qué se hizo
Se ocultaron, sin borrar código, las secciones de la Landing Page pública que
todavía muestran datos de ejemplo (logos de empresas, contadores de
"organizaciones activas", etc.), dejando visible solo la sección Hero
(encabezado, navegación, textos y botones principales) seguida directamente
del Footer.

## Por qué se hizo
El requerimiento REQ-001 (`dds/MEJORAS/09072026/REQ001.md`) pidió no mostrar
contenido simulado al público mientras no haya datos reales, para no dar una
impresión incorrecta a los visitantes del sitio ni cargar componentes
innecesarios.

## Qué beneficio aporta
- La landing ya no expone cifras y logos ficticios como si fueran reales.
- Reducción del trabajo de renderizado (7 componentes menos montados por
  visita), lo que ayuda con el problema de carga lenta reportado.
- Reversión trivial: basta con cambiar `SHOW_MOCK_SECTIONS` a `true` en
  `src/pages/landing/LandingPage.tsx` cuando existan datos reales.

## Qué funcionalidades quedaron afectadas
Ninguna funcionalidad se rompió. La sección Hero (incluyendo los botones
"Comenzar ahora" / "Ver demo" y el modal de contacto) y el Footer siguen
100% operativos. Las secciones ocultadas (`TrustSection`, `Features`,
`VisualShowcase`, `VisualImpact`, `HowItWorks`, `Pricing`, `FinalCTA`) dejan
de ser visibles pero su código permanece intacto en el repositorio.

## Nota de entorno — verificación visual
Este cambio se validó con `tsc --noEmit` (sin errores nuevos) y revisión
manual del JSX contra los criterios de aceptación del requerimiento. No se
pudo completar una verificación visual automatizada con navegador headless
en este entorno: no hay `chromium-cli` disponible y la instalación de
Playwright en este Windows sandbox resultó inestable (dañó temporalmente
`node_modules`, ya revertido). Se recomienda una revisión visual manual
rápida en `npm run dev` antes de considerarlo verificado end-to-end, o usar
`/run-skill-generator` para dejar un método de verificación reproducible.
