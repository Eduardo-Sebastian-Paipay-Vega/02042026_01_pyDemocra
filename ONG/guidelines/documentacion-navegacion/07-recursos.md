# Modulo Recursos

## Objetivo
- Operar inventario y finanzas solo con tablas reales de los esquemas `ong` y `finanzas`.
- Eliminar semanticas legacy falsas y cerrar el contrato financiero real con `finanzas.cat_tipos_cuenta` y `finanzas.aprobaciones_transaccion`.

## Fuentes auditadas
- `AGENTS.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG modulos complementarios.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/documentacion-navegacion/03-proyectos.md`
- `guidelines/documentacion-navegacion/02-operacion.md`

## Paginas afectadas
- `src/app/pages/Inventory.tsx`
- `src/app/pages/Finance.tsx`

## Hooks y services afectados
- `src/app/modules/resources/hooks/useItems.ts`
- `src/app/modules/resources/hooks/useUbicaciones.ts`
- `src/app/modules/resources/hooks/useInventarioMovimientos.ts`
- `src/app/modules/resources/hooks/useKardex.ts`
- `src/app/modules/resources/hooks/useCuentasFinancieras.ts`
- `src/app/modules/resources/hooks/useCategoriasFinancieras.ts`
- `src/app/modules/resources/hooks/useTransaccionesFinancieras.ts`
- `src/app/modules/resources/hooks/useComprobantesFinancieros.ts`
- `src/app/modules/resources/hooks/useReportesFinancieros.ts`
- `src/app/services/recursos/items.service.ts`
- `src/app/services/recursos/ubicaciones.service.ts`
- `src/app/services/recursos/inventarioMovimientos.service.ts`
- `src/app/services/recursos/cuentasFinancieras.service.ts`
- `src/app/services/recursos/categoriasFinancieras.service.ts`
- `src/app/services/recursos/transaccionesFinancieras.service.ts`
- `src/app/services/recursos/comprobantesFinancieros.service.ts`
- `src/app/services/recursos/reportesFinancieros.service.ts`

## Tablas y esquemas reales
- `ong.items`
- `ong.unidades_medida`
- `ong.estados_objeto`
- `ong.ubicaciones`
- `ong.tipo_transaccion_inventario`
- `ong.transacciones_inventario`
- `ong.proyectos`
- `finanzas.cuentas`
- `finanzas.cat_tipos_cuenta`
- `finanzas.categorias`
- `finanzas.transacciones`
- `finanzas.aprobaciones_transaccion`
- `finanzas.comprobantes_financieros`
- `public.cat_paises`
- `public.cat_monedas`

## Acciones implementadas
- `Inventario / Items`: listar, ver detalle, crear, editar e inactivar.
- `Inventario / Ubicaciones`: listar, ver detalle, crear, editar e inactivar.
- `Inventario / Movimientos`: listar, ver detalle, crear, editar y eliminar.
- `Kardex`: consulta paginada por item, ubicacion, tipo y fecha.
- `Finanzas / Cuentas`: listar, ver detalle, crear, editar e inactivar.
- `Finanzas / Categorias`: listar, ver detalle, crear, editar y eliminar.
- `Finanzas / Transacciones`: listar, ver detalle, crear, editar, aprobar/rechazar y eliminar.
- `Comprobantes`: adjuntar y eliminar comprobantes reales por transaccion.
- `Reportes`: consultar totales y exportar CSV.

## Ajustes de contrato
- `finanzas.cuentas.tipo_cuenta` ya no es texto libre: referencia el catalogo real `finanzas.cat_tipos_cuenta`.
- `finanzas.aprobaciones_transaccion` gobierna el flujo basico de aprobacion de egresos; la UI lista estado, comentario, solicitante y resolutor.
- `finanzas.transacciones`, `finanzas.comprobantes_financieros` y `ong.transacciones_inventario` no documentan soft delete; las eliminaciones siguen el contrato real.
- `ong.recursos_proyecto` si documenta `is_deleted`, `deleted_at` y `deleted_by` desde Parte 4; su tratamiento debe hacerse en el modulo que administra recursos por proyecto, no inventando soft delete dentro de `finanzas.transacciones`.
- `finanzas.cuentas` usa `public.cat_monedas` como catalogo real expuesto al formulario.

## Riesgos y limites
- el build produce un chunk principal grande; no bloquea la fase pero queda como optimizacion pendiente.
- los egresos legacy sin fila en `finanzas.aprobaciones_transaccion` se muestran como pendientes hasta regularizar el backfill.
- `finanzas.aprobaciones_transaccion` no documenta un estado "observado"; el flujo visible queda acotado a `pendiente`, `aprobada` y `rechazada`.
