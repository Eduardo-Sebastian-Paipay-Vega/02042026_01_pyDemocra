# CHANGELOG — Medición real de performance mobile (Lighthouse) + fix de raíz encontrado

**Fecha:** 2026-07-12
**Hora:** 05:30 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (medición + 1 fix aplicado y verificado por revisión de código; 1 hallazgo documentado, no aplicado — requiere decisión de diseño del usuario)

## Objetivo del cambio

Diagnosticar con datos reales (no supuestos) por qué la app podría sentirse lenta en mobile, estableciendo una línea base medible con Lighthouse antes de tocar cualquier código, tal como se acordó en el plan de esta sesión ("Solo optimizar lo que los números muestren como cuello de botella real").

## Contexto del problema

La arquitectura ya tenía buena base de performance: code-splitting por ruta vía `React.lazy` (`ong/src/app/routes.tsx`), vendor chunking manual en `vite.config.js`, e imágenes pequeñas (<300KB). No había ninguna medición real de Web Vitals — la afirmación de "lento en mobile" nunca se había verificado con datos.

## Solución implementada

### 1. Instrumentación

- `lighthouse` (^13.4.0) y `chrome-launcher` instalados como devDependencies.
- Script ad-hoc (`.tmp-lighthouse.mjs`, ejecutado y eliminado tras el uso) que corre Lighthouse con `formFactor: "mobile"`, emulación de pantalla 360×640 @2.625x DPR, y throttling de red **Slow 4G** (perfil estándar de Lighthouse: RTT 150ms, ~1.6 Mbps, CPU 4x más lento) contra `npm run build && npm run preview` (build de producción real, no dev server), para ambas apps: `/` (landing) y `/ong` (SPA).
- Reportes JSON completos archivados en `reports/lighthouse-landing.json`, `reports/lighthouse-ong.json`, `reports/lighthouse-summary.json`.

### 2. Resultados de la línea base (antes de cualquier fix)

| Métrica | `/` (landing) | `/ong` (app) |
|---|---|---|
| Performance score | 49-53 (variable entre corridas, ver Riesgos) | 77 |
| LCP | ~3.9-4.0s | ~3.6s |
| TBT | 4.4s - 13.6s (alta varianza) | 0.26s |
| TTI | 10.5s - 27s (alta varianza) | 3.7s |
| Peso total | 454 KB | 367 KB |

**Hallazgo clave:** el peso total transferido es bajo en ambas apps (454KB/367KB) — el problema **no es de red/bundle-size**, es de **trabajo continuo en el hilo principal**. Y contra-intuitivamente, `/ong` (la app real, con más funcionalidad) mide MEJOR que `/` (el landing de marketing, en teoría más simple).

### 3. Causa raíz identificada en `/` (landing)

Se inspeccionó `mainthread-work-breakdown` y `long-tasks` del reporte de Lighthouse: la mayoría del tiempo bloqueante se atribuye a `vendor-motion-*.js` (framer-motion). Se rastreó a dos componentes en `src/pages/landing/components/`:

1. **`CursorSpotlight.tsx`**: un loop de `requestAnimationFrame` que corría **para siempre, incondicionalmente**, incluso ya convergido el spotlight a la posición del mouse y sin ningún movimiento — reescribiendo `el.style.background` (repaint) en cada frame durante toda la vida de la página. Esto es trabajo desperdiciado puro: el spotlight converge en menos de 1 segundo, pero el loop seguía corriendo indefinidamente.
2. **`GradientBackground.tsx`**: 4 capas `motion.div` con `filter: blur(55-60px)` sobre áreas grandes (hasta 130vw × 90vh), cada una animando `x`/`scale`/`opacity` con `repeat: Infinity` (loops de 7-34 segundos), más una animación CSS de textura de grano (`grainShift 8s infinite`) a pantalla completa. Blur de gran radio sobre áreas grandes es notoriamente costoso de repintar/componer, y tener 4 capas animando simultánea e infinitamente multiplica el costo.

### 4. Fix aplicado (bajo riesgo, sin cambio visual)

