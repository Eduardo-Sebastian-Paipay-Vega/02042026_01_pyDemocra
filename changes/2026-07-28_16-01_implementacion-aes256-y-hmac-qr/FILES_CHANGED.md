# Lista de Archivos Modificados — Cifrado AES-256 y HMAC-SHA256 Rotativo

## Archivos Creados
- `server/utils/crypto-aes.js`: Módulo con funciones `encryptAes256` y `decryptAes256` usando AES-256-GCM.
- `server/utils/crypto-aes.test.js`: Suite de pruebas unitarias Jest para cifrado, descifrado y detección de alteración de authTag.
- `ong/src/app/modules/people/idCardShared.test.ts`: Suite de pruebas unitarias Vitest para tokens rotativos HMAC-SHA256 en QR.
- `changes/2026-07-28_16-01_implementacion-aes256-y-hmac-qr/CHANGELOG.md`: Registro formal de auditoría de cambio Democra.
- `changes/2026-07-28_16-01_implementacion-aes256-y-hmac-qr/SUMMARY.md`: Resumen ejecutivo del cambio.
- `changes/2026-07-28_16-01_implementacion-aes256-y-hmac-qr/FILES_CHANGED.md`: Lista detallada de archivos impactados.

## Archivos Modificados
- `ong/src/app/modules/people/idCardShared.ts`: Se agregaron `computeHmacSha256Token`, opciones rotativas en `buildIdCardQrPayload` y la función `verifyRotativeQrToken`.
