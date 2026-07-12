# FILES_CHANGED — Performance mobile (Lighthouse)

## Modificados

- `package.json` / `package-lock.json` — agrega `lighthouse` y `chrome-launcher` como devDependencies.
- `src/pages/landing/components/CursorSpotlight.tsx` — el loop de `requestAnimationFrame` se detiene al converger y se reactiva en el próximo `mousemove`, en vez de correr para siempre.

## Creados

- `changes/2026-07-12_05-30_performance-mobile-lighthouse/CHANGELOG.md`
- `changes/2026-07-12_05-30_performance-mobile-lighthouse/SUMMARY.md`
- `changes/2026-07-12_05-30_performance-mobile-lighthouse/FILES_CHANGED.md`
- `changes/2026-07-12_05-30_performance-mobile-lighthouse/reports/lighthouse-landing.json` (reporte completo, línea base)
- `changes/2026-07-12_05-30_performance-mobile-lighthouse/reports/lighthouse-ong.json` (reporte completo, línea base)
- `changes/2026-07-12_05-30_performance-mobile-lighthouse/reports/lighthouse-summary.json` (resumen de métricas clave)

## No aplicado (documentado como recomendación)

- `src/pages/landing/components/GradientBackground.tsx` — identificado como el mayor contribuyente restante al TBT alto del landing (4 capas con blur animadas infinitamente). No se modificó porque cambiaría el resultado visual de la marca; ver CHANGELOG para las 3 opciones concretas recomendadas.
