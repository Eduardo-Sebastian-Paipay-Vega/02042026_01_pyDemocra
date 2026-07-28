# Resumen Ejecutivo — Sprint 2: Pasarelas de Pago (M14) y Webhooks Salientes (M12)

## Qué se hizo
1. **M14 Donaciones y Pasarelas de Pago**:
   - `server/services/payments/stripe.js`: Adaptador Stripe para cobros únicos y suscripciones recurrentes de apadrinamiento.
   - `server/services/payments/culqi.js`: Adaptador Culqi para procesamiento local en Perú.
   - `server/services/payments/mercadopago.js`: Adaptador MercadoPago.
   - `server/routes/webhooks-payments.js`: Verificador criptográfico HMAC-SHA256 para evitar fraudes en webhooks de pago.
2. **M12 API Gateway y Webhooks Salientes**:
   - `server/services/outgoing-webhooks.js`: Motor de despacho saliente firmado con HMAC-SHA256 (`X-Democra-Signature`) y reintentos por Exponential Backoff ante errores HTTP 5xx.
3. **Pruebas Unitarias**:
   - `server/services/payments.test.js` y `server/services/webhooks.test.js` (**21/21 Test Suites Backend Pasadas, 367 Tests Pasados**).

## Por qué se hizo
Para satisfacer los requisitos funcionales de pago seguro y comunicación por eventos desacoplada para clientes externos especificados en el estándar IEEE 830 (`main.md`).

## Beneficio aportado
- Protección anti-fraude en webhooks de pago mediante validación de firma criptográfica en tiempo constante.
- Resiliencia en la entrega de notificaciones salientes a desarrolladores/sistemas de terceros mediante estrategia de reintentos exponenciales.

## Funcionalidades afectadas
- `server/services/payments/`
- `server/routes/webhooks-payments.js`
- `server/services/outgoing-webhooks.js`
