# Resumen Ejecutivo — Implementación Cifrado AES-256 y QR HMAC-SHA256 (M01 & M13)

## Qué se hizo
1. Se construyó el módulo de cifrado simétrico autenticado **AES-256-GCM** en `server/utils/crypto-aes.js` para la encriptación de datos sensibles de fichas (M01/M03).
2. Se amplió el generador de QR en `ong/src/app/modules/people/idCardShared.ts` para soportar tokens rotativos con firma HMAC-SHA256 basada en ventanas de tiempo de 30s.
3. Se agregaron suites de prueba automatizadas completas en Jest (`server/utils/crypto-aes.test.js`) y Vitest (`ong/src/app/modules/people/idCardShared.test.ts`).

## Por qué se hizo
Para alinearse 100% con los requerimientos criptográficos de seguridad descritos en el estándar IEEE 830 (`main.md`) para datos sensibles y credenciales dinámicas QR.

## Beneficio aportado
- Protección criptográfica AES-256-GCM contra manipulación o lectura no autorizada de datos de contacto o médicos.
- Prevención de clonación y ataques de repetición (*replay attacks*) en escaneo de credenciales QR mediante rotación de 30s.

## Funcionalidades afectadas
- `server/utils/crypto-aes.js` (Nuevo utility módulo de cifrado backend).
- `ong/src/app/modules/people/idCardShared.ts` (Ampliación de utilidades QR dinámicas).
