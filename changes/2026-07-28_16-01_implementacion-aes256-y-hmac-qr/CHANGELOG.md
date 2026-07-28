# CHANGELOG — Implementación Cifrado AES-256 y HMAC-SHA256 Rotativo (M01 & M13)

- **Fecha y Hora**: 2026-07-28 16:05 (UTC-5)
- **Objetivo del Cambio**: Implementar el cifrado simétrico AES-256-GCM para datos sensibles (M01/M03) y ampliar el módulo de credenciales QR en M13 con tokens rotativos HMAC-SHA256 basados en ventanas de tiempo de 30 segundos manteniendo 100% de retrocompatibilidad.
- **Contexto del Problema**: La especificación IEEE 830 (`main.md`) solicita cifrado simétrico AES-256 en datos de fichas sensibles y soporte de rotación de tokens QR para prevención de clonación en escaneo offline.
- **Motivo de la Modificación**: Completar la cobertura técnica en la base de código monorepo sin alterar la arquitectura MPA ni la compatibilidad existente.
- **Solución Implementada**:
  1. Creado `server/utils/crypto-aes.js` con cifrado/descifrado simétrico AES-256-GCM utilizando derivación SHA-256 sobre clave o `config.otpPepper`.
  2. Creado `server/utils/crypto-aes.test.js` con 5 pruebas unitarias completas en Jest.
  3. Ampliada la función `buildIdCardQrPayload` en `ong/src/app/modules/people/idCardShared.ts` para soportar tokens rotativos HMAC-SHA256 en formato `IDCARD:<CODE>:ROT:<SLOT>:<HMAC>` y función de verificación `verifyRotativeQrToken` con ventana de tolerancia de ±30s.
  4. Creado `ong/src/app/modules/people/idCardShared.test.ts` con 4 pruebas unitarias en Vitest.
- **Riesgos Identificados**: Ninguno. Las funciones mantienen comportamiento por defecto 100% retrocompatible (`IDCARD:<CARD_CODE>`).
- **Impacto Esperado**: Máxima seguridad criptográfica en almacenamiento de fichas sensibles y código QR dinámico resistente a ataques de repetición.
- **Módulos Afectados**: `server/utils/crypto-aes.js`, `ong/src/app/modules/people/idCardShared.ts`.
- **Dependencias Involucradas**: API nativa `node:crypto`.
- **Posibles Efectos Secundarios**: Ninguno.
- **Estado del Cambio**: Completado y Verificado.
