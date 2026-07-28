# Lista de Archivos Modificados — Sprint 4 (M01, M07, M03 y M06)

## Archivos Creados
- `server/services/reputation.js`: Motor de cálculo de reputación y asignación de medallas/rangos.
- `server/services/bank-reconciliation.js`: Parser de extractos bancarios OFX/CSV y motor de coincidencia de transacciones.
- `server/services/biometric-signature.js`: Servicio de validación y sellado hash SHA-256 de firmas biométricas.
- `server/services/inventory-transfers.js`: Gestor de transferencias inter-sedes y órdenes de compra por stock crítico.
- `server/services/reputation.test.js`: Suite de pruebas unitarias Jest para el motor de reputación.
- `server/services/reconciliation.test.js`: Suite de pruebas unitarias Jest para parsers OFX/CSV y conciliación bancaria.
- `server/services/biometric.test.js`: Suite de pruebas unitarias Jest para firmas digitales y sellos inmutables.
- `server/services/inventory-transfers.test.js`: Suite de pruebas unitarias Jest para transferencias inter-sedes.
- `changes/2026-07-28_17-07_implementacion-sprint4-m01-m07-m03-m06/CHANGELOG.md`: Registro de auditoría Democra.
- `changes/2026-07-28_17-07_implementacion-sprint4-m01-m07-m03-m06/SUMMARY.md`: Resumen ejecutivo del Sprint 4.
- `changes/2026-07-28_17-07_implementacion-sprint4-m01-m07-m03-m06/FILES_CHANGED.md`: Registro de archivos afectados.

## Archivos Modificados
- `server/services/reputation.test.js`: Ajuste de parámetros de prueba para la verificación de insignias.
