# Changelog: Fase 1 - Modularización de Backend

- **Fecha y hora:** 2026-08-16 00:55
- **Objetivo del cambio:** Iniciar la evolución de Democra a una plataforma SaaS multivertical (Fase 1), separando los servicios transversales de los específicos.
- **Contexto del problema:** El monolito de ONG (`server/services/`) estaba fuertemente acoplado. Al agregar nuevos verticales (como GYM o Retail), todos compartirían la misma carpeta, rompiendo la segregación del dominio.
- **Motivo de la modificación:** Implementar un Monolito Modular donde `server/core/` aloja utilidades compartidas y `server/domains/ong/` aloja la lógica propietaria del vertical.
- **Solución implementada:** 
  - Se movieron los módulos de Auth, SSO, Notificaciones, Email, SMS, WhatsApp, Sync Offline y CMS a `server/core/services/`.
  - Se movieron los módulos OCR, Conciliación, LMS, Transferencias e Inventario a `server/domains/ong/services/`.
  - Se actualizaron las referencias relativas en `server/routes/*` y `server/security/*`.
- **Riesgos identificados:** Riesgo de rotura de imports (Module not found) en los controladores.
- **Impacto esperado:** Escalabilidad de la arquitectura para permitir crear `server/domains/gym/` en las siguientes fases usando los módulos base del Core.
- **Módulos afectados:** `server/services/` (eliminado), `server/routes/onboarding.js`, `server/routes/auth.js`, `server/security/risk-engine.js`.
- **Dependencias involucradas:** Ninguna dependencia externa nueva, solo recableado interno.
- **Posibles efectos secundarios:** Fallos en tests unitarios si el entorno (jest) u otras herramientas de tooling dependen de rutas estáticas absolutas de archivos de test.
- **Estado del cambio:** Completado
