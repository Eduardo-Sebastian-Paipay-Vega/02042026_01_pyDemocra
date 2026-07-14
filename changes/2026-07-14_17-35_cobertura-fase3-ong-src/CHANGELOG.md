# CHANGELOG — Fase 3: cobertura parcial en `ong/src`

- **Fecha y hora:** 2026-07-14 17:35 (hora local del entorno)
- **Autor:** Claude (Cowork)

## Objetivo del cambio
Completar la Fase 3 del plan de cobertura de frontend: dejar en verde y versionada la batería
de tests de `ong/src`, y cerrar los huecos de cobertura del subsistema de credenciales (ID card),
que estaba parcialmente cubierto.

## Contexto del problema
La secuencia de cobertura tenía Fases 1 y 2 marcadas como hechas, pero sus 43 archivos de test
seguían **sin versionar** en el árbol de trabajo (`git status` los mostraba como untracked).
Además, dos helpers puros del subsistema de credenciales (`idCardUnits.ts`, `idCardShared.ts`)
no tenían ninguna prueba (0%). En este entorno Linux, la suite ni siquiera arrancaba.

## Motivo de la modificación
1. La regla del repo prohíbe acumular trabajo sin subirlo; había ~360 pruebas sin commitear.
2. La Fase 3 exige completar cobertura parcial: `idCardUnits`/`idCardShared` eran un hueco claro,
   puro y sin dependencias de red — ideal para cerrar de forma segura.

## Solución implementada
1. **Fix de toolchain (solo entorno):** el `node_modules` estaba instalado en Windows, por lo que
   faltaban los binarios nativos `@rollup/rollup-linux-x64-gnu` y `@esbuild/linux-x64`. Se
   instalaron las variantes Linux (no se versiona `node_modules`). Se descubrió que Vitest debe
   correr con `--no-isolate` en este entorno para que happy-dom no reconstruya el Window por
   archivo (de ~8 s/archivo a una sola vez).
2. **Verificación:** se corrieron por grupos los 45 archivos de test de `ong/src`; todos en verde
   (admission 56, resources-hooks 98, operation+projects 38, people 62, services 24, adapters/utils
   50, idCard nuevos 42).
3. **Tests nuevos (Fase 3):**
   - `ong/src/app/modules/people/idCardUnits.test.ts` (23 pruebas): conversores mm↔px a 300 DPI,
     `convertUnit`, `snapToGrid`/`snapPoint`, `formatUnit`, `computeScale`/`screenToTemplate`,
     constantes CR80/CR79 y bleed por defecto.
   - `ong/src/app/modules/people/idCardShared.test.ts` (19 pruebas): catálogos de campos y estados,
     `createDefaultIdCardFields` (incluye clamps mínimos), `mergeIdCardFieldsWithDefaults`
     (orden canónico + re-normalización de etiqueta), `generateIdCardCode`, `buildIdCardQrPayload`,
     `buildIdCardRenderSubject`.
4. **Config de cobertura:** `vite.config.js` y `vitest.config.ts` emiten a `coverage-web/` con
   reporter `lcov`; se agregó `coverage-web/` a `.gitignore`.

## Riesgos identificados
- Bajo. Solo se agregan tests y configuración de cobertura; no se toca código de aplicación.
- `--no-isolate` es una decisión de ejecución de este entorno, no un cambio de config versionado:
  en la máquina del desarrollador la suite corre aislada como siempre.

## Impacto esperado
- Cobertura del subsistema de credenciales (helpers puros) de 0% a completa.
- Suite de `ong/src` versionada y reproducible; base lista para la Fase 4 (componentes UI y páginas).

## Módulos afectados
`ong/src/app/modules/{admission,operation,people,projects,resources}`,
`ong/src/app/services/{account,admision,clinico,operacion,personas}`,
`ong/src/app/utils`, `ong/src/core/ui-state`. Config: `vite.config.js`, `vitest.config.ts`, `.gitignore`.

## Dependencias involucradas
Vitest 4, `@vitejs/plugin-react`, happy-dom, v8 coverage. Binarios nativos por plataforma
(Rollup/esbuild) resueltos en `node_modules` (no versionado).

## Posibles efectos secundarios
Ninguno en runtime de producción. Los reportes de cobertura de Vitest ahora viven en
`coverage-web/` (ignorado por git) para no pisar `coverage/` de Jest (backend).

## Estado del cambio
**Completado** (Fase 3). Pendiente explícito documentado en `SUMMARY.md`: completar el mock de
`transaccionesFinancieras.service.test.ts > TST-ERR-118` (archivo pre-existente, no modificado
en esta sesión).
