# Archivos Modificados - Fase 1

### Eliminados (Reubicados)
- `server/services/*` (se movieron más de 20 archivos y subdirectorios).
- Directorio `server/services` borrado.

### Nuevas Carpetas Creadas
- `server/core/services/` -> (Contiene sso, email, notificaciones, push, sms, gdpr, cms, webhooks, payments).
- `server/domains/ong/services/` -> (Contiene lms, ocr, reconciliation, predictive-analytics, biometric, reputation).

### Modificados (Actualización de Imports)
- `server/routes/onboarding.js` (Rutas actualizadas hacia el core)
- `server/routes/auth.js` (Rutas actualizadas hacia el core)
- `server/security/risk-engine.js` (Rutas actualizadas hacia el core)
- `server/security/risk-engine.test.js` (Rutas y mocks actualizados hacia el core)
