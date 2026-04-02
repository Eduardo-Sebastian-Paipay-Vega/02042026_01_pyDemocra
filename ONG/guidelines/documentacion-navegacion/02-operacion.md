# 1. Modulo
- `Operacion`

## 2. Objetivo
- Gestionar actividades, horas, evidencias y asistencias con datos reales del schema `ong`.
- Mantener la UI actual mientras se sincronizan contratos post-migracion sobre la nueva BD multi-esquema.

## 3. Fuentes auditadas
- `AGENTS.md`
- `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`
- `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`
- `guidelines/ONGModulosDeTrabajo(ED).md`

## 4. Paginas impactadas
- `src/app/pages/Activities.tsx`
- `src/app/pages/Attendance.tsx`
- `src/app/pages/Hours.tsx`
- `src/app/pages/HoursApproval.tsx`
- `src/app/pages/Evidence.tsx`

## 5. Hooks impactados
- `src/app/modules/operation/useOperationAttendance.ts`
- `src/app/modules/operation/useOperationHours.ts`
- `src/app/modules/operation/hooks/useAsistencias.ts`
- `src/app/modules/operation/hooks/useHorasActividad.ts`

## 6. Services impactados
- `src/app/services/operacion/asistencias.service.ts`
- `src/app/services/operacion/horas.service.ts`
- `src/app/services/operacion/aprobaciones.service.ts`
- `src/app/services/operacion/shared.ts`

## 7. Tablas y RPCs reales post-migracion
- `public.fn_current_tenant_id()` segun `guidelines/BD/Parte 1- Script maestro documental del Core SUBS public.txt`.
- `ong.actividades` con `descripcion`, `codigo_estado`, `fecha_inicio`, `fecha_fin`, `id_ubicacion` segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- `ong.asistencias` segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- `ong.aprobaciones` segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- `ong.horas_actividad` con `id_aprobacion` y `comentario_resolucion` segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.
- `ong.id_cards` como soporte de asistencia por QR segun `guidelines/BD/Parte 4- Script maestro documental de ONG módulos complementarios.txt`.

## 8. Acciones operativas sincronizadas
- `Asistencias`:
  - listar con datos reales.
  - ver detalle por id.
  - registrar entrada manual.
  - registrar salida.
  - registrar entrada/salida por QR con `ong.fn_register_attendance_scan`.
  - validar en frontend `ong.id_cards` para distinguir credencial invalida, expirada o revocada antes de invocar la RPC.
  - mostrar confirmacion visual del ultimo scan con resultado `check-in` o `check-out`.
  - editar.
  - marcar incidencia.
  - eliminar logico con `is_deleted`, `deleted_at`, `deleted_by`.
- `Horas`:
  - listar.
  - ver detalle.
  - crear.
  - editar.
  - solicitar aprobacion.
  - aprobar.
  - rechazar.
  - sincronizar `id_aprobacion` y `comentario_resolucion`.
- `Aprobaciones`:
  - leer la bandeja real desde `ong.aprobaciones`.
  - usar `ong.horas_actividad` solo como contexto vinculado para horas.
  - sincronizar persistencia real sobre `ong.aprobaciones` y `ong.horas_actividad.comentario_resolucion`.

## 9. Reglas de contrato aplicadas
- Todas las consultas usan `supabase.schema("ong")` para tablas del dominio ONG.
- El tenant se resuelve con `public.fn_current_tenant_id()` y se filtra por `tenant_id`.
- `Asistencias` deriva `id_proyecto` desde `ong.actividades -> ong.tareas -> ong.proyectos` porque `ong.asistencias` no almacena ese FK directo.
- La pantalla de asistencias carga catalogo real de actividades y el escaneo QR escribe por RPC sobre `ong.id_cards` y `ong.asistencias`.
- El modal QR permite ingreso manual de payload o captura por lector tipo wedge y deja el foco listo para escaneo continuo.
- `Horas` sigue usando el rango horario solo para calculo; el storage persistente real sigue siendo `horas_registradas`.
- Los comentarios de resolucion ahora se sincronizan en `ong.aprobaciones.comentario` y `ong.horas_actividad.comentario_resolucion`.

## 10. Riesgos y pendientes
- La UI de aprobaciones todavia lista desde el flujo de horas y no desde `ong.aprobaciones` como bandeja generica.
- `ong.evidencias_actividad` sigue sin contrato documental de validacion/aprobacion en los scripts auditados.
- El flujo QR depende de que `ong.id_cards.qr_payload` y `ong.id_cards.estado='activa'` ya existan correctamente emitidos para el voluntario.

## 11. Resultado operativo
- `Attendance.tsx` dejo de tratar `ong.asistencias` como inexistente y muestra datos reales del tenant.
- `Attendance.tsx` ya puede registrar asistencia manual, editar, ver detalle, cerrar, marcar incidencia, eliminar logicamente y registrar QR usando `ong.fn_register_attendance_scan`.
- `horas.service.ts` prioriza `ong.aprobaciones` como fuente real de estado/comentario cuando existe `id_aprobacion` o una aprobacion vinculada por entidad.
- `aprobaciones.service.ts` ya no deriva la bandeja desde horas; lista directamente `ong.aprobaciones` y usa horas solo para enriquecer contexto.
- El modulo queda listo para una siguiente fase funcional sin mocks ni referencias implicitas a `public`.
