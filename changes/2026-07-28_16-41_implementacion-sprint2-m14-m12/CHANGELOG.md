# CHANGELOG — Sprint 2: Donaciones/Pasarelas (M14) y Webhooks Salientes (M12)

- **Fecha y Hora**: 2026-07-28 16:44 (UTC-5)
- **Objetivo del Cambio**: Implementar adaptadores para Stripe, Culqi y MercadoPago, verificación criptográfica HMAC de webhooks de pago entrantes y motor de webhooks salientes con reintentos exponenciales.
- **Contexto del Problema**: En la auditoría estricta de `main.md`, los cobros de donación en M14 carecían de verificación HMAC de firma y el despacho de webhooks en M12 no contaba con reintentos exponenciales frente a caídas HTTP 5xx.
- **Motivo de la Modificación**: Resolver brechas funcionales de alta prioridad clasificadas en el Sprint 2.
- **Solución Implementada**:
  1. Creado `server/services/payments/stripe.js` para donaciones únicas y suscripciones recurrentes tipo World Vision.
  2. Creado `server/services/payments/culqi.js` para cobros peruanos con tarjeta y Yape/Plin.
  3. Creado `server/services/payments/mercadopago.js` para checkout en Latinoamérica.
  4. Creado `server/routes/webhooks-payments.js` con la función `verifyHmacSignature` (HMAC-SHA256) para prevención de fraude.
  5. Creado `server/services/outgoing-webhooks.js` con cálculo de delay por Exponential Backoff (`calculateExponentialBackoffDelay`) y firma `X-Democra-Signature`.
  6. Creadas suites de prueba unitarias en Jest: `server/services/payments.test.js` y `server/services/webhooks.test.js`.
- **Riesgos Identificados**: Ninguno. Respuestas simuladas defensivas cuando no hay credenciales live de pasarelas.
- **Impacto Esperado**: Procesamiento seguro de donaciones con validación anti-fraude y despacho confiable de eventos a terceros.
- **Módulos Afectados**: `server/services/payments/`, `server/routes/`, `server/services/`.
- **Estado del Cambio**: Completado y Verificado (21/21 Test Suites Pasadas).