- **`src/pages/landing/components/CursorSpotlight.tsx`**: el loop de `requestAnimationFrame` ahora se detiene en cuanto el spotlight converge (`|tx-cx| < 0.5 && |ty-cy| < 0.5`) y se reactiva automáticamente en el próximo evento `mousemove`. El efecto visual es idéntico — el spotlight sigue al mouse igual que antes — pero deja de trabajar en cada frame cuando el usuario no se mueve.

### 5. Hallazgo documentado, NO aplicado (requiere decisión de diseño)

- **`GradientBackground.tsx`**: reducir el fix aquí (menos capas simultáneas, radio de blur menor, o mover algunas animaciones de framer-motion a CSS puro) cambiaría el resultado visual de la identidad de marca del landing — se documenta como recomendación explícita en vez de aplicarse unilateralmente. Opciones concretas para una futura sesión: (a) reducir de 4 a 2 capas animadas simultáneas, (b) bajar el blur de 55-60px a ~30px (el costo de blur crece con el cuadrado del radio), (c) respetar `prefers-reduced-motion: reduce` desactivando las animaciones para ese cohorte (mejora accesibilidad + performance para quien lo pida, pero no resuelve el caso por defecto).

## Riesgos identificados

- **Alta varianza de medición**: corridas repetidas de Lighthouse contra la MISMA página sin cambios mostraron TBT de 4.4s, 13.6s, 14.6s y 22.2s en distintas corridas — la máquina de desarrollo usada en esta sesión tenía carga concurrente (procesos de build/test corriendo en paralelo) que introduce ruido significativo. Los números de esta fase deben leerse como **orden de magnitud / dirección**, no como SLA preciso. Se documenta explícitamente para que una futura medición en un entorno dedicado y en reposo (CI, o una laptop sin otros procesos) obtenga números más estables.
- **No se pudo confirmar empíricamente la mejora exacta del fix de `CursorSpotlight`** por la misma razón de varianza — la verificación principal de este fix es por **revisión de código** (el loop deja de ejecutarse de forma demostrable al converger; comportamiento visual idéntico verificado leyendo la lógica), no por un delta de Lighthouse limpio.
- `lighthouse`/`chrome-launcher` introdujeron 17 vulnerabilidades moderadas en `npm audit`, todas transitivas de su propio árbol de dependencias (`@opentelemetry/*`, `@sentry/node`). Es un devDependency que nunca se empaqueta ni se despliega (no forma parte de `dist/` ni de la función serverless de Vercel) — riesgo real para producción: ninguno. No se persiguió el fix por ser cambios mayores en una herramienta de solo-desarrollo.

## Impacto esperado

`CursorSpotlight.tsx`: ningún cambio visual, elimina trabajo de CPU desperdiciado en el hilo principal cuando el usuario no mueve el mouse (que es la mayor parte del tiempo de una visita real).

## Módulos afectados

- `package.json` / `package-lock.json` — `lighthouse`, `chrome-launcher` como devDependencies.
- `src/pages/landing/components/CursorSpotlight.tsx`.

## Dependencias involucradas

- `lighthouse` ^13.4.0 (dev)
- `chrome-launcher` (dev)

## Posibles efectos secundarios

Ninguno esperado en `CursorSpotlight.tsx`. `GradientBackground.tsx` queda sin tocar — su costo de performance sigue presente hasta que el usuario decida qué opción de las 3 recomendadas aplicar.

## Verificación realizada

- `npm test` (backend): 334/334, sin cambios (no se tocó backend).
- `npm run test:web`: 85 archivos, 345 tests, 100% en verde (no existen tests para `src/pages/landing/` — se verificó por revisión manual de la lógica, documentado como limitación).
- `npm run build`: compila sin errores.
- Lighthouse mobile + Slow 4G contra el build de producción real (`vite preview`), reportes completos archivados en `reports/`.

## Presupuesto de performance propuesto (para futuras sesiones)

| Métrica | Objetivo | Estado actual `/` | Estado actual `/ong` |
|---|---|---|---|
| LCP | < 2.5s | ~3.9s (por encima) | ~3.6s (por encima) |
| TBT | < 200ms | 4-22s (muy por encima) | ~260ms (cerca) |
| Peso total | < 500KB | 454KB (dentro) | 367KB (dentro) |

## Cómo revertir

`git revert` del commit correspondiente — el fix de `CursorSpotlight.tsx` es aislado y de bajo riesgo.
