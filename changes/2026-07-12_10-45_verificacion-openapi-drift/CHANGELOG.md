# CHANGELOG — Verificación y corrección de drift en docs/api/openapi.yaml

**Fecha:** 2026-07-12
**Hora:** 10:45 (America/Lima)
**Autor:** Claude Sonnet 5 (Claude Code)
**Estado:** Completado

## Objetivo del cambio

Verificar, endpoint por endpoint, que `docs/api/openapi.yaml` describe con precisión el comportamiento real de `server/routes/*.js` — no solo que exista una entrada por cada endpoint (eso ya se había verificado al inicio de esta sesión), sino que los schemas de request/response, códigos de estado y códigos de error documentados coincidan con el código.

## Contexto del problema

Al inicio de esta sesión se verificó que los 22 endpoints reales tenían sus 16 paths correspondientes en `openapi.yaml`, y se asumió que la documentación estaba "completa". Esa verificación fue superficial (solo contó rutas). Un análisis detallado (delegado a un agente de solo-lectura que comparó cada ruta línea por línea contra su sección del YAML) encontró que la documentación **ya estaba desactualizada desde antes de esta sesión** — no por los cambios hechos en las Fases 1-4 (que no tocaron `server/routes/`), sino porque nunca se mantuvo en sincronía con la lógica de error real del código.

## Solución implementada

Se corrigió `docs/api/openapi.yaml` con los siguientes hallazgos:

### Gap transversal (afecta a los 22 endpoints)
- **500 (InternalError)**: `sendUnexpectedError` (`server/utils/http.js`) puede devolver 500 en cualquier ruta ante una excepción no capturada — no estaba documentado en ningún endpoint. Se agregó un componente `InternalError` reutilizable y se referenció en todas las rutas.
- **403 FIN-001/FIN-002**: todas las escrituras (POST/PUT/DELETE) de `iam.js` y `sedes.js` pasan por `requireFinancialWriteAccess()` (`server/middleware/financial-state.js`), que puede bloquear con 403 si el tenant está suspendido o en modo solo-lectura — no estaba mencionado en ningún endpoint de escritura. Se agregó como nota en la descripción de los tags `iam`/`sedes` y en los endpoints de escritura de `sedes`.

### `auth.js`
- `/auth/risk-evaluate`: se documentaron los campos de request faltantes (`device_fingerprint`, `timestamp`, `action_name`, `action_criticality`, `required_permission`, `sede_id`) y el schema completo de la respuesta 200 (antes sin schema, a pesar de tener un payload rico con 12 campos).
- `/auth/step-up/verify-otp`: se agregó el 403 (OTP incorrecto/expirado/desafío inválido) que faltaba por completo.
- `/auth/step-up/resend-otp`: `challenge_id` pasó de opcional a `required` (coincide con el código); se agregaron 400 (falta challenge_id) y 503 (fallo al reenviar).
- `/auth/terminal-login`: era el endpoint con más gaps. Se agregaron 401 (PIN incorrecto sin bloqueo aún), 423 (PIN bloqueado — **status que no existía en absoluto en el doc**), y se amplió el 403 para cubrir los 4 casos reales (terminal inactivo, perfil no encontrado, usuario bloqueado, bloqueo del motor de riesgo).

### `iam.js` (el archivo con más drift)
- Se agregó 401 (IAM-004, contexto IAM no resuelto) y 409 (TEN-003, mismatch de tenant) a los **9 endpoints** — ninguno los tenía documentados, a pesar de que `resolveIamContext()` los aplica a todos.
- `PUT /iam/roles/{roleId}`: no tenía `requestBody` documentado en absoluto, a pesar de que el código requiere `{name}`. Se agregó el schema completo más 400/403/404.
- `DELETE /iam/roles/{roleId}`: se agregó el 403 que faltaba.
- `GET/POST /iam/roles/{roleId}/permissions` y `DELETE .../permissions/{permission}`: se agregó el 403 faltante en los 3; en POST, `permission` pasó de opcional a `required` (coincide con el código) y se agregó el 400 correspondiente.
- `GET /iam/user-roles`: se documentó el query param `user_id` (existía en el código, no en el doc) y se agregó el 403 faltante.
- `POST /iam/user-roles`: `user_id`/`role_id`/`sede_id` pasaron de opcionales a `required` (coincide con el código) y se agregó 400/403.
- `DELETE /iam/user-roles/{assignmentId}`: se agregó el 403 faltante.

### `onboarding.js`
- `GET /onboarding/validate-ruc/{ruc}`: se agregaron 404 (RUC no encontrado), 502 (error/caída del servicio fiscal externo), 422 (respuesta ambigua) y **403 TEN-002 (empresa inactiva o "no habida")** — este último no estaba documentado en absoluto, a pesar de ser una regla de negocio real que bloquea el onboarding.
- `POST /onboarding/bootstrap-tenant`: schema y campos ya coincidían correctamente con el código (sin drift); solo se agregó el 500 transversal.

### `sedes.js`
- Se agregaron 401/409/500 a los 4 endpoints (`GET/POST /sedes`, `PUT/DELETE /sedes/{sedeId}`), y 400 a `PUT /sedes/{sedeId}` (el código rechaza `name` vacío o ausencia total de campos a actualizar, cosa que el doc no mencionaba).

### `audit.js`
- `/audit/summary`: se documentó el campo `error_code` del request (existía en el código, no en el doc) y el schema completo de la respuesta 200 (`ok`, `summary`, `reasoning`, `confidence`, `audit_log_id`).
- `/audit/metrics`: sin drift de status codes; se aclaró que el shape de la respuesta 200 coincide con lo que devuelve el código.

## Riesgos identificados

Ninguno — este es un cambio 100% de documentación (`docs/api/openapi.yaml`), no se tocó ningún archivo de código de producción. Se validó que el YAML resultante sigue siendo sintácticamente válido y que Swagger UI (`/api/docs`) lo sirve sin error.

## Impacto esperado

Ninguno en runtime. Cualquier persona (o IA) que integre contra esta API ahora tiene una referencia precisa de los códigos de error reales que puede recibir, en vez de una versión optimista que solo documentaba el camino feliz.

## Módulos afectados

- `docs/api/openapi.yaml`

## Dependencias involucradas

Ninguna.

## Verificación realizada

- Auditoría línea por línea de las 5 rutas contra el YAML, delegada a un agente de solo-lectura (sin modificar archivos) para no saturar el contexto principal con la lectura completa de ~1200 líneas.
- `node -e "yaml.load(...)"`: el YAML resultante es sintácticamente válido.
- Arranque real del servidor (`server/index.js`) + petición HTTP real a `/api/docs/`: 200 OK, Swagger UI sirve el spec sin error.
- `npm test` (backend): 334/334, sin cambios (no se tocó ningún archivo de código).

## Cómo revertir

`git revert` del commit correspondiente — solo afecta un archivo de documentación, cero riesgo de romper funcionalidad.
