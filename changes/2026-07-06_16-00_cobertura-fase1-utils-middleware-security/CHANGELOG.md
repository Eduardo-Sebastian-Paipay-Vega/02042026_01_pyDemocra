# CHANGELOG — Cobertura Fase 1: server/utils, server/middleware, server/security > 95%

**Fecha:** 2026-07-06
**Hora:** 16:00 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Elevar la cobertura de pruebas a más del 95% (statements/branches/functions/lines) en `server/utils/`, `server/middleware/` y `server/security/`, sin tocar `server/routes/` ni `server/services/`, como primera fase de un objetivo global del 95% de cobertura.

## Contexto del problema

Tras la sesión anterior (26 tests, 28% de cobertura global, enfocados solo en `server/routes/`), el usuario pidió una fase dedicada a "los cimientos": las utilidades y el motor de seguridad/riesgo que el resto de la API consume, incluyendo caminos infelices (edge cases, errores, nulls, fallos de red).

## Motivo de la modificación

`server/security/risk-engine.js` (766 líneas) y `server/security/ai-client.js` concentran la lógica de negocio más compleja y sensible de todo el backend (motor de riesgo, MFA/OTP, resúmenes forenses con IA) y no tenían ninguna prueba. `server/utils/*` son las funciones puras que todo lo demás reutiliza.

## Solución implementada

1. **`server/test-utils/mockSupabase.js`** (nuevo, helper compartido): `createChainableResult()`/`createServiceClientMock()` — un mock de query builder de supabase-js cuya forma de resultado (fila única vs lista) depende de si se llamó `.single()`/`.maybeSingle()` en la cadena, igual que el comportamiento real. Reutilizado en 3 de los 4 archivos de test nuevos para evitar duplicar esta lógica.
2. **`server/utils/http.test.js`** (18 tests): `getBearerToken`, `sendError`, `sendUnexpectedError` (incluyendo el branch de `NODE_ENV=production` que oculta el campo `debug`), `parseBoolean`, `clamp`.
3. **`server/utils/security.test.js`** (35 tests): todas las funciones puras (`maskIp`, `maskEmail`, `hashOtp`, `safeCompare` con timing-safe real, `verifyPinHash` cubriendo los 4 formatos de hash soportados —bcrypt `$2a$`/`$2b$`, `sha256:`, y comparación directa—, etc.).
4. **`server/utils/tenant-scope.test.js`** (9 tests): `assertTenantScope`/`applyTenantScope`, incluyendo el mensaje de error con el contexto y el `errorCode`/`errorType` adjuntos al `Error`.
5. **`server/security/ai-client.test.js`** (18 tests): `requestAiJson` (sin API key, HTTP no-ok, JSON directo, JSON extraído por regex de texto con ruido alrededor, JSON del bloque extraído que TAMBIÉN es inválido, sin contenido), `summarizeForensicEvent` y `explainRiskDecisionWithAi` (fallback sin IA, uso del resultado de IA, clamps de `confidence`/`adjustment`, normalización de `extra_reason_codes`). **`global.fetch` mockeado en todos los casos — cero llamadas de red reales.**
6. **`server/security/audit.test.js`** (14 tests): `insertAuthEvent`, `insertAuditLog` (las 4 combinaciones de `getRetentionDays` con fallos en `tenants`/`plan_policies`, el enriquecimiento con `summarizeForensicEvent` cuando `includeAiSummary=true`), `buildMaskedRequestContext`.
7. **`server/security/risk-engine.test.js`** (58 tests, el más extenso): las 4 funciones exportadas (`evaluateRiskEngine`, `resendOtpChallenge`, `verifyOtpChallenge`, `createSessionFromVerifiedChallenge`), cubriendo — bloqueos tempranos por perfil (`is_blocked`, `pin_blocked_until`, `risk_blocked_until`), límite de intentos de PIN, verificación de permisos (RPC exitosa/con error con fallback a `user_roles_sedes`+`role_permissions`, sin roles, sin permiso), dispositivo/IP conocidos vs nuevos (las 4 combinaciones), fallos de creación/entrega de OTP con y sin modo debug, expiración y mismatch de código OTP, y fallos de inserción en cada tabla involucrada.
8. **`server/middleware/financial-state.test.js`** (12 tests, directorio no listado explícitamente por el usuario pero sí mencionado como objetivo): los 3 estados bloqueantes (`FIN-SUSPENDED`, `FIN-READONLY`/`FIN-INCONSISTENT`/`FIN-PENDING`), método de lectura vs escritura, sin token, tenant inválido, sin tenant_id (pre-onboarding), y fallo silencioso de la consulta de estado.

## Riesgos identificados

- **2 fallos propios encontrados y corregidos antes de reportar**: (a) un test de `sendError` asumía que un código de error desconocido caía a `"GEN-000"` — en realidad `GEN-000` solo aplica si el código es una cadena vacía; un código desconocido no-vacío se conserva tal cual con el mensaje por defecto. (b) 5 tests de `evaluateRiskEngine` esperaban `ALLOW` pero no pasaban `deviceFingerprint`/`ip`, así que el código tomaba sus defaults de "dispositivo/IP no provistos" (tratados como desconocidos) en vez de usar los datos mockeados de "dispositivo conocido" — corregido agregando ambos parámetros a esos casos.
- **Cobertura de branches de `risk-engine.js` quedó en 96.46%, no 100%**: las líneas restantes sin cubrir (21, 205, 348-352, 406-420 parcial, 647, 730) son ramas defensivas (`|| {}`, `|| null`) que solo se alcanzarían si la ÚNICA función que las llama internamente les pasara un valor falsy — cosa que ningún llamador real hace hoy. Cubrirlas requeriría exportar funciones internas solo para forzar ese caso artificialmente, lo cual no se hizo por ser sobre-ingeniería para una ganancia marginal. Documentado aquí en vez de forzarlo silenciosamente.
- No se tocó `server/routes/` ni `server/services/`, tal como se pidió explícitamente.

## Impacto esperado

Ningún cambio en el comportamiento de la aplicación — solo se agregaron pruebas y un helper de test compartido.

## Módulos afectados

- `server/test-utils/mockSupabase.js` (nuevo)
- `server/utils/http.test.js` (nuevo)
- `server/utils/security.test.js` (nuevo)
- `server/utils/tenant-scope.test.js` (nuevo)
- `server/security/ai-client.test.js` (nuevo)
- `server/security/audit.test.js` (nuevo)
- `server/security/risk-engine.test.js` (nuevo)
- `server/middleware/financial-state.test.js` (nuevo)

## Dependencias involucradas

Ninguna nueva (usa jest/supertest ya instalados en la sesión anterior).

## Posibles efectos secundarios

Ninguno sobre código de producción.

## Verificación realizada

`npm run test:coverage` — 194 tests, 12 suites, todos pasando. Resultados por directorio objetivo:

| Directorio | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `server/utils/` | 100% | 100% | 100% | 100% |
| `server/middleware/` | 100% | 100% | 100% | 100% |
| `server/security/` | 99.01% | 97.42% | 100% | 100% |

Los 3 directorios superan el objetivo de >95% en las 4 métricas.

## Cómo revertir

`git revert` del commit `test: eleva cobertura de server/utils, middleware y security a >95%`.
