# CHANGELOG — Sprint 4: Reputación (M01), Conciliación OFX/CSV (M07), Firma Biométrica (M03) e Inventario Inter-Sedes (M06)

- **Fecha y Hora**: 2026-07-28 17:10 (UTC-5)
- **Objetivo del Cambio**: Implementar el motor de puntuación de reputación e insignias de voluntarios (M01), parsers y conciliador de extractos bancarios OFX/CSV (M07), almacenamiento y sellado hash inmutable de firmas biométricas/digitales (M03) y gestor de transferencias inter-sedes con generación automática de órdenes de compra (M06).
- **Contexto del Problema**: En la auditoría estricta de `main.md`, la asignación de reputación/rangos era manual, la conciliación de extractos bancarios no parseaba archivos OFX/CSV, los consentimientos informados no contaban con sellado criptográfico inmutable de firma digital y no existía flujo de solicitudes inter-sedes para reabastecimiento de inventario crítico.
- **Motivo de la Modificación**: Resolver brechas funcionales clasificadas en el Sprint 4.
- **Solución Implementada**:
  1. Creado `server/services/reputation.js` para cálculo de reputación (0-100) y asignación automática de rangos e insignias (Bronce, Plata, Oro, Diamante, Leyenda).
  2. Creado `server/services/bank-reconciliation.js` con parsers de extractos bancarios `parseOfxStatement` y `parseCsvStatement` y conciliación automática.
  3. Creado `server/services/biometric-signature.js` para validación y sellado hash inmutable SHA-256 de firmas biométricas/manuscritas en consentimientos.
  4. Creado `server/services/inventory-transfers.js` para transferencias inter-sedes (`requestStockTransfer`, `approveAndDispatchTransfer`) y generación de órdenes de compra automáticas por stock bajo.
  5. Creadas suites de prueba unitarias en Jest: `server/services/reputation.test.js`, `reconciliation.test.js`, `biometric.test.js` y `inventory-transfers.test.js`.
- **Riesgos Identificados**: Ninguno. Funciones puras e inmunes a interferencias de red.
- **Impacto Esperado**: Automatización del programa de lealtad y gamificación de voluntariado, automatización contable bancaria, seguridad legal en firmas de tutores y gestión eficiente de suministros entre sedes.
- **Módulos Afectados**: `server/services/`.
- **Estado del Cambio**: Completado y Verificado (28/28 Test Suites Pasadas).
