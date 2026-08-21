# 06 - AUTENTICACIÓN Y SESIONES (AUTH-TESTS)

## 1. Pruebas de Bypass de Token JWT

| Vector de Ataque | Header Authorization Enviado | Respuesta API | Veredicto |
| :--- | :--- | :--- | :--- |
| Token Ausente | *(Ninguna cabecera)* | `HTTP 401 Unauthorized` (`IAM-004`) | **CONFIRMED SECURE** |
| Token Inválido | `Bearer invalid.jwt.token` | `HTTP 401 Unauthorized` (`IAM-004`) | **CONFIRMED SECURE** |
| Token Malformado | `Bearer ===not_a_jwt===` | `HTTP 401 Unauthorized` (`IAM-004`) | **CONFIRMED SECURE** |
| Token de Otro Tenant | `Bearer valid_jwt_tenant_B` | Petición procesada para Tenant B exclusivamente | **CONFIRMED SECURE** |

---

## 2. Auditoría de Persistencia de Sesión (`localStorage`)
- **Hallazgo:** La SPA React en `ong/src/` persiste el token de autenticación en `window.localStorage` bajo la clave `sb-democra-auth-token`.
- **Riesgo:** Si bien la API backend valida la sesión en cada endpoint y las defensas contra XSS previenen inyecciones en el DOM, el uso de `localStorage` en lugar de cookies `HttpOnly` constituye un riesgo residual arquitectónico reconocido (`ACCEPTED RISK`).
