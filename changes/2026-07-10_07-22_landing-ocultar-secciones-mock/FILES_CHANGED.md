# Archivos modificados

## Modificados
- `src/pages/landing/LandingPage.tsx` — se agregó la constante
  `SHOW_MOCK_SECTIONS = false` (con comentario explicando su origen en
  REQ-001) y se envolvió el renderizado de `<TrustSection />`, `<Features />`,
  `<VisualShowcase />`, `<VisualImpact />`, `<HowItWorks />`, `<Pricing />` y
  `<FinalCTA />` en `{SHOW_MOCK_SECTIONS && (...)}`. `<Navbar />`, `<Hero />`
  y `<Footer />` no se tocaron y siguen renderizando siempre.

## Creados
- `changes/2026-07-10_07-22_landing-ocultar-secciones-mock/CHANGELOG.md`
- `changes/2026-07-10_07-22_landing-ocultar-secciones-mock/SUMMARY.md`
- `changes/2026-07-10_07-22_landing-ocultar-secciones-mock/FILES_CHANGED.md`

## Eliminados
Ninguno.

## Carpetas afectadas
- `src/pages/landing/` (solo el archivo orquestador; los componentes hijos
  no fueron modificados).
- `changes/2026-07-10_07-22_landing-ocultar-secciones-mock/` (nueva).
