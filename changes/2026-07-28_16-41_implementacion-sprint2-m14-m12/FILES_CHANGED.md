# Lista de Archivos Modificados — Sprint 2 (M14 y M12)

## Archivos Creados
- `server/services/payments/stripe.js`: Adaptador Stripe para donaciones y apadrinamiento.
- `server/services/payments/culqi.js`: Adaptador Culqi para cobros locales en Perú.
- `server/services/payments/mercadopago.js`: Adaptador MercadoPago.
- `server/routes/webhooks-payments.js`: Manejador y verificador criptográfico HMAC-SHA256 de webhooks entrantes de pago.
- `server/services/outgoing-webhooks.js`: Motor de despacho de webhooks salientes con reintentos por Exponential Backoff.
- `server/services/payments.test.js`: Suite de pruebas unitarias Jest para pasarelas de pago y firmas de webhook.
- `server/services/webhooks.test.js`: Suite de pruebas unitarias Jest para firmas HMAC y reintentos exponenciales.
- `changes/2026-07-28_16-41_implementacion-sprint2-m14-m12/CHANGELOG.md`: Registro de auditoría Democra.
- `changes/2026-07-28_16-41_implementacion-sprint2-m14-m12/SUMMARY.md`: Resumen ejecutivo del Sprint 2.
- `changes/2026-07-28_16-41_implementacion-sprint2-m14-m12/FILES_CHANGED.md`: Registro de archivos afectados.
