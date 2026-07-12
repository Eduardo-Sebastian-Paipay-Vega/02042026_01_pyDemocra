# CHANGELOG — Cobertura Fase 3 (Tier 1): tenant/ y recursos/ (frontend)

**Fecha:** 2026-07-12
**Hora:** 05:10 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado (Tier 1 del plan; Tier 2/3 quedan fuera de esta fase)

## Objetivo del cambio

Elevar la cobertura de frontend en los módulos de mayor criticidad de negocio — `ong/src/app/tenant/` (auth/RBAC/routing multi-tenant) y `ong/src/app/services/recursos/` (finanzas) — como Tier 1 del plan de cobertura acordado con el usuario (por criticidad de negocio, reportando % real por tier).

## Contexto del problema

El frontend partía de 13.03% de cobertura global (statements) sobre ~40k statements / 628 archivos — un número deliberadamente no perseguido a ciegas hasta 85%, sino abordado por tiers de riesgo. `tenant/` ya tenía una suite parcial (`tenant.test.tsx`, 16 tests) cubriendo `permissions.ts` bien pero dejando `navigation.tsx`, `bootstrap.ts` y `screens.tsx` con huecos grandes o en 0%. `recursos/` tenía tests solo de "sad path" (validaciones de error) en cada servicio financiero, sin un solo test de happy path.

## Solución implementada

### `ong/src/app/tenant/` (58.09% → 87.30% statements, 44.54% → 79.91% branches)

1. **`__tests__/navigation.test.ts`** (nuevo, 17 tests): cubre las funciones puras no testeadas de `navigation.tsx` — `getTenantRouteById`, `listTenantRoutes`, `findTenantRouteByPath`, `normalizeTenantPath`, ramas adicionales de `canAccessTenantRoute` (contexto/ruta null, módulo bloqueado, sin permisos requeridos, admin universal), `resolveTenantInitialPath` (ruta guardada válida, fallback a `ROUTES[0]` si la priority list se agota), y las 3 funciones que no tenían ningún test: `buildTenantSidebar`, `buildTenantCommandRoutes`, `resolveShortcutTargets`. Resultado: `navigation.tsx` pasó de 42.55% a **100% statements**.
2. **`__tests__/bootstrap-context.test.ts`** (nuevo, 8 tests): cubre casos de `bootstrapTenantContext()` no cubiertos por la suite existente — status `missing_tenant`, status `unsupported_industry`, resolución explícita de módulos vía `tenant_modules` (incluyendo el fallback implícito de módulos hijos de ONG), resolución de asignaciones de rol con nombres (incluyendo el fallback al id crudo si no se encuentra el nombre), propagación de warning sin abortar cuando falla la resolución de roles/sedes, política financiera de suspensión (`FIN-SUSPENDED`) y periodo de gracia (`FIN-GRACE`), y el hit de caché en memoria en la segunda llamada (0 llamadas nuevas a Supabase). Resultado: `bootstrap.ts` pasó de 61.67% a **88.02% statements**.
3. **`__tests__/screens.test.tsx`** (nuevo, 13 tests, React Testing Library): cubre los 4 componentes de presentación de `screens.tsx` que estaban en 0% — `TenantBootstrapLoadingScreen`, `TenantStatusScreen` (las 6 variantes de `status`, precedencia del mensaje explícito sobre el default, interpolación de `industryTypeId`, render del nodo `action`), `TenantFinancialBanner` (null sin política financiera, render con label/mensaje), `TenantInlineAccessDenied` (textos default y overrides). Resultado: `screens.tsx` pasó de **0% a 100% statements**.

### `ong/src/app/services/recursos/` (~30% → ~35% statements; ganancia dirigida en 2 archivos)

1. **`shared.test.ts`** (nuevo, 22 tests): primera suite para el módulo de utilidades compartido por los 8 servicios financieros — `normalizeText`, `sanitizeText`, `sanitizeSearchTerm` (incluyendo remoción de caracteres de inyección SQL-LIKE `% _ ' "`), `sanitizeOptionalId`, `sanitizePath`, `normalizeDateTimeValue`, `toDateTimeLabel`/`toDateLabel`, `formatNumber`/`formatMoney`, `isRouteValueValid` (rechaza XSS-like `<script>`), `sanitizeFileName`, `toFriendlyError`/`toOperationError`. Resultado: `shared.ts` pasó de 29.76% a **71.42% statements**.
2. **`reportesFinancieros.service.test.ts`** (ampliado, +9 tests de happy path): cálculo de `totalIncome`/`totalExpense`/`net` con redondeo a 2 decimales, agrupación `byCategory`/`byAccount`/`byType`/`byProject` ordenada de mayor a menor monto, agrupación de filas sin proyecto bajo `"sin-proyecto"`, paginación de `allRows` sin alterar los totales globales, dataset vacío (todo en cero, sin romper), warning de dataset truncado, y **escape de comillas dobles en la exportación CSV** (previene que un campo con comillas/comas rompa las columnas del archivo exportado). Resultado: `reportesFinancieros.service.ts` pasó de 31.37% a **100% statements**.
3. Los demás servicios de `recursos/` (`transaccionesFinancieras`, `cuentasFinancieras`, `inventarioMovimientos`, `items`, `categoriasFinancieras`, `comprobantesFinancieros`, `ubicaciones`) quedan con solo cobertura de validación (sad-path), sin happy-path — no se profundizó por su tamaño (450-1106 líneas cada uno, con cadenas de llamadas a Supabase anidadas que requieren mocks sustancialmente más complejos) y el costo/riesgo de mockear mal una cadena de este tamaño en el tiempo disponible. Documentado explícitamente en vez de forzarlo.

## Riesgos identificados

- Una corrida de la suite completa mientras el backend (`npm test`) corría en paralelo produjo 21 archivos "fallidos" por saturación de recursos del entorno (tiempos de "environment setup" de +1700s vs los ~10-40s normales) — se re-confirmó con una corrida limpia y aislada: **85 archivos, 345 tests, 100% en verde**. No es una regresión real, se documenta para que quien retome esta suite no se alarme si ve algo similar corriendo cosas en paralelo.
- Ningún cambio de comportamiento en producción — todo lo agregado en esta fase son archivos `*.test.ts(x)` nuevos o ampliados; no se tocó ningún archivo de código de producción.

## Impacto esperado

Ninguno en runtime. Aumenta la red de seguridad para futuros cambios en el módulo de tenant/auth/RBAC y en cálculos financieros/reportes.

## Módulos afectados

- `ong/src/app/tenant/__tests__/navigation.test.ts` (nuevo)
- `ong/src/app/tenant/__tests__/bootstrap-context.test.ts` (nuevo)
- `ong/src/app/tenant/__tests__/screens.test.tsx` (nuevo)
- `ong/src/app/services/recursos/shared.test.ts` (nuevo)
- `ong/src/app/services/recursos/reportesFinancieros.service.test.ts` (ampliado)

## Dependencias involucradas

Ninguna nueva.

## Verificación realizada

- `npm test` (backend): 334/334, sin cambios (no se tocó backend).
- `npm run test:web`: 85 archivos, 345 tests, 100% en verde (corrida limpia, aislada).
- `npm run build`: compila ambas apps sin errores.
- Cobertura verificada con `vitest run --coverage` escopado a cada directorio, antes y después de cada archivo de test agregado.

## Cómo revertir

`git revert` del commit correspondiente — solo elimina archivos de test, cero riesgo de romper funcionalidad existente.
