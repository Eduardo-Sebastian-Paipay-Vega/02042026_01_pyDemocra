# Recursos

Dominio auditado: `src/app/pages/Inventory.tsx`, `src/app/pages/Finance.tsx`, `src/app/modules/resources/**`, `src/app/services/recursos/**`.

Fuentes revisadas para el anclaje de esquema:
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 2 - Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/BD/Parte 3- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/ONGDiccionarioRF.md`

## Mapa RF/CU -> schema.table

| RF / CU | Flujo de Recursos | schema.table reales | Observacion |
| --- | --- | --- | --- |
| RF-34 / CU-25 | Items y ubicaciones | `ong.items`, `ong.ubicaciones`, `ong.unidades_medida`, `ong.estados_objeto`, `public.cat_paises` | Se usan catalogos reales para unidad, estado y pais. |
| RF-35 / CU-25 | Movimientos de inventario | `ong.transacciones_inventario`, `ong.tipo_transaccion_inventario`, `ong.items`, `ong.ubicaciones`, `public.profiles` | Entradas, salidas, transferencias y ajustes validan origen/destino y cantidad. |
| RF-36 / CU-26 | Kardex y stock derivado | `ong.transacciones_inventario`, `ong.items`, `ong.ubicaciones` | El stock se deriva de movimientos reales; no se hardcodea saldo. |
| RF-37 / CU-27 | Cuentas y categorias | `finanzas.cuentas`, `finanzas.categorias`, `public.cat_monedas` | El script nuevo usa `finanzas.*` y no las tablas legacy `*_financieras` del RF resumido. |
| RF-38 / CU-27 | Transacciones financieras | `finanzas.transacciones`, `finanzas.cuentas`, `finanzas.categorias`, `ong.proyectos`, `public.profiles` | La columna real es `tipo`; no existe catalogo documental separado `tipo_transaccion_financiera`. |
| RF-39 / CU-27 | Comprobantes financieros | `finanzas.comprobantes_financieros`, `finanzas.transacciones` | El comprobante se adjunta a una transaccion real y puede subir a storage o persistir ruta manual. |
| RF-40 / CU-28 | Reportes financieros | `finanzas.transacciones`, `finanzas.cuentas`, `finanzas.categorias`, `ong.proyectos` | Los reportes se generan a nivel app sobre datos reales y exportan CSV. |
| RF-42 / RF-43 / CU-29 / CU-30 | Cursos y certificados | Sin implementacion routed real en el repo actual | `src/app/routes.tsx` mantiene `/admin/courses` como `PlaceholderPage`; este ciclo no inventa tablas ni UI. |

## Archivos impactados

- `src/app/pages/Inventory.tsx`
- `src/app/pages/Finance.tsx`
- `src/app/modules/resources/types.ts`
- `src/app/modules/resources/hooks/useTransaccionesFinancieras.ts`
- `src/app/modules/resources/hooks/useReportesFinancieros.ts`
- `src/app/services/recursos/shared.ts`
- `src/app/services/recursos/items.service.ts`
- `src/app/services/recursos/ubicaciones.service.ts`
- `src/app/services/recursos/inventarioMovimientos.service.ts`
- `src/app/services/recursos/cuentasFinancieras.service.ts`
- `src/app/services/recursos/categoriasFinancieras.service.ts`
- `src/app/services/recursos/transaccionesFinancieras.service.ts`
- `src/app/services/recursos/comprobantesFinancieros.service.ts`
- `src/app/services/recursos/reportesFinancieros.service.ts`

## Consultas legacy corregidas

- El dominio usa helpers explicitos `schema("ong")`, `schema("finanzas")` y `schema("public")`; no quedaron accesos `supabase.from(...)` directos en `src/`.
- Inventario dejo de asumir tablas en `public`; items, ubicaciones y movimientos ahora operan contra `ong.items`, `ong.ubicaciones`, `ong.transacciones_inventario` y `ong.tipo_transaccion_inventario`.
- Finanzas dejo de asumir nombres legacy como `cuentas_financieras` o `transacciones_financieras`; las consultas reales van contra `finanzas.cuentas`, `finanzas.categorias`, `finanzas.transacciones` y `finanzas.comprobantes_financieros`.
- Los labels de usuario se resuelven contra `public.profiles` y el vinculo opcional a proyecto contra `ong.proyectos`.

## Huecos documentados

- `guidelines/ONGDiccionarioRF.md` resume RF-37/38/39/40 con nombres legacy (`cuentas_financieras`, `categorias_financieras`, `transacciones_financieras`, `tipo_transaccion_financiera`), pero los scripts reales documentan `finanzas.cuentas`, `finanzas.categorias`, `finanzas.transacciones` y `finanzas.comprobantes_financieros`.
- El esquema financiero nuevo no documenta un flujo de aprobacion de egresos ni una tabla de aprobaciones. Por eso `src/app/services/recursos/transaccionesFinancieras.service.ts` expone `approvalWorkflow: false` y `approveEgreso/rejectEgreso/observeEgreso` fallan de forma segura.
- `src/app/routes.tsx` mantiene `courses` como `PlaceholderPage`; no existe implementacion real de cursos/certificados en este repo para conectar RF-42/43 sin inventar tablas o pantallas.
- En inventario la baja es logica para `items` y `ubicaciones` via `activo/activa = false`; en finanzas las tablas documentadas no exponen un contrato uniforme de soft delete, por lo que categorias, transacciones y comprobantes siguen eliminacion fisica en el codigo actual.

## Notas de validacion

- Los formularios de inventario y finanzas usan catalogos reales, validan ids/fechas/montos/cantidades y respetan `tenant_id` cuando la tabla es tenant-bound.
- El stock y el kardex se calculan desde movimientos reales; no se usa saldo manual por item.
- Los reportes financieros se generan desde `finanzas.transacciones` y exportan CSV sin depender de mocks.
- No se tocaron `src/lib/db/**`, `src/supabaseClient.ts` ni `src/app/components/layout/**`.
