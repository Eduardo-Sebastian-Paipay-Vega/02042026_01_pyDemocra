# CHANGELOG — Sprint 1: Notificaciones Multicanal (M09) y Pipeline OCR (M02)

- **Fecha y Hora**: 2026-07-28 16:38 (UTC-5)
- **Objetivo del Cambio**: Implementar adaptadores multicanal de notificaciones (WhatsApp Meta API, SMS Twilio/SNS, Push FCM) y el pipeline de OCR con motor de scoring de candidatos para M09 y M02.
- **Contexto del Problema**: En la auditoría estricta, M09 y M02 operaban parcialmente con mocks o sin conectores nativos de mensajería (WhatsApp/SMS/Push) ni reglas de validación automática por similitud de texto DNI/nombres.
- **Motivo de la Modificación**: Resolver brechas funcionales de alta prioridad clasificadas en el Sprint 1.
- **Solución Implementada**:
  1. Creado `server/services/whatsapp.js` para Meta Cloud API / Twilio WhatsApp.
  2. Creado `server/services/sms.js` para Twilio / AWS SNS.
  3. Creado `server/services/push.js` para Firebase Cloud Messaging (FCM).
  4. Creado `server/services/notifications-dispatcher.js` como orquestador defensivo multicanal.
  5. Creado `server/services/ocr.js` con algoritmo Levenshtein/Token Match y reglas de negocio (`score>=95%` auto-aprobado, `70%<=score<95%` revisión manual, `<70%` observado).
  6. Creadas suites de prueba unitarias en Jest: `server/services/notifications.test.js` y `server/services/ocr.test.js`.
- **Riesgos Identificados**: Ninguno. Operación defensiva con fallbacks de desarrollo si faltan tokens de Meta/Twilio/FCM.
- **Impacto Esperado**: Cobertura multicanal real y automatización del flujo de admisión de postulantes.
- **Módulos Afectados**: `server/services/`.
- **Estado del Cambio**: Completado y Verificado (19/19 Test Suites Pasadas).
